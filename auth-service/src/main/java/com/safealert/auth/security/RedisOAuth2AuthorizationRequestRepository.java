package com.safealert.auth.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;

import java.io.*;
import java.util.Base64;
import java.util.concurrent.TimeUnit;

@Component
public class RedisOAuth2AuthorizationRequestRepository
        implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    private static final String KEY_PREFIX = "oauth2:state:";
    private static final long TTL_MINUTES = 10;

    private final RedisTemplate<String, String> redisTemplate;

    public RedisOAuth2AuthorizationRequestRepository(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        String state = request.getParameter("state");
        if (state == null) return null;

        String serialized = redisTemplate.opsForValue().get(KEY_PREFIX + state);
        if (serialized == null) return null;

        return deserialize(serialized);
    }

    @Override
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest,
                                         HttpServletRequest request,
                                         HttpServletResponse response) {
        if (authorizationRequest == null) {
            String state = request.getParameter("state");
            if (state != null) {
                redisTemplate.delete(KEY_PREFIX + state);
            }
            return;
        }

        String state = authorizationRequest.getState();
        redisTemplate.opsForValue().set(
                KEY_PREFIX + state,
                serialize(authorizationRequest),
                TTL_MINUTES,
                TimeUnit.MINUTES
        );
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request,
                                                                  HttpServletResponse response) {
        OAuth2AuthorizationRequest authRequest = loadAuthorizationRequest(request);
        if (authRequest != null) {
            redisTemplate.delete(KEY_PREFIX + authRequest.getState());
        }
        return authRequest;
    }

    private String serialize(OAuth2AuthorizationRequest request) {
        try (ByteArrayOutputStream bos = new ByteArrayOutputStream();
             ObjectOutputStream oos = new ObjectOutputStream(bos)) {
            oos.writeObject(request);
            return Base64.getEncoder().encodeToString(bos.toByteArray());
        } catch (IOException e) {
            throw new RuntimeException("OAuth2AuthorizationRequest 직렬화 실패", e);
        }
    }

    private OAuth2AuthorizationRequest deserialize(String data) {
        try (ByteArrayInputStream bis = new ByteArrayInputStream(Base64.getDecoder().decode(data));
             ObjectInputStream ois = new ObjectInputStream(bis)) {
            return (OAuth2AuthorizationRequest) ois.readObject();
        } catch (IOException | ClassNotFoundException e) {
            throw new RuntimeException("OAuth2AuthorizationRequest 역직렬화 실패", e);
        }
    }
}
