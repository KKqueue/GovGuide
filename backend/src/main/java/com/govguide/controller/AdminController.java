package com.govguide.controller;

import com.govguide.dto.ApiResponse;
import com.govguide.persistence.FeedbackPersistence;
import com.govguide.persistence.FeedbackRecord;
import com.govguide.persistence.FileBackedUserDetailsManager;
import com.govguide.persistence.ReviewPersistence;
import com.govguide.persistence.ReviewRecord;
import com.govguide.persistence.TaskPersistence;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final FileBackedUserDetailsManager userManager;
    private final TaskPersistence taskPersistence;
    private final FeedbackPersistence feedbackPersistence;
    private final ReviewPersistence reviewPersistence;

    public AdminController(FileBackedUserDetailsManager userManager,
                           TaskPersistence taskPersistence,
                           FeedbackPersistence feedbackPersistence,
                           ReviewPersistence reviewPersistence) {
        this.userManager = userManager;
        this.taskPersistence = taskPersistence;
        this.feedbackPersistence = feedbackPersistence;
        this.reviewPersistence = reviewPersistence;
    }

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> stats() {
        var tasks = taskPersistence.findAllRecords();
        var feedback = feedbackPersistence.findAll();
        var reviews = reviewPersistence.findAll();

        long totalUsers = userManager.getUserCount();
        long totalTasks = tasks.size();
        long completedTasks = tasks.stream().filter(t -> "READY_TO_APPLY".equals(t.status())).count();
        double avgRating = reviews.stream().mapToInt(ReviewRecord::rating).average().orElse(0);

        Map<String, Long> serviceUsage = tasks.stream()
                .collect(Collectors.groupingBy(t -> t.serviceCode(), Collectors.counting()));
        List<Map<String, Object>> topServices = serviceUsage.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(20)
                .map(e -> Map.<String, Object>of("serviceCode", e.getKey(), "taskCount", e.getValue()))
                .toList();

        Map<String, Long> feedbackByType = feedback.stream()
                .collect(Collectors.groupingBy(FeedbackRecord::type, Collectors.counting()));

        Map<String, Long> feedbackByService = feedback.stream()
                .collect(Collectors.groupingBy(FeedbackRecord::serviceCode, Collectors.counting()));
        List<Map<String, Object>> topFeedbackServices = feedbackByService.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .map(e -> Map.<String, Object>of("serviceCode", e.getKey(), "feedbackCount", e.getValue()))
                .toList();

        Map<String, Long> dailyTasks = tasks.stream()
                .collect(Collectors.groupingBy(t -> {
                    long ts = t.revision();
                    if (ts < 1_000_000_000_000L) return "unknown";
                    return LocalDate.ofInstant(Instant.ofEpochMilli(ts), ZoneId.systemDefault()).toString();
                }, Collectors.counting()));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalUsers", totalUsers);
        result.put("totalTasks", totalTasks);
        result.put("completedTasks", completedTasks);
        result.put("totalFeedback", feedback.size());
        result.put("totalReviews", reviews.size());
        result.put("averageRating", Math.round(avgRating * 10) / 10.0);
        result.put("topServices", topServices);
        result.put("feedbackByType", feedbackByType);
        result.put("topFeedbackServices", topFeedbackServices);

        return ApiResponse.ok(result);
    }

    @GetMapping("/users")
    public ApiResponse<Object> users() {
        return ApiResponse.ok(Map.of("users", userManager.getAllUsernames(), "total", userManager.getUserCount()));
    }

    @GetMapping("/feedback")
    public ApiResponse<Object> feedback() {
        var all = feedbackPersistence.findAll();
        var sorted = all.stream()
                .sorted(Comparator.comparingLong(FeedbackRecord::timestamp).reversed())
                .toList();
        return ApiResponse.ok(Map.of("feedback", sorted, "total", sorted.size()));
    }

    @GetMapping("/reviews")
    public ApiResponse<Object> reviews() {
        var all = reviewPersistence.findAll();
        var sorted = all.stream()
                .sorted(Comparator.comparingLong(ReviewRecord::timestamp).reversed())
                .toList();
        double avg = all.stream().mapToInt(ReviewRecord::rating).average().orElse(0);
        Map<Integer, Long> distribution = all.stream()
                .collect(Collectors.groupingBy(ReviewRecord::rating, Collectors.counting()));
        return ApiResponse.ok(Map.of("reviews", sorted, "total", sorted.size(),
                "averageRating", Math.round(avg * 10) / 10.0, "distribution", distribution));
    }
}
