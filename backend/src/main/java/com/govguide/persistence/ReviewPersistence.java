package com.govguide.persistence;

import java.util.List;

public interface ReviewPersistence {
    void save(ReviewRecord record);
    List<ReviewRecord> findAll();
    List<ReviewRecord> findByService(String serviceCode);
    boolean hasReview(String taskId, String username);
    long count();
}
