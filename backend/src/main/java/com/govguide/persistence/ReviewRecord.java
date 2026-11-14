package com.govguide.persistence;

public record ReviewRecord(
        String id,
        String serviceCode,
        String taskId,
        String username,
        int rating,
        String message,
        long timestamp) {
}
