package com.safealert.subscription.controller;

import com.safealert.subscription.dto.SubscriptionRequest;
import com.safealert.subscription.dto.SubscriptionResponse;
import com.safealert.subscription.service.SubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @GetMapping
    public ResponseEntity<SubscriptionResponse> getMySubscription(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(subscriptionService.getMySubscription(UUID.fromString(userId)));
    }

    @PostMapping
    public ResponseEntity<SubscriptionResponse> createSubscription(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(subscriptionService.createSubscription(UUID.fromString(userId)));
    }

    @PostMapping("/regions")
    public ResponseEntity<SubscriptionResponse> addRegion(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody SubscriptionRequest.AddRegion request) {
        return ResponseEntity.ok(subscriptionService.addRegion(UUID.fromString(userId), request));
    }

    @DeleteMapping("/regions/{regionCode}")
    public ResponseEntity<Void> removeRegion(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String regionCode) {
        subscriptionService.removeRegion(UUID.fromString(userId), regionCode);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/categories")
    public ResponseEntity<SubscriptionResponse> updateCategories(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody SubscriptionRequest.UpdateCategories request) {
        return ResponseEntity.ok(subscriptionService.updateCategories(UUID.fromString(userId), request));
    }
}