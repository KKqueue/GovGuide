package com.govguide.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int MAX_ATTEMPTS_PER_MINUTE = 10;
    private final ConcurrentHashMap<String, AtomicInteger> attempts = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        boolean isAuth = request.getHeader("Authorization") != null;
        boolean isRegister = "POST".equalsIgnoreCase(request.getMethod())
                && request.getRequestURI().contains("/auth/register");
        if (isAuth || isRegister) {
            String ip = request.getRemoteAddr();
            AtomicInteger count = attempts.computeIfAbsent(ip, k -> new AtomicInteger(0));
            if (count.incrementAndGet() > MAX_ATTEMPTS_PER_MINUTE) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
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
