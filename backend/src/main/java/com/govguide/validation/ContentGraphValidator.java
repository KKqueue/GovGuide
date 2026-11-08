package com.govguide.validation;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Cross-record validation for the JSON service content contract. */
public final class ContentGraphValidator {

    private static final Set<String> SOURCE_CATEGORIES = Set.of(
            "OFFICIAL_GOVERNMENT",
            "AUTHORIZED_SERVICE_PROVIDER",
            "INDEPENDENT_CORROBORATED",
            "INDEPENDENT_UNVERIFIED",
            "STAFF_REPORTED",
            "UNKNOWN_OR_UNAVAILABLE");
    private static final Set<String> SOURCE_VERIFICATION_STATUSES = Set.of(
            "VERIFIED", "NEEDS_REVIEW", "UNVERIFIED", "CONFLICTING", "OUTDATED", "SUPERSEDED", "UNAVAILABLE");
    private static final Set<String> EVIDENCE_STATUSES = Set.of(
            "VERIFIED", "CORROBORATED", "NEEDS_REVIEW", "UNVERIFIED", "STAFF_REPORTED",
            "UNKNOWN", "INTERNAL_WORKFLOW", "CONFLICTING", "OUTDATED");

    private ContentGraphValidator() {
    }

    public static void validateCatalog(Iterable<JsonNode> records) {
        Map<String, JsonNode> byCode = new HashMap<>();
        List<JsonNode> list = new ArrayList<>();
        for (JsonNode record : records) {
            String serviceCode = text(record, "serviceCode");
            if (byCode.put(serviceCode, record) != null) {
                throw new IllegalArgumentException("Duplicate service code: " + serviceCode);
            }
            list.add(record);
        }

        Map<String, Set<String>> graph = new HashMap<>();
        for (JsonNode record : list) {
            validateRecord(record, byCode, graph);
        }
        DependencyGraphValidator.validate(graph);
    }

    private static void validateRecord(
            JsonNode record,
            Map<String, JsonNode> services,
            Map<String, Set<String>> graph) {
        String serviceCode = text(record, "serviceCode");
        Map<String, JsonNode> conditions = index(record.path("conditions"), "conditionCode", "condition");
        Map<String, JsonNode> sources = index(record.path("sources"), "sourceCode", "source");
        Map<String, JsonNode> requirements = index(record.path("requirements"), "requirementCode", "requirement");

        for (JsonNode source : sources.values()) {
            validateSource(source);
        }

        for (JsonNode condition : conditions.values()) {
            validateCondition(condition);
            validateEvidence(condition, sources, false);
        }
        for (JsonNode requirement : requirements.values()) {
            String evidenceStatus = text(requirement, "evidenceStatus");
            validateEvidence(requirement, sources, isApproved(record));
            JsonNode expression = requirement.path("appliesWhen");
            validateExpressionReferences(expression, conditions);
            if ("ALTERNATIVE_GROUP".equals(requirement.path("kind").asText())) {
                JsonNode alternatives = requirement.path("alternatives");
                if (!alternatives.isArray() || alternatives.isEmpty()) {
                    throw new IllegalArgumentException("Alternative requirement needs at least one alternative");
                }
                for (JsonNode alternative : alternatives) {
                    if (alternative.isTextual()) {
                        continue;
                    }
                    validateEvidence(alternative, sources, isApproved(record));
                }
            }
            if (isApproved(record) && !"VERIFIED".equals(evidenceStatus)) {
                throw new IllegalArgumentException("Approved content cannot contain unverified requirements");
            }
        }
        for (JsonNode process : record.path("processInformation")) {
            validateExpressionReferences(process.path("appliesWhen"), conditions);
        }

        Set<String> targets = graph.computeIfAbsent(serviceCode, ignored -> new HashSet<>());
        for (JsonNode dependency : record.path("dependencies")) {
            String target = firstText(dependency, "prerequisiteServiceCode", "targetServiceCode");
            String sourceRequirement = firstText(dependency, "sourceRequirementCode", "requirementCode");
            String documentTarget = firstText(dependency, "prerequisiteDocumentTypeCode", "documentTypeCode");
            if (target == null && documentTarget == null) {
                throw new IllegalArgumentException("Dependency must declare a prerequisite target");
            }
            if (target != null && !services.containsKey(target)) {
                throw new IllegalArgumentException("Dependency references an unknown service");
            }
            if (sourceRequirement == null || !requirements.containsKey(sourceRequirement)) {
                throw new IllegalArgumentException("Dependency references an unknown requirement");
            }
            String kind = text(dependency, "dependencyKind");
            ContentPublicationValidator.validateDependency(
                    serviceCode,
                    serviceCode,
                    kind,
                    dependency.path("conditionCode").asText(null),
                    documentTarget,
                    target);
            if (target != null) {
                targets.add(target);
            }
            if ("CONDITIONAL".equals(kind)) {
                String conditionCode = text(dependency, "conditionCode");
                if (!conditions.containsKey(conditionCode)) {
                    throw new IllegalArgumentException("Dependency references an unknown condition");
                }
            }
            validateEvidence(dependency, sources, isApproved(record));
        }
    }

    private static void validateCondition(JsonNode condition) {
        String field = text(condition, "field");
        String operator = text(condition, "operator");
        JsonNode value = condition.get("value");
        if (value == null || value.isNull()) {
            throw new IllegalArgumentException("Condition value is required");
        }
        if (value.isArray()) {
            List<String> values = new ArrayList<>();
            value.forEach(item -> values.add(item.isTextual() ? item.textValue() : null));
            ContentPublicationValidator.validateCondition(field, operator, "STRING", null, null, null, values);
        } else if (value.isBoolean()) {
            ContentPublicationValidator.validateCondition(field, operator, "BOOLEAN", null, value.booleanValue(), null, null);
        } else if (value.isNumber()) {
            ContentPublicationValidator.validateCondition(field, operator, "NUMBER", null, null, value.decimalValue(), null);
        } else if (value.isTextual()) {
            ContentPublicationValidator.validateCondition(field, operator, "STRING", value.textValue(), null, null, null);
        } else {
            throw new IllegalArgumentException("Condition value must be scalar or a string set");
        }
    }

    private static void validateExpressionReferences(JsonNode expression, Map<String, JsonNode> conditions) {
        if (expression == null || expression.isMissingNode() || expression.isNull()) {
            return;
        }
        if (!expression.isObject()) {
            throw new IllegalArgumentException("Requirement expression must be an object");
        }
        for (String type : List.of("all", "any")) {
            JsonNode children = expression.get(type);
            if (children != null) {
                if (!children.isArray() || children.isEmpty()) {
                    throw new IllegalArgumentException("Expression group must contain conditions");
                }
                for (JsonNode child : children) {
                    String code = child.asText(null);
                    if (code == null || !conditions.containsKey(code)) {
                        throw new IllegalArgumentException("Expression references an unknown condition");
                    }
                }
            }
        }
    }

    private static void validateEvidence(JsonNode node, Map<String, JsonNode> sources, boolean requireVerified) {
        String status = node.path("evidenceStatus").asText(null);
        if (status == null) {
            return;
        }
        if (!EVIDENCE_STATUSES.contains(status)) {
            throw new IllegalArgumentException("Unsupported evidence status");
        }
        JsonNode refs = node.path("sourceRefs");
        if (requireVerified && !"VERIFIED".equals(status)) {
            throw new IllegalArgumentException("Approved content requires verified evidence");
        }
        if ("VERIFIED".equals(status) && (!refs.isArray() || refs.isEmpty())) {
            throw new IllegalArgumentException("Verified content requires source references");
        }
        if ("CORROBORATED".equals(status) && (!refs.isArray() || refs.size() < 2)) {
            throw new IllegalArgumentException("Corroborated content requires at least two source references");
        }
        if (refs.isArray()) {
            Set<String> corroborationKeys = new HashSet<>();
            for (JsonNode ref : refs) {
                JsonNode source = sources.get(ref.asText());
                if (source == null) {
                    throw new IllegalArgumentException("Content references an unknown source");
                }
                if ("CORROBORATED".equals(status)
                        && !corroborationKeys.add(sourceIdentity(source))) {
                    throw new IllegalArgumentException("Corroborated content requires distinct sources");
                }
                if ("CORROBORATED".equals(status)
                        && !"VERIFIED".equals(source.path("verificationStatus").asText())) {
                    throw new IllegalArgumentException("Corroborated content requires verified source records");
                }
                if ("VERIFIED".equals(status)
                        && (!"VERIFIED".equals(source.path("verificationStatus").asText())
                        || !Set.of("OFFICIAL_GOVERNMENT", "AUTHORIZED_SERVICE_PROVIDER")
                        .contains(source.path("sourceCategory").asText()))) {
                    throw new IllegalArgumentException("Verified content requires verified authoritative source evidence");
                }
            }
        }
    }

    private static void validateSource(JsonNode source) {
        String category = text(source, "sourceCategory");
        if (!SOURCE_CATEGORIES.contains(category)) {
            throw new IllegalArgumentException("Unsupported source category");
        }
        String status = text(source, "verificationStatus");
        if (!SOURCE_VERIFICATION_STATUSES.contains(status)) {
            throw new IllegalArgumentException("Unsupported source verification status");
        }
        text(source, "title");
        text(source, "publisher");
        if (!hasText(source, "url") && !hasText(source, "documentReference")) {
            throw new IllegalArgumentException("Source requires a URL or document reference");
        }
        if (source.path("url").isTextual() && source.path("url").asText().isBlank()) {
            throw new IllegalArgumentException("Source URL cannot be blank");
        }
    }

    private static String sourceIdentity(JsonNode source) {
        if (hasText(source, "url")) {
            return source.path("url").asText();
        }
        return source.path("documentReference").asText();
    }

    private static boolean hasText(JsonNode node, String field) {
        return node.path(field).isTextual() && !node.path(field).asText().isBlank();
    }

    private static boolean isApproved(JsonNode record) {
        return "PUBLISHED".equals(record.path("status").asText())
                || "APPROVED".equals(record.path("publicationReadiness").asText());
    }

    private static Map<String, JsonNode> index(JsonNode values, String codeField, String kind) {
        Map<String, JsonNode> indexed = new HashMap<>();
        if (!values.isArray()) {
            return indexed;
        }
        for (JsonNode value : values) {
            String code = text(value, codeField);
            if (indexed.put(code, value) != null) {
                throw new IllegalArgumentException("Duplicate " + kind + " code: " + code);
            }
        }
        return indexed;
    }

    private static String firstText(JsonNode node, String... fields) {
        for (String field : fields) {
            if (node.hasNonNull(field) && !node.path(field).asText().isBlank()) {
                return node.path(field).asText();
            }
        }
        return null;
    }

    private static String text(JsonNode node, String field) {
        String value = node.path(field).asText(null);
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Missing " + field);
        }
        return value;
    }
}

