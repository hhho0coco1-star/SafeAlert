package com.safealert.subscription.repository;

import com.safealert.subscription.domain.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

import java.util.Optional;
import java.util.UUID;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {

    Optional<Subscription> findByUserId(UUID userId);
    // Optional -> 결과가 있거나/없거나

    @Query("SELECT DISTINCT s.userId FROM Subscription s " +
           "JOIN s.regions r " +
           "JOIN s.categories c " +
           "WHERE r.regionCode = :regionCode " +
           "AND c.category = :category " +
           "AND s.status = 'ACTIVE'")
    List<UUID> findUserIdsByRegionCodeAndCategory(
            @Param("regionCode") String regionCode,
            @Param("category") String category);

}