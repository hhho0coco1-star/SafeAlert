package com.safealert.auth.service;

import com.safealert.auth.domain.User;
import com.safealert.auth.dto.SignupRequest;
import com.safealert.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.safealert.auth.dto.LoginRequest;
import com.safealert.auth.dto.TokenResponse;
import com.safealert.auth.security.JwtProvider;
import org.springframework.data.redis.core.RedisTemplate;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final RedisTemplate<String, String> redisTemplate;

    @Transactional
    public void signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 가입된 이메일입니다");
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User user = User.create(request.getEmail(), encodedPassword, request.getNickname());
        userRepository.save(user);
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
}