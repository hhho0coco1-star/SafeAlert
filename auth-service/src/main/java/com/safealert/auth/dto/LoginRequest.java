package com.safealert.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class LoginRequest {

    @NotBlank(message = "이메일은 필수입니다")
    @Email(message = "이메일 형식이 올바르지 않습니다")
    private String email;

    @NotBlank(message = "비밀번호는 필수입니다")
    private String password;

    // @NotBlank -> 문자열이 null이 아니고, 공백(스페이스)을 
    // 제외한 의미 있는 글자가 최소 한 글자 이상 포함되어야 함을 보장합니다.
}