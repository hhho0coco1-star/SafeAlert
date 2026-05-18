package com.safealert.processor.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.safealert.processor.model.ProcessedAlert;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProcessedAlertProducer {

    private static final String TOPIC = "alert.processed";
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void send(ProcessedAlert alert) {
        try {
            String json = objectMapper.writeValueAsString(alert);
            kafkaTemplate.send(TOPIC, alert.getSource(), json);
            log.info("[Kafka] alert.processed 전송 - source={}, severity={}", alert.getSource(), alert.getSeverity());
        } catch (Exception e) {
            log.error("[Kafka] 전송 실패 - {}", e.getMessage());
        }
    }
}
