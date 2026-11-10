package com.govguide.config;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

class SecurityConfigTest {

    @Test
    void configuredBcryptPrefixIsRemovedBeforeAuthentication(@TempDir Path tempDir) {
        String rawPassword = "temporary-password";
        String encodedPassword = new BCryptPasswordEncoder().encode(rawPassword);
        UserDetailsService service = new SecurityConfig().userDetailsService(
                "alice:{bcrypt}" + encodedPassword, tempDir.toString(), new BCryptPasswordEncoder());

        UserDetails user = service.loadUserByUsername("alice");

        assertTrue(new BCryptPasswordEncoder().matches(rawPassword, user.getPassword()));
    }
}
