package com.govguide.persistence;

import java.util.Map;

public record TaskRecord(
        String taskId,
        String ownerId,
        String serviceCode,
        int serviceVersion,
        String parentTaskId,
        String parentChecklistItemId,
        String rootTaskId,
        String dependencyCode,
        int depth,
        String status,
        Map<String, Object> context,
        Map<String, String> checklistStates,
        Map<String, String> childTaskIds,
        long revision) {
}
