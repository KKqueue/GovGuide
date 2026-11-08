package com.govguide.dto;

public record ServiceSummaryResponse(
        String serviceCode,
        int version,
        String status,
        String publicationReadiness,
        String name,
        String authority,
        String jurisdiction,
        String category,
        String description,
        String lastVerifiedDate) {
}
