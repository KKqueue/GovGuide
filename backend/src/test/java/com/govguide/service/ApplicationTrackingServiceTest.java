package com.govguide.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.govguide.dto.ApplicationTrackingResponse;
import com.govguide.dto.CreateApplicationTrackingRequest;
import com.govguide.dto.TaskResponse;
import com.govguide.dto.UpdateApplicationTrackingRequest;
import com.govguide.persistence.InMemoryTrackingPersistence;
import java.time.LocalDate;
import java.util.Map;
import java.util.NoSuchElementException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class ApplicationTrackingServiceTest {
    private ChecklistTaskService tasks;
    private ApplicationTrackingService tracking;

    @BeforeEach
    void setUp() {
        tasks = Mockito.mock(ChecklistTaskService.class);
        Mockito.when(tasks.getTask("task-1", "alice"))
                .thenReturn(new TaskResponse("task-1", "PAN_INSTANT_EPAN", "REVIEW", "LIMITED_ROUTE_CANDIDATE",
                        "PREPARING_DOCUMENTS", 0, 1, Map.of(), "IN_MEMORY_PROTOTYPE"));
        Mockito.when(tasks.getTask("task-1", "bob"))
                .thenReturn(new TaskResponse("task-1", "PAN_INSTANT_EPAN", "REVIEW", "LIMITED_ROUTE_CANDIDATE",
                        "PREPARING_DOCUMENTS", 0, 1, Map.of(), "IN_MEMORY_PROTOTYPE"));
        tracking = new ApplicationTrackingService(tasks, new InMemoryTrackingPersistence());
    }

    @Test
    void createsRetrievesAndUpdatesOwnedTrackingRecord() {
        ApplicationTrackingResponse created = tracking.create(
                new CreateApplicationTrackingRequest("task-1", "PLANNING", null, null, null, "Preparing documents", "https://example.gov/track"),
                "alice");
        assertEquals("task-1", created.taskId());
        assertEquals("USER_PROVIDED_UNVERIFIED", created.trackingLinkProvenance());
        assertEquals("IN_MEMORY_PROTOTYPE", created.persistence());

        tracking.update(created.applicationId(),
                new UpdateApplicationTrackingRequest("PREPARING_DOCUMENTS", null, null, null,
                        "Preparing documents", "https://example.gov/track"), "alice");
        tracking.update(created.applicationId(),
                new UpdateApplicationTrackingRequest("READY_TO_APPLY", null, null, null,
                        "Ready to apply", "https://example.gov/track"), "alice");
        ApplicationTrackingResponse updated = tracking.update(created.applicationId(),
                new UpdateApplicationTrackingRequest("SUBMITTED", LocalDate.of(2026, 1, 10), null, null,
                        "Submitted by the user", "https://example.gov/status"), "alice");
        assertEquals("SUBMITTED", updated.status());
        assertEquals(LocalDate.of(2026, 1, 10), updated.submissionDate());
        assertEquals("Submitted by the user", updated.notes());
        assertEquals(created.applicationId(), tracking.get(created.applicationId(), "alice").applicationId());
    }

    @Test
    void rejectsInvalidTransitionsDatesAndLinks() {
        ApplicationTrackingResponse created = tracking.create(
                new CreateApplicationTrackingRequest("task-1", "PLANNING", null, null, null, null, null), "alice");
        assertThrows(IllegalArgumentException.class, () -> tracking.update(created.applicationId(),
                new UpdateApplicationTrackingRequest("COMPLETED", null, null, null, null, null), "alice"));
        assertThrows(IllegalArgumentException.class, () -> tracking.create(
                new CreateApplicationTrackingRequest("task-1", "INVALID", null, null, null, null, null), "bob"));
        assertThrows(IllegalArgumentException.class, () -> tracking.create(
                new CreateApplicationTrackingRequest("task-1", "PLANNING", LocalDate.of(2026, 2, 1),
                        LocalDate.of(2026, 1, 1), null, null, null), "bob"));
        assertThrows(IllegalArgumentException.class, () -> tracking.create(
                new CreateApplicationTrackingRequest("task-1", "PLANNING", null, null, null, null, "javascript:alert(1)"), "bob"));
    }

    @Test
    void isolatesRecordsByOwnerAndRequiresAnOwnedTask() {
        ApplicationTrackingResponse created = tracking.create(
                new CreateApplicationTrackingRequest("task-1", "PLANNING", null, null, null, null, null), "alice");
        assertThrows(NoSuchElementException.class, () -> tracking.get(created.applicationId(), "bob"));
        assertThrows(NoSuchElementException.class, () -> tracking.update(created.applicationId(),
                new UpdateApplicationTrackingRequest("PREPARING_DOCUMENTS", null, null, null, null, null), "bob"));
        Mockito.when(tasks.getTask("task-2", "bob")).thenThrow(new NoSuchElementException("Task not found: task-2"));
        assertThrows(NoSuchElementException.class, () -> tracking.create(
                new CreateApplicationTrackingRequest("task-2", "PLANNING", null, null, null, null, null), "bob"));
    }
}
