package com.safealert.notification.kafka;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.safealert.notification.domain.NotificationHistory;
import com.safealert.notification.repository.NotificationHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertProcessedConsumer {

    private final StringRedisTemplate redisTemplate;
    private final NotificationHistoryRepository historyRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @Value("${subscription.service.url}")
    private String subscriptionServiceUrl;

    @KafkaListener(topics = "alert.processed", groupId = "notification-group")
    public void consume(String message) {
        try {
            JsonNode root = objectMapper.readTree(message);
            String region   = root.path("region").asText();
            String category = root.path("category").asText();
            String title    = root.path("title").asText();
            String content  = root.path("content").asText();
            String severity = root.path("severity").asText();
            String source   = root.path("source").asText();

            // Redis Pub/Sub으로 WebSocket push (AlertRedisSubscriber가 수신)
            redisTemplate.convertAndSend("alert:broadcast:" + region, message);

            // 해당 지역+카테고리 구독자 조회 후 이력 저장
            List<UUID> subscribers = fetchSubscribers(region, category);
            if (subscribers.isEmpty()) {
                // 구독자 없으면 로그만 남기고 종료
                log.info("알림 Push 완료 (구독자 없음) - region: {}, category: {}", region, category);
                return;
            }

            for (UUID userId : subscribers) {
                NotificationHistory history = NotificationHistory.create(
                        userId, category, title, content, region, source, severity);
                historyRepository.save(history);
            }

            log.info("알림 Push 완료 - region: {}, category: {}, 수신자: {}명", region, category, subscribers.size());
        } catch (Exception e) {
            log.error("알림 처리 실패: {}", e.getMessage());
        }
    }

    private List<UUID> fetchSubscribers(String regionCode, String category) {
        try {
            String url = subscriptionServiceUrl + "/api/subscriptions/subscribers"
                    + "?regionCode=" + regionCode + "&category=" + category;
            JsonNode body = restTemplate.getForObject(url, JsonNode.class);
            if (body == null) return Collections.emptyList();

            JsonNode userIds = body.path("data").path("userIds");
            if (!userIds.isArray()) return Collections.emptyList();

            List<UUID> result = new java.util.ArrayList<>();
            for (JsonNode id : userIds) {
                result.add(UUID.fromString(id.asText()));
            }
            return result;
        } catch (Exception e) {
            log.warn("구독자 조회 실패 (region={}, category={}): {}", regionCode, category, e.getMessage());
            return Collections.emptyList();
        }
    }
}