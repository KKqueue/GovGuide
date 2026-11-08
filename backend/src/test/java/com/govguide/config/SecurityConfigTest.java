package com.govguide.config;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

class SecurityConfigTest {

    @Test
    void configuredBcryptPrefixIsRemovedBeforeAuthentication() {
        String rawPassword = "temporary-password";
        String encodedPassword = new BCryptPasswordEncoder().encode(rawPassword);
        UserDetailsService service = new SecurityConfig().userDetailsService(
                "alice:{bcrypt}" + encodedPassword, new BCryptPasswordEncoder());

        UserDetails user = service.loadUserByUsername("alice");

        assertTrue(new BCryptPasswordEncoder().matches(rawPassword, user.getPassword()));
    }
}
