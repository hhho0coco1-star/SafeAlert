package com.safealert.subscription.dto;

import com.safealert.subscription.domain.Subscription;
import com.safealert.subscription.domain.SubscriptionCategory;
import com.safealert.subscription.domain.SubscriptionRegion;
import lombok.Getter;

import java.util.List;
import java.util.UUID;

@Getter
public class SubscriptionResponse {

    private UUID subscriptionId;
    private UUID userId;
    private String status;
    private List<RegionDto> regions;
    private List<String> categories;

    @Getter
    public static class RegionDto {
        private String code;
        private String name;

        public RegionDto(SubscriptionRegion region) {
            this.code = region.getRegionCode();
            this.name = region.getRegionName();
        }
    }

    public SubscriptionResponse(Subscription subscription) {
        this.subscriptionId = subscription.getSubscriptionId();
        this.userId = subscription.getUserId();
        this.status = subscription.getStatus();
        this.regions = subscription.getRegions().stream()
                .map(RegionDto::new)
                .toList();
        this.categories = subscription.getCategories().stream()
                .map(SubscriptionCategory::getCategory)
                .toList();
    }
}