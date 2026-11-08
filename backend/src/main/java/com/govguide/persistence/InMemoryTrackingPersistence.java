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
public class InMemoryTrackingPersistence implements TrackingPersistence {
    private final ConcurrentMap<String, TrackingRecord> records = new ConcurrentHashMap<>();

    @Override
    public String persistenceLabel() { return "IN_MEMORY_PROTOTYPE"; }

    @Override
    public Optional<TrackingRecord> find(String applicationId, String ownerId) {
        TrackingRecord record = records.get(applicationId);
        return record != null && record.ownerId().equals(ownerId) ? Optional.of(record) : Optional.empty();
    }

    @Override
    public Optional<TrackingRecord> findByTask(String taskId, String ownerId) {
        return records.values().stream().filter(record -> record.taskId().equals(taskId) && record.ownerId().equals(ownerId)).findFirst();
    }

    @Override
    public TrackingRecord save(TrackingRecord record) {
        return records.compute(record.applicationId(), (id, current) -> {
            if (current != null && current.revision() != record.revision()) {
                throw new ConcurrentModificationException("Tracking revision is stale");
            }
            return new TrackingRecord(record.applicationId(), record.taskId(), record.serviceCode(), record.ownerId(), record.status(),
                    record.submissionDate(), record.appointmentDate(), record.completionDate(), record.notes(), record.trackingLink(),
                    record.revision() + (current == null ? 0 : 1));
        });
    }
}
