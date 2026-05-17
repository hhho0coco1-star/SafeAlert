package com.safealert.collector.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.safealert.collector.model.AlertRawMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertKafkaProducer {

    private static final String TOPIC = "alert.raw"; // 상수 선언

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void send(AlertRawMessage message) {
        try {
            String json = objectMapper.writeValueAsString(message);
            kafkaTemplate.send(TOPIC, message.getSource(), json);
            log.info("[Kafka] 전송 완료 - source={}, title={}", message.getSource(), message.getTitle());
        } catch (Exception e) {
            log.error("[Kafka] 전송 실패 - {}", e.getMessage());
        }

    }
}