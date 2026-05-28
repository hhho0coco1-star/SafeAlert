package com.safealert.notification.dto;

import com.safealert.notification.domain.NotificationHistory;
import lombok.Getter;
import java.time.LocalDateTime;
import java.util.Map;

@Getter
public class AdminAlertResponse {

    private static final Map<String, String> REGION_NAMES = Map.ofEntries(
        Map.entry("전국", "전국"),
        Map.entry("11", "서울특별시"),
        Map.entry("26", "부산광역시"),
        Map.entry("27", "대구광역시"),
        Map.entry("28", "인천광역시"),
        Map.entry("29", "광주광역시"),
        Map.entry("30", "대전광역시"),
        Map.entry("31", "울산광역시"),
        Map.entry("36", "세종특별자치시"),
        Map.entry("41", "경기도"),
        Map.entry("42", "강원도"),
        Map.entry("43", "충청북도"),
        Map.entry("44", "충청남도"),
        Map.entry("45", "전라북도"),
        Map.entry("46", "전라남도"),
        Map.entry("47", "경상북도"),
        Map.entry("48", "경상남도"),
        Map.entry("50", "제주특별자치도")
    );

    private final String category;
    private final String title;
    private final String content;
    private final String region;
    private final LocalDateTime createdAt;
    private final long recipientCount;

    public AdminAlertResponse(NotificationHistory n, long recipientCount) {
        this.category = n.getCategory();
        this.title = n.getTitle();
        this.content = n.getContent();
        this.region = REGION_NAMES.getOrDefault(n.getRegionCode(), n.getRegionCode());
        this.createdAt = n.getCreatedAt();
        this.recipientCount = recipientCount;
    }
}
