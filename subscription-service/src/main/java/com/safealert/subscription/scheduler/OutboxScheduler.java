package com.safealert.subscription.scheduler;

import com.safealert.subscription.domain.OutboxEvent;
import com.safealert.subscription.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class OutboxScheduler {

    private final OutboxEventRepository outboxEventRepository;

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
        // 1-C-6에서 Kafka Producer 연동
        log.info("OutboxEvent 발행 대기: eventId={}, type={}", event.getEventId(), event.getEventType());
    }
}