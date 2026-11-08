package com.govguide.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.govguide.dto.OfficeResponse;
import com.govguide.dto.OfficeSearchResponse;
import java.net.URI;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class OfficeDiscoveryService {

    private final ServiceCatalogueService catalogueService;

    public OfficeDiscoveryService(ServiceCatalogueService catalogueService) {
        this.catalogueService = catalogueService;
    }

    public OfficeSearchResponse search(String serviceCode, String district, String city, String town, String pinCode) {
        validateServiceCode(serviceCode);
        validateLocation("district", district);
        validateLocation("city", city);
        validateLocation("town", town);
        validatePinCode(pinCode);

        JsonNode service = catalogueService.getService(serviceCode);
        List<OfficeResponse> offices = new ArrayList<>();
        for (JsonNode office : service.path("offices")) {
            if (isVerifiedForService(office, serviceCode) && matches(office, district, city, town, pinCode)) {
                offices.add(toResponse(office));
            }
        }

        Map<String, String> selection = new LinkedHashMap<>();
        putIfPresent(selection, "district", district);
        putIfPresent(selection, "city", city);
        putIfPresent(selection, "town", town);
        putIfPresent(selection, "pinCode", pinCode);
        String message = offices.isEmpty()
                ? "No verified office information is available for this service and selection."
                : null;
        return new OfficeSearchResponse(
                serviceCode,
                "MANUAL",
                Map.copyOf(selection),
                offices.isEmpty() ? "UNAVAILABLE" : "VERIFIED",
                message,
                List.copyOf(offices));
    }

    private boolean isVerifiedForService(JsonNode office, String serviceCode) {
        if (!"VERIFIED".equals(office.path("verificationStatus").asText())) {
            return false;
        }
        JsonNode capability = office.path("serviceCapability");
        if (!"VERIFIED".equals(capability.path("verificationStatus").asText())
                || !serviceCode.equals(capability.path("serviceCode").asText())) {
            return false;
        }
        JsonNode source = office.path("source");
        return nonBlank(source, "sourceCode")
                && nonBlank(source, "title")
                && nonBlank(source, "publisher")
                && validHttpUrl(source.path("url").asText(null))
                && nonBlank(source, "checkedAt")
                && "VERIFIED".equals(source.path("verificationStatus").asText())
                && nonBlank(office, "officeCode")
                && nonBlank(office, "name")
                && nonBlank(office, "type")
                && nonBlank(office, "address");
    }

    private OfficeResponse toResponse(JsonNode office) {
        JsonNode source = office.path("source");
        return new OfficeResponse(
                office.path("officeCode").asText(),
                office.path("name").asText(),
                office.path("type").asText(),
                textOrNull(office, "district"),
                textOrNull(office, "city"),
                textOrNull(office, "town"),
                textOrNull(office, "pinCode"),
                office.path("address").asText(),
                validHttpUrl(office.path("directionsUrl").asText(null))
                        ? office.path("directionsUrl").asText() : null,
                new OfficeResponse.SourceMetadata(
                        source.path("sourceCode").asText(),
                        source.path("title").asText(),
                        source.path("publisher").asText(),
                        source.path("url").asText(),
                        source.path("verificationStatus").asText(),
                        source.path("checkedAt").asText()));
    }

    private boolean matches(JsonNode office, String district, String city, String town, String pinCode) {
        return matchesValue(office, "district", district)
                && matchesValue(office, "city", city)
                && matchesValue(office, "town", town)
                && matchesValue(office, "pinCode", pinCode);
    }

    private boolean matchesValue(JsonNode office, String field, String expected) {
        return expected == null || expected.isBlank()
                || expected.equalsIgnoreCase(office.path(field).asText());
    }

    private void validateServiceCode(String serviceCode) {
        if (serviceCode == null || !serviceCode.matches("[A-Za-z0-9_-]{1,100}")) {
            throw new IllegalArgumentException("serviceId must be a valid service code");
        }
    }

    private void validateLocation(String field, String value) {
        if (value != null && (value.length() > 100 || value.chars().anyMatch(Character::isISOControl))) {
            throw new IllegalArgumentException(field + " is invalid");
        }
    }

    private void validatePinCode(String pinCode) {
        if (pinCode != null && !pinCode.matches("\\d{6}")) {
            throw new IllegalArgumentException("pinCode must contain exactly 6 digits");
        }
    }

    private boolean nonBlank(JsonNode node, String field) {
        return node.hasNonNull(field) && !node.path(field).asText().isBlank();
    }

    private String textOrNull(JsonNode node, String field) {
        return nonBlank(node, field) ? node.path(field).asText() : null;
    }

    private boolean validHttpUrl(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }
        try {
            String scheme = URI.create(value).getScheme();
            return "http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme);
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private void putIfPresent(Map<String, String> selection, String key, String value) {
        if (value != null && !value.isBlank()) {
            selection.put(key, value.trim());
        }
    }
}
