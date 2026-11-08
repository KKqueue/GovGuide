package com.govguide.dto;

import java.util.Map;

public record TaskResponse(
        String taskId,
        String serviceCode,
        String serviceStatus,
        String publicationReadiness,
        String state,
        int completedBlockingItems,
        int blockingItems,
        Map<String, String> checklistStates,
        String persistence,
        String parentTaskId,
        String parentChecklistItemId,
        String rootTaskId,
        Map<String, String> childTaskIds,
        int completedItems,
        int totalItems,
        int remainingItems,
        int progressPercentage,
        EstimateResponse estimate) {

    public record EstimateResponse(
            String userEffortStatus,
            String userEffortLabel,
            String explanation,
            String governmentProcessingStatus,
            String governmentProcessingDescription) { }

    public TaskResponse(
            String taskId,
            String serviceCode,
            String serviceStatus,
            String publicationReadiness,
            String state,
            int completedBlockingItems,
            int blockingItems,
            Map<String, String> checklistStates,
            String persistence) {
        this(taskId, serviceCode, serviceStatus, publicationReadiness, state,
                completedBlockingItems, blockingItems, checklistStates, persistence,
                null, null, taskId, Map.of(), 0, 0, 0, 0,
                new EstimateResponse("UNAVAILABLE", "Estimate unavailable",
                        "No verified numeric user-effort rule is defined.",
                        "UNKNOWN", "Government processing information is unavailable."));
    }
}
