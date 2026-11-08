package com.govguide.validation;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.Set;

public final class ContentPublicationValidator {

    private static final Set<String> ALLOWED_CONDITION_ENTITY_PREFIXES = Set.of(
        "applicant", "workflow", "event", "company", "business", "establishment",
        "employee", "enterprise", "vehicle", "transaction", "property", "premises",
        "beneficiary", "guardian", "project", "licensee", "subscriber", "petitioner",
        "operator", "dealer", "manufacturer");
    private static final Set<String> ALLOWED_OPERATORS = Set.of(
        "EQUALS", "NOT_EQUALS", "LESS_THAN", "GREATER_THAN", "IN_SET");
    private static final Set<String> ALLOWED_DEPENDENCY_KINDS = Set.of(
        "REQUIRED", "CONDITIONAL", "OPTIONAL", "ALTERNATIVE");

    private ContentPublicationValidator() {
    }

    public static void requireVerifiedEvidence(String contentType, String status, int sourceCount) {
        if ("VERIFIED".equals(status) && sourceCount < 1) {
            throw new IllegalArgumentException(contentType + " requires at least one source");
        }
    }

    public static void requireVerifiedFee(
            String status,
            int sourceCount,
            BigDecimal amount,
            BigDecimal minimumAmount,
            BigDecimal maximumAmount) {
        requireVerifiedEvidence("Verified fee", status, sourceCount);
        if (minimumAmount != null && maximumAmount != null && minimumAmount.compareTo(maximumAmount) > 0) {
            throw new IllegalArgumentException("Fee range minimum cannot exceed maximum");
        }
        if ("VERIFIED".equals(status) && amount == null && minimumAmount == null && maximumAmount == null) {
            throw new IllegalArgumentException("Verified fee requires an amount or range");
        }
    }

    public static void requireVerifiedProcessingTime(
            String status,
            int sourceCount,
            Integer minimumDuration,
            Integer maximumDuration,
            String durationUnit,
            String basis,
            String claim) {
        requireVerifiedEvidence("Verified processing time", status, sourceCount);
        boolean hasDuration = minimumDuration != null || maximumDuration != null;
        boolean orderedRange = minimumDuration == null || maximumDuration == null
                || minimumDuration <= maximumDuration;
        boolean hasDurationUnit = !hasDuration || (durationUnit != null && !durationUnit.isBlank());
        boolean hasQualitativeBasis = "OFFICIAL_SERVICE_DESCRIPTION".equals(basis)
                && claim != null
                && !claim.isBlank();
        if ("VERIFIED".equals(status) && (!orderedRange || !hasDurationUnit
                || (!hasDuration && !hasQualitativeBasis))) {
            throw new IllegalArgumentException("Verified processing time requires a duration or documented qualitative basis");
        }
    }

    public static void requireCurrentLink(String status, int sourceCount) {
        if ("CURRENT".equals(status) && sourceCount < 1) {
            throw new IllegalArgumentException("Current service link requires a source");
        }
    }

    public static void validateCondition(
            String fieldName,
            String operator,
            String valueType,
            String textValue,
            Boolean booleanValue,
            BigDecimal numberValue,
            List<String> setValues) {
        if (fieldName == null || operator == null || !ALLOWED_OPERATORS.contains(operator)
                || !isValidConditionField(fieldName)) {
            throw new IllegalArgumentException("Condition field and operator are required");
        }
        int scalarValues = (textValue != null ? 1 : 0)
                + (booleanValue != null ? 1 : 0)
                + (numberValue != null ? 1 : 0);
        if ("IN_SET".equals(operator)) {
            if (scalarValues != 0 || setValues == null || setValues.isEmpty()
                    || !"STRING".equals(valueType)
                    || setValues.stream().anyMatch(value -> value == null || value.isBlank())) {
                throw new IllegalArgumentException("IN_SET requires a non-empty structured value set");
            }
        } else if (scalarValues != 1 || (setValues != null && !setValues.isEmpty())
                || !valueTypeMatches(valueType, textValue, booleanValue, numberValue)) {
            throw new IllegalArgumentException("A scalar condition requires exactly one typed value");
        }
    }

    public static void validateResolutionPolicy(boolean notApplicableAllowed, String resolutionPolicy) {
        if (!"REQUIRED".equals(resolutionPolicy)
                && !"NOT_APPLICABLE_ALLOWED".equals(resolutionPolicy)) {
            throw new IllegalArgumentException("Requirement resolution policy is missing or incompatible");
        }
        if ("NOT_APPLICABLE_ALLOWED".equals(resolutionPolicy) && !notApplicableAllowed) {
            throw new IllegalArgumentException("Not-applicable resolution is not permitted");
        }
    }

    public static void validateDependency(
            String serviceId,
            String sourceRequirementServiceId,
            String dependencyKind,
            String conditionNodeId,
            String prerequisiteDocumentTypeId,
            String prerequisiteServiceId) {
        if (dependencyKind == null || !ALLOWED_DEPENDENCY_KINDS.contains(dependencyKind)) {
            throw new IllegalArgumentException("Unsupported dependency kind");
        }
        if (!Objects.equals(serviceId, sourceRequirementServiceId)) {
            throw new IllegalArgumentException("Dependency requirement must belong to the dependency service");
        }
        if ("CONDITIONAL".equals(dependencyKind) && (conditionNodeId == null || conditionNodeId.isBlank())) {
            throw new IllegalArgumentException("Conditional dependency requires a condition reference");
        }
        if ((prerequisiteDocumentTypeId == null) == (prerequisiteServiceId == null)) {
            throw new IllegalArgumentException("Dependency must target exactly one prerequisite type");
        }
    }

    private static boolean isValidConditionField(String fieldName) {
        int dot = fieldName.indexOf('.');
        if (dot <= 0 || dot >= fieldName.length() - 1) {
            return false;
        }
        return ALLOWED_CONDITION_ENTITY_PREFIXES.contains(fieldName.substring(0, dot));
    }

    private static boolean valueTypeMatches(
            String valueType,
            String textValue,
            Boolean booleanValue,
            BigDecimal numberValue) {
        return ("STRING".equals(valueType) && textValue != null && booleanValue == null && numberValue == null)
                || ("BOOLEAN".equals(valueType) && textValue == null && booleanValue != null && numberValue == null)
                || ("NUMBER".equals(valueType) && textValue == null && booleanValue == null && numberValue != null);
    }
}
