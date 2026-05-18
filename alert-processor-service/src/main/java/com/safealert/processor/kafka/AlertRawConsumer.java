package com.safealert.processor.kafka;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.safealert.processor.model.ProcessedAlert;
import com.safealert.processor.repository.ProcessedAlertRepository;
import com.safealert.processor.service.AlertClassifierService;
import com.safealert.processor.service.DuplicateFilterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class AlertRawConsumer {

    private final ObjectMapper objectMapper;
    private final DuplicateFilterService duplicateFilter;
    private final AlertClassifierService classifier;
    private final ProcessedAlertRepository repository;
    private final ProcessedAlertProducer producer;

    // @KafkaListener : "Apache Kafka의 alert.raw 토픽으로 들어오는 실시간 메시지를 
    // alert-processor-group이라는 서버 그룹이 분산·병렬 처리하도록 자동으로 
    // 잡아 채주는 실시간 구독(Consume) 엔진
    @KafkaListener(topics = "alert.raw", groupId = "alert-processor-group") 
    public void consume(String message) {
        try {
            JsonNode root = objectMapper.readTree(message);

            String source = root.path("source").asText();
            String title = root.path("title").asText();
            String content = root.path("content").asText();
            String region = root.path("region").asText();
            String issuedAt = root.path("issuedAt").asText();

            log.info("[Consumer] 메시지 수신 - source={}, title={}", source, title);

            if (duplicateFilter.isDuplicate(source, title, issuedAt)) {
                return;
            }

            String severity = classifier.classifySeverity(source, content);

            ProcessedAlert alert = ProcessedAlert.builder()
                    .source(source)
                    .category(source)
                    .title(title)
                    .content(content)
                    .region(region)
                    .severity(severity)
                    .issuedAt(issuedAt)
                    .processedAt(LocalDateTime.now())
                    .build();

            repository.save(alert);
            log.info("[Consumer] MongoDB 저장 완료 - severity={}", severity);

            producer.send(alert);

        } catch (Exception e) {
            log.error("[Consumer] 처리 실패 - {}", e.getMessage());
        }
    }
}
