package com.govguide.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.NoSuchElementException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class OfficeDiscoveryServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    @Mock
    private ServiceCatalogueService catalogueService;
    private OfficeDiscoveryService service;

    @BeforeEach
    void setUp() {
        service = new OfficeDiscoveryService(catalogueService);
    }

    @Test
    void returnsSafeUnavailableResponseWhenNoVerifiedOfficeExists() throws Exception {
        when(catalogueService.getService("PAN_INSTANT_EPAN"))
                .thenReturn(objectMapper.readTree("{\"serviceCode\":\"PAN_INSTANT_EPAN\"}"));

        var response = service.search("PAN_INSTANT_EPAN", "Chennai", null, null, null);

        assertEquals("UNAVAILABLE", response.availabilityStatus());
        assertEquals(0, response.offices().size());
        assertEquals("No verified office information is available for this service and selection.", response.message());
    }

    @Test
    void returnsOnlySourceBackedOfficeForMatchingServiceAndDistrict() throws Exception {
        JsonNode record = objectMapper.readTree("""
                {
                  "serviceCode":"PAN_INSTANT_EPAN",
                  "offices":[
                    {"officeCode":"ITD-1","name":"Verified Office","type":"Service Centre","district":"Chennai","address":"Official address","verificationStatus":"VERIFIED",
                     "serviceCapability":{"serviceCode":"PAN_INSTANT_EPAN","verificationStatus":"VERIFIED"},
                     "source":{"sourceCode":"SRC-1","title":"Official directory","publisher":"Department","url":"https://example.gov.in/offices","verificationStatus":"VERIFIED","checkedAt":"2026-10-22"}},
                    {"officeCode":"UNVERIFIED","name":"Unverified Office","type":"Service Centre","district":"Chennai","address":"Unknown","verificationStatus":"UNVERIFIED",
                     "serviceCapability":{"serviceCode":"PAN_INSTANT_EPAN","verificationStatus":"VERIFIED"},
                     "source":{"sourceCode":"SRC-2","title":"Unknown","publisher":"Unknown","url":"https://example.gov.in/offices","verificationStatus":"UNVERIFIED","checkedAt":"2026-10-22"}}
                  ]
                }
                """);
        when(catalogueService.getService("PAN_INSTANT_EPAN")).thenReturn(record);

        var response = service.search("PAN_INSTANT_EPAN", "Chennai", null, null, null);

        assertEquals("VERIFIED", response.availabilityStatus());
        assertEquals(1, response.offices().size());
        assertEquals("ITD-1", response.offices().get(0).officeCode());
    }

    @Test
    void rejectsInvalidPinCode() {
        assertThrows(IllegalArgumentException.class,
                () -> service.search("PAN_INSTANT_EPAN", null, null, null, "123"));
    }

    @Test
    void rejectsInvalidServiceCodeBeforeContentLookup() {
        assertThrows(IllegalArgumentException.class,
                () -> service.search("../secret", null, null, null, null));
    }

    @Test
    void preservesUnknownServiceNotFoundContract() {
        when(catalogueService.getService("UNKNOWN"))
                .thenThrow(new NoSuchElementException("Service not found: UNKNOWN"));

        assertThrows(NoSuchElementException.class,
                () -> service.search("UNKNOWN", null, null, null, null));
    }
}
