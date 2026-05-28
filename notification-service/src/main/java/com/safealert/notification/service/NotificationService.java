package com.safealert.notification.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.safealert.notification.domain.NotificationHistory;
import com.safealert.notification.dto.*;
import com.safealert.notification.repository.NotificationHistoryRepository;
import com.safealert.notification.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationHistoryRepository repository;
    private final JwtProvider jwtProvider;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @Value("${subscription.service.url}")
    private String subscriptionServiceUrl;

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(
            String accessToken, String category,
            int page, int size,
            String startDate, String endDate, String keyword) {

        UUID userId = jwtProvider.getUserId(accessToken);

        LocalDateTime start = (startDate != null && !startDate.isBlank())
                ? LocalDate.parse(startDate).atStartOfDay() : LocalDateTime.of(1970, 1, 1, 0, 0);
        LocalDateTime end = (endDate != null && !endDate.isBlank())
                ? LocalDate.parse(endDate).atTime(23, 59, 59) : LocalDateTime.of(9999, 12, 31, 23, 59, 59);
        String cat = (category != null && !category.isBlank()) ? category : "";
        String kw = (keyword != null && !keyword.isBlank()) ? keyword : "";

        return repository.findByFilters(userId, cat, start, end, kw, PageRequest.of(page, size))
                .map(NotificationResponse::new);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getRecentAlerts() {
        return repository.findTop300ByUserIdIsNullOrderByCreatedAtDesc()
                .stream()
                .map(NotificationResponse::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public NotificationSummaryResponse getSummary(String accessToken) {
        UUID userId = jwtProvider.getUserId(accessToken);
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = start.plusDays(1);
        long total    = repository.countByUserIdAndCreatedAtBetween(userId, start, end);
        long weather   = repository.countTodayByUserIdAndCategory(userId, "WEATHER",    start, end);
        long earthquake = repository.countTodayByUserIdAndCategory(userId, "EARTHQUAKE", start, end);
        long dust      = repository.countTodayByUserIdAndCategory(userId, "DUST",       start, end);
        long disaster  = repository.countTodayByUserIdAndCategory(userId, "DISASTER",   start, end);
        return new NotificationSummaryResponse(total, weather, earthquake, dust, disaster);
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
        return repository.findTop7ByUserIdIsNullOrderByCreatedAtDesc()
                .stream()
                .map(n -> {
                    long count = repository.countByUserIdIsNotNullAndTitleAndCreatedAtBetween(
                            n.getTitle(),
                            n.getCreatedAt().minusSeconds(5),
                            n.getCreatedAt().plusSeconds(30));
                    return new AdminAlertResponse(n, count);
                })
                .toList();
    }

    @Transactional
    public void sendManualAlert(String accessToken, ManualAlertRequest request) {
        validateAdmin(accessToken);
        String source = request.getSource() != null ? request.getSource() : "관리자";
        String regionLabel = request.getTargetRegions().size() > 1 ? "전국" : request.getTargetRegions().get(0);

        // 공개 브로드캐스트 레코드 1건 저장 (실시간 피드용)
        NotificationHistory publicRecord = NotificationHistory.create(
                null, request.getCategory(), request.getTitle(),
                request.getContent(), regionLabel, source, request.getSeverity());
        repository.save(publicRecord);

        // 각 지역별 Redis Pub/Sub 발행 (실시간 WebSocket용)
        try {
            String payload = objectMapper.writeValueAsString(Map.of(
                    "notificationId", publicRecord.getNotificationId().toString(),
                    "title",          request.getTitle(),
                    "content",        request.getContent(),
                    "category",       request.getCategory(),
                    "severity",       publicRecord.getSeverity(),
                    "source",         source,
                    "region",         regionLabel,
                    "createdAt",      publicRecord.getCreatedAt().toString()
            ));
            for (String region : request.getTargetRegions()) {
                redisTemplate.convertAndSend("alert:broadcast:" + region, payload);
            }
            redisTemplate.convertAndSend("alert:public", payload);
        } catch (Exception e) {
            log.error("수동 알림 Redis 발행 실패: {}", e.getMessage());
        }

        // 구독자 조회 (지역 기준, 카테고리 무관) 및 사용자별 이력 생성
        Set<UUID> subscriberSet = new HashSet<>();
        for (String region : request.getTargetRegions()) {
            subscriberSet.addAll(fetchSubscribersByRegion(region));
        }

        if (subscriberSet.isEmpty()) {
            log.info("수동 알림 발송 완료 (구독자 없음) - regions: {}", request.getTargetRegions());
            return;
        }

        for (UUID userId : subscriberSet) {
            repository.save(NotificationHistory.create(
                    userId, request.getCategory(), request.getTitle(),
                    request.getContent(), regionLabel, source, request.getSeverity()));
        }
        log.info("수동 알림 발송 완료 - regions: {}, 수신자: {}명", request.getTargetRegions(), subscriberSet.size());
    }

    private List<UUID> fetchSubscribersByRegion(String regionCode) {
        try {
            String url = subscriptionServiceUrl + "/api/subscriptions/subscribers/by-region?regionCode=" + regionCode;
            JsonNode body = restTemplate.getForObject(url, JsonNode.class);
            if (body == null) return Collections.emptyList();
            JsonNode userIds = body.path("data").path("userIds");
            if (!userIds.isArray()) return Collections.emptyList();
            List<UUID> result = new java.util.ArrayList<>();
            for (JsonNode id : userIds) result.add(UUID.fromString(id.asText()));
            return result;
        } catch (Exception e) {
            log.warn("구독자 조회 실패 (region={}): {}", regionCode, e.getMessage());
            return Collections.emptyList();
        }
    }

    private void validateAdmin(String accessToken) {
        jwtProvider.getUserId(accessToken);
    }
}