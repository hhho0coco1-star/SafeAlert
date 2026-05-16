package com.safealert.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AdminStatsResponse {

    private final long totalMembers;
    private final long todaySent;
    private final long totalSent;
    private final long activeSubscriptions;
}