package com.govguide.content;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Stream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.govguide.validation.ContentGraphValidator;

import jakarta.annotation.PostConstruct;

@Repository
public class ServiceContentRepository {

    private static final Logger logger = LoggerFactory.getLogger(ServiceContentRepository.class);

    private final ObjectMapper objectMapper;
    private final Path contentRoot;
    private volatile List<JsonNode> cachedContent;

    public ServiceContentRepository(
            ObjectMapper objectMapper,
            @Value("${app.content.root}") String contentRoot) {
        this.objectMapper = objectMapper;
        this.contentRoot = Path.of(contentRoot).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void reload() {
        try (Stream<Path> files = Files.list(contentRoot)) {
            List<JsonNode> records = files
                    .filter(path -> path.getFileName().toString().endsWith(".json"))
                    .sorted(Comparator.comparing(Path::toString))
                    .map(this::read)
                    .toList();
            ContentGraphValidator.validateCatalog(records);
            cachedContent = records;
            logger.info("Loaded {} government service content files from {}", records.size(), contentRoot);
        } catch (IOException exception) {
            throw new IllegalStateException("Government service content is unavailable", exception);
        }
    }

    public List<JsonNode> findAll() {
        List<JsonNode> content = cachedContent;
        if (content == null) {
            reload();
            content = cachedContent;
        }
        return content;
    }

    public JsonNode findByCode(String serviceCode) {
        return findAll().stream()
                .filter(record -> serviceCode.equals(record.path("serviceCode").asText()))
                .findFirst()
                .orElseThrow(() -> new NoSuchElementException("Service not found: " + serviceCode));
    }

    private JsonNode read(Path path) {
        try {
            return objectMapper.readTree(path.toFile());
        } catch (IOException exception) {
            throw new IllegalStateException("Invalid government service content: " + path.getFileName(), exception);
        }
    }
}
