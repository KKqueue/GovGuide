package com.govguide.persistence;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.ConcurrentModificationException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

@Repository
@Profile("!db")
public class InMemoryTaskPersistence implements TaskPersistence {

    private static final Logger log = LoggerFactory.getLogger(InMemoryTaskPersistence.class);
    private final ConcurrentMap<String, TaskRecord> records = new ConcurrentHashMap<>();
    private final Path tasksFile;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public InMemoryTaskPersistence(@Value("${app.data.dir:data}") String dataDir) {
        this.tasksFile = Path.of(dataDir, "tasks.json");
        loadFromFile();
    }

    @Override
    public String persistenceLabel() { return "FILE_BACKED"; }

    @Override
    public Optional<TaskRecord> find(String taskId, String ownerId) {
        TaskRecord record = records.get(taskId);
        return record != null && record.ownerId().equals(ownerId) ? Optional.of(copy(record)) : Optional.empty();
    }

    @Override
    public TaskRecord save(TaskRecord task) {
        TaskRecord saved = records.compute(task.taskId(), (id, current) -> {
            if (current != null && current.revision() != task.revision()) {
                throw new ConcurrentModificationException("Task revision is stale");
            }
            return copy(taskWithRevision(task, task.revision() + (current == null ? 0 : 1)));
        });
        persistToFile();
        return saved;
    }

    private void loadFromFile() {
        if (!Files.exists(tasksFile)) return;
        try {
            List<TaskRecord> stored = objectMapper.readValue(tasksFile.toFile(), new TypeReference<>() {});
            for (TaskRecord record : stored) {
                records.put(record.taskId(), record);
            }
            log.info("Loaded {} tasks from {}", stored.size(), tasksFile);
        } catch (IOException e) {
            log.warn("Failed to load tasks from {}: {}", tasksFile, e.getMessage());
        }
    }

    private synchronized void persistToFile() {
        try {
            Files.createDirectories(tasksFile.getParent());
            List<TaskRecord> all = new ArrayList<>(records.values());
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(tasksFile.toFile(), all);
        } catch (IOException e) {
            log.error("Failed to persist tasks to {}: {}", tasksFile, e.getMessage());
        }
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
