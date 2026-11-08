package com.govguide.controller;

import com.govguide.dto.ApiResponse;
import com.govguide.dto.ChecklistUpdateRequest;
import com.govguide.dto.CreateChildTaskRequest;
import com.govguide.dto.CreateTaskRequest;
import com.govguide.dto.TaskResponse;
import com.govguide.service.ChecklistTaskService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/v1/tasks")
public class TaskController {

    private final ChecklistTaskService taskService;

    public TaskController(ChecklistTaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping
    public ApiResponse<TaskResponse> createTask(Authentication authentication, @Valid @RequestBody CreateTaskRequest request) {
        return ApiResponse.ok(taskService.createTask(request, authentication.getName()));
    }

    @PostMapping("/{taskId}/children")
    public ApiResponse<TaskResponse> createChildTask(
            @PathVariable String taskId,
            Authentication authentication,
            @Valid @RequestBody CreateChildTaskRequest request) {
        return ApiResponse.ok(taskService.createChildTask(taskId, request, authentication.getName()));
    }

    @GetMapping("/{taskId}")
    public ApiResponse<TaskResponse> getTask(@PathVariable String taskId, Authentication authentication) {
        return ApiResponse.ok(taskService.getTask(taskId, authentication.getName()));
    }

    @GetMapping("/{taskId}/parent")
    public ApiResponse<TaskResponse> getParentTask(@PathVariable String taskId, Authentication authentication) {
        return ApiResponse.ok(taskService.getParentTask(taskId, authentication.getName()));
    }

    @PatchMapping("/{taskId}/checklist-items/{itemId}")
    public ApiResponse<TaskResponse> updateChecklist(
            @PathVariable String taskId,
            @PathVariable String itemId,
            Authentication authentication,
            @Valid @RequestBody ChecklistUpdateRequest request) {
        return ApiResponse.ok(taskService.updateChecklist(taskId, itemId, request, authentication.getName()));
    }
}
