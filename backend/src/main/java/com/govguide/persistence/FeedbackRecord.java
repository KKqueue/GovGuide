package com.govguide.persistence;

public record FeedbackRecord(
        String id,
        String serviceCode,
        String username,
        String type,
        String message,
        long timestamp) {
}
