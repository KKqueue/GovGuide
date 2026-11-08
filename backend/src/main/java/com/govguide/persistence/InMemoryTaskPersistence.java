package com.govguide.persistence;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.ConcurrentModificationException;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

@Repository
@Profile("!db")
public class InMemoryTaskPersistence implements TaskPersistence {
    private final ConcurrentMap<String, TaskRecord> records = new ConcurrentHashMap<>();

    @Override
    public String persistenceLabel() { return "IN_MEMORY_PROTOTYPE"; }

    @Override
    public Optional<TaskRecord> find(String taskId, String ownerId) {
        TaskRecord record = records.get(taskId);
        return record != null && record.ownerId().equals(ownerId) ? Optional.of(copy(record)) : Optional.empty();
    }

    @Override
    public TaskRecord save(TaskRecord task) {
        return records.compute(task.taskId(), (id, current) -> {
            if (current != null && current.revision() != task.revision()) {
                throw new ConcurrentModificationException("Task revision is stale");
            }
            return copy(taskWithRevision(task, task.revision() + (current == null ? 0 : 1)));
        });
    }

    private static TaskRecord taskWithRevision(TaskRecord task, long revision) {
        return new TaskRecord(task.taskId(), task.ownerId(), task.serviceCode(), task.serviceVersion(),
                task.parentTaskId(), task.parentChecklistItemId(), task.rootTaskId(), task.dependencyCode(), task.depth(),
                task.status(), task.context(), task.checklistStates(), task.childTaskIds(), revision);
    }

    private static TaskRecord copy(TaskRecord task) {
        return new TaskRecord(task.taskId(), task.ownerId(), task.serviceCode(), task.serviceVersion(),
                task.parentTaskId(), task.parentChecklistItemId(), task.rootTaskId(), task.dependencyCode(), task.depth(),
                task.status(), Map.copyOf(task.context()), Map.copyOf(task.checklistStates()), Map.copyOf(task.childTaskIds()), task.revision());
    }
}
