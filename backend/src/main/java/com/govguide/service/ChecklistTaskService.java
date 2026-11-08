package com.govguide.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.govguide.dto.ChecklistUpdateRequest;
import com.govguide.dto.CreateChildTaskRequest;
import com.govguide.dto.CreateTaskRequest;
import com.govguide.dto.TaskResponse;
import com.govguide.persistence.TaskPersistence;
import com.govguide.persistence.TaskRecord;
import com.govguide.validation.DependencyEvaluator;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

@Service
public class ChecklistTaskService {
    private static final String NOT_REVIEWED = "NOT_REVIEWED";
    private static final String NEEDS_VERIFICATION = "NEEDS_VERIFICATION";
    private static final String COMPLETED = "COMPLETED";
    private static final int MAX_TASK_DEPTH = 16;
    private final ServiceCatalogueService catalogueService;
    private final TaskPersistence persistence;

    public ChecklistTaskService(ServiceCatalogueService catalogueService, TaskPersistence persistence) {
        this.catalogueService = catalogueService;
        this.persistence = persistence;
    }

    @Transactional
    public TaskResponse createTask(CreateTaskRequest request, String ownerId) {
        JsonNode service = catalogueService.getService(request.serviceCode());
        return createTask(request.serviceCode(), request.context(), null, null, 0, ownerId, service);
    }

    @Transactional
    public TaskResponse createChildTask(String parentTaskId, CreateChildTaskRequest request, String ownerId) {
        TaskState parent = requireTask(parentTaskId, ownerId);
        JsonNode parentService = catalogueService.getService(parent.serviceCode);
        JsonNode requirement = findRequirement(parentService, request.checklistItemId());
        List<DependencyRef> candidates = applicableDependencies(parentService, requirement, parent.context);
        if (candidates.isEmpty()) {
            throw new NoSuchElementException("No verified applicable prerequisite dependency for checklist item: " + request.checklistItemId());
        }
        DependencyRef dependency = chooseDependency(candidates, request.dependencyCode());
        if (parent.depth + 1 > MAX_TASK_DEPTH) throw new IllegalArgumentException("Nested task depth exceeds maximum of " + MAX_TASK_DEPTH);
        if (ancestorHasService(parent, dependency.targetServiceCode())) throw new IllegalArgumentException("Circular nested task navigation is not allowed");
        String existingChildId = parent.childTaskIds.get(dependency.dependencyCode());
        if (existingChildId != null) return getTask(existingChildId, ownerId);
        JsonNode childService = catalogueService.getService(dependency.targetServiceCode());
        TaskResponse response = createTask(dependency.targetServiceCode(), parent.context, parentTaskId, request.checklistItemId(), parent.depth + 1, ownerId, childService);
        TaskState child = requireTask(response.taskId(), ownerId);
        child.dependencyCode = dependency.dependencyCode();
        save(child);
        parent.childTaskIds.put(dependency.dependencyCode(), response.taskId());
        if (NOT_REVIEWED.equals(parent.checklistStates.get(request.checklistItemId()))) parent.checklistStates.put(request.checklistItemId(), NEEDS_VERIFICATION);
        save(parent);
        return response;
    }

    public TaskResponse getTask(String taskId, String ownerId) {
        TaskState task = requireTask(taskId, ownerId);
        return toResponse(taskId, task, catalogueService.getService(task.serviceCode));
    }

    public TaskResponse getParentTask(String taskId, String ownerId) {
        TaskState child = requireTask(taskId, ownerId);
        if (child.parentTaskId == null) throw new NoSuchElementException("Task has no parent: " + taskId);
        return getTask(child.parentTaskId, ownerId);
    }

    @Transactional
    public TaskResponse updateChecklist(String taskId, String itemId, ChecklistUpdateRequest request, String ownerId) {
        TaskState task = requireTask(taskId, ownerId);
        JsonNode service = catalogueService.getService(task.serviceCode);
        JsonNode requirement = findRequirement(service, itemId);
        if (COMPLETED.equals(request.state()) && !dependenciesSatisfied(task, requirement)) {
            throw new IllegalArgumentException("Checklist item has unresolved prerequisite dependencies: " + itemId);
        }
        task.checklistStates.put(itemId, request.state());
        save(task);
        if (isReady(task, service)) completeParentRequirement(task);
        return toResponse(taskId, task, service);
    }

    private TaskResponse createTask(String serviceCode, Map<String, Object> context, String parentTaskId, String parentChecklistItemId, int depth, String ownerId, JsonNode service) {
        String taskId = UUID.randomUUID().toString();
        Map<String, String> states = new LinkedHashMap<>();
        service.path("requirements").forEach(requirement -> states.put(requirement.path("requirementCode").asText(), NOT_REVIEWED));
        String rootTaskId = parentTaskId == null ? taskId : requireTask(parentTaskId, ownerId).rootTaskId;
        TaskState task = new TaskState(ownerId, serviceCode, parentTaskId, parentChecklistItemId, rootTaskId, context, depth, states);
        task.taskId = taskId;
        task.serviceVersion = service.path("version").asInt();
        TaskRecord saved = persistence.save(toRecord(task));
        task.revision = saved.revision();
        return toResponse(taskId, task, service);
    }

    private void completeParentRequirement(TaskState child) {
        if (child.parentTaskId == null || !isReady(child, catalogueService.getService(child.serviceCode))) return;
        TaskState parent = requireTask(child.parentTaskId, child.ownerId);
        JsonNode parentService = catalogueService.getService(parent.serviceCode);
        JsonNode requirement = findRequirement(parentService, child.parentChecklistItemId);
        if (dependenciesSatisfied(parent, requirement)) {
            parent.checklistStates.put(child.parentChecklistItemId, COMPLETED);
            save(parent);
            if (isReady(parent, parentService)) completeParentRequirement(parent);
        }
    }

    private boolean isReady(TaskState task, JsonNode service) {
        int blockingItems = 0;
        for (JsonNode requirement : service.path("requirements")) {
            if (!requirement.path("blocking").asBoolean(false) || !isRequirementApplicable(service, requirement, task.context)) continue;
            blockingItems++;
            if (!COMPLETED.equals(task.checklistStates.get(requirement.path("requirementCode").asText())) || !dependenciesSatisfied(task, requirement)) return false;
        }
        return blockingItems > 0;
    }

    private boolean dependenciesSatisfied(TaskState task, JsonNode requirement) {
        JsonNode service = catalogueService.getService(task.serviceCode);
        List<DependencyRef> dependencies = applicableDependencies(service, requirement, task.context);
        if (dependencies.isEmpty()) return true;
        boolean alternative = dependencies.stream().anyMatch(d -> "ALTERNATIVE".equals(d.kind()));
        if (alternative) return dependencies.stream().filter(d -> "ALTERNATIVE".equals(d.kind())).anyMatch(d -> childReady(task, d));
        return dependencies.stream().allMatch(d -> childReady(task, d));
    }

    private boolean childReady(TaskState parent, DependencyRef dependency) {
        String childId = parent.childTaskIds.get(dependency.dependencyCode());
        if (childId == null) return false;
        TaskState child = persistence.find(childId, parent.ownerId).map(this::fromRecord).orElse(null);
        return child != null && isReady(child, catalogueService.getService(child.serviceCode));
    }

    private List<DependencyRef> applicableDependencies(JsonNode service, JsonNode requirement, Map<String, Object> context) {
        List<DependencyRef> dependencies = new ArrayList<>();
        String requirementCode = requirement.path("requirementCode").asText();
        for (JsonNode dependency : service.path("dependencies")) {
            String source = firstText(dependency, "sourceRequirementCode", "requirementCode");
            if (!requirementCode.equals(source) || !"VERIFIED".equals(dependency.path("evidenceStatus").asText()) || !"VERIFIED".equals(requirement.path("evidenceStatus").asText())) continue;
            String conditionCode = dependency.path("conditionCode").asText(null);
            if (conditionCode != null && !conditionCode.isBlank() && !conditionMatches(service, conditionCode, context)) continue;
            String target = firstText(dependency, "prerequisiteServiceCode", "targetServiceCode");
            String code = dependency.path("dependencyCode").asText(null);
            if (target == null || code == null || code.isBlank()) continue;
            dependencies.add(new DependencyRef(code, target, dependency.path("dependencyKind").asText()));
        }
        return dependencies;
    }

    private boolean conditionMatches(JsonNode service, String code, Map<String, Object> context) {
        for (JsonNode condition : service.path("conditions")) {
            if (code.equals(condition.path("conditionCode").asText())) {
                return DependencyEvaluator.evaluateCondition(new DependencyEvaluator.Condition(condition.path("field").asText(), condition.path("operator").asText(), jsonValue(condition.get("value"))), context);
            }
        }
        return false;
    }

    private boolean isRequirementApplicable(JsonNode service, JsonNode requirement, Map<String, Object> context) {
        JsonNode expression = requirement.path("appliesWhen");
        if (expression.isMissingNode() || expression.isNull()) return true;
        for (String type : List.of("all", "any")) {
            if (expression.has(type)) {
                JsonNode codes = expression.path(type);
                if (!codes.isArray() || codes.isEmpty()) return false;
                List<Boolean> results = new ArrayList<>();
                for (JsonNode code : codes) results.add(conditionMatches(service, code.asText(), context));
                return "all".equals(type) ? results.stream().allMatch(Boolean::booleanValue) : results.stream().anyMatch(Boolean::booleanValue);
            }
        }
        return false;
    }

    private JsonNode findRequirement(JsonNode service, String itemId) {
        for (JsonNode requirement : service.path("requirements")) if (itemId.equals(requirement.path("requirementCode").asText())) return requirement;
        throw new NoSuchElementException("Checklist item not found: " + itemId);
    }

    private DependencyRef chooseDependency(List<DependencyRef> candidates, String code) {
        if (code != null && !code.isBlank()) return candidates.stream().filter(c -> code.equals(c.dependencyCode())).findFirst().orElseThrow(() -> new NoSuchElementException("Dependency not found: " + code));
        if (candidates.size() > 1) throw new IllegalArgumentException("Multiple prerequisite dependencies require a dependencyCode");
        return candidates.get(0);
    }

    private boolean ancestorHasService(TaskState task, String serviceCode) {
        TaskState current = task;
        while (current != null) {
            if (serviceCode.equals(current.serviceCode)) return true;
            current = current.parentTaskId == null ? null : requireTask(current.parentTaskId, task.ownerId);
        }
        return false;
    }

    private TaskState requireTask(String taskId, String ownerId) {
        return persistence.find(taskId, ownerId).map(this::fromRecord)
                .orElseThrow(() -> new NoSuchElementException("Task not found: " + taskId));
    }

    private void save(TaskState task) {
        TaskRecord saved = persistence.save(toRecord(task));
        task.revision = saved.revision();
    }

    private TaskRecord toRecord(TaskState task) {
        String state = isReady(task, catalogueService.getService(task.serviceCode)) ? "READY_TO_APPLY" : "PREPARING_DOCUMENTS";
        return new TaskRecord(task.taskId, task.ownerId, task.serviceCode, task.serviceVersion, task.parentTaskId,
                task.parentChecklistItemId, task.rootTaskId, task.dependencyCode, task.depth, state, task.context,
                task.checklistStates, task.childTaskIds, task.revision);
    }

    private TaskState fromRecord(TaskRecord record) {
        TaskState task = new TaskState(record.ownerId(), record.serviceCode(), record.parentTaskId(), record.parentChecklistItemId(),
                record.rootTaskId(), record.context(), record.depth(), new LinkedHashMap<>(record.checklistStates()));
        task.taskId = record.taskId();
        task.serviceVersion = record.serviceVersion();
        task.dependencyCode = record.dependencyCode();
        task.childTaskIds.putAll(record.childTaskIds());
        task.revision = record.revision();
        return task;
    }

    private TaskResponse toResponse(String taskId, TaskState task, JsonNode service) {
        int blocking = 0;
        int completed = 0;
        int totalItems = 0;
        int completedItems = 0;
        for (JsonNode requirement : service.path("requirements")) {
            boolean applicable = isRequirementApplicable(service, requirement, task.context);
            String state = task.checklistStates.get(requirement.path("requirementCode").asText());
            if (!applicable || "NOT_APPLICABLE".equals(state)) continue;
            totalItems++;
            if (isProgressComplete(task, service, requirement)) completedItems++;
            if (requirement.path("blocking").asBoolean(false)) {
                blocking++;
                if (COMPLETED.equals(state) && dependenciesSatisfied(task, requirement)) completed++;
            }
        }
        int remainingItems = totalItems - completedItems;
        int progressPercentage = totalItems == 0 ? 0 : (int) Math.round((completedItems * 100.0) / totalItems);
        String state = blocking > 0 && completed == blocking ? "READY_TO_APPLY" : "PREPARING_DOCUMENTS";
        return new TaskResponse(taskId, task.serviceCode, service.path("status").asText(), service.path("publicationReadiness").asText(), state, completed, blocking, Map.copyOf(task.checklistStates), persistence.persistenceLabel(), task.parentTaskId, task.parentChecklistItemId, task.rootTaskId, Map.copyOf(task.childTaskIds), completedItems, totalItems, remainingItems, progressPercentage, estimate(service));
    }

    private boolean isProgressComplete(TaskState task, JsonNode service, JsonNode requirement) {
        String evidenceStatus = requirement.path("evidenceStatus").asText("");
        return COMPLETED.equals(task.checklistStates.get(requirement.path("requirementCode").asText()))
                && (evidenceStatus.isBlank() || "VERIFIED".equals(evidenceStatus))
                && dependenciesSatisfied(task, requirement);
    }

    private TaskResponse.EstimateResponse estimate(JsonNode service) {
        JsonNode processing = service.path("processingTime");
        String status = processing.path("status").asText("");
        String description = processing.path("claim").asText("");
        if (description.isBlank()) description = "No verified government processing-time information is available.";
        return new TaskResponse.EstimateResponse(
                "UNAVAILABLE",
                "Estimate unavailable",
                "No verified numeric user-effort rule is defined; government processing information is not converted into a user-effort estimate.",
                status.isBlank() ? "UNAVAILABLE" : status,
                description);
    }

    private static String firstText(JsonNode node, String... fields) {
        for (String field : fields) if (node.hasNonNull(field) && !node.path(field).asText().isBlank()) return node.path(field).asText();
        return null;
    }

    private static Object jsonValue(JsonNode value) {
        if (value == null || value.isNull()) return null;
        if (value.isArray()) { List<Object> values = new ArrayList<>(); value.forEach(item -> values.add(jsonValue(item))); return values; }
        if (value.isBoolean()) return value.booleanValue();
        if (value.isNumber()) return value.decimalValue();
        return value.asText();
    }

    private record DependencyRef(String dependencyCode, String targetServiceCode, String kind) { }

    private static final class TaskState {
        private String taskId;
        private final String ownerId;
        private final String serviceCode;
        private final String parentTaskId;
        private final String parentChecklistItemId;
        private final String rootTaskId;
        private final Map<String, Object> context;
        private final int depth;
        private int serviceVersion;
        private String dependencyCode;
        private long revision;
        private final Map<String, String> checklistStates;
        private final Map<String, String> childTaskIds = new LinkedHashMap<>();

        private TaskState(String ownerId, String serviceCode, String parentTaskId, String parentChecklistItemId, String rootTaskId, Map<String, Object> context, int depth, Map<String, String> checklistStates) {
            this.ownerId = ownerId;
            this.serviceCode = serviceCode;
            this.parentTaskId = parentTaskId;
            this.parentChecklistItemId = parentChecklistItemId;
            this.rootTaskId = rootTaskId;
            this.context = context == null ? Map.of() : Map.copyOf(context);
            this.depth = depth;
            this.checklistStates = checklistStates;
        }
    }
}
