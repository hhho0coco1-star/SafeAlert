package com.safealert.notification.repository;

import com.safealert.notification.domain.NotificationHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface NotificationHistoryRepository extends JpaRepository<NotificationHistory, UUID> {

    @Query(value = "SELECT n FROM NotificationHistory n WHERE n.userId = :userId " +
                  "AND (:category = '' OR n.category = :category) " +
                  "AND (n.createdAt >= :startDate) " +
                  "AND (n.createdAt <= :endDate) " +
                  "AND (:keyword = '' OR n.title LIKE CONCAT('%',:keyword,'%') OR n.content LIKE CONCAT('%',:keyword,'%')) " +
                  "ORDER BY n.createdAt DESC",
           countQuery = "SELECT COUNT(n) FROM NotificationHistory n WHERE n.userId = :userId " +
                       "AND (:category = '' OR n.category = :category) " +
                       "AND (n.createdAt >= :startDate) " +
                       "AND (n.createdAt <= :endDate) " +
                       "AND (:keyword = '' OR n.title LIKE CONCAT('%',:keyword,'%') OR n.content LIKE CONCAT('%',:keyword,'%'))")
    Page<NotificationHistory> findByFilters(
            @Param("userId") UUID userId,
            @Param("category") String category,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("keyword") String keyword,
            Pageable pageable);

    List<NotificationHistory> findTop8ByOrderByCreatedAtDesc();

    List<NotificationHistory> findTop300ByUserIdIsNullOrderByCreatedAtDesc();

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    List<NotificationHistory> findTop7ByUserIdIsNullOrderByCreatedAtDesc();

    long countByUserIdIsNotNullAndTitleAndCreatedAtBetween(
            String title, LocalDateTime start, LocalDateTime end);

    long countByUserIdAndCreatedAtBetween(UUID userId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(n) FROM NotificationHistory n " +
           "WHERE n.userId = :userId AND n.category = :category " +
           "AND n.createdAt >= :start AND n.createdAt < :end")
    long countTodayByUserIdAndCategory(
            @Param("userId") UUID userId,
            @Param("category") String category,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}