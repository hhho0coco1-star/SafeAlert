package com.safealert.auth.service;

import com.safealert.auth.domain.User;
import com.safealert.auth.dto.SignupRequest;
import com.safealert.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.safealert.auth.dto.LoginRequest;
import com.safealert.auth.dto.MeResponse;
import com.safealert.auth.dto.TokenResponse;
import com.safealert.auth.dto.UpdateNicknameRequest;
import com.safealert.auth.security.JwtProvider;
import org.springframework.data.redis.core.RedisTemplate;
import java.util.concurrent.TimeUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final RedisTemplate<String, String> redisTemplate;

    @Transactional // All or Nothing
    public User signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail()))
            throw new IllegalArgumentException("이미 가입된 이메일입니다");
        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User user = User.create(request.getEmail(), encodedPassword, request.getNickname());
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다");
        }

        String accessToken = jwtProvider.generateAccessToken(user.getUserId());
        String refreshToken = jwtProvider.generateRefreshToken(user.getUserId());

        redisTemplate.opsForValue().set(
                "token:refresh:" + user.getUserId(),
                refreshToken,
                7, TimeUnit.DAYS
                // Redis의 TTL(유효 기간) 기능을 이용해, 
                // 보안과 메모리 효율을 위해 리프레시 토큰을 딱 7일만 보관하고 자동으로 폐기하는 설정
        );

        return new TokenResponse(accessToken, refreshToken);
    }

    public String refresh(String refreshToken) {
        // 전달받은 리프레시 토큰이 서버(Redis)에 저장된 것과 일치하는지 확인하여, 
        // 통과 시 새로운 액세스 토큰을 발급해주는 토큰 갱신 로직
        UUID userId = jwtProvider.getUserId(refreshToken);
        String savedToken = redisTemplate.opsForValue().get("token:refresh:" + userId);

        if (savedToken == null || !savedToken.equals(refreshToken)) {
            throw new IllegalArgumentException("유효하지 않은 Refresh Token입니다");
        }

        return jwtProvider.generateAccessToken(userId);
    }

    public void logout(String accessToken) {
        UUID userId = jwtProvider.getUserId(accessToken);
        redisTemplate.delete("token:refresh:" + userId);
    }

    @Transactional(readOnly = true)
    public MeResponse getMe(String accessToken) {
        UUID userId = jwtProvider.getUserId(accessToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return new MeResponse(user.getUserId(), user.getEmail(), user.getNickname(),
                user.getRole(), user.getCreatedAt());
    }

    @Transactional
    public MeResponse updateNickname(String accessToken, UpdateNicknameRequest request) {
        UUID userId = jwtProvider.getUserId(accessToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        user.updateNickname(request.getNickname());
        return new MeResponse(user.getUserId(), user.getEmail(), user.getNickname(),
                user.getRole(), user.getCreatedAt());
    }

    @Transactional
    public void withdraw(String accessToken) {
        UUID userId = jwtProvider.getUserId(accessToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        user.delete();
        redisTemplate.delete("token:refresh:" + userId);
    }

    @Transactional(readOnly = true)
    public java.util.List<MeResponse> getAdminUsers(String accessToken) {
        UUID requesterId = jwtProvider.getUserId(accessToken);
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        if (!"ADMIN".equals(requester.getRole())) {
            throw new IllegalArgumentException("관리자 권한이 필요합니다");
        }
        return userRepository.findTop7ByIsDeletedFalseOrderByCreatedAtDesc()
                .stream()
                .map(u -> new MeResponse(u.getUserId(), u.getEmail(), u.getNickname(),
                        u.getRole(), u.getCreatedAt()))
                .toList();
    }
}