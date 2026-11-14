package com.govguide.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.govguide.exception.ApiError;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import com.govguide.persistence.FileBackedUserDetailsManager;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${app.cors.allowed-origins}")
    private String corsAllowedOrigins;

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    FileBackedUserDetailsManager userDetailsService(
            @Value("${app.auth.users:}") String configuredUsers,
            @Value("${app.data.dir:data}") String dataDir,
            PasswordEncoder encoder) {
        List<UserDetails> users = new ArrayList<>();
        if (configuredUsers != null && !configuredUsers.isBlank()) {
            for (String entry : configuredUsers.split(",")) {
                String[] parts = entry.trim().split(":", 2);
                if (parts.length != 2 || parts[0].isBlank() || parts[1].isBlank()
                        || !parts[1].startsWith("{bcrypt}")) {
                    throw new IllegalStateException("APP_AUTH_USERS must contain username:{bcrypt}hash entries");
                }
                String encodedPassword = parts[1].trim().substring("{bcrypt}".length());
                users.add(User.withUsername(parts[0].trim())
                        .password(encodedPassword)
                        .roles("USER")
                        .build());
            }
        }
        Path usersFile = Paths.get(dataDir, "users.json");
        return new FileBackedUserDetailsManager(usersFile, users);
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, ObjectMapper objectMapper, RateLimitingFilter rateLimitingFilter) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(headers -> {
                    headers.contentTypeOptions(cto -> { })
                        .frameOptions(fo -> fo.deny())
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31536000))
                        .referrerPolicy(rp -> rp.policy(
                                org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter
                                        .ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                        .permissionsPolicy(pp -> pp.policy(
                                "geolocation=(self), camera=(), microphone=()"));
                    headers.contentSecurityPolicy(csp -> csp.policyDirectives(
                                "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'"));
                })
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/services/_reload").authenticated()
                        .requestMatchers("/api/v1/health", "/api/v1/services", "/api/v1/services/**", "/api/v1/offices", "/api/v1/offices/**", "/api/v1/auth/register").permitAll()
                        .requestMatchers("/api/v1/feedback/service/**", "/api/v1/reviews/service/**").permitAll()
                        .requestMatchers("/api/v1/auth/**", "/api/v1/tasks/**", "/api/v1/applications/**",
                                "/api/v1/feedback/**", "/api/v1/reviews/**", "/api/v1/admin/**").authenticated()
                        .anyRequest().authenticated())
                .httpBasic(basic -> basic.authenticationEntryPoint(apiErrorEntryPoint(objectMapper)))
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint(apiErrorEntryPoint(objectMapper))
                        .accessDeniedHandler(apiErrorAccessDeniedHandler(objectMapper)))
                .addFilterBefore(rateLimitingFilter, org.springframework.security.web.authentication.www.BasicAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    org.springframework.boot.web.servlet.FilterRegistrationBean<RateLimitingFilter> disableAutoRegistration(RateLimitingFilter filter) {
        var reg = new org.springframework.boot.web.servlet.FilterRegistrationBean<>(filter);
        reg.setEnabled(false);
        return reg;
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        List<String> origins = Arrays.stream(corsAllowedOrigins.split(","))
                .map(String::trim)
                .filter(o -> !o.isBlank())
                .toList();
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    private AuthenticationEntryPoint apiErrorEntryPoint(ObjectMapper objectMapper) {
        return (request, response, exception) -> writeError(objectMapper, request.getRequestURI(), response,
                HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    private AccessDeniedHandler apiErrorAccessDeniedHandler(ObjectMapper objectMapper) {
        return (request, response, exception) -> writeError(objectMapper, request.getRequestURI(), response,
                HttpStatus.FORBIDDEN, "Access denied");
    }

    private void writeError(ObjectMapper objectMapper, String path, jakarta.servlet.http.HttpServletResponse response,
            HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), new ApiError(
                OffsetDateTime.now(), status.value(), status.getReasonPhrase(), message, path));
    }
}
