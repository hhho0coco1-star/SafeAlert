package com.safealert.auth.repository;

import com.safealert.auth.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByOauthProviderAndOauthId(String oauthProvider, String oauthId);

    List<User> findTop7ByIsDeletedFalseOrderByCreatedAtDesc();

    long countByIsDeletedFalse();

    Page<User> findByIsDeletedFalseOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.isDeleted = false " +
           "AND (LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "  OR LOWER(u.nickname) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY u.createdAt DESC")
    Page<User> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
}
