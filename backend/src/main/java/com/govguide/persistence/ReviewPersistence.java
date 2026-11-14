package com.govguide.persistence;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

@Repository
public class ReviewPersistence {

    private static final Logger log = LoggerFactory.getLogger(ReviewPersistence.class);
    private final List<ReviewRecord> records = new CopyOnWriteArrayList<>();
    private final Path file;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ReviewPersistence(@Value("${app.data.dir:data}") String dataDir) {
        this.file = Path.of(dataDir, "reviews.json");
        loadFromFile();
    }

    public void save(ReviewRecord record) {
        records.add(record);
        persistToFile();
    }

    public List<ReviewRecord> findAll() {
        return List.copyOf(records);
    }

    public List<ReviewRecord> findByService(String serviceCode) {
        return records.stream().filter(r -> r.serviceCode().equals(serviceCode)).toList();
    }

    public boolean hasReview(String taskId, String username) {
        return records.stream().anyMatch(r -> r.taskId().equals(taskId) && r.username().equals(username));
    }

    public long count() { return records.size(); }

    private void loadFromFile() {
        if (!Files.exists(file)) return;
        try {
            List<ReviewRecord> stored = objectMapper.readValue(file.toFile(), new TypeReference<>() {});
            records.addAll(stored);
            log.info("Loaded {} review records from {}", stored.size(), file);
        } catch (IOException e) {
            log.warn("Failed to load reviews from {}: {}", file, e.getMessage());
        }
    }

    private synchronized void persistToFile() {
        try {
            Files.createDirectories(file.getParent());
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(file.toFile(), new ArrayList<>(records));
        } catch (IOException e) {
            log.error("Failed to persist reviews to {}: {}", file, e.getMessage());
        }
    }
}
