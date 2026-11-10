package com.govguide.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.govguide.dto.ChecklistUpdateRequest;
import com.govguide.dto.CreateChildTaskRequest;
import com.govguide.dto.CreateTaskRequest;
import com.govguide.dto.TaskResponse;
import com.govguide.persistence.InMemoryTaskPersistence;
import java.nio.file.Path;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mockito;

class ChecklistTaskServiceTest {

    @TempDir
    Path tempDir;

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void preservesParentProgressAndCompletesItWhenChildIsReady() throws Exception {
        ServiceCatalogueService catalogue = Mockito.mock(ServiceCatalogueService.class);
        JsonNode parent = mapper.readTree(parentJson("REQUIRED", "VERIFIED", false));
        JsonNode child = mapper.readTree(childJson(false));
        Mockito.when(catalogue.getService("PARENT")).thenReturn(parent);
        Mockito.when(catalogue.getService("CHILD")).thenReturn(child);
        ChecklistTaskService tasks = new ChecklistTaskService(catalogue, new InMemoryTaskPersistence(tempDir.toString()));

        TaskResponse root = tasks.createTask(new CreateTaskRequest("PARENT", Map.of()), "test-user");
        TaskResponse nested = tasks.createChildTask(root.taskId(), new CreateChildTaskRequest("REQ", null), "test-user");
        assertEquals(root.taskId(), nested.parentTaskId());
        assertEquals("NEEDS_VERIFICATION", tasks.getTask(root.taskId(), "test-user").checklistStates().get("REQ"));
        assertEquals(0, tasks.getTask(root.taskId(), "test-user").progressPercentage());

        TaskResponse childUpdated = tasks.updateChecklist(
                nested.taskId(), "CHILD_REQ", new ChecklistUpdateRequest("COMPLETED"), "test-user");
        assertEquals("READY_TO_APPLY", childUpdated.state());
        assertEquals(100, childUpdated.progressPercentage());
        TaskResponse parentUpdated = tasks.getTask(root.taskId(), "test-user");
        assertEquals("COMPLETED", parentUpdated.checklistStates().get("REQ"));
        assertEquals("READY_TO_APPLY", parentUpdated.state());
        assertEquals(100, parentUpdated.progressPercentage());
        assertEquals(root.taskId(), tasks.getParentTask(nested.taskId(), "test-user").taskId());
    }

    @Test
    void preventsDuplicateChildrenAndCircularNavigation() throws Exception {
        ServiceCatalogueService catalogue = Mockito.mock(ServiceCatalogueService.class);
        JsonNode parent = mapper.readTree(parentJson("REQUIRED", "VERIFIED", false));
        JsonNode child = mapper.readTree(childJson(true));
        Mockito.when(catalogue.getService("PARENT")).thenReturn(parent);
        Mockito.when(catalogue.getService("CHILD")).thenReturn(child);
        ChecklistTaskService tasks = new ChecklistTaskService(catalogue, new InMemoryTaskPersistence(tempDir.toString()));

        TaskResponse root = tasks.createTask(new CreateTaskRequest("PARENT", Map.of()), "test-user");
        TaskResponse first = tasks.createChildTask(root.taskId(), new CreateChildTaskRequest("REQ", null), "test-user");
        TaskResponse duplicate = tasks.createChildTask(root.taskId(), new CreateChildTaskRequest("REQ", null), "test-user");
        assertEquals(first.taskId(), duplicate.taskId());
        assertThrows(IllegalArgumentException.class,
                () -> tasks.createChildTask(first.taskId(), new CreateChildTaskRequest("CHILD_REQ", null), "test-user"));
    }

    @Test
    void keepsParentUnresolvedWhenAnotherMandatoryRequirementRemainsIncomplete() throws Exception {
        ServiceCatalogueService catalogue = Mockito.mock(ServiceCatalogueService.class);
        JsonNode parent = mapper.readTree(parentWithIndependentRequirementJson());
        JsonNode child = mapper.readTree(childJson(false));
        Mockito.when(catalogue.getService("PARENT")).thenReturn(parent);
        Mockito.when(catalogue.getService("CHILD")).thenReturn(child);
        ChecklistTaskService tasks = new ChecklistTaskService(catalogue, new InMemoryTaskPersistence(tempDir.toString()));

        TaskResponse root = tasks.createTask(new CreateTaskRequest("PARENT", Map.of()), "test-user");
        TaskResponse nested = tasks.createChildTask(root.taskId(), new CreateChildTaskRequest("REQ", null), "test-user");
        TaskResponse childUpdated = tasks.updateChecklist(
                nested.taskId(), "CHILD_REQ", new ChecklistUpdateRequest("COMPLETED"), "test-user");

        TaskResponse parentUpdated = tasks.getTask(root.taskId(), "test-user");
        assertEquals("COMPLETED", parentUpdated.checklistStates().get("REQ"));
        assertEquals("NOT_REVIEWED", parentUpdated.checklistStates().get("OTHER_REQ"));
        assertEquals("PREPARING_DOCUMENTS", parentUpdated.state());
        assertEquals(1, parentUpdated.completedItems());
        assertEquals(1, parentUpdated.remainingItems());
        assertEquals(50, parentUpdated.progressPercentage());
        assertEquals("READY_TO_APPLY", childUpdated.state());
    }

    @Test
    void enforcesNestedDepthBoundaryWithoutCreatingProhibitedChild() throws Exception {
        ServiceCatalogueService catalogue = Mockito.mock(ServiceCatalogueService.class);
        Map<String, JsonNode> services = new java.util.HashMap<>();
        for (int index = 0; index <= 17; index++) {
            String serviceCode = "CHAIN_" + index;
            String requirementCode = "REQ_" + index;
            String dependency = index < 17
                    ? ",\"dependencies\":[{\"dependencyCode\":\"DEP_" + index
                        + "\",\"sourceRequirementCode\":\"" + requirementCode
                        + "\",\"prerequisiteServiceCode\":\"CHAIN_" + (index + 1)
                        + "\",\"dependencyKind\":\"REQUIRED\",\"evidenceStatus\":\"VERIFIED\"}]"
                    : "";
            services.put(serviceCode, mapper.readTree(
                    "{\"serviceCode\":\"" + serviceCode
                            + "\",\"status\":\"REVIEW\",\"publicationReadiness\":\"LIMITED_ROUTE_CANDIDATE\""
                            + ",\"conditions\":[],\"sources\":[],\"requirements\":[{\"requirementCode\":\""
                            + requirementCode + "\",\"blocking\":true,\"evidenceStatus\":\"VERIFIED\"}]"
                            + dependency + "}"));
        }
        Mockito.when(catalogue.getService(Mockito.anyString())).thenAnswer(invocation ->
                services.get(invocation.getArgument(0)));
        ChecklistTaskService tasks = new ChecklistTaskService(catalogue, new InMemoryTaskPersistence(tempDir.toString()));

        TaskResponse current = tasks.createTask(new CreateTaskRequest("CHAIN_0", Map.of()), "test-user");
        for (int index = 0; index < 16; index++) {
            current = tasks.createChildTask(current.taskId(),
                    new CreateChildTaskRequest("REQ_" + index, null), "test-user");
        }
        TaskResponse depthBoundary = current;
        assertEquals("CHAIN_16", depthBoundary.serviceCode());
        assertThrows(IllegalArgumentException.class,
                () -> tasks.createChildTask(depthBoundary.taskId(),
                        new CreateChildTaskRequest("REQ_16", null), "test-user"));

        TaskResponse boundaryTask = tasks.getTask(depthBoundary.taskId(), "test-user");
        assertFalse(boundaryTask.childTaskIds().containsKey("DEP_16"));
        assertEquals("CHAIN_15", tasks.getParentTask(depthBoundary.taskId(), "test-user").serviceCode());
    }

    @Test
    void doesNotOpenUnverifiedOrInapplicableDependencies() throws Exception {
        ServiceCatalogueService catalogue = Mockito.mock(ServiceCatalogueService.class);
        JsonNode conditional = mapper.readTree(conditionalParentJson());
        JsonNode child = mapper.readTree(childJson(false));
        Mockito.when(catalogue.getService("PARENT")).thenReturn(conditional);
        Mockito.when(catalogue.getService("CHILD")).thenReturn(child);
        ChecklistTaskService tasks = new ChecklistTaskService(catalogue, new InMemoryTaskPersistence(tempDir.toString()));

        TaskResponse noContext = tasks.createTask(new CreateTaskRequest("PARENT", Map.of()), "test-user");
        assertThrows(java.util.NoSuchElementException.class,
                () -> tasks.createChildTask(noContext.taskId(), new CreateChildTaskRequest("REQ", null), "test-user"));

        TaskResponse applicable = tasks.createTask(new CreateTaskRequest("PARENT", Map.of("applicant.age", 21)), "test-user");
        assertEquals("CHILD", tasks.createChildTask(applicable.taskId(), new CreateChildTaskRequest("REQ", null), "test-user").serviceCode());
    }

    @Test
    void requiresExplicitChoiceForAlternativeDependencies() throws Exception {
        ServiceCatalogueService catalogue = Mockito.mock(ServiceCatalogueService.class);
        JsonNode parent = mapper.readTree(parentJson("ALTERNATIVE", "VERIFIED", true));
        JsonNode child = mapper.readTree(childJson(false));
        Mockito.when(catalogue.getService("PARENT")).thenReturn(parent);
        Mockito.when(catalogue.getService("CHILD")).thenReturn(child);
        ChecklistTaskService tasks = new ChecklistTaskService(catalogue, new InMemoryTaskPersistence(tempDir.toString()));
        TaskResponse root = tasks.createTask(new CreateTaskRequest("PARENT", Map.of()), "test-user");
        assertThrows(IllegalArgumentException.class,
                () -> tasks.createChildTask(root.taskId(), new CreateChildTaskRequest("REQ", null), "test-user"));
    }

    @Test
    void isolatesTasksByOwner() throws Exception {
        ServiceCatalogueService catalogue = Mockito.mock(ServiceCatalogueService.class);
        JsonNode parent = mapper.readTree(parentJson("REQUIRED", "VERIFIED", false));
        Mockito.when(catalogue.getService("PARENT")).thenReturn(parent);
        ChecklistTaskService tasks = new ChecklistTaskService(catalogue, new InMemoryTaskPersistence(tempDir.toString()));

        TaskResponse aliceTask = tasks.createTask(new CreateTaskRequest("PARENT", Map.of()), "alice");
        assertThrows(java.util.NoSuchElementException.class, () -> tasks.getTask(aliceTask.taskId(), "bob"));
        assertThrows(java.util.NoSuchElementException.class, () -> tasks.updateChecklist(
                aliceTask.taskId(), "REQ", new ChecklistUpdateRequest("COMPLETED"), "bob"));
    }

    @Test
    void supportsMultipleTasksForTheSameUserAndService() throws Exception {
        ServiceCatalogueService catalogue = Mockito.mock(ServiceCatalogueService.class);
        JsonNode parent = mapper.readTree(parentJson("REQUIRED", "VERIFIED", false));
        Mockito.when(catalogue.getService("PARENT")).thenReturn(parent);
        ChecklistTaskService tasks = new ChecklistTaskService(catalogue, new InMemoryTaskPersistence(tempDir.toString()));

        TaskResponse first = tasks.createTask(new CreateTaskRequest("PARENT", Map.of()), "alice");
        TaskResponse second = tasks.createTask(new CreateTaskRequest("PARENT", Map.of("case", "second")), "alice");

        assertFalse(first.taskId().equals(second.taskId()));
        assertEquals("PARENT", tasks.getTask(first.taskId(), "alice").serviceCode());
        assertEquals("PARENT", tasks.getTask(second.taskId(), "alice").serviceCode());
    }

    @Test
    void calculatesProgressAndLeavesGovernmentEstimateUnavailable() throws Exception {
        ServiceCatalogueService catalogue = Mockito.mock(ServiceCatalogueService.class);
        JsonNode service = mapper.readTree(twoRequirementJson("VERIFIED"));
        Mockito.when(catalogue.getService("TRACKED")).thenReturn(service);
        ChecklistTaskService tasks = new ChecklistTaskService(catalogue, new InMemoryTaskPersistence(tempDir.toString()));

        TaskResponse initial = tasks.createTask(new CreateTaskRequest("TRACKED", Map.of()), "test-user");
        assertEquals(0, initial.completedItems());
        assertEquals(2, initial.totalItems());
        assertEquals(2, initial.remainingItems());
        assertEquals(0, initial.progressPercentage());
        assertEquals("Estimate unavailable", initial.estimate().userEffortLabel());

        TaskResponse partial = tasks.updateChecklist(initial.taskId(), "REQ_1",
                new ChecklistUpdateRequest("COMPLETED"), "test-user");
        assertEquals(1, partial.completedItems());
        assertEquals(1, partial.remainingItems());
        assertEquals(50, partial.progressPercentage());

        TaskResponse complete = tasks.updateChecklist(initial.taskId(), "REQ_2",
                new ChecklistUpdateRequest("COMPLETED"), "test-user");
        assertEquals(2, complete.completedItems());
        assertEquals(0, complete.remainingItems());
        assertEquals(100, complete.progressPercentage());
        assertEquals("QUALITATIVE_ONLY", complete.estimate().governmentProcessingStatus());
    }

    @Test
    void excludesExplicitlyUnverifiedRequirementsFromCompletedProgress() throws Exception {
        ServiceCatalogueService catalogue = Mockito.mock(ServiceCatalogueService.class);
        JsonNode service = mapper.readTree(twoRequirementJson("UNVERIFIED"));
        Mockito.when(catalogue.getService("TRACKED")).thenReturn(service);
        ChecklistTaskService tasks = new ChecklistTaskService(catalogue, new InMemoryTaskPersistence(tempDir.toString()));

        TaskResponse task = tasks.createTask(new CreateTaskRequest("TRACKED", Map.of()), "test-user");
        TaskResponse updated = tasks.updateChecklist(task.taskId(), "REQ_1",
                new ChecklistUpdateRequest("COMPLETED"), "test-user");
        assertEquals(0, updated.completedItems());
        assertEquals(2, updated.remainingItems());
        assertEquals(0, updated.progressPercentage());
    }

    @Test
    void handlesEmptyChecklistWithoutDivisionByZero() throws Exception {
        ServiceCatalogueService catalogue = Mockito.mock(ServiceCatalogueService.class);
        JsonNode service = mapper.readTree("{\"serviceCode\":\"EMPTY\",\"status\":\"REVIEW\",\"publicationReadiness\":\"LIMITED_ROUTE_CANDIDATE\",\"requirements\":[],\"processingTime\":{\"status\":\"UNAVAILABLE\"}}");
        Mockito.when(catalogue.getService("EMPTY")).thenReturn(service);
        ChecklistTaskService tasks = new ChecklistTaskService(catalogue, new InMemoryTaskPersistence(tempDir.toString()));

        TaskResponse task = tasks.createTask(new CreateTaskRequest("EMPTY", Map.of()), "test-user");
        assertEquals(0, task.totalItems());
        assertEquals(0, task.remainingItems());
        assertEquals(0, task.progressPercentage());
    }

    private String parentJson(String kind, String evidence, boolean twoAlternatives) {
        String second = twoAlternatives
                ? ", {\"dependencyCode\":\"DEP_2\",\"sourceRequirementCode\":\"REQ\",\"prerequisiteServiceCode\":\"CHILD\",\"dependencyKind\":\"ALTERNATIVE\",\"evidenceStatus\":\"VERIFIED\"}"
                : "";
        return "{\"serviceCode\":\"PARENT\",\"status\":\"REVIEW\",\"publicationReadiness\":\"LIMITED_ROUTE_CANDIDATE\","
                + "\"conditions\":[],\"sources\":[],\"requirements\":[{\"requirementCode\":\"REQ\",\"blocking\":true,\"evidenceStatus\":\"VERIFIED\"}],"
                + "\"dependencies\":[{\"dependencyCode\":\"DEP_1\",\"sourceRequirementCode\":\"REQ\",\"prerequisiteServiceCode\":\"CHILD\",\"dependencyKind\":\""
                + kind + "\",\"evidenceStatus\":\"" + evidence + "\"}" + second + "]}";
    }

    private String parentWithIndependentRequirementJson() {
        return "{\"serviceCode\":\"PARENT\",\"status\":\"REVIEW\",\"publicationReadiness\":\"LIMITED_ROUTE_CANDIDATE\","
                + "\"conditions\":[],\"sources\":[],\"requirements\":["
                + "{\"requirementCode\":\"REQ\",\"blocking\":true,\"evidenceStatus\":\"VERIFIED\"},"
                + "{\"requirementCode\":\"OTHER_REQ\",\"blocking\":true,\"evidenceStatus\":\"VERIFIED\"}],"
                + "\"dependencies\":[{\"dependencyCode\":\"DEP_1\",\"sourceRequirementCode\":\"REQ\","
                + "\"prerequisiteServiceCode\":\"CHILD\",\"dependencyKind\":\"REQUIRED\","
                + "\"evidenceStatus\":\"VERIFIED\"}]}";
    }

    private String conditionalParentJson() {
        return "{\"serviceCode\":\"PARENT\",\"status\":\"REVIEW\",\"publicationReadiness\":\"LIMITED_ROUTE_CANDIDATE\","
                + "\"conditions\":[{\"conditionCode\":\"ADULT\",\"field\":\"applicant.age\",\"operator\":\"GREATER_THAN\",\"value\":18}],"
                + "\"sources\":[],\"requirements\":[{\"requirementCode\":\"REQ\",\"blocking\":true,\"evidenceStatus\":\"VERIFIED\"}],"
                + "\"dependencies\":[{\"dependencyCode\":\"DEP_1\",\"sourceRequirementCode\":\"REQ\",\"prerequisiteServiceCode\":\"CHILD\",\"dependencyKind\":\"CONDITIONAL\",\"conditionCode\":\"ADULT\",\"evidenceStatus\":\"VERIFIED\"}]}";
    }

    private String twoRequirementJson(String evidenceStatus) {
        return "{\"serviceCode\":\"TRACKED\",\"status\":\"REVIEW\",\"publicationReadiness\":\"LIMITED_ROUTE_CANDIDATE\","
                + "\"requirements\":[{\"requirementCode\":\"REQ_1\",\"blocking\":true,\"evidenceStatus\":\"" + evidenceStatus + "\"},"
                + "{\"requirementCode\":\"REQ_2\",\"blocking\":true,\"evidenceStatus\":\"VERIFIED\"}],"
                + "\"dependencies\":[],\"processingTime\":{\"status\":\"QUALITATIVE_ONLY\",\"claim\":\"Near-real time description\"}}";
    }

    private String childJson(boolean circular) {
        String dependency = circular
                ? ",\"dependencies\":[{\"dependencyCode\":\"BACK\",\"sourceRequirementCode\":\"CHILD_REQ\",\"prerequisiteServiceCode\":\"PARENT\",\"dependencyKind\":\"REQUIRED\",\"evidenceStatus\":\"VERIFIED\"}]"
                : "";
        return "{\"serviceCode\":\"CHILD\",\"status\":\"REVIEW\",\"publicationReadiness\":\"LIMITED_ROUTE_CANDIDATE\",\"conditions\":[],\"sources\":[],\"requirements\":[{\"requirementCode\":\"CHILD_REQ\",\"blocking\":true,\"evidenceStatus\":\"VERIFIED\"}]" + dependency + "}";
    }
}
