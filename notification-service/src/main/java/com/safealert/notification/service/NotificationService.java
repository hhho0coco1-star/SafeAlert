package com.safealert.notification.service;

import com.safealert.notification.domain.NotificationHistory;
import com.safealert.notification.dto.*;
import com.safealert.notification.repository.NotificationHistoryRepository;
import com.safealert.notification.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationHistoryRepository repository;
    private final JwtProvider jwtProvider;

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(
            String accessToken, String category,
            int page, int size,
            String startDate, String endDate, String keyword) {

        UUID userId = jwtProvider.getUserId(accessToken);

        LocalDateTime start = (startDate != null && !startDate.isBlank())
                ? LocalDate.parse(startDate).atStartOfDay() : null;
        LocalDateTime end = (endDate != null && !endDate.isBlank())
                ? LocalDate.parse(endDate).atTime(23, 59, 59) : null;
        String cat = (category != null && !category.isBlank()) ? category : null;
        String kw = (keyword != null && !keyword.isBlank()) ? keyword : null;

        return repository.findByFilters(userId, cat, start, end, kw, PageRequest.of(page, size))
                .map(NotificationResponse::new);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getRecentAlerts() {
        return repository.findTop8ByOrderByCreatedAtDesc()
                .stream()
                .map(NotificationResponse::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminStatsResponse getAdminStats(String accessToken) {
        validateAdmin(accessToken);
        long totalSent = repository.count();
        long todaySent = repository.countByCreatedAtBetween(
                LocalDate.now().atStartOfDay(),
                LocalDate.now().atTime(23, 59, 59));
        return new AdminStatsResponse(0L, todaySent, totalSent, 0L);
    }

    @Transactional(readOnly = true)
    public List<AdminAlertResponse> getAdminAlerts(String accessToken) {
        validateAdmin(accessToken);
        return repository.findTop7ByOrderByCreatedAtDesc()
                .stream()
                .map(n -> new AdminAlertResponse(n, 1L))
                .toList();
    }

    @Transactional
    public void sendManualAlert(String accessToken, ManualAlertRequest request) {
        validateAdmin(accessToken);
        NotificationHistory h = NotificationHistory.create(
                UUID.randomUUID(), request.getCategory(), request.getTitle(),
                request.getContent(), request.getRegion(),
                request.getSource(), request.getSeverity());
        repository.save(h);
    }

    private void validateAdmin(String accessToken) {
        jwtProvider.getUserId(accessToken);
    }
}