package com.safealert.notification.dto;

import com.safealert.notification.domain.NotificationHistory;
import lombok.Getter;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
public class NotificationResponse {

    private final UUID id;
    private final String category;
    private final String title;
    private final String content;
    private final String region;
    private final String source;
    private final String severity;
    private final LocalDateTime createdAt;

    public NotificationResponse(NotificationHistory n) {
        this.id = n.getId();
        this.category = n.getCategory();
        this.title = n.getTitle();
        this.content = n.getContent();
        this.region = n.getRegion();
        this.source = n.getSource();
        this.severity = n.getSeverity();
        this.createdAt = n.getCreatedAt();
    }
}