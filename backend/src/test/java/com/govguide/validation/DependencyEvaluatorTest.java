package com.govguide.validation;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class DependencyEvaluatorTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void evaluatesAllAnyAndApplicantConditionsWithoutExecutingCode() {
        DependencyEvaluator.Expression validApplicant = DependencyEvaluator.Expression.condition(
                new DependencyEvaluator.Condition("applicant.age", "GREATER_THAN", 17));
        DependencyEvaluator.Expression route = DependencyEvaluator.Expression.condition(
                new DependencyEvaluator.Condition("workflow.selectedServiceRoute", "EQUALS", "PAN_INSTANT_EPAN"));

        assertTrue(DependencyEvaluator.evaluate(
                DependencyEvaluator.Expression.all(validApplicant, route),
                Map.of("applicant.age", 21, "workflow.selectedServiceRoute", "PAN_INSTANT_EPAN")));
        assertFalse(DependencyEvaluator.evaluate(
                DependencyEvaluator.Expression.any(validApplicant, route),
                Map.of("applicant.age", 16, "workflow.selectedServiceRoute", "OTHER")));
        assertFalse(DependencyEvaluator.evaluate(validApplicant, Map.of()));
    }

    @Test
    void rejectsMalformedExpressionsAndOperators() {
        assertThrows(IllegalArgumentException.class,
                () -> DependencyEvaluator.evaluate(new DependencyEvaluator.Expression("ALL", null, List.of()), Map.of()));
        assertThrows(IllegalArgumentException.class,
                () -> DependencyEvaluator.evaluateCondition(
                        new DependencyEvaluator.Condition("applicant.age", "EXECUTE", 1), Map.of()));
        assertThrows(IllegalArgumentException.class,
                () -> DependencyEvaluator.evaluateCondition(
                        new DependencyEvaluator.Condition("applicant.age", "GREATER_THAN", "old"), Map.of("applicant.age", 21)));
        assertThrows(IllegalArgumentException.class,
                () -> DependencyEvaluator.evaluateCondition(
                        new DependencyEvaluator.Condition("system.secret", "EQUALS", "x"), Map.of()));
    }

    @Test
    void detectsUnknownServicesCyclesAndExcessiveDepth() {
        assertThrows(IllegalArgumentException.class,
                () -> DependencyGraphValidator.validate(Map.of("A", List.of("B"))));
        assertThrows(IllegalArgumentException.class,
                () -> DependencyGraphValidator.validate(Map.of("A", List.of("A"))));
        assertThrows(IllegalArgumentException.class,
                () -> DependencyGraphValidator.validate(Map.of("A", List.of("B"), "B", List.of("A"))));
        assertThrows(IllegalArgumentException.class,
                () -> DependencyGraphValidator.validate(
                        Map.of("A", List.of("B"), "B", List.of("C"), "C", List.of()), 2));
        assertDoesNotThrow(() -> DependencyGraphValidator.validate(
                Map.of("A", List.of("B"), "B", List.of(), "C", List.of())));
    }

    @Test
    void validatesCurrentServiceRecordAndRejectsBrokenReferences() throws Exception {
        JsonNode current = objectMapper.readTree(
                java.nio.file.Files.readString(java.nio.file.Path.of("..", "content", "services", "instant-e-pan.v1.json")));
        assertDoesNotThrow(() -> ContentGraphValidator.validateCatalog(List.of(current)));

        JsonNode unknownCondition = current.deepCopy();
        ((com.fasterxml.jackson.databind.node.ArrayNode) unknownCondition.path("requirements").get(0)
                .path("appliesWhen").path("all")).removeAll().add("MISSING_CONDITION");
        assertThrows(IllegalArgumentException.class,
                () -> ContentGraphValidator.validateCatalog(List.of(unknownCondition)));

        JsonNode approvedUnverified = current.deepCopy();
        ((com.fasterxml.jackson.databind.node.ObjectNode) approvedUnverified).put("publicationReadiness", "APPROVED");
        ((com.fasterxml.jackson.databind.node.ObjectNode) approvedUnverified.path("requirements").get(0))
                .put("evidenceStatus", "UNVERIFIED");
        assertThrows(IllegalArgumentException.class,
                () -> ContentGraphValidator.validateCatalog(List.of(approvedUnverified)));

        JsonNode invalidAlternative = current.deepCopy();
        ((com.fasterxml.jackson.databind.node.ObjectNode) invalidAlternative.path("requirements").get(0))
                .put("kind", "ALTERNATIVE_GROUP");
        ((com.fasterxml.jackson.databind.node.ObjectNode) invalidAlternative.path("requirements").get(0))
                .putArray("alternatives");
        assertThrows(IllegalArgumentException.class,
                () -> ContentGraphValidator.validateCatalog(List.of(invalidAlternative)));

        JsonNode unknownSource = current.deepCopy();
        ((com.fasterxml.jackson.databind.node.ArrayNode) unknownSource.path("requirements").get(0)
                .path("sourceRefs")).add("MISSING_SOURCE");
        assertThrows(IllegalArgumentException.class,
                () -> ContentGraphValidator.validateCatalog(List.of(unknownSource)));
    }

    @Test
    void enforcesSourceProvenanceAndEvidenceStatusRules() throws Exception {
        JsonNode current = objectMapper.readTree(
                java.nio.file.Files.readString(java.nio.file.Path.of("..", "content", "services", "instant-e-pan.v1.json")));

        JsonNode unsupportedCategory = current.deepCopy();
        ((com.fasterxml.jackson.databind.node.ObjectNode) unsupportedCategory.path("sources").get(0))
                .put("sourceCategory", "BLOG");
        assertThrows(IllegalArgumentException.class,
                () -> ContentGraphValidator.validateCatalog(List.of(unsupportedCategory)));

        JsonNode singleCorroboration = current.deepCopy();
        ((com.fasterxml.jackson.databind.node.ObjectNode) singleCorroboration.path("requirements").get(0))
                .put("evidenceStatus", "CORROBORATED");
        assertThrows(IllegalArgumentException.class,
                () -> ContentGraphValidator.validateCatalog(List.of(singleCorroboration)));

        JsonNode independentVerified = current.deepCopy();
        ((com.fasterxml.jackson.databind.node.ObjectNode) independentVerified.path("sources").get(0))
                .put("sourceCategory", "INDEPENDENT_CORROBORATED");
        assertThrows(IllegalArgumentException.class,
                () -> ContentGraphValidator.validateCatalog(List.of(independentVerified)));

        JsonNode verifiedClaimWithUnverifiedSource = current.deepCopy();
        ((com.fasterxml.jackson.databind.node.ObjectNode) verifiedClaimWithUnverifiedSource.path("sources").get(0))
                .put("verificationStatus", "UNVERIFIED");
        assertThrows(IllegalArgumentException.class,
                () -> ContentGraphValidator.validateCatalog(List.of(verifiedClaimWithUnverifiedSource)));

        JsonNode unverifiedMandatory = current.deepCopy();
        ((com.fasterxml.jackson.databind.node.ObjectNode) unverifiedMandatory).put("publicationReadiness", "APPROVED");
        ((com.fasterxml.jackson.databind.node.ObjectNode) unverifiedMandatory.path("requirements").get(0))
                .put("evidenceStatus", "UNVERIFIED");
        assertThrows(IllegalArgumentException.class,
                () -> ContentGraphValidator.validateCatalog(List.of(unverifiedMandatory)));

        JsonNode outdatedApproved = current.deepCopy();
        ((com.fasterxml.jackson.databind.node.ObjectNode) outdatedApproved).put("publicationReadiness", "APPROVED");
        ((com.fasterxml.jackson.databind.node.ObjectNode) outdatedApproved.path("sources").get(0))
                .put("verificationStatus", "OUTDATED");
        assertThrows(IllegalArgumentException.class,
                () -> ContentGraphValidator.validateCatalog(List.of(outdatedApproved)));

        JsonNode validCorroborated = current.deepCopy();
        com.fasterxml.jackson.databind.node.ObjectNode secondSource =
                ((com.fasterxml.jackson.databind.node.ArrayNode) validCorroborated.path("sources"))
                        .addObject()
                        .put("sourceCode", "SRC-INDEPENDENT")
                        .put("url", "https://independent.example/e-pan")
                        .put("title", "Independent evidence")
                        .put("publisher", "Identifiable publisher")
                        .put("sourceCategory", "INDEPENDENT_CORROBORATED")
                        .put("verificationStatus", "VERIFIED");
        secondSource.put("checkedAt", "2026-10-22");
        com.fasterxml.jackson.databind.node.ObjectNode corroboratedRequirement =
                (com.fasterxml.jackson.databind.node.ObjectNode) validCorroborated.path("requirements").get(0);
        corroboratedRequirement.put("kind", "OPTIONAL").put("evidenceStatus", "CORROBORATED");
        corroboratedRequirement.putArray("sourceRefs").add("SRC-ITD-EPAN-2026-10-21").add("SRC-INDEPENDENT");
        assertDoesNotThrow(() -> ContentGraphValidator.validateCatalog(List.of(validCorroborated)));

        JsonNode duplicateCorroboration = validCorroborated.deepCopy();
        ((com.fasterxml.jackson.databind.node.ObjectNode) duplicateCorroboration.path("requirements").get(0))
                .putArray("sourceRefs").add("SRC-ITD-EPAN-2026-10-21").add("SRC-ITD-EPAN-2026-10-21");
        assertThrows(IllegalArgumentException.class,
                () -> ContentGraphValidator.validateCatalog(List.of(duplicateCorroboration)));
    }
}


