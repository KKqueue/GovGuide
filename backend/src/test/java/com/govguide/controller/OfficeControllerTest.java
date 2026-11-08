package com.govguide.controller;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.govguide.dto.OfficeSearchResponse;
import com.govguide.config.SecurityConfig;
import com.govguide.service.OfficeDiscoveryService;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(OfficeController.class)
@Import({SecurityConfig.class, com.govguide.exception.GlobalExceptionHandler.class})
class OfficeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private OfficeDiscoveryService officeDiscoveryService;

    @Test
    void returnsOfficeSearchResponseWithoutAuthentication() throws Exception {
        when(officeDiscoveryService.search(eq("PAN_INSTANT_EPAN"), eq("Chennai"), eq(null), eq(null), eq(null)))
                .thenReturn(new OfficeSearchResponse("PAN_INSTANT_EPAN", "MANUAL", Map.of("district", "Chennai"),
                        "UNAVAILABLE", "No verified office information is available for this service and selection.", List.of()));

        mockMvc.perform(get("/api/v1/offices")
                        .param("serviceId", "PAN_INSTANT_EPAN")
                        .param("district", "Chennai"))
                .andExpect(status().isOk());
    }

    @Test
    void rejectsInvalidPinCode() throws Exception {
        when(officeDiscoveryService.search(eq("PAN_INSTANT_EPAN"), eq(null), eq(null), eq(null), eq("123")))
                .thenThrow(new IllegalArgumentException("pinCode must contain exactly 6 digits"));
        mockMvc.perform(get("/api/v1/offices")
                        .param("serviceId", "PAN_INSTANT_EPAN")
                        .param("pinCode", "123"))
                .andExpect(status().isBadRequest());
    }
}
