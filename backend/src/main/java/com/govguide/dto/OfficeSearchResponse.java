package com.govguide.dto;

import java.util.List;
import java.util.Map;

public record OfficeSearchResponse(
        String serviceCode,
        String selectionMode,
        Map<String, String> selection,
        String availabilityStatus,
        String message,
        List<OfficeResponse> offices) {
}
