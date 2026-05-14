package com.safealert.subscription.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "subscription_regions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SubscriptionRegion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id", nullable = false) // 외래키 지정
    private Subscription subscription;

    @Column(name = "region_code", nullable = false, length = 10)
    private String regionCode;

    @Column(name = "region_name", nullable = false, length = 100)
    private String regionName;

    public static SubscriptionRegion create(Subscription subscription, String regionCode, String regionName) {
        SubscriptionRegion region = new SubscriptionRegion();
        region.subscription = subscription;
        region.regionCode = regionCode;
        region.regionName = regionName;
        return region;
    }
}