package com.govguide.persistence;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ConcurrentModificationException;
import java.util.List;
import java.util.Optional;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@Profile("db")
public class JdbcTrackingPersistence implements TrackingPersistence {
    private final JdbcTemplate jdbc;

    public JdbcTrackingPersistence(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Override
    public String persistenceLabel() { return "POSTGRES_DURABLE"; }

    @Override
    public Optional<TrackingRecord> find(String applicationId, String ownerId) {
        return query("""
                SELECT r.application_id, r.task_id, t.service_code, r.username, r.status,
                       r.submission_date, r.appointment_date, r.completion_date, r.notes, r.tracking_link, r.revision
                  FROM tracking_record r JOIN user_task t ON t.task_id = r.task_id
                 WHERE r.application_id = ? AND r.username = ?""", applicationId, ownerId).stream().findFirst();
    }

    @Override
    public Optional<TrackingRecord> findByTask(String taskId, String ownerId) {
        return query("""
                SELECT r.application_id, r.task_id, t.service_code, r.username, r.status,
                       r.submission_date, r.appointment_date, r.completion_date, r.notes, r.tracking_link, r.revision
                  FROM tracking_record r JOIN user_task t ON t.task_id = r.task_id
                 WHERE r.task_id = ? AND r.username = ?""", taskId, ownerId).stream().findFirst();
    }

    @Override
    public TrackingRecord save(TrackingRecord record) {
        if (record.revision() == 0
                && jdbc.queryForObject("SELECT COUNT(*) FROM tracking_record WHERE application_id = ?", Integer.class, record.applicationId()) == 0) {
            jdbc.update("""
                    INSERT INTO tracking_record (application_id, task_id, username, status,
                        submission_date, appointment_date, completion_date, notes, tracking_link)
                    VALUES (?,?,?,?,?,?,?,?,?)""",
                    record.applicationId(), record.taskId(), record.ownerId(), record.status(),
                    record.submissionDate(), record.appointmentDate(), record.completionDate(),
                    record.notes(), record.trackingLink());
            return record;
        }
        int updated = jdbc.update("""
                UPDATE tracking_record SET status=?, submission_date=?, appointment_date=?,
                    completion_date=?, notes=?, tracking_link=?, revision=revision+1
                WHERE application_id=? AND username=? AND revision=?""",
                record.status(), record.submissionDate(), record.appointmentDate(),
                record.completionDate(), record.notes(), record.trackingLink(),
                record.applicationId(), record.ownerId(), record.revision());
        if (updated != 1) throw new ConcurrentModificationException("Tracking revision is stale");
        return new TrackingRecord(record.applicationId(), record.taskId(), record.serviceCode(),
                record.ownerId(), record.status(), record.submissionDate(), record.appointmentDate(),
                record.completionDate(), record.notes(), record.trackingLink(), record.revision() + 1);
    }

    private List<TrackingRecord> query(String sql, Object... args) {
        return jdbc.query(sql, this::map, args);
    }

    private TrackingRecord map(ResultSet rs, int row) throws SQLException {
        return new TrackingRecord(
                rs.getString("application_id"), rs.getString("task_id"),
                rs.getString("service_code"), rs.getString("username"),
                rs.getString("status"),
                rs.getObject("submission_date", LocalDate.class),
                rs.getObject("appointment_date", LocalDate.class),
                rs.getObject("completion_date", LocalDate.class),
                rs.getString("notes"), rs.getString("tracking_link"),
                rs.getLong("revision"));
    }
}
