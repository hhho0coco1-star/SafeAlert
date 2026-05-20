package com.safealert.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class VerifyCodeRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String code;
    
    /*
    1. 사용자가 이메일 입력 → 코드 발송 요청
    2. 서버가 Redis에 코드 → 이메일 매핑으로 저장
    3. 사용자가 코드 입력 → 확인 요청
    */
}