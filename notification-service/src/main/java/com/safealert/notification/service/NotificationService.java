package com.safealert.notification.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.safealert.notification.domain.NotificationHistory;
import com.safealert.notification.dto.*;
import com.safealert.notification.repository.NotificationHistoryRepository;
import com.safealert.notification.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationHistoryRepository repository;
    private final JwtProvider jwtProvider;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(
            String accessToken, String category,
            int page, int size,
            String startDate, String endDate, String keyword) {

        UUID userId = jwtProvider.getUserId(accessToken);

        LocalDateTime start = (startDate != null && !startDate.isBlank())
                ? LocalDate.parse(startDate).atStartOfDay() : null;
        LocalDateTime end = (endDate != null && !endDate.isBlank())
                ? LocalDate.parse(endDate).atTime(23, 59, 59) : null;
        String cat = (category != null && !category.isBlank()) ? category : null;
        String kw = (keyword != null && !keyword.isBlank()) ? keyword : null;

        return repository.findByFilters(userId, cat, start, end, kw, PageRequest.of(page, size))
                .map(NotificationResponse::new);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getRecentAlerts() {
        return repository.findTop8ByOrderByCreatedAtDesc()
                .stream()
                .map(NotificationResponse::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminStatsResponse getAdminStats(String accessToken) {
        validateAdmin(accessToken);
        long totalSent = repository.count();
        long todaySent = repository.countByCreatedAtBetween(
                LocalDate.now().atStartOfDay(),
                LocalDate.now().atTime(23, 59, 59));
        return new AdminStatsResponse(0L, todaySent, totalSent, 0L);
    }

    @Transactional(readOnly = true)
    public List<AdminAlertResponse> getAdminAlerts(String accessToken) {
        validateAdmin(accessToken);
        return repository.findTop7ByOrderByCreatedAtDesc()
                .stream()
                .map(n -> new AdminAlertResponse(n, 1L))
                .toList();
    }

    @Transactional
    public void sendManualAlert(String accessToken, ManualAlertRequest request) {
        validateAdmin(accessToken);
        String source = request.getSource() != null ? request.getSource() : "관리자";

        for (String region : request.getTargetRegions()) {
            NotificationHistory h = NotificationHistory.create(
                    null, request.getCategory(), request.getTitle(),
                    request.getContent(), region, source, request.getSeverity());
            repository.save(h);

            try {
                String payload = objectMapper.writeValueAsString(Map.of(
                        "notificationId", h.getNotificationId().toString(),
                        "title",          request.getTitle(),
                        "content",        request.getContent(),
                        "category",       request.getCategory(),
                        "severity",       h.getSeverity(),
                        "source",         source,
                        "region",         region,
                        "createdAt",      h.getCreatedAt().toString()
                ));
                redisTemplate.convertAndSend("alert:broadcast:" + region, payload);
                log.info("수동 알림 Push - region: {}, title: {}", region, request.getTitle());
            } catch (Exception e) {
                log.error("수동 알림 Redis 발행 실패 - region: {}, error: {}", region, e.getMessage());
            }
        }
    }

    private void validateAdmin(String accessToken) {
        jwtProvider.getUserId(accessToken);
    }
}