package com.govguide.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.govguide.dto.TaskResponse;
import com.govguide.service.ChecklistTaskService;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.context.annotation.Import;
import com.govguide.config.SecurityConfig;

@WebMvcTest(TaskController.class)
@Import(SecurityConfig.class)
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ChecklistTaskService taskService;

    @Test
    @WithMockUser(username = "test-user")
    void createTaskUsesApiEnvelope() throws Exception {
        org.mockito.Mockito.when(taskService.createTask(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.eq("test-user")))
                .thenReturn(new TaskResponse("task-1", "PAN_INSTANT_EPAN", "REVIEW", "LIMITED_ROUTE_CANDIDATE",
                        "PREPARING_DOCUMENTS", 0, 2, Map.of(), "IN_MEMORY_PROTOTYPE"));

        mockMvc.perform(post("/api/v1/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serviceCode\":\"PAN_INSTANT_EPAN\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"))
                .andExpect(jsonPath("$.data.serviceCode").value("PAN_INSTANT_EPAN"))
                .andExpect(jsonPath("$.data.publicationReadiness").value("LIMITED_ROUTE_CANDIDATE"));
    }

    @Test
    @WithMockUser(username = "test-user")
    void checklistUpdateRejectsUnsupportedState() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch(
                        "/api/v1/tasks/task-1/checklist-items/EPAN_REQ_VALID_AADHAAR")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"state\":\"APPROVED\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }
}
