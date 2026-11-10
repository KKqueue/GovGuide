package com.govguide.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Username is required")
        @Size(max = 64, message = "Username must not exceed 64 characters")
        @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Username must be alphanumeric (dots, hyphens, underscores allowed)")
        String username,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 128, message = "Password must be 8-128 characters")
        String password
) {}
