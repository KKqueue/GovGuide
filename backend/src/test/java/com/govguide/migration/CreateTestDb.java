package com.govguide.migration;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class CreateTestDb {
    public static void main(String[] args) {
        String serverUrl = "jdbc:mysql://localhost:3306/?useSSL=false&serverTimezone=UTC";
        try (Connection conn = DriverManager.getConnection(serverUrl, "root", "");
             Statement stmt = conn.createStatement()) {
            stmt.executeUpdate("CREATE DATABASE IF NOT EXISTS govguide_t005_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            stmt.executeUpdate("DROP TABLE IF EXISTS govguide_t005_test.some_table"); // ensure clean if needed, but test checks table count == 0
            System.out.println("SUCCESS: Database govguide_t005_test created successfully.");
        } catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        }
    }
}
