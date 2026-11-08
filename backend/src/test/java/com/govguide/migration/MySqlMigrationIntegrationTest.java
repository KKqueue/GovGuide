package com.govguide.migration;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

import org.flywaydb.core.Flyway;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;

class MySqlMigrationIntegrationTest {

    private static final List<String> EXPECTED_TABLES = List.of(
            "government_service",
            "service_localization",
            "document_type",
            "official_source",
            "service_source",
            "service_link",
            "service_requirement",
            "requirement_node",
            "requirement_source",
            "requirement_condition_value",
            "service_requirement_source",
            "accepted_alternative_group",
            "alternative_document",
            "document_dependency",
            "fee_information",
            "fee_source",
            "processing_time_information",
            "processing_time_source",
            "app_user",
            "user_service_task",
            "user_checklist_item",
            "application_tracking_record");

    @Test
    void migratesOnlyAnExplicitlyEnabledEmptyDedicatedDatabase() throws Exception {
        Assumptions.assumeTrue(Boolean.parseBoolean(System.getenv("T005_MYSQL_TEST_ENABLED")),
                "Set T005_MYSQL_TEST_ENABLED=true to run against a dedicated database");

        String url = required("DB_URL");
        String username = required("DB_USERNAME");
        String password = required("DB_PASSWORD");
        String databaseName = required("T005_MYSQL_DATABASE_NAME");
        Assumptions.assumeTrue(databaseName.startsWith("govguide_t005_"),
                "The integration test only permits govguide_t005_* databases");

        try (Connection connection = DriverManager.getConnection(url, username, password)) {
            assertEquals(databaseName, connection.getCatalog(),
                "JDBC catalog must exactly match the dedicated test database");
            assertEquals(0, countTables(connection, databaseName),
                    "Refusing to migrate a non-empty database");

            Flyway.configure()
                    .dataSource(url, username, password)
                    .locations("classpath:db/migration")
                    .load()
                    .migrate();

            assertEquals(4, countFlywayMigrations(connection));
            for (String table : EXPECTED_TABLES) {
                assertEquals(1, countTable(connection, databaseName, table),
                        "Missing migrated table: " + table);
            }
            assertTrue(countForeignKeys(connection, databaseName) >= 20);
            assertTrue(countIndex(connection, databaseName, "uq_service_requirement_service_id") >= 1);
            assertConstraintFailures(connection);
        }
    }

    private static String required(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(name + " is required when T005_MYSQL_TEST_ENABLED=true");
        }
        return value;
    }

    private static int countTables(Connection connection, String databaseName) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ?")) {
            statement.setString(1, databaseName);
            try (ResultSet result = statement.executeQuery()) {
                result.next();
                return result.getInt(1);
            }
        }
    }

    private static int countTable(Connection connection, String databaseName, String table) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ? AND table_name = ?")) {
            statement.setString(1, databaseName);
            statement.setString(2, table);
            try (ResultSet result = statement.executeQuery()) {
                result.next();
                return result.getInt(1);
            }
        }
    }

    private static int countFlywayMigrations(Connection connection) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE success = 1")) {
            try (ResultSet result = statement.executeQuery()) {
                result.next();
                return result.getInt(1);
            }
        }
    }

    private static int countForeignKeys(Connection connection, String databaseName) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT COUNT(*) FROM information_schema.table_constraints "
                        + "WHERE constraint_schema = ? AND constraint_type = 'FOREIGN KEY'")) {
            statement.setString(1, databaseName);
            try (ResultSet result = statement.executeQuery()) {
                result.next();
                return result.getInt(1);
            }
        }
    }

    private static int countIndex(Connection connection, String databaseName, String indexName) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT COUNT(*) FROM information_schema.statistics "
                        + "WHERE table_schema = ? AND index_name = ?")) {
            statement.setString(1, databaseName);
            statement.setString(2, indexName);
            try (ResultSet result = statement.executeQuery()) {
                result.next();
                return result.getInt(1);
            }
        }
    }

    private static void assertConstraintFailures(Connection connection) throws SQLException {
        connection.setAutoCommit(false);
        try {
            long serviceOneId = executeInsertReturningKey(connection,
                "INSERT INTO government_service "
                    + "(service_code, version_number, status, publication_readiness, authority, jurisdiction, category) "
                    + "VALUES ('T005_TEST_1', 1, 'DRAFT', 'UNREVIEWED', 'Test', 'CENTRAL', 'Test')");
            long serviceTwoId = executeInsertReturningKey(connection,
                "INSERT INTO government_service "
                    + "(service_code, version_number, status, publication_readiness, authority, jurisdiction, category) "
                    + "VALUES ('T005_TEST_2', 1, 'DRAFT', 'UNREVIEWED', 'Test', 'CENTRAL', 'Test')");
            long requirementOneId = executeInsertReturningKey(connection,
                "INSERT INTO service_requirement "
                    + "(service_id, requirement_code, requirement_kind, evidence_status, claim) "
                    + "VALUES (" + serviceOneId + ", 'REQ_1', 'MANDATORY', 'UNVERIFIED', 'Test')");
            long requirementTwoId = executeInsertReturningKey(connection,
                "INSERT INTO service_requirement "
                    + "(service_id, requirement_code, requirement_kind, evidence_status, claim) "
                    + "VALUES (" + serviceTwoId + ", 'REQ_2', 'MANDATORY', 'UNVERIFIED', 'Test')");
            long documentTypeId = executeInsertReturningKey(connection,
                    "INSERT INTO document_type (document_code, status, verification_status) "
                + "VALUES ('DOC_T005', 'ACTIVE', 'UNVERIFIED')");

            assertSqlFailure(connection,
                "INSERT INTO document_dependency "
                    + "(dependency_code, service_id, source_requirement_id, prerequisite_document_type_id, "
                    + "prerequisite_service_id, dependency_kind, evidence_status, claim) "
                    + "VALUES ('BOTH_TARGETS', " + serviceOneId + ", " + requirementOneId + ", "
                    + documentTypeId + ", " + serviceTwoId + ", 'REQUIRED', 'UNVERIFIED', 'Test')");
            assertSqlFailure(connection,
                "INSERT INTO document_dependency "
                    + "(dependency_code, service_id, source_requirement_id, dependency_kind, evidence_status, claim) "
                    + "VALUES ('NO_TARGET', " + serviceOneId + ", " + requirementOneId + ", 'REQUIRED', 'UNVERIFIED', 'Test')");
            assertSqlFailure(connection,
                "INSERT INTO document_dependency "
                    + "(dependency_code, service_id, source_requirement_id, prerequisite_document_type_id, "
                    + "dependency_kind, evidence_status, claim) "
                    + "VALUES ('NO_CONDITION', " + serviceOneId + ", " + requirementOneId + ", "
                    + documentTypeId + ", 'CONDITIONAL', 'UNVERIFIED', 'Test')");
            assertSqlFailure(connection,
                "INSERT INTO document_dependency "
                    + "(dependency_code, service_id, source_requirement_id, prerequisite_document_type_id, "
                    + "dependency_kind, evidence_status, claim) "
                    + "VALUES ('CROSS_SERVICE_REQ', " + serviceOneId + ", " + requirementTwoId + ", "
                    + documentTypeId + ", 'REQUIRED', 'UNVERIFIED', 'Test')");
            assertSqlFailure(connection,
                "INSERT INTO requirement_node "
                    + "(service_id, service_requirement_id, node_type, evidence_status, value_text, value_boolean) "
                    + "VALUES (" + serviceOneId + ", " + requirementOneId + ", 'CONDITIONAL', 'UNVERIFIED', 'x', TRUE)");
            assertSqlFailure(connection,
                "INSERT INTO service_requirement "
                    + "(service_id, requirement_code, requirement_kind, resolution_policy, evidence_status, claim) "
                    + "VALUES (" + serviceOneId + ", 'REQ_NULL_POLICY', 'MANDATORY', NULL, 'UNVERIFIED', 'Test')");
            assertSqlFailure(connection,
                "INSERT INTO government_service "
                    + "(service_code, version_number, status, publication_readiness, authority, jurisdiction, category) "
                    + "VALUES ('T005_INVALID', 1, 'INVALID', 'UNREVIEWED', 'Test', 'CENTRAL', 'Test')");
        } finally {
            connection.rollback();
            connection.setAutoCommit(true);
        }
    }

    private static long executeInsertReturningKey(Connection connection, String sql) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS)) {
            statement.executeUpdate();
            try (ResultSet keys = statement.getGeneratedKeys()) {
                if (!keys.next()) {
                    throw new SQLException("Expected a generated key");
                }
                return keys.getLong(1);
            }
        }
    }

    private static void execute(Connection connection, String sql) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.executeUpdate();
        }
    }

    private static void assertSqlFailure(Connection connection, String sql) {
        org.junit.jupiter.api.Assertions.assertThrows(SQLException.class, () -> execute(connection, sql));
    }
}
