package com.safealert.subscription.controller;

import com.safealert.subscription.dto.ApiResponse;
import com.safealert.subscription.dto.RegionCodeResponse;
import com.safealert.subscription.dto.SubscriberResponse;
import com.safealert.subscription.dto.SubscriptionRequest;
import com.safealert.subscription.dto.SubscriptionResponse;
import com.safealert.subscription.service.SubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @GetMapping
    public ResponseEntity<ApiResponse<SubscriptionResponse>> getMySubscription(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(ApiResponse.ok(
                subscriptionService.getMySubscription(UUID.fromString(userId))));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SubscriptionResponse>> createSubscription(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(
                subscriptionService.createSubscription(UUID.fromString(userId))));
    }

    @PostMapping("/regions")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> addRegion(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody SubscriptionRequest.AddRegion request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(
                subscriptionService.addRegion(UUID.fromString(userId), request)));
    }

    @DeleteMapping("/regions/{regionCode}")
    public ResponseEntity<Void> removeRegion(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String regionCode) {
        subscriptionService.removeRegion(UUID.fromString(userId), regionCode);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/categories")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> updateCategories(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody SubscriptionRequest.UpdateCategories request) {
        return ResponseEntity.ok(ApiResponse.ok(
                subscriptionService.updateCategories(UUID.fromString(userId), request)));
    }

    @GetMapping("/regions/available")
    public ResponseEntity<ApiResponse<List<RegionCodeResponse>>> getAvailableRegions() {
        return ResponseEntity.ok(ApiResponse.ok(
                subscriptionService.getAvailableRegions()));
    }

    @GetMapping("/subscribers")
    public ResponseEntity<ApiResponse<SubscriberResponse>> getSubscribers(
            @RequestParam String regionCode,
            @RequestParam String category) {
        return ResponseEntity.ok(ApiResponse.ok(
                subscriptionService.getSubscribers(regionCode, category)));
    }
}