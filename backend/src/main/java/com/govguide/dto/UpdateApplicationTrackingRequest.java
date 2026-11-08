package com.govguide.dto;

import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record UpdateApplicationTrackingRequest(
        String status,
        LocalDate submissionDate,
        LocalDate appointmentDate,
        LocalDate completionDate,
        @Size(max = 2000) String notes,
        @Size(max = 2048) String trackingLink) {
}
