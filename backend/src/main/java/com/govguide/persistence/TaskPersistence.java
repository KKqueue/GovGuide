package com.govguide.persistence;

import java.util.List;
import java.util.Optional;

public interface TaskPersistence {
    String persistenceLabel();
    Optional<TaskRecord> find(String taskId, String ownerId);
    TaskRecord save(TaskRecord task);
    List<TaskRecord> findAllRecords();
}
