package com.safealert.gateway.filter;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import java.time.Duration;

@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitFilter implements GlobalFilter, Ordered {
    
    private static final int MAX_REQUESTS = 60;
    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final ReactiveStringRedisTemplate redisTemplate;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        var remoteAddress = exchange.getRequest().getRemoteAddress();
        String ip = remoteAddress != null ? remoteAddress.getAddress().getHostAddress() : "unknown";

        // 로컬 부하 테스트 시 Rate Limiting 스킵 (localhost IPv4/IPv6)
        if (ip.equals("127.0.0.1") || ip.equals("0:0:0:0:0:0:0:1")) {
            return chain.filter(exchange);
        }

        String key = "ratelimit:" + ip;

        return redisTemplate.opsForValue().increment(key)
            .flatMap(count -> {
                if (count == 1) {
                    return redisTemplate.expire(key, WINDOW).then(Mono.just(count));
                }
                return Mono.just(count);
            })
            .flatMap(count -> {
                if (count > MAX_REQUESTS) {
                    exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                    return exchange.getResponse().setComplete();
                }
                return chain.filter(exchange);
            })
            .onErrorResume(e -> {
                log.warn("[RateLimit] Redis 연결 실패 — Rate Limiting 비활성화: {}", e.getMessage());
                return chain.filter(exchange);
            });
    }

    @Override
    public int getOrder() {
        return 0;
    }


}