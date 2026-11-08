package com.govguide.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.govguide.config.SecurityConfig;
import com.govguide.dto.ApplicationTrackingResponse;
import com.govguide.service.ApplicationTrackingService;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ApplicationTrackingController.class)
@Import(SecurityConfig.class)
class ApplicationTrackingControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ApplicationTrackingService trackingService;

    @Test
    void trackingCreationRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/v1/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"taskId\":\"task-1\",\"status\":\"PLANNING\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "alice")
    void trackingCreationUsesAuthenticatedOwnerAndEnvelope() throws Exception {
        org.mockito.Mockito.when(trackingService.create(any(), eq("alice")))
                .thenReturn(new ApplicationTrackingResponse("application-1", "task-1", "PAN_INSTANT_EPAN",
                        "PLANNING", null, null, null, null, null, "UNAVAILABLE", "IN_MEMORY_PROTOTYPE"));

        mockMvc.perform(post("/api/v1/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"taskId\":\"task-1\",\"status\":\"PLANNING\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"))
                .andExpect(jsonPath("$.data.applicationId").value("application-1"))
                .andExpect(jsonPath("$.data.persistence").value("IN_MEMORY_PROTOTYPE"));
    }

    @Test
    @WithMockUser(username = "alice")
    void malformedDateReturnsClientError() throws Exception {
        mockMvc.perform(post("/api/v1/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"taskId\":\"task-1\",\"status\":\"PLANNING\",\"submissionDate\":\"not-a-date\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @WithMockUser(username = "alice")
    void updateUsesAuthenticatedOwner() throws Exception {
        org.mockito.Mockito.when(trackingService.update(eq("application-1"), any(), eq("alice")))
                .thenReturn(new ApplicationTrackingResponse("application-1", "task-1", "PAN_INSTANT_EPAN",
                        "SUBMITTED", LocalDate.of(2026, 1, 10), null, null, "Submitted", null,
                        "UNAVAILABLE", "IN_MEMORY_PROTOTYPE"));

        mockMvc.perform(patch("/api/v1/applications/application-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SUBMITTED\",\"submissionDate\":\"2026-01-10\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SUBMITTED"));
    }
}
