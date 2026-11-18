package com.govguide.persistence;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ConcurrentModificationException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Profile("db")
public class JdbcTaskPersistence implements TaskPersistence {
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;

    public JdbcTaskPersistence(JdbcTemplate jdbc, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.mapper = mapper;
    }

    @Override
    public String persistenceLabel() { return "POSTGRES_DURABLE"; }

    @Override
    public List<TaskRecord> findAllRecords() {
        return jdbc.query("""
                SELECT task_id, username, service_code, service_version, parent_task_id,
                       parent_requirement_code, root_task_id, dependency_code, depth,
                       status, context_json, checklist_json, child_tasks_json, revision
                  FROM user_task""", this::mapTask);
    }

    @Override
    public Optional<TaskRecord> find(String taskId, String ownerId) {
        List<TaskRecord> rows = jdbc.query("""
                SELECT task_id, username, service_code, service_version, parent_task_id,
                       parent_requirement_code, root_task_id, dependency_code, depth,
                       status, context_json, checklist_json, child_tasks_json, revision
                  FROM user_task
                 WHERE task_id = ? AND username = ?""", this::mapTask, taskId, ownerId);
        return rows.stream().findFirst();
    }

    @Override
    @Transactional
    public TaskRecord save(TaskRecord task) {
        String context = writeJson(task.context());
        String checklist = writeJson(task.checklistStates());
        String children = writeJson(task.childTaskIds());

        boolean inserting = task.revision() == 0
                && jdbc.queryForObject("SELECT COUNT(*) FROM user_task WHERE task_id = ?", Integer.class, task.taskId()) == 0;

        if (inserting) {
            jdbc.update("""
                    INSERT INTO user_task
                    (task_id, username, service_code, service_version, parent_task_id, root_task_id,
                     parent_requirement_code, dependency_code, depth, status,
                     context_json, checklist_json, child_tasks_json, revision)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?::jsonb,?::jsonb,?::jsonb,0)""",
                    task.taskId(), task.ownerId(), task.serviceCode(), task.serviceVersion(),
                    task.parentTaskId(), task.rootTaskId(), task.parentChecklistItemId(),
                    task.dependencyCode(), task.depth(), task.status(),
                    context, checklist, children);
        } else {
            int updated = jdbc.update("""
                    UPDATE user_task
                       SET service_code=?, service_version=?, parent_task_id=?, root_task_id=?,
                           parent_requirement_code=?, dependency_code=?, depth=?, status=?,
                           context_json=?::jsonb, checklist_json=?::jsonb, child_tasks_json=?::jsonb,
                           revision=revision+1
                     WHERE task_id=? AND username=? AND revision=?""",
                    task.serviceCode(), task.serviceVersion(), task.parentTaskId(), task.rootTaskId(),
                    task.parentChecklistItemId(), task.dependencyCode(), task.depth(), task.status(),
                    context, checklist, children,
                    task.taskId(), task.ownerId(), task.revision());
            if (updated != 1) throw new ConcurrentModificationException("Task revision is stale");
        }

        long revision = inserting ? 0 : task.revision() + 1;
        return new TaskRecord(task.taskId(), task.ownerId(), task.serviceCode(), task.serviceVersion(),
                task.parentTaskId(), task.parentChecklistItemId(), task.rootTaskId(), task.dependencyCode(),
                task.depth(), task.status(), task.context(), task.checklistStates(), task.childTaskIds(), revision);
    }

    private TaskRecord mapTask(ResultSet rs, int row) throws SQLException {
        return new TaskRecord(
                rs.getString("task_id"), rs.getString("username"),
                rs.getString("service_code"), rs.getInt("service_version"),
                rs.getString("parent_task_id"), rs.getString("parent_requirement_code"),
                rs.getString("root_task_id"), rs.getString("dependency_code"),
                rs.getInt("depth"), rs.getString("status"),
                readJsonMap(rs.getString("context_json")),
                readJsonStringMap(rs.getString("checklist_json")),
                readJsonStringMap(rs.getString("child_tasks_json")),
                rs.getLong("revision"));
    }

    private String writeJson(Object value) {
        try { return mapper.writeValueAsString(value); }
        catch (JsonProcessingException e) { throw new IllegalStateException("Cannot serialize to JSON", e); }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> readJsonMap(String value) {
        if (value == null || value.isBlank()) return Map.of();
        try { return mapper.readValue(value, new TypeReference<Map<String, Object>>() {}); }
        catch (JsonProcessingException e) { throw new IllegalStateException("Invalid stored JSON", e); }
    }

    private Map<String, String> readJsonStringMap(String value) {
        if (value == null || value.isBlank()) return new LinkedHashMap<>();
        try { return mapper.readValue(value, new TypeReference<LinkedHashMap<String, String>>() {}); }
        catch (JsonProcessingException e) { throw new IllegalStateException("Invalid stored JSON", e); }
    }
}
