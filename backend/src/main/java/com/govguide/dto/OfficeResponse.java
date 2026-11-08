package com.govguide.dto;

public record OfficeResponse(
        String officeCode,
        String name,
        String type,
        String district,
        String city,
        String town,
        String pinCode,
        String address,
        String directionsUrl,
        SourceMetadata source) {

    public record SourceMetadata(
            String sourceCode,
            String title,
            String publisher,
            String url,
            String verificationStatus,
            String checkedAt) {
    }
}
