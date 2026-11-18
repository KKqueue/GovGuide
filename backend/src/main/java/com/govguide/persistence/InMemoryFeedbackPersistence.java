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
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

@Repository
@Profile("!db")
public class InMemoryFeedbackPersistence implements FeedbackPersistence {

    private static final Logger log = LoggerFactory.getLogger(InMemoryFeedbackPersistence.class);
    private final List<FeedbackRecord> records = new CopyOnWriteArrayList<>();
    private final Path file;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public InMemoryFeedbackPersistence(@Value("${app.data.dir:data}") String dataDir) {
        this.file = Path.of(dataDir, "feedback.json");
        loadFromFile();
    }

    @Override
    public void save(FeedbackRecord record) {
        records.add(record);
        persistToFile();
    }

    @Override
    public List<FeedbackRecord> findAll() {
        return List.copyOf(records);
    }

    @Override
    public List<FeedbackRecord> findByService(String serviceCode) {
        return records.stream().filter(r -> r.serviceCode().equals(serviceCode)).toList();
    }

    @Override
    public long count() { return records.size(); }

    private void loadFromFile() {
        if (!Files.exists(file)) return;
        try {
            List<FeedbackRecord> stored = objectMapper.readValue(file.toFile(), new TypeReference<>() {});
            records.addAll(stored);
            log.info("Loaded {} feedback records from {}", stored.size(), file);
        } catch (IOException e) {
            log.warn("Failed to load feedback from {}: {}", file, e.getMessage());
        }
    }

    private synchronized void persistToFile() {
        try {
            Files.createDirectories(file.getParent());
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(file.toFile(), new ArrayList<>(records));
        } catch (IOException e) {
            log.error("Failed to persist feedback to {}: {}", file, e.getMessage());
        }
    }
}
