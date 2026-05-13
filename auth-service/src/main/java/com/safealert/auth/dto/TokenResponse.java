package com.safealert.auth.dto;

import lombok.Getter;

// 로그인 성공 시 클라이언트에게 돌려줄 토큰 2개를 담는 그릇

@Getter
public class TokenResponse {

    private final String accessToken;
    private final String refreshToken;
    private final String tokenType = "Bearer";

    public TokenResponse(String accessToken, String refreshToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }
}