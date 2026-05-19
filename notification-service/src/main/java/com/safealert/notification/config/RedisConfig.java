package com.safealert.notification.config;

import com.safealert.notification.redis.AlertRedisSubscriber;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;
import org.springframework.web.client.RestTemplate;

@Configuration
@RequiredArgsConstructor
public class RedisConfig {

    private final AlertRedisSubscriber alertRedisSubscriber;

    @Bean
    public RedisMessageListenerContainer redisContainer(RedisConnectionFactory factory) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(factory);
        // "alert:broadcast:*" 패턴으로 모든 지역 채널 구독
        container.addMessageListener(
                new MessageListenerAdapter(alertRedisSubscriber, "onMessage"),
                new PatternTopic("alert:broadcast:*")
        );
        return container;
    }

    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory factory) {
        return new StringRedisTemplate(factory);
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}