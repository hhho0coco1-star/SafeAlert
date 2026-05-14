package com.safealert.auth.dto;

import lombok.Getter;

@Getter
public class TokenResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private int expiresIn;

    public TokenResponse(String accessToken, String refreshToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresIn = 900;
    }
}