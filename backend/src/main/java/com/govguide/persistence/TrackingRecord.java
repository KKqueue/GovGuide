package com.govguide.persistence;

import java.time.LocalDate;

public record TrackingRecord(
        String applicationId,
        String taskId,
        String serviceCode,
        String ownerId,
        String status,
        LocalDate submissionDate,
        LocalDate appointmentDate,
        LocalDate completionDate,
        String notes,
        String trackingLink,
        long revision) {
}
