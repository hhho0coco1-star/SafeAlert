package com.safealert.notification.controller;

import com.safealert.notification.dto.*;
import com.safealert.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/api/notifications")
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getNotifications(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "") String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "7") int size,
            @RequestParam(defaultValue = "") String startDate,
            @RequestParam(defaultValue = "") String endDate,
            @RequestParam(defaultValue = "") String keyword) {
        String token = authHeader.replace("Bearer ", "");
        return ResponseEntity.ok(ApiResponse.ok(
                notificationService.getNotifications(token, category, page, size, startDate, endDate, keyword)));
    }

    @GetMapping("/api/alerts/recent")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getRecentAlerts() {
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getRecentAlerts()));
    }

    @GetMapping("/api/admin/stats")
    public ResponseEntity<ApiResponse<AdminStatsResponse>> getAdminStats(
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getAdminStats(token)));
    }

    @GetMapping("/api/admin/alerts")
    public ResponseEntity<ApiResponse<List<AdminAlertResponse>>> getAdminAlerts(
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getAdminAlerts(token)));
    }

    @PostMapping("/api/admin/alerts/manual")
    public ResponseEntity<ApiResponse<Void>> sendManualAlert(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ManualAlertRequest request) {
        String token = authHeader.replace("Bearer ", "");
        notificationService.sendManualAlert(token, request);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}