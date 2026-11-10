package com.govguide.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.nio.file.Path;
import java.util.Map;
import java.util.ConcurrentModificationException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class InMemoryPersistenceTest {

    @Test
    void taskWritesAreOwnerScopedAndRejectStaleRevisions(@TempDir Path tempDir) {
        InMemoryTaskPersistence persistence = new InMemoryTaskPersistence(tempDir.toString());
        TaskRecord original = new TaskRecord("task-1", "alice", "PAN_INSTANT_EPAN", 1,
                null, null, "task-1", null, 0, "PREPARING_DOCUMENTS", Map.of(), Map.of(), Map.of(), 0);

        TaskRecord saved = persistence.save(original);
        assertEquals(0, saved.revision());
        assertEquals("task-1", persistence.find("task-1", "alice").orElseThrow().taskId());
        assertEquals(false, persistence.find("task-1", "bob").isPresent());

        TaskRecord changed = new TaskRecord(original.taskId(), original.ownerId(), original.serviceCode(), original.serviceVersion(),
                original.parentTaskId(), original.parentChecklistItemId(), original.rootTaskId(), original.dependencyCode(),
                original.depth(), "READY_TO_APPLY", original.context(), original.checklistStates(), original.childTaskIds(), saved.revision());
        TaskRecord updated = persistence.save(changed);
        assertEquals(1, updated.revision());
        assertThrows(ConcurrentModificationException.class, () -> persistence.save(changed));
    }

    @Test
    void trackingWritesRejectStaleRevisions(@TempDir Path tempDir) {
        InMemoryTrackingPersistence persistence = new InMemoryTrackingPersistence(tempDir.toString());
        TrackingRecord original = new TrackingRecord("application-1", "task-1", "PAN_INSTANT_EPAN", "alice",
                "PLANNING", null, null, null, null, null, 0);
        TrackingRecord saved = persistence.save(original);
        assertEquals(0, saved.revision());
        assertEquals(false, persistence.find("application-1", "bob").isPresent());
        TrackingRecord changed = new TrackingRecord(original.applicationId(), original.taskId(), original.serviceCode(), original.ownerId(),
                "PREPARING_DOCUMENTS", null, null, null, null, null, saved.revision());
        assertEquals(1, persistence.save(changed).revision());
        assertThrows(ConcurrentModificationException.class, () -> persistence.save(original));
    }
}
