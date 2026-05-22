package com.safealert.notification.redis;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AlertPublicSubscriber implements MessageListener {

    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String payload = new String(message.getBody());
            messagingTemplate.convertAndSend("/topic/public/alerts", payload);
            log.info("Redis → WebSocket Push (public)");
        } catch (Exception e) {
            log.error("공개 채널 메시지 처리 실패: {}", e.getMessage());
        }
    }
}
