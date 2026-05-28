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
import java.util.ArrayList;

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
        // PENDING 이벤트 발행
        List<OutboxEvent> pendingEvents =
                outboxEventRepository.findTop10ByStatusOrderByCreatedAtAsc("PENDING");

        // FAILED 상태 중 아직 3회 미만 실패한 이벤트도 재시도 대상에 포함
        List<OutboxEvent> failedEvents =
                outboxEventRepository.findTop10ByStatusAndRetryCountLessThanOrderByCreatedAtAsc("FAILED", 3);

        // PENDING + FAILED 합쳐서 한 번에 처리
        List<OutboxEvent> targets = new ArrayList<>(pendingEvents);
        targets.addAll(failedEvents);

        for (OutboxEvent event : targets) {
            try {
                publish(event);
                event.markPublished();
            } catch (Exception e) {
                // retryCount 증가 → 3회 초과 시 markFailed() 내부에서 DEAD로 전환
                log.error("OutboxEvent 발행 실패: eventId={}, retryCount={}",
                        event.getEventId(), event.getRetryCount(), e);
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