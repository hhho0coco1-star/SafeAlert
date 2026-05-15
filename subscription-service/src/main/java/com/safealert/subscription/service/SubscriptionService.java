package com.safealert.subscription.service;

import com.safealert.subscription.domain.Subscription;
import com.safealert.subscription.dto.SubscriptionRequest;
import com.safealert.subscription.dto.SubscriptionResponse;
import com.safealert.subscription.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.safealert.subscription.repository.RegionCodeRepository;
import com.safealert.subscription.dto.RegionCodeResponse;
import java.util.List;
import com.safealert.subscription.dto.SubscriberResponse;
import com.safealert.subscription.domain.OutboxEvent;
import com.safealert.subscription.repository.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SubscriptionService {
    // final이 붙은 필드를 매개변수로 받는 생성자를 자동으로 생성하여, 
    // 스프링의 의존성 주입(DI)을 간결하고 안전하게 처리해주는 롬복 어노테이션

    private final SubscriptionRepository subscriptionRepository;
    private final RegionCodeRepository regionCodeRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true) // 읽기 전용 모드 -> 조회만 하겠다
    public SubscriptionResponse getMySubscription(UUID userId) {
        Subscription subscription = subscriptionRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("구독 정보가 없습니다."));
        return new SubscriptionResponse(subscription);
    }

    @Transactional // Transactional -> all or noting
    public SubscriptionResponse createSubscription(UUID userId) {
        if (subscriptionRepository.findByUserId(userId).isPresent()) {
            throw new IllegalStateException("이미 구독이 존재합니다.");
        }
        Subscription subscription = Subscription.create(userId);
        subscriptionRepository.save(subscription);
        saveOutboxEvent(subscription, "SUBSCRIPTION_CREATED");
        return new SubscriptionResponse(subscription);
    }

    @Transactional
    public SubscriptionResponse addRegion(UUID userId, SubscriptionRequest.AddRegion request) {
        Subscription subscription = subscriptionRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("구독 정보가 없습니다."));
        String regionName = regionCodeRepository.findById(request.getRegionCode())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 지역 코드입니다."))
                .getName();
        subscription.addRegion(request.getRegionCode(), regionName);
        saveOutboxEvent(subscription, "REGION_ADDED");
        return new SubscriptionResponse(subscription);
    }

    @Transactional
    public SubscriptionResponse removeRegion(UUID userId, String regionCode) {
        Subscription subscription = subscriptionRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("구독 정보가 없습니다."));
        subscription.removeRegion(regionCode);
        saveOutboxEvent(subscription, "REGION_REMOVED");
        return new SubscriptionResponse(subscription);
    }

    @Transactional
    public SubscriptionResponse updateCategories(UUID userId, SubscriptionRequest.UpdateCategories request) {
        Subscription subscription = subscriptionRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("구독 정보가 없습니다."));
        subscription.updateCategories(request.getCategories());
        saveOutboxEvent(subscription, "CATEGORIES_UPDATED");
        return new SubscriptionResponse(subscription);
    }

    @Transactional(readOnly = true)
    public List<RegionCodeResponse> getAvailableRegions() {
        return regionCodeRepository.findAll().stream()
                .map(RegionCodeResponse::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public SubscriberResponse getSubscribers(String regionCode, String category) {
        List<UUID> userIds = subscriptionRepository
                .findUserIdsByRegionCodeAndCategory(regionCode, category);
        return new SubscriberResponse(regionCode, category, userIds);
    }

    private void saveOutboxEvent(Subscription subscription, String eventType) {
        try {
            String payload = objectMapper.writeValueAsString(new java.util.HashMap<>() {{
                put("subscriptionId", subscription.getSubscriptionId().toString());
                put("userId", subscription.getUserId().toString());
                put("eventType", eventType);
            }});
            outboxEventRepository.save(
                OutboxEvent.create("SUBSCRIPTION", subscription.getSubscriptionId(), eventType, payload)
            );
        } catch (Exception e) {
            throw new RuntimeException("OutboxEvent 저장 실패" , e);
        }
    }
}