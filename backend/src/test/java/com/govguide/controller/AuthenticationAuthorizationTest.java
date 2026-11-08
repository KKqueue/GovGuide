package com.govguide.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.govguide.dto.TaskResponse;
import com.govguide.config.SecurityConfig;
import com.govguide.service.ChecklistTaskService;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.context.annotation.Import;

@WebMvcTest(TaskController.class)
@Import(SecurityConfig.class)
class AuthenticationAuthorizationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ChecklistTaskService taskService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String alicePassword;
    private String bobPassword;

    @BeforeEach
    void configureUsers() {
        alicePassword = UUID.randomUUID().toString();
        bobPassword = UUID.randomUUID().toString();
        org.mockito.Mockito.when(userDetailsService.loadUserByUsername("alice"))
                .thenReturn(User.withUsername("alice").password(passwordEncoder.encode(alicePassword)).roles("USER").build());
        org.mockito.Mockito.when(userDetailsService.loadUserByUsername("bob"))
                .thenReturn(User.withUsername("bob").password(passwordEncoder.encode(bobPassword)).roles("USER").build());
    }

    @Test
    void unauthenticatedTaskAccessReturnsConsistent401() throws Exception {
        mockMvc.perform(get("/api/v1/tasks/task-1"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Authentication required"));
    }

    @Test
    void invalidCredentialsReturn401WithoutCredentialDisclosure() throws Exception {
        mockMvc.perform(get("/api/v1/tasks/task-1").with(httpBasic("alice", UUID.randomUUID().toString())))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Authentication required"));
    }

    @Test
    void validCredentialsCanCreatePrivateTask() throws Exception {
        org.mockito.Mockito.when(taskService.createTask(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.eq("alice")))
                .thenReturn(new TaskResponse("task-1", "PAN_INSTANT_EPAN", "REVIEW", "LIMITED_ROUTE_CANDIDATE",
                        "PREPARING_DOCUMENTS", 0, 2, Map.of(), "IN_MEMORY_PROTOTYPE"));

        mockMvc.perform(post("/api/v1/tasks")
                        .with(httpBasic("alice", alicePassword))
                        .contentType("application/json")
                        .content("{\"serviceCode\":\"PAN_INSTANT_EPAN\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.taskId").value("task-1"));
    }

    @Test
    void authenticatedUserCannotReadAnotherUsersTask() throws Exception {
        org.mockito.Mockito.when(taskService.getTask("alice-task", "bob"))
                .thenThrow(new java.util.NoSuchElementException("Task not found: alice-task"));

        mockMvc.perform(get("/api/v1/tasks/alice-task").with(httpBasic("bob", bobPassword)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Task not found: alice-task"));
    }
}
