package com.safealert.subscription.scheduler;

import com.safealert.subscription.domain.OutboxEvent;
import com.safealert.subscription.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class OutboxScheduler {

    private final OutboxEventRepository outboxEventRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Value("${kafka.topic.subscription-events:subscription-events}")
    private String topic;

    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void publishPendingEvents() {
        List<OutboxEvent> pendingEvents =
                outboxEventRepository.findTop10ByStatusOrderByCreatedAtAsc("PENDING");

        for (OutboxEvent event : pendingEvents) {
            try {
                publish(event);
                event.markPublished();
            } catch (Exception e) {
                log.error("OutboxEvent 발행 실패: eventId={}", event.getEventId(), e);
                event.markFailed();
            }
        }
    }

    private void publish(OutboxEvent event) {
        kafkaTemplate.send(topic, event.getAggregateId().toString(), event.getPayload());
        log.info("Kafka 발행 완료: eventId={}, type={}, topic={}",
                event.getEventId(), event.getEventType(), topic);
    }
}