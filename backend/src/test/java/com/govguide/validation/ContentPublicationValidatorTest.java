package com.govguide.validation;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;

class ContentPublicationValidatorTest {

    @Test
    void verifiedClaimsRequireSources() {
        assertThrows(IllegalArgumentException.class,
                () -> ContentPublicationValidator.requireVerifiedEvidence("requirement", "VERIFIED", 0));
        assertDoesNotThrow(
                () -> ContentPublicationValidator.requireVerifiedEvidence("requirement", "UNVERIFIED", 0));
    }

    @Test
    void verifiedFeesAndTimelinesRequireEvidenceAndMeaningfulValues() {
        assertThrows(IllegalArgumentException.class,
                () -> ContentPublicationValidator.requireVerifiedFee(
                        "VERIFIED", 1, null, null, null));
        assertDoesNotThrow(
                () -> ContentPublicationValidator.requireVerifiedFee(
                        "VERIFIED", 1, BigDecimal.ZERO, null, null));
        assertThrows(IllegalArgumentException.class,
                () -> ContentPublicationValidator.requireVerifiedFee(
                        "VERIFIED", 1, null, BigDecimal.TEN, BigDecimal.ONE));
        assertThrows(IllegalArgumentException.class,
                () -> ContentPublicationValidator.requireVerifiedProcessingTime(
                        "VERIFIED", 1, null, null, null, "UNAVAILABLE", ""));
        assertThrows(IllegalArgumentException.class,
                () -> ContentPublicationValidator.requireVerifiedProcessingTime(
                        "VERIFIED", 1, 10, 5, "DAYS", "PUBLISHED_STANDARD", "Published range"));
        assertThrows(IllegalArgumentException.class,
                () -> ContentPublicationValidator.requireVerifiedProcessingTime(
                        "VERIFIED", 1, 1, 1, null, "PUBLISHED_STANDARD", "Published range"));
        assertDoesNotThrow(
                () -> ContentPublicationValidator.requireVerifiedProcessingTime(
                        "VERIFIED", 1, null, null,
                        "DAYS",
                        "OFFICIAL_SERVICE_DESCRIPTION", "Near-real-time service description"));
    }

    @Test
    void conditionsUseOneTypedScalarOrAValidatedSet() {
        assertDoesNotThrow(() -> ContentPublicationValidator.validateCondition(
                "applicant.age", "GREATER_THAN", "NUMBER", null, null, BigDecimal.valueOf(17), null));
        assertDoesNotThrow(() -> ContentPublicationValidator.validateCondition(
                "applicant.category", "IN_SET", "STRING", null, null, null, List.of("ADULT", "MINOR")));
        assertThrows(IllegalArgumentException.class, () -> ContentPublicationValidator.validateCondition(
                "applicant.category", "IN_SET", "STRING", "ADULT", null, null, null));
        assertThrows(IllegalArgumentException.class, () -> ContentPublicationValidator.validateCondition(
                "applicant.category", "EQUALS", "STRING", "ADULT", Boolean.TRUE, null, null));
        assertThrows(IllegalArgumentException.class, () -> ContentPublicationValidator.validateCondition(
                "unsupported.field", "EQUALS", "STRING", "ADULT", null, null, null));
        assertThrows(IllegalArgumentException.class, () -> ContentPublicationValidator.validateCondition(
                "applicant.category", "UNSAFE_EXPRESSION", "STRING", "ADULT", null, null, null));
    }

    @Test
    void dependenciesRequireConditionServiceMatchAndOneTarget() {
        assertDoesNotThrow(() -> ContentPublicationValidator.validateDependency(
                "service-1", "service-1", "REQUIRED", null, "document-1", null));
        assertDoesNotThrow(() -> ContentPublicationValidator.validateDependency(
                "service-1", "service-1", "CONDITIONAL", "condition-1", "document-1", null));
        assertDoesNotThrow(() -> ContentPublicationValidator.validateDependency(
                "service-1", "service-1", "OPTIONAL", null, "document-1", null));
        assertDoesNotThrow(() -> ContentPublicationValidator.validateDependency(
                "service-1", "service-1", "ALTERNATIVE", null, null, "service-2"));
        assertThrows(IllegalArgumentException.class, () -> ContentPublicationValidator.validateDependency(
                "service-1", "service-1", null, null, "document-1", null));
        assertThrows(IllegalArgumentException.class, () -> ContentPublicationValidator.validateDependency(
                "service-1", "service-1", "INVALID", null, "document-1", null));
        assertThrows(IllegalArgumentException.class, () -> ContentPublicationValidator.validateDependency(
                "service-1", "service-1", " ", null, "document-1", null));
        assertThrows(IllegalArgumentException.class, () -> ContentPublicationValidator.validateDependency(
                "service-1", "service-2", "REQUIRED", null, "document-1", null));
        assertThrows(IllegalArgumentException.class, () -> ContentPublicationValidator.validateDependency(
                "service-1", "service-1", "CONDITIONAL", null, "document-1", null));
        assertThrows(IllegalArgumentException.class, () -> ContentPublicationValidator.validateDependency(
                "service-1", "service-1", "REQUIRED", null, "document-1", "service-2"));
    }

    @Test
    void currentLinksRequireEvidence() {
        assertThrows(IllegalArgumentException.class,
                () -> ContentPublicationValidator.requireCurrentLink("CURRENT", 0));
        assertDoesNotThrow(() -> ContentPublicationValidator.requireCurrentLink("UNVERIFIED", 0));
    }

    @Test
    void validatesNotApplicableResolutionPolicy() {
        assertDoesNotThrow(() -> ContentPublicationValidator.validateResolutionPolicy(
                false, "REQUIRED"));
        assertDoesNotThrow(() -> ContentPublicationValidator.validateResolutionPolicy(
                true, "REQUIRED"));
        assertDoesNotThrow(() -> ContentPublicationValidator.validateResolutionPolicy(
                true, "NOT_APPLICABLE_ALLOWED"));
        assertThrows(IllegalArgumentException.class, () -> ContentPublicationValidator.validateResolutionPolicy(
                false, "NOT_APPLICABLE_ALLOWED"));
        assertThrows(IllegalArgumentException.class, () -> ContentPublicationValidator.validateResolutionPolicy(
                true, null));
        assertThrows(IllegalArgumentException.class, () -> ContentPublicationValidator.validateResolutionPolicy(
                true, ""));
        assertThrows(IllegalArgumentException.class, () -> ContentPublicationValidator.validateResolutionPolicy(
                true, "INVALID"));
    }
}
