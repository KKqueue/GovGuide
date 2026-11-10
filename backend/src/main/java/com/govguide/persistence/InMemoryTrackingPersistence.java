package com.govguide.persistence;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.ConcurrentModificationException;
import java.util.List;
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
public class InMemoryTrackingPersistence implements TrackingPersistence {

    private static final Logger log = LoggerFactory.getLogger(InMemoryTrackingPersistence.class);
    private final ConcurrentMap<String, TrackingRecord> records = new ConcurrentHashMap<>();
    private final Path trackingFile;
    private final ObjectMapper objectMapper;

    public InMemoryTrackingPersistence(@Value("${app.data.dir:data}") String dataDir) {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.trackingFile = Path.of(dataDir, "tracking.json");
        loadFromFile();
    }

    @Override
    public String persistenceLabel() { return "FILE_BACKED"; }

    @Override
    public Optional<TrackingRecord> find(String applicationId, String ownerId) {
        TrackingRecord record = records.get(applicationId);
        return record != null && record.ownerId().equals(ownerId) ? Optional.of(record) : Optional.empty();
    }

    @Override
    public Optional<TrackingRecord> findByTask(String taskId, String ownerId) {
        return records.values().stream()
                .filter(record -> record.taskId().equals(taskId) && record.ownerId().equals(ownerId))
                .findFirst();
    }

    @Override
    public TrackingRecord save(TrackingRecord record) {
        TrackingRecord saved = records.compute(record.applicationId(), (id, current) -> {
            if (current != null && current.revision() != record.revision()) {
                throw new ConcurrentModificationException("Tracking revision is stale");
            }
            return new TrackingRecord(record.applicationId(), record.taskId(), record.serviceCode(), record.ownerId(), record.status(),
                    record.submissionDate(), record.appointmentDate(), record.completionDate(), record.notes(), record.trackingLink(),
                    record.revision() + (current == null ? 0 : 1));
        });
        persistToFile();
        return saved;
    }

    private void loadFromFile() {
        if (!Files.exists(trackingFile)) return;
        try {
            List<TrackingRecord> stored = objectMapper.readValue(trackingFile.toFile(), new TypeReference<>() {});
            for (TrackingRecord record : stored) {
                records.put(record.applicationId(), record);
            }
            log.info("Loaded {} tracking records from {}", stored.size(), trackingFile);
        } catch (IOException e) {
            log.warn("Failed to load tracking records from {}: {}", trackingFile, e.getMessage());
        }
    }

    private synchronized void persistToFile() {
        try {
            Files.createDirectories(trackingFile.getParent());
            List<TrackingRecord> all = new ArrayList<>(records.values());
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(trackingFile.toFile(), all);
        } catch (IOException e) {
            log.error("Failed to persist tracking records to {}: {}", trackingFile, e.getMessage());
        }
    }
}
