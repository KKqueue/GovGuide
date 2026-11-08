package com.govguide.controller;

import com.govguide.dto.ApiResponse;
import com.govguide.dto.ApplicationTrackingResponse;
import com.govguide.dto.CreateApplicationTrackingRequest;
import com.govguide.dto.UpdateApplicationTrackingRequest;
import com.govguide.service.ApplicationTrackingService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ApplicationTrackingController {
    private final ApplicationTrackingService trackingService;

    public ApplicationTrackingController(ApplicationTrackingService trackingService) {
        this.trackingService = trackingService;
    }

    @PostMapping("/applications")
    public ApiResponse<ApplicationTrackingResponse> create(Authentication authentication,
            @Valid @RequestBody CreateApplicationTrackingRequest request) {
        return ApiResponse.ok(trackingService.create(request, authentication.getName()));
    }

    @GetMapping("/applications/{applicationId}")
    public ApiResponse<ApplicationTrackingResponse> get(@PathVariable String applicationId, Authentication authentication) {
        return ApiResponse.ok(trackingService.get(applicationId, authentication.getName()));
    }

    @PatchMapping("/applications/{applicationId}")
    public ApiResponse<ApplicationTrackingResponse> update(@PathVariable String applicationId,
            Authentication authentication, @Valid @RequestBody UpdateApplicationTrackingRequest request) {
        return ApiResponse.ok(trackingService.update(applicationId, request, authentication.getName()));
    }

    @GetMapping("/tasks/{taskId}/application")
    public ApiResponse<ApplicationTrackingResponse> getForTask(@PathVariable String taskId, Authentication authentication) {
        return ApiResponse.ok(trackingService.getForTask(taskId, authentication.getName()));
    }
}
