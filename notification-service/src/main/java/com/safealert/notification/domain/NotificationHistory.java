package com.safealert.notification.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notification_history")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NotificationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "notification_id")
    private UUID notificationId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "alert_id")
    private UUID alertId;

    @Column(nullable = false, length = 30)
    private String category;

    @Column(nullable = false, length = 20)
    private String severity;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "region_code", length = 10)
    private String regionCode;

    @Column(length = 100)
    private String source;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "issued_at")
    private LocalDateTime issuedAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public static NotificationHistory create(UUID userId, String category, String title,
            String content, String regionCode, String source, String severity) {
        NotificationHistory h = new NotificationHistory();
        h.userId = userId;
        h.category = category;
        h.severity = severity != null ? severity : "MEDIUM";
        h.title = title;
        h.content = content;
        h.regionCode = regionCode;
        h.source = source;
        h.status = "SENT";
        h.issuedAt = LocalDateTime.now();
        h.sentAt = LocalDateTime.now();
        h.createdAt = LocalDateTime.now();
        return h;
    }
}
