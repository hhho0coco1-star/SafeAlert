package com.safealert.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class MeResponse {
    
    private UUID userId;
    private String email;
    private String nickname;
    private String role;
    private LocalDateTime createdAt;
    
}