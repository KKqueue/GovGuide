package com.govguide.persistence;

import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@Profile("db")
public class JdbcReviewPersistence implements ReviewPersistence {
    private final JdbcTemplate jdbc;

    public JdbcReviewPersistence(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Override
    public void save(ReviewRecord record) {
        jdbc.update("INSERT INTO review (id, service_code, task_id, username, rating, message, created_at) VALUES (?,?,?,?,?,?,?)",
                record.id(), record.serviceCode(), record.taskId(), record.username(), record.rating(), record.message(), record.timestamp());
    }

    @Override
    public List<ReviewRecord> findAll() {
        return jdbc.query("SELECT id, service_code, task_id, username, rating, message, created_at FROM review ORDER BY created_at DESC",
                (rs, row) -> new ReviewRecord(rs.getString("id"), rs.getString("service_code"), rs.getString("task_id"),
                        rs.getString("username"), rs.getInt("rating"), rs.getString("message"), rs.getLong("created_at")));
    }

    @Override
    public List<ReviewRecord> findByService(String serviceCode) {
        return jdbc.query("SELECT id, service_code, task_id, username, rating, message, created_at FROM review WHERE service_code = ? ORDER BY created_at DESC",
                (rs, row) -> new ReviewRecord(rs.getString("id"), rs.getString("service_code"), rs.getString("task_id"),
                        rs.getString("username"), rs.getInt("rating"), rs.getString("message"), rs.getLong("created_at")),
                serviceCode);
    }

    @Override
    public boolean hasReview(String taskId, String username) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM review WHERE task_id = ? AND username = ?", Integer.class, taskId, username);
        return count != null && count > 0;
    }

    @Override
    public long count() {
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM review", Long.class);
        return c != null ? c : 0;
    }
}
