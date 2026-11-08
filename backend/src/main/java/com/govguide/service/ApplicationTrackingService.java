package com.govguide.service;

import com.govguide.dto.ApplicationTrackingResponse;
import com.govguide.dto.CreateApplicationTrackingRequest;
import com.govguide.dto.UpdateApplicationTrackingRequest;
import com.govguide.dto.TaskResponse;
import com.govguide.persistence.TrackingPersistence;
import com.govguide.persistence.TrackingRecord;
import java.net.URI;
import java.time.LocalDate;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

@Service
public class ApplicationTrackingService {
    private static final Set<String> STATUSES = Set.of(
            "PLANNING", "PREPARING_DOCUMENTS", "READY_TO_APPLY", "SUBMITTED",
            "APPOINTMENT_SCHEDULED", "ADDITIONAL_INFORMATION_REQUIRED", "UNDER_REVIEW",
            "APPROVED", "REJECTED", "DOCUMENT_ISSUED", "COMPLETED");
    private static final Map<String, Set<String>> TRANSITIONS = Map.ofEntries(
            Map.entry("PLANNING", Set.of("PLANNING", "PREPARING_DOCUMENTS", "READY_TO_APPLY")),
            Map.entry("PREPARING_DOCUMENTS", Set.of("PREPARING_DOCUMENTS", "READY_TO_APPLY")),
            Map.entry("READY_TO_APPLY", Set.of("READY_TO_APPLY", "SUBMITTED")),
            Map.entry("SUBMITTED", Set.of("SUBMITTED", "APPOINTMENT_SCHEDULED", "ADDITIONAL_INFORMATION_REQUIRED", "UNDER_REVIEW")),
            Map.entry("APPOINTMENT_SCHEDULED", Set.of("APPOINTMENT_SCHEDULED", "ADDITIONAL_INFORMATION_REQUIRED", "UNDER_REVIEW")),
            Map.entry("ADDITIONAL_INFORMATION_REQUIRED", Set.of("ADDITIONAL_INFORMATION_REQUIRED", "SUBMITTED", "APPOINTMENT_SCHEDULED")),
            Map.entry("UNDER_REVIEW", Set.of("UNDER_REVIEW", "APPROVED", "REJECTED")),
            Map.entry("APPROVED", Set.of("APPROVED", "DOCUMENT_ISSUED", "COMPLETED")),
            Map.entry("DOCUMENT_ISSUED", Set.of("DOCUMENT_ISSUED", "COMPLETED")),
            Map.entry("REJECTED", Set.of("REJECTED")),
            Map.entry("COMPLETED", Set.of("COMPLETED")));

    private final ChecklistTaskService taskService;
    private final TrackingPersistence persistence;

    public ApplicationTrackingService(ChecklistTaskService taskService, TrackingPersistence persistence) {
        this.taskService = taskService;
        this.persistence = persistence;
    }

    @Transactional
    public ApplicationTrackingResponse create(CreateApplicationTrackingRequest request, String ownerId) {
        TaskResponse task = taskService.getTask(request.taskId(), ownerId);
        if (persistence.findByTask(request.taskId(), ownerId).isPresent()) {
            throw new IllegalArgumentException("A tracking record already exists for this task");
        }
        String status = validateStatus(request.status());
        validateFields(request.submissionDate(), request.appointmentDate(), request.completionDate(), request.trackingLink());
        TrackingRecord state = new TrackingRecord(UUID.randomUUID().toString(), request.taskId(), task.serviceCode(), ownerId,
                status, request.submissionDate(), request.appointmentDate(), request.completionDate(), request.notes(), request.trackingLink(), 0);
        return response(persistence.save(state));
    }

    public ApplicationTrackingResponse get(String applicationId, String ownerId) {
        return response(require(applicationId, ownerId));
    }

    public ApplicationTrackingResponse getForTask(String taskId, String ownerId) {
        taskService.getTask(taskId, ownerId);
        return persistence.findByTask(taskId, ownerId).map(this::response)
                .orElseThrow(() -> new NoSuchElementException("Tracking record not found for task: " + taskId));
    }

    @Transactional
    public ApplicationTrackingResponse update(String applicationId, UpdateApplicationTrackingRequest request, String ownerId) {
        TrackingRecord state = require(applicationId, ownerId);
        String nextStatus = request.status() == null || request.status().isBlank() ? state.status() : validateStatus(request.status());
        if (!TRANSITIONS.get(state.status()).contains(nextStatus)) {
            throw new IllegalArgumentException("Status transition is not allowed: " + state.status() + " to " + nextStatus);
        }
        LocalDate finalSubmissionDate = request.submissionDate() != null ? request.submissionDate() : state.submissionDate();
        LocalDate finalAppointmentDate = request.appointmentDate() != null ? request.appointmentDate() : state.appointmentDate();
        LocalDate finalCompletionDate = request.completionDate() != null ? request.completionDate() : state.completionDate();
        String finalNotes = request.notes() != null ? request.notes() : state.notes();
        String finalTrackingLink = request.trackingLink() != null ? request.trackingLink() : state.trackingLink();
        validateFields(finalSubmissionDate, finalAppointmentDate, finalCompletionDate, finalTrackingLink);
        TrackingRecord updated = new TrackingRecord(state.applicationId(), state.taskId(), state.serviceCode(), state.ownerId(), nextStatus,
                finalSubmissionDate, finalAppointmentDate, finalCompletionDate, finalNotes, finalTrackingLink, state.revision());
        return response(persistence.save(updated));
    }

    private TrackingRecord require(String applicationId, String ownerId) {
        return persistence.find(applicationId, ownerId)
                .orElseThrow(() -> new NoSuchElementException("Tracking record not found: " + applicationId));
    }

    private static String validateStatus(String status) {
        if (status == null || !STATUSES.contains(status)) throw new IllegalArgumentException("Unsupported application tracking status");
        return status;
    }

    private static void validateFields(LocalDate submission, LocalDate appointment, LocalDate completion, String link) {
        if (submission != null && appointment != null && appointment.isBefore(submission)) {
            throw new IllegalArgumentException("Appointment date cannot be before submission date");
        }
        if (submission != null && completion != null && completion.isBefore(submission)) {
            throw new IllegalArgumentException("Completion date cannot be before submission date");
        }
        if (appointment != null && completion != null && completion.isBefore(appointment)) {
            throw new IllegalArgumentException("Completion date cannot be before appointment date");
        }
        if (link != null && !link.isBlank()) {
            try {
                URI uri = URI.create(link);
                if (!("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme())) || uri.getHost() == null) {
                    throw new IllegalArgumentException("Tracking link must use HTTP or HTTPS");
                }
            } catch (IllegalArgumentException exception) {
                throw new IllegalArgumentException("Tracking link must use HTTP or HTTPS");
            }
        }
    }

    private ApplicationTrackingResponse response(TrackingRecord state) {
        return new ApplicationTrackingResponse(state.applicationId(), state.taskId(), state.serviceCode(), state.status(),
                state.submissionDate(), state.appointmentDate(), state.completionDate(), state.notes(), state.trackingLink(),
                state.trackingLink() == null || state.trackingLink().isBlank() ? "UNAVAILABLE" : "USER_PROVIDED_UNVERIFIED",
                persistence.persistenceLabel());
    }
}
