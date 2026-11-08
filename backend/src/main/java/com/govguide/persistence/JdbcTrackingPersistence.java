package com.govguide.persistence;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.ConcurrentModificationException;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@Profile("db")
public class JdbcTrackingPersistence implements TrackingPersistence {
    private final JdbcTemplate jdbc;

    public JdbcTrackingPersistence(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Override
    public String persistenceLabel() { return "MYSQL_DURABLE"; }

    @Override
    public Optional<TrackingRecord> find(String applicationId, String ownerId) {
        return query("SELECT a.application_id,a.task_id,t.service_code,u.username,a.status,a.submission_date,a.appointment_date,a.completion_date,a.notes,a.tracking_link,a.revision FROM application_tracking_record a JOIN user_service_task t ON t.task_id=a.task_id JOIN app_user u ON u.user_id=a.user_id WHERE a.application_id=? AND u.username=?", applicationId, ownerId).stream().findFirst();
    }

    @Override
    public Optional<TrackingRecord> findByTask(String taskId, String ownerId) {
        return query("SELECT a.application_id,a.task_id,t.service_code,u.username,a.status,a.submission_date,a.appointment_date,a.completion_date,a.notes,a.tracking_link,a.revision FROM application_tracking_record a JOIN user_service_task t ON t.task_id=a.task_id JOIN app_user u ON u.user_id=a.user_id WHERE a.task_id=? AND u.username=?", taskId, ownerId).stream().findFirst();
    }

    @Override
    public TrackingRecord save(TrackingRecord record) {
        Long userId = jdbc.queryForObject("SELECT user_id FROM app_user WHERE username = ? AND enabled = TRUE", Long.class, record.ownerId());
        if (userId == null) throw new IllegalStateException("Authenticated user is not pre-provisioned");
        if (record.revision() == 0 && jdbc.queryForObject("SELECT COUNT(*) FROM application_tracking_record WHERE application_id = ?", Integer.class, record.applicationId()) == 0) {
            jdbc.update("INSERT INTO application_tracking_record (application_id,user_id,task_id,status,submission_date,appointment_date,completion_date,notes,tracking_link) VALUES (?,?,?,?,?,?,?,?,?)",
                    record.applicationId(), userId, record.taskId(), record.status(), record.submissionDate(), record.appointmentDate(), record.completionDate(), record.notes(), record.trackingLink());
            return record;
        }
        int updated = jdbc.update("UPDATE application_tracking_record SET status=?,submission_date=?,appointment_date=?,completion_date=?,notes=?,tracking_link=?,revision=revision+1 WHERE application_id=? AND user_id=? AND revision=?",
                record.status(), record.submissionDate(), record.appointmentDate(), record.completionDate(), record.notes(), record.trackingLink(), record.applicationId(), userId, record.revision());
        if (updated != 1) throw new ConcurrentModificationException("Tracking revision is stale");
        return new TrackingRecord(record.applicationId(), record.taskId(), record.serviceCode(), record.ownerId(), record.status(), record.submissionDate(), record.appointmentDate(), record.completionDate(), record.notes(), record.trackingLink(), record.revision() + 1);
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
