package com.safealert.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

// JWT 토큰을 만들고 검증하는 핵심 도구 파일

@Component
public class JwtProvider {

    private final SecretKey secretKey;
    private final long accessTokenExpiry;
    private final long refreshTokenExpiry;

    public JwtProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiry}") long accessTokenExpiry,
            @Value("${jwt.refresh-token-expiry}") long refreshTokenExpiry) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes());
        this.accessTokenExpiry = accessTokenExpiry;
        this.refreshTokenExpiry = refreshTokenExpiry;
    }

    public String generateAccessToken(UUID userId) {
        return Jwts.builder()
                .subject(userId.toString()) // userId 저장
                .issuedAt(new Date()) // 토큰 발급시간
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiry)) // 유효시간
                .signWith(secretKey) // 비밀키 서명
                .compact();
    }

    public String generateRefreshToken(UUID userId) {
        return Jwts.builder()
                .subject(userId.toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshTokenExpiry))
                .signWith(secretKey)
                .compact();
    }

    public UUID getUserId(String token) {
        Claims claims = Jwts.parser() // 판독기 준비 
                .verifyWith(secretKey) // 위변조 확인
                .build() // 판독기 조립 완료
                .parseSignedClaims(token) // 실제 토큰 주입
                .getPayload(); // 내용물 가져오기
        return UUID.fromString(claims.getSubject());
    }

    public boolean validate(String token) {
        try {
            Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}