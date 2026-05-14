package com.safealert.gateway.filter;

import lombok.RequiredArgsConstructor;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import java.time.Duration;

@Component
@RequiredArgsConstructor
public class RateLimitFilter implements GlobalFilter, Ordered {
    
    private static final int MAX_REQUESTS = 60;
    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final ReactiveStringRedisTemplate redisTemplate;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String ip = exchange.getRequest().getRemoteAddress().getAddress().getHostAddress();
        String key = "ratelimit:" + ip; 

        return redisTemplate.opsForValue().increment(key)
            .flatMap(count -> {
                if (count == 1) {
                    return redisTemplate.expire(key, WINDOW).then(Mono.just(count));
                }
                return Mono.just(count);
            })

            .flatMap(count -> {
                if(count > MAX_REQUESTS) {
                    exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                    return exchange.getResponse().setComplete();
                }
                return chain.filter(exchange);
            });
    }

    @Override
    public int getOrder() {
        return 0;
    }


}