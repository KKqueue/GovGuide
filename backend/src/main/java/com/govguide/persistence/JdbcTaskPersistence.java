package com.govguide.persistence;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.ConcurrentModificationException;
import org.springframework.jdbc.core.RowCallbackHandler;
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
    public String persistenceLabel() { return "MYSQL_DURABLE"; }

    @Override
    public List<TaskRecord> findAllRecords() {
        return jdbc.query("""
                SELECT t.task_id, u.username, t.service_code, t.service_version, t.parent_task_id,
                       t.parent_requirement_code, t.root_task_id, t.dependency_code, t.depth,
                       t.status, t.context_json, t.revision
                  FROM user_service_task t JOIN app_user u ON u.user_id = t.user_id""", this::mapTask);
    }

    @Override
    public Optional<TaskRecord> find(String taskId, String ownerId) {
        List<TaskRecord> rows = jdbc.query("""
                SELECT t.task_id, u.username, t.service_code, t.service_version, t.parent_task_id,
                       t.parent_requirement_code, t.root_task_id, t.dependency_code, t.depth,
                       t.status, t.context_json, t.revision
                  FROM user_service_task t JOIN app_user u ON u.user_id = t.user_id
                 WHERE t.task_id = ? AND u.username = ?""", this::mapTask, taskId, ownerId);
        return rows.stream().findFirst().map(this::withChildren);
    }

    @Override
    @Transactional
    public TaskRecord save(TaskRecord task) {
        long userId = userId(task.ownerId());
        long serviceId = serviceId(task.serviceCode(), task.serviceVersion());
        String context = writeJson(task.context());
        Long parentServiceId = parentServiceId(task.parentTaskId(), userId);
        Long parentRequirementId = parentServiceId == null || task.parentChecklistItemId() == null
                ? null : requirementId(parentServiceId, task.parentChecklistItemId());
        boolean inserting = task.revision() == 0
                && jdbc.queryForObject("SELECT COUNT(*) FROM user_service_task WHERE task_id = ?", Integer.class, task.taskId()) == 0;
        if (inserting) {
            jdbc.update("""
                    INSERT INTO user_service_task
                    (task_id,user_id,service_id,service_code,service_version,parent_task_id,root_task_id,
                     parent_requirement_id,parent_requirement_service_id,parent_requirement_code,dependency_code,depth,status,context_json,revision)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,0)""",
                    task.taskId(), userId, serviceId, task.serviceCode(), task.serviceVersion(), task.parentTaskId(),
                    task.rootTaskId(), parentRequirementId, parentServiceId, task.parentChecklistItemId(), task.dependencyCode(), task.depth(),
                    task.status(), context);
        } else {
            int updated = jdbc.update("""
                    UPDATE user_service_task
                       SET service_id=?, service_code=?, service_version=?, parent_task_id=?, root_task_id=?,
                           parent_requirement_id=?, parent_requirement_service_id=?, parent_requirement_code=?, dependency_code=?, depth=?, status=?, context_json=?, revision=revision+1
                     WHERE task_id=? AND user_id=? AND revision=?""",
                    serviceId, task.serviceCode(), task.serviceVersion(), task.parentTaskId(), task.rootTaskId(),
                    parentRequirementId, parentServiceId, task.parentChecklistItemId(), task.dependencyCode(), task.depth(), task.status(), context,
                    task.taskId(), userId, task.revision());
            if (updated != 1) throw new ConcurrentModificationException("Task revision is stale");
        }
        List<Long> currentRequirementIds = new ArrayList<>();
        for (Map.Entry<String, String> entry : task.checklistStates().entrySet()) {
            long requirementId = requirementId(serviceId, entry.getKey());
            currentRequirementIds.add(requirementId);
            jdbc.update("""
                    INSERT INTO user_checklist_item (task_id,task_service_id,service_requirement_id,state)
                    VALUES (?,?,?,?)
                    ON DUPLICATE KEY UPDATE state = VALUES(state)""",
                    task.taskId(), serviceId, requirementId, entry.getValue());
        }
        if (currentRequirementIds.isEmpty()) {
            jdbc.update("DELETE FROM user_checklist_item WHERE task_id = ?", task.taskId());
        } else {
            String placeholders = String.join(",", currentRequirementIds.stream().map(id -> "?").toList());
            List<Object> params = new ArrayList<>();
            params.add(task.taskId());
            params.addAll(currentRequirementIds);
            jdbc.update("DELETE FROM user_checklist_item WHERE task_id = ? AND service_requirement_id NOT IN (" + placeholders + ")",
                    params.toArray());
        }
        long revision = inserting ? 0 : task.revision() + 1;
        return new TaskRecord(task.taskId(), task.ownerId(), task.serviceCode(), task.serviceVersion(), task.parentTaskId(),
                task.parentChecklistItemId(), task.rootTaskId(), task.dependencyCode(), task.depth(), task.status(), task.context(),
                task.checklistStates(), task.childTaskIds(), revision);
    }

    private TaskRecord withChildren(TaskRecord task) {
        Map<String, String> children = new LinkedHashMap<>();
        jdbc.query("SELECT dependency_code, task_id FROM user_service_task WHERE parent_task_id = ? AND user_id = ?",
                (RowCallbackHandler) rs -> children.put(rs.getString("dependency_code"), rs.getString("task_id")), task.taskId(), userId(task.ownerId()));
        return new TaskRecord(task.taskId(), task.ownerId(), task.serviceCode(), task.serviceVersion(), task.parentTaskId(),
                task.parentChecklistItemId(), task.rootTaskId(), task.dependencyCode(), task.depth(), task.status(), task.context(),
                task.checklistStates(), Map.copyOf(children), task.revision());
    }

    private TaskRecord mapTask(ResultSet rs, int row) throws SQLException {
        Map<String, String> states = new LinkedHashMap<>();
        jdbc.query("SELECT r.requirement_code, c.state FROM user_checklist_item c JOIN service_requirement r ON r.id = c.service_requirement_id WHERE c.task_id = ?",
                (RowCallbackHandler) child -> states.put(child.getString("requirement_code"), child.getString("state")), rs.getString("task_id"));
        return new TaskRecord(rs.getString("task_id"), rs.getString("username"), rs.getString("service_code"),
                rs.getInt("service_version"), rs.getString("parent_task_id"), rs.getString("parent_requirement_code"),
                rs.getString("root_task_id"), rs.getString("dependency_code"), rs.getInt("depth"), rs.getString("status"),
                readJson(rs.getString("context_json")), states, Map.of(), rs.getLong("revision"));
    }

    private long userId(String username) {
        Long id = jdbc.queryForObject("SELECT user_id FROM app_user WHERE username = ? AND enabled = TRUE", Long.class, username);
        if (id == null) throw new IllegalStateException("Authenticated user is not pre-provisioned");
        return id;
    }

    private long serviceId(String code, int version) {
        Long id = jdbc.queryForObject("SELECT id FROM government_service WHERE service_code = ? AND version_number = ?", Long.class, code, version);
        if (id == null) throw new IllegalStateException("Service version is not present in the reference schema");
        return id;
    }

    private long requirementId(long serviceId, String code) {
        Long id = jdbc.queryForObject("SELECT id FROM service_requirement WHERE service_id = ? AND requirement_code = ?", Long.class, serviceId, code);
        if (id == null) throw new IllegalStateException("Requirement is not present for the selected service version");
        return id;
    }

    private Long parentServiceId(String parentTaskId, long userId) {
        if (parentTaskId == null) return null;
        return jdbc.queryForObject("SELECT service_id FROM user_service_task WHERE task_id = ? AND user_id = ?", Long.class, parentTaskId, userId);
    }

    private String writeJson(Map<String, Object> context) {
        try { return mapper.writeValueAsString(context); }
        catch (JsonProcessingException exception) { throw new IllegalStateException("Task context cannot be stored", exception); }
    }

    private Map<String, Object> readJson(String value) {
        try { return mapper.readValue(value, new TypeReference<Map<String, Object>>() { }); }
        catch (JsonProcessingException exception) { throw new IllegalStateException("Stored task context is invalid", exception); }
    }
}
