package com.govguide.dto;

import java.time.LocalDate;

public record ApplicationTrackingResponse(
        String applicationId,
        String taskId,
        String serviceCode,
        String status,
        LocalDate submissionDate,
        LocalDate appointmentDate,
        LocalDate completionDate,
        String notes,
        String trackingLink,
        String trackingLinkProvenance,
        String persistence) {
}
