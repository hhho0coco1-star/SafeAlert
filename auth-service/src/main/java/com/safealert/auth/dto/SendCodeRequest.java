package com.safealert.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class SendCodeRequest {

    @NotBlank
    @Email
    private String email;
    // { "email": "..." } JSON을 Java 객체로 변환하는 그릇
    // @Email로 이메일 형식 자동 검증
}
