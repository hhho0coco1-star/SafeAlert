package com.safealert.subscription.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity // 데이터베이스의 테이블과 1:1로 매핑되는 객체
@Table(name = "subscriptions") // 실제 데이터베이스 테이블의 이름
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // 파라미터가 없는 기본 생성자 -> 생성자의 접근 제한 PROTECTED
public class Subscription {

    @Id // 기본키 선언
    @GeneratedValue(strategy = GenerationType.UUID) 
    @Column(name = "subscription_id")
    private UUID subscriptionId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    // 기본값 updatable = true -> false 의미 : 업데이트가 날라오면 해당 컬럼은 제외 

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "subscription", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SubscriptionRegion> regions = new ArrayList<>();
    // OneToMany -> 1:N 관계
    // 연관관계가 누구 ? -> mappedBy = "subscription"
    // 영속성 정의 -> cascade = CascadeType.ALL -> 변화 SubscriptionRegion 부모에게 영향
    // 고립 객체 제거 -> 부모에서 삭제되면 자식도 삭제한다. orphanRemoval

    @OneToMany(mappedBy = "subscription", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SubscriptionCategory> categories = new ArrayList<>();

    public static Subscription create(UUID userId) {
        Subscription subscription = new Subscription();
        subscription.userId = userId;
        subscription.status = "ACTIVE";
        subscription.createdAt = LocalDateTime.now();
        subscription.updatedAt = LocalDateTime.now();
        return subscription;
    }

    public void removeRegion(String regionCode) {
        this.regions.removeIf(r -> r.getRegionCode().equals(regionCode));
        this.updatedAt = LocalDateTime.now();
    }

    public void addRegion(String regionCode, String regionName) {
        this.regions.add(SubscriptionRegion.create(this, regionCode, regionName));
        this.updatedAt = LocalDateTime.now();
    }

    public void updateCategories(List<String> newCategories) {
        this.categories.clear();
        newCategories.forEach(c -> this.categories.add(SubscriptionCategory.create(this, c)));
        this.updatedAt = LocalDateTime.now();
    }

}