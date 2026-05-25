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
import java.util.Set;
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

    private static final List<String> ALL_REGION_CODES = List.of(
        "11","26","27","28","29","30","31","36","41","42","43","44","45","46","47","48","50"
    );

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

            List<String> broadcastTargets;
            if ("전국".equals(region)) {
                broadcastTargets = ALL_REGION_CODES;
            } else if (region.length() == 5) {
                broadcastTargets = List.of(region, region.substring(0, 2));
            } else {
                broadcastTargets = List.of(region);
            }

            for (String code : broadcastTargets) {
                redisTemplate.convertAndSend("alert:broadcast:" + code, message);
            }
            
            // 전체 공개 피드 단일 발행 (TestPage용 — 중복 없이 1건)
            redisTemplate.convertAndSend("alert:public", message);

            // 공개 이력 저장 (recent API용, 구독자 유무 무관)
            historyRepository.save(NotificationHistory.create(null, category, title, content, region, source, severity));

            List<String> subscriberTargets = "전국".equals(region) ? ALL_REGION_CODES : List.of(region);
            Set<UUID> subscriberSet = new java.util.HashSet<>();
            for (String code : subscriberTargets) {
                subscriberSet.addAll(fetchSubscribers(code, category));
            }

            if (subscriberSet.isEmpty()) {
                log.info("알림 Push 완료 (구독자 없음) - region: {}, category: {}", region, category);
                return;
            }

            for (UUID userId : subscriberSet) {
                NotificationHistory history = NotificationHistory.create(
                        userId, category, title, content, region, source, severity);
                historyRepository.save(history);
            }

            log.info("알림 Push 완료 - region: {}, category: {}, 수신자: {}명", region, category, subscriberSet.size());
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