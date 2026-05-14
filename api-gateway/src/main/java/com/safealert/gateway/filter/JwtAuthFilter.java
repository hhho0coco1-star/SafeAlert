package com.safealert.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * JWT 인증 필터: 모든 요청의 통행증(JWT)을 검사하는 전역 필터
 */
@Slf4j // 로그 기록을 위한 객체 생성 (Lombok)
@Component // 스프링 빈으로 등록
public class JwtAuthFilter implements GlobalFilter, Ordered {

    // application.yml에 정의된 보안키를 가져옴
    @Value("${jwt.secret}")
    private String jwtSecret;

    // 인증 없이 통과시켜줄 화이트리스트 경로 설정
    private static final List<String> PUBLIC_PATHS = List.of(
            "/api/auth/signup",  // 회원가입
            "/api/auth/login",   // 로그인
            "/api/auth/refresh"  // 토큰 갱신
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // 1. 현재 들어온 요청의 경로(Path) 확인
        String path = exchange.getRequest().getPath().value();

        // 2. 화이트리스트 경로인 경우 검사 없이 통과
        if (PUBLIC_PATHS.stream().anyMatch(path::startsWith)) {
            return chain.filter(exchange);
        }

        // 3. 헤더에서 Authorization 정보 추출
        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");

        // 4. 토큰이 없거나 형식이 'Bearer '로 시작하지 않으면 차단
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return handleUnAuthorized(exchange); // 401 에러 응답 함수 호출
        }

        // 5. 'Bearer '를 제외한 실제 토큰 값만 추출
        String token = authHeader.substring(7);

        try {
            // 6. JWT 토큰 검증 및 내부 데이터(Claims) 파싱
            Claims claims = Jwts.parser()
                    .verifyWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            // 7. [중요] 원본 요청에 사용자 정보를 추가하여 다음 단계로 전달
            // 내부 서비스(Auth, Order 등)가 토큰을 또 해석하지 않도록 헤더에 사용자 ID를 심어줌
            ServerWebExchange mutatedExchange = exchange.mutate()
                    .request(r -> r.header("X-User-Id", claims.getSubject()))
                    .build();

            return chain.filter(mutatedExchange);

        } catch (Exception e) {
            // 토큰 만료, 변조 등 검증 실패 시 로그 남기고 차단
            log.warn("JWT 검증 실패: {}", e.getMessage());
            return handleUnAuthorized(exchange);
        }
    }

    /**
     * 401 Unauthorized 응답을 공통으로 처리하는 메서드
     */
    private Mono<Void> handleUnAuthorized(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }

    /**
     * 필터 실행 순서 설정
     * -1은 매우 높은 우선순위로, 다른 로직보다 인증을 가장 먼저 처리하게 함
     */
    @Override
    public int getOrder() {
        return -1;
    }
}