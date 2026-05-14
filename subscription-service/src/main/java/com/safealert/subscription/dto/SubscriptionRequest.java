package com.safealert.subscription.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

public class SubscriptionRequest {

    @Getter
    @NoArgsConstructor
    public static class AddRegion {
        @NotBlank
        private String regionCode;
    }

    @Getter
    @NoArgsConstructor
    public static class UpdateCategories {
        @NotEmpty
        private List<String> categories;
    }
}