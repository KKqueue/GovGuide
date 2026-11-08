package com.govguide.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;

public record CreateTaskRequest(@NotBlank String serviceCode, Map<String, Object> context) {
    public CreateTaskRequest {
        context = context == null ? Map.of() : Map.copyOf(context);
    }
}
