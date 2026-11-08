package com.govguide.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ChecklistUpdateRequest(
        @NotBlank
        @Pattern(regexp = "NOT_REVIEWED|AVAILABLE|NEEDS_VERIFICATION|MISSING|UPDATE_REQUIRED|IN_PROGRESS|COMPLETED|NOT_APPLICABLE")
        String state) {
}
