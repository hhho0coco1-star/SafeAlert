package com.safealert.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class NotificationSummaryResponse {
    private final long total;
    private final long weather;
    private final long earthquake;
    private final long dust;
    private final long disaster;
}
