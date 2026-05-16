package com.safealert.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UpdateNicknameRequest {

    @NotBlank(message = "닉네임을 입력해 주세요")
    @Size(min = 2, max = 20, message = "닉네임은 2 ~ 20자여야 합니다.")
    private String nickname;

}