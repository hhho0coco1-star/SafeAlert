package com.safealert.notification.kafka;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.safealert.notification.domain.NotificationHistory;
import com.safealert.notification.repository.NotificationHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertProcessedConsumer {

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationHistoryRepository historyRepository;
    private final ObjectMapper objectMapper;

    // @KafkaListener : Apache Kafka 토픽에 쌓이는 메시지를 실시간으로 
    // 구독(Consume)하여 처리하는 리스너(소비자)를 만들 때 사용
    // topics = "alert.processed" -> 구독할 토픽의 이름
    // groupId = "notification-group" -> 알림 그룹
    @KafkaListener(topics = "alert.processed", groupId = "notification-group")
    public void consume(String message) {
        try {
            JsonNode root = objectMapper.readTree(message);
            String region = root.path("region").asText();
            String title = root.path("title").asText();
            String content = root.path("content").asText();
            String severity = root.path("severity").asText();
            String source = root.path("source").asText();

            messagingTemplate.convertAndSend("/topic/alerts/" + region, message);
            // 구독 사용자에게 실시간 알림 전송

            NotificationHistory history = NotificationHistory.create(
                    null, source, title, content, region, source, severity);
            historyRepository.save(history);

            log.info("알림 Push 완료 - region: {}, title: {}", region, title);
        } catch (Exception e) {
            log.error("알림 처리 실패: {}", e.getMessage());
        }
    }
}