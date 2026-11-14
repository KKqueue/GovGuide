package com.govguide.controller;

import com.govguide.dto.ApiResponse;
import com.govguide.persistence.FeedbackPersistence;
import com.govguide.persistence.FeedbackRecord;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/feedback")
public class FeedbackController {

    private final FeedbackPersistence persistence;

    public FeedbackController(FeedbackPersistence persistence) {
        this.persistence = persistence;
    }

    public record FeedbackRequest(
            @NotBlank String serviceCode,
            @NotBlank @Size(max = 50) String type,
            @NotBlank @Size(max = 2000) String message) {}

    @PostMapping
    public ApiResponse<Map<String, Object>> submit(Authentication auth, @Valid @RequestBody FeedbackRequest request) {
        FeedbackRecord record = new FeedbackRecord(
                UUID.randomUUID().toString(),
                request.serviceCode().toUpperCase(),
                auth.getName(),
                request.type(),
                request.message(),
                System.currentTimeMillis());
        persistence.save(record);
        return ApiResponse.ok(Map.of("id", record.id(), "submitted", true));
    }

    @GetMapping("/service/{serviceCode}")
    public ApiResponse<Object> byService(@PathVariable String serviceCode) {
        var list = persistence.findByService(serviceCode.toUpperCase());
        return ApiResponse.ok(Map.of("feedback", list, "count", list.size()));
    }
}
