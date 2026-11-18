package com.govguide.persistence;

import java.util.List;

public interface FeedbackPersistence {
    void save(FeedbackRecord record);
    List<FeedbackRecord> findAll();
    List<FeedbackRecord> findByService(String serviceCode);
    long count();
}
