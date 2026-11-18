package com.govguide.persistence;

import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@Profile("db")
public class JdbcFeedbackPersistence implements FeedbackPersistence {
    private final JdbcTemplate jdbc;

    public JdbcFeedbackPersistence(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Override
    public void save(FeedbackRecord record) {
        jdbc.update("INSERT INTO feedback (id, service_code, username, type, message, created_at) VALUES (?,?,?,?,?,?)",
                record.id(), record.serviceCode(), record.username(), record.type(), record.message(), record.timestamp());
    }

    @Override
    public List<FeedbackRecord> findAll() {
        return jdbc.query("SELECT id, service_code, username, type, message, created_at FROM feedback ORDER BY created_at DESC",
                (rs, row) -> new FeedbackRecord(rs.getString("id"), rs.getString("service_code"),
                        rs.getString("username"), rs.getString("type"), rs.getString("message"), rs.getLong("created_at")));
    }

    @Override
    public List<FeedbackRecord> findByService(String serviceCode) {
        return jdbc.query("SELECT id, service_code, username, type, message, created_at FROM feedback WHERE service_code = ? ORDER BY created_at DESC",
                (rs, row) -> new FeedbackRecord(rs.getString("id"), rs.getString("service_code"),
                        rs.getString("username"), rs.getString("type"), rs.getString("message"), rs.getLong("created_at")),
                serviceCode);
    }

    @Override
    public long count() {
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM feedback", Long.class);
        return c != null ? c : 0;
    }
}
