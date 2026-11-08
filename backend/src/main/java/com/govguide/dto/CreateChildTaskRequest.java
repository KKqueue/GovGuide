package com.govguide.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateChildTaskRequest(@NotBlank String checklistItemId, String dependencyCode) {
}
