package com.safealert.auth.dto;

import lombok.Getter;
import java.util.UUID;

@Getter
public class UserResponse {

    private UUID userId;
    private String email;
    private String nickname;

    public UserResponse(UUID userId, String email, String nickname) {
        this.userId = userId;
        this.email = email;
        this.nickname = nickname;
    }
}