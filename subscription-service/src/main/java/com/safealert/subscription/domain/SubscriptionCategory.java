package com.safealert.subscription.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "subscription_categories")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SubscriptionCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // DB 에게 값을 위임
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) // N:1 -> LAZY(지연로딩)
    @JoinColumn(name = "subscription_id", nullable = false)
    private Subscription subscription;

    @Column(nullable = false, length = 30)
    private String category;

    public static SubscriptionCategory create(Subscription subscription, String category) {
        SubscriptionCategory sc = new SubscriptionCategory();
        sc.subscription = subscription;
        sc.category = category;
        return sc;
    }
}