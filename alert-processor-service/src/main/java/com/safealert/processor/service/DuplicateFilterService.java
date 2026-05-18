package com.safealert.processor.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Slf4j // log 기록
@Service
@RequiredArgsConstructor
public class DuplicateFilterService {

    private final StringRedisTemplate redisTemplate;
    private static final String KEY_PREFIX = "processed:seen:";
    private static final Duration TTL = Duration.ofHours(24);

    public boolean isDuplicate(String source, String title, String issuedAt) {
        String key = KEY_PREFIX + source + ":" + title + ":" + issuedAt;
        Boolean isNew = redisTemplate.opsForValue().setIfAbsent(key, "1", TTL);
        if (Boolean.TRUE.equals(isNew)) {
            log.info("[중복필터] 신규 처리 - key={}", key);
            return false;
        }
        log.info("[중복필터] 중복 건너뜀 - key={}", key);
        return true;
    }
}
