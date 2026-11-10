package com.govguide.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int MAX_ATTEMPTS_PER_MINUTE = 10;
    private static final String RETRY_AFTER_SECONDS = "60";
    private final ConcurrentHashMap<String, AtomicInteger> attempts = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        boolean isAuth = request.getHeader("Authorization") != null;
        boolean isRegister = "POST".equalsIgnoreCase(request.getMethod())
                && request.getRequestURI().contains("/auth/register");
        if (isAuth || isRegister) {
            String forwarded = request.getHeader("X-Forwarded-For");
            String ip = (forwarded != null && !forwarded.isBlank())
                    ? forwarded.split(",")[0].trim() : request.getRemoteAddr();
            AtomicInteger count = attempts.computeIfAbsent(ip, k -> new AtomicInteger(0));
            int current = count.incrementAndGet();
            response.setHeader("X-RateLimit-Limit", String.valueOf(MAX_ATTEMPTS_PER_MINUTE));
            response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, MAX_ATTEMPTS_PER_MINUTE - current)));
            if (current > MAX_ATTEMPTS_PER_MINUTE) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setHeader("Retry-After", RETRY_AFTER_SECONDS);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Too many requests. Try again later.\"}");
                return;
            }
        }
        chain.doFilter(request, response);
    }

    @Scheduled(fixedRate = 60000)
    public void resetCounts() {
        attempts.clear();
    }
}
