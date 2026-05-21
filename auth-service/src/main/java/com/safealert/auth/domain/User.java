package com.safealert.auth.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_id")
    private UUID userId;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "password_hash", nullable = true)
    private String passwordHash;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Column(nullable = false, length = 10)
    private String role = "USER";

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_deleted")
    private boolean isDeleted = false;

    @Column(name = "oauth_provider", length = 20)
    private String oauthProvider;

    @Column(name = "oauth_id", length = 100)
    private String oauthId;

    public static User create(String email, String passwordHash, String nickname) {
        User user = new User();
        user.email = email;
        user.passwordHash = passwordHash;
        user.nickname = nickname;
        user.role = "USER";
        user.createdAt = LocalDateTime.now();
        user.updatedAt = LocalDateTime.now();
        user.isDeleted = false;
        return user;
    }

    public static User createOAuth(String email, String nickname, String oauthProvider, String oauthId) {

        User user = new User();
        user.email = email;
        user.nickname = nickname;
        user.oauthProvider = oauthProvider;
        user.oauthId = oauthId;
        user.role = "USER";
        user.createdAt = LocalDateTime.now();
        user.updatedAt = LocalDateTime.now();
        user.isDeleted = false;
        return user;
    }

    public void delete() {
        this.isDeleted = true;
        this.updatedAt = LocalDateTime.now();
    }

    public void updateNickname(String nickname) {
        this.nickname = nickname;
        this.updatedAt = LocalDateTime.now();
    }

    public void updatePasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
        this.updatedAt = LocalDateTime.now();
    }
}
