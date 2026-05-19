package com.safealert.notification.redis;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Slf4j // log
@Component
@RequiredArgsConstructor
public class AlertRedisSubscriber implements MessageListener {

    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String payload = new String(message.getBody());
            String channel = new String(message.getChannel());
            String region = channel.replace("alert:broadcast:", "");
            messagingTemplate.convertAndSend("/topic/alerts/" + region, payload);
            log.info("Redis → WebSocket Push - region: {}", region);
        } catch (Exception e) {
            log.error("Redis 메시지 처리 실패: {}", e.getMessage());
        }
    }
}