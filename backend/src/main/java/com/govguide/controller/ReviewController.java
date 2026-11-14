package com.govguide.controller;

import com.govguide.dto.ApiResponse;
import com.govguide.persistence.ReviewPersistence;
import com.govguide.persistence.ReviewRecord;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/reviews")
public class ReviewController {

    private final ReviewPersistence persistence;

    public ReviewController(ReviewPersistence persistence) {
        this.persistence = persistence;
    }

    public record ReviewRequest(
            @NotBlank String serviceCode,
            @NotBlank String taskId,
            @Min(1) @Max(5) int rating,
            @NotBlank @Size(max = 2000) String message) {}

    @PostMapping
    public ApiResponse<Map<String, Object>> submit(Authentication auth, @Valid @RequestBody ReviewRequest request) {
        if (persistence.hasReview(request.taskId(), auth.getName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Review already submitted for this task");
        }
        ReviewRecord record = new ReviewRecord(
                UUID.randomUUID().toString(),
                request.serviceCode().toUpperCase(),
                request.taskId(),
                auth.getName(),
                request.rating(),
                request.message(),
                System.currentTimeMillis());
        persistence.save(record);
        return ApiResponse.ok(Map.of("id", record.id(), "submitted", true));
    }

    @GetMapping("/service/{serviceCode}")
    public ApiResponse<Object> byService(@PathVariable String serviceCode) {
        var list = persistence.findByService(serviceCode.toUpperCase());
        double avg = list.stream().mapToInt(ReviewRecord::rating).average().orElse(0);
        return ApiResponse.ok(Map.of("reviews", list, "count", list.size(), "averageRating", Math.round(avg * 10) / 10.0));
    }

    @GetMapping("/check/{taskId}")
    public ApiResponse<Map<String, Boolean>> check(@PathVariable String taskId, Authentication auth) {
        return ApiResponse.ok(Map.of("reviewed", persistence.hasReview(taskId, auth.getName())));
    }
}
