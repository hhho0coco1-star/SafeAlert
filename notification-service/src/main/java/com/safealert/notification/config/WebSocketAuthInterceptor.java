package com.safealert.notification.config;

import com.safealert.notification.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements HandshakeInterceptor {

    private final JwtProvider jwtProvider;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                    WebSocketHandler wsHandler, Map<String, Object> attributes) {
        String authHeader = request.getHeaders().getFirst("Authorization");
        // header -> Authorization -> first 값
        if(authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("WebSocket 연결 거부 : Authorization 헤더 없음");
            return false;
        }
        try {
            String token = authHeader.substring(7);
            String userId = jwtProvider.getUserId(token).toString();
            attributes.put("userId", userId);
            return true;
        } catch (Exception e) {
            log.warn("WebSocket 연결 거부 : 유효하지 않은 토큰 - {}", e.getMessage());
            return false;
        }
    }
    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                WebSocketHandler wsHandler, Exception exception) {
    }
}