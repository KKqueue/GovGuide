package com.govguide.persistence;

import java.util.Optional;

public interface TrackingPersistence {
    String persistenceLabel();
    Optional<TrackingRecord> find(String applicationId, String ownerId);
    Optional<TrackingRecord> findByTask(String taskId, String ownerId);
    TrackingRecord save(TrackingRecord record);
}
