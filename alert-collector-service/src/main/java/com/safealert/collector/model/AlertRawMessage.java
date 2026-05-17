package com.safealert.collector.model;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AlertRawMessage {
    private String source; // 출처
    private String category; // 카테고리
    private String title; // 제목
    private String content; // 내용
    private String region; // 지역
    private String issuedAt; // 발령 시각
    private String rawData; // API 원본 응답
}