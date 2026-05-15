package com.safealert.subscription.dto;

import lombok.Getter;

import java.util.List;
import java.util.UUID;

@Getter
public class SubscriberResponse {

    private String regionCode;
    private String category;
    private List<UUID> userIds;

    public SubscriberResponse(String regionCode, String category, List<UUID> userIds) {
        this.regionCode = regionCode;
        this.category = category;
        this.userIds = userIds;
    }
}