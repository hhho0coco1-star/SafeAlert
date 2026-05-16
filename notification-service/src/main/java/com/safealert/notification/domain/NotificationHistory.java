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
    private UUID id;

    // @GeneratedValue(strategy = GenerationType.UUID) 규칙에 의해 
    // 유저 테이블에 f81d4fae-... 라는 고유 UUID를 가진 유저가 탄생

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 20)
    private String category;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(length = 50)
    private String region;

    @Column(length = 100)
    private String source;

    @Column(length = 10)
    private String severity;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public static NotificationHistory create(UUID userId, String category, String title,
            String content, String region, String source, String severity) {
        NotificationHistory h = new NotificationHistory();
        h.userId = userId;
        h.category = category;
        h.title = title;
        h.content = content;
        h.region = region;
        h.source = source;
        h.severity = severity;
        h.createdAt = LocalDateTime.now();
        return h;
    }
}