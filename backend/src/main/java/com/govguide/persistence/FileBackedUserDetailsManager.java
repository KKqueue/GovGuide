package com.govguide.persistence;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;

public class FileBackedUserDetailsManager extends InMemoryUserDetailsManager {

    private static final Logger log = LoggerFactory.getLogger(FileBackedUserDetailsManager.class);
    private final Path usersFile;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private volatile boolean initialized = false;

    public FileBackedUserDetailsManager(Path usersFile, List<UserDetails> preconfiguredUsers) {
        super();
        this.usersFile = usersFile;
        for (UserDetails u : preconfiguredUsers) {
            super.createUser(u);
        }
        loadFromFile();
        initialized = true;
    }

    @Override
    public void createUser(UserDetails user) {
        super.createUser(user);
        if (initialized) {
            appendToFile(user);
        }
    }

    @Override
    public void updateUser(UserDetails user) {
        super.updateUser(user);
        if (initialized) {
            appendToFile(user);
        }
    }

    @Override
    public void deleteUser(String username) {
        super.deleteUser(username);
        if (initialized) {
            removeFromFile(username);
        }
    }

    private void loadFromFile() {
        if (!Files.exists(usersFile)) return;
        try {
            List<StoredUser> stored = objectMapper.readValue(usersFile.toFile(), new TypeReference<>() {});
            int loaded = 0;
            for (StoredUser su : stored) {
                if (!userExists(su.username())) {
                    UserDetails user = User.withUsername(su.username())
                            .password(su.encodedPassword())
                            .roles(su.roles().toArray(new String[0]))
                            .build();
                    super.createUser(user);
                    loaded++;
                }
            }
            log.info("Loaded {} registered users from {}", loaded, usersFile);
        } catch (IOException e) {
            log.warn("Failed to load users from {}: {}", usersFile, e.getMessage());
        }
    }

    private synchronized void appendToFile(UserDetails user) {
        try {
            Files.createDirectories(usersFile.getParent());
            List<StoredUser> existing = readFile();
            existing.removeIf(su -> su.username().equals(user.getUsername()));
            existing.add(new StoredUser(user.getUsername(), user.getPassword(),
                    user.getAuthorities().stream()
                            .map(a -> a.getAuthority().replace("ROLE_", ""))
                            .toList()));
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(usersFile.toFile(), existing);
            log.info("Saved user '{}' — {} total users in {}", user.getUsername(), existing.size(), usersFile);
        } catch (IOException e) {
            log.error("Failed to persist user to {}: {}", usersFile, e.getMessage());
        }
    }

    private synchronized void removeFromFile(String username) {
        try {
            List<StoredUser> existing = readFile();
            existing.removeIf(su -> su.username().equals(username));
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(usersFile.toFile(), existing);
        } catch (IOException e) {
            log.error("Failed to remove user from {}: {}", usersFile, e.getMessage());
        }
    }

    private List<StoredUser> readFile() {
        if (!Files.exists(usersFile)) return new ArrayList<>();
        try {
            return new ArrayList<>(objectMapper.readValue(usersFile.toFile(), new TypeReference<>() {}));
        } catch (IOException e) {
            return new ArrayList<>();
        }
    }

    record StoredUser(String username, String encodedPassword, List<String> roles) {}
}
