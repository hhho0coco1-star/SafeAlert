package com.safealert.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 수동 알림 발송 요청 DTO
@Getter
@NoArgsConstructor
public class ManualAlertRequest {

    @NotBlank(message = "카테고리를 입력해 주세요")
    private String category;

    @NotBlank(message = "제목을 입력해 주세요")
    @Size(max = 200, message = "제목은 200자 이내여야 합니다")
    private String title;

    @NotBlank(message = "내용을 입력해 주세요")
    private String content;

    private String region;
    private String source;
    private String severity;
}