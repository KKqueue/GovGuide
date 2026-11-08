package com.govguide.migration;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

class MigrationResourceTest {

    @Test
    void v1MigrationIsDiscoverableAndContainsReferenceSchema() throws IOException {
        try (InputStream migration = getClass().getResourceAsStream(
                "/db/migration/V1__create_reference_content_schema.sql")) {
            assertTrue(migration != null, "V1 migration must be on the classpath");
            String sql = new String(migration.readAllBytes(), StandardCharsets.UTF_8);
            assertTrue(sql.contains("CREATE TABLE government_service"));
            assertTrue(sql.contains("CREATE TABLE official_source"));
            assertTrue(sql.contains("CREATE TABLE service_link"));
            assertTrue(sql.contains("CREATE TABLE service_requirement"));
            assertTrue(sql.contains("CREATE TABLE requirement_node"));
            assertTrue(sql.contains("CREATE TABLE document_dependency"));
            assertTrue(sql.contains("CREATE TABLE fee_information"));
            assertTrue(sql.contains("CREATE TABLE fee_source"));
            assertTrue(sql.contains("CREATE TABLE processing_time_information"));
            assertTrue(sql.contains("CREATE TABLE processing_time_source"));
            assertTrue(sql.contains("publication_readiness"));
            assertTrue(sql.contains("verification_status"));
        }
    }

    @Test
    void v2MigrationContainsIntegrityCorrections() throws IOException {
        try (InputStream migration = getClass().getResourceAsStream(
                "/db/migration/V2__strengthen_content_integrity.sql")) {
            assertTrue(migration != null, "V2 migration must be on the classpath");
            String sql = new String(migration.readAllBytes(), StandardCharsets.UTF_8);
            assertTrue(sql.contains("NOT_APPLICABLE_ALLOWED"));
            assertTrue(sql.contains("condition_node_id"));
            assertTrue(sql.contains("chk_dependency_exactly_one_target"));
            assertTrue(sql.contains("chk_dependency_condition_required"));
            assertTrue(sql.contains("fk_dependency_source_requirement_service"));
            assertTrue(sql.contains("requirement_condition_value"));
            assertTrue(sql.contains("ON DELETE RESTRICT"));
        }
    }

    @Test
    void v3MigrationCompletesConditionAndRangeIntegrity() throws IOException {
        try (InputStream migration = getClass().getResourceAsStream(
                "/db/migration/V3__complete_condition_and_publication_integrity.sql")) {
            assertTrue(migration != null, "V3 migration must be on the classpath");
            String sql = new String(migration.readAllBytes(), StandardCharsets.UTF_8);
            assertTrue(sql.contains("fk_requirement_node_service_requirement"));
            assertTrue(sql.contains("fk_dependency_condition_node_service"));
            assertTrue(sql.contains("chk_requirement_condition_value_type_shape"));
            assertTrue(sql.contains("chk_fee_range_order"));
            assertTrue(sql.contains("chk_processing_time_unit_required"));
        }
    }

    @Test
    void v4MigrationDefinesDurableUserWorkflowTablesAndConstraints() throws IOException {
        try (InputStream migration = getClass().getResourceAsStream(
                "/db/migration/V4__add_user_workflow_persistence.sql")) {
            assertTrue(migration != null, "V4 migration must be on the classpath");
            String sql = new String(migration.readAllBytes(), StandardCharsets.UTF_8);
            assertTrue(sql.contains("CREATE TABLE app_user"));
            assertTrue(sql.contains("CREATE TABLE user_service_task"));
            assertTrue(sql.contains("CREATE TABLE user_checklist_item"));
            assertTrue(sql.contains("CREATE TABLE application_tracking_record"));
            assertTrue(sql.contains("uq_user_task_child_dependency"));
            assertTrue(sql.contains("fk_user_checklist_requirement_service"));
            assertTrue(sql.contains("revision BIGINT"));
            assertTrue(sql.contains("chk_tracking_dates"));
        }
    }

    @Test
    void v4MigrationCoversOwnershipVersionAndStateIntegrity() throws IOException {
        try (InputStream migration = getClass().getResourceAsStream(
                "/db/migration/V4__add_user_workflow_persistence.sql")) {
            assertTrue(migration != null, "V4 migration must be on the classpath");
            String sql = new String(migration.readAllBytes(), StandardCharsets.UTF_8);

            assertTrue(sql.contains("uq_app_user_username"));
            assertTrue(sql.contains("fk_user_task_user"));
            assertTrue(sql.contains("fk_user_task_parent"));
            assertTrue(sql.contains("fk_user_task_root"));
            assertTrue(sql.contains("fk_user_task_parent_requirement_service"));
            assertTrue(sql.contains("uq_user_task_child_dependency"));
            assertTrue(sql.contains("chk_user_task_depth"));
            assertTrue(sql.contains("chk_user_task_status"));
            assertTrue(sql.contains("revision BIGINT NOT NULL DEFAULT 0"));

            assertTrue(sql.contains("uq_user_checklist_item"));
            assertTrue(sql.contains("fk_user_checklist_task_service"));
            assertTrue(sql.contains("fk_user_checklist_requirement_service"));
            assertTrue(sql.contains("chk_user_checklist_state"));

            assertTrue(sql.contains("uq_tracking_task"));
            assertTrue(sql.contains("fk_tracking_user"));
            assertTrue(sql.contains("fk_tracking_task_user"));
            assertTrue(sql.contains("chk_tracking_status"));
            assertTrue(sql.contains("chk_tracking_link_provenance"));
            assertTrue(sql.contains("idx_user_task_owner_status"));
            assertTrue(sql.contains("idx_tracking_user_status"));
        }
    }
}
