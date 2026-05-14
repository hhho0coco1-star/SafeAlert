package com.safealert.auth.dto;

import lombok.Getter;

@Getter
public class RefreshResponse {

    private String accessToken;
    private int expiresIn;

    public RefreshResponse(String accessToken) {
        this.accessToken = accessToken;
        this.expiresIn = 900;
    }
}