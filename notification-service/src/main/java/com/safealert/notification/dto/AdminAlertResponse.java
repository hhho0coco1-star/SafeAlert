package com.safealert.notification.dto;

import com.safealert.notification.domain.NotificationHistory;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
public class AdminAlertResponse {

    private final String category;
    private final String title;
    private final String region;
    private final LocalDateTime createdAt;
    private final long recipientCount;

    public AdminAlertResponse(NotificationHistory n, long recipientCount) {
        this.category = n.getCategory();
        this.title = n.getTitle();
        this.region = n.getRegion();
        this.createdAt = n.getCreatedAt();
        this.recipientCount = recipientCount;
    }
}