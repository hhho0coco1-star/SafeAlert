package com.safealert.auth.service;

import com.safealert.auth.domain.User;
import com.safealert.auth.dto.LoginRequest;
import com.safealert.auth.dto.SignupRequest;
import com.safealert.auth.dto.TokenResponse;
import com.safealert.auth.repository.UserRepository;
import com.safealert.auth.security.JwtProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.mockito.quality.Strictness;
import org.mockito.junit.jupiter.MockitoSettings;

@MockitoSettings(strictness = Strictness.LENIENT)
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @InjectMocks
    private AuthService authService; // 실제로 테스트할 클래스

    // 의존성 가짜 객체들
    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtProvider jwtProvider;

    @Mock
    private RedisTemplate<String, String> redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Test
    void 회원가입_중복이메일_예외() {
        // given (준비)
        SignupRequest request = mock(SignupRequest.class);
        when(request.getEmail()).thenReturn("test@example.com");
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true); // 중복상황 인위적으로 만듬

        // when & then (실행 & 검증)
        assertThatThrownBy(() -> authService.signup(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("이미 가입된 이메일입니다");
    }

    @Test
    void 로그인_성공() {
        // given
        LoginRequest request = mock(LoginRequest.class);
        when(request.getEmail()).thenReturn("test@example.com");
        when(request.getPassword()).thenReturn("password123");

        User user = User.create("test@example.com", "hashedPassword", "닉네임");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "hashedPassword")).thenReturn(true);
        when(jwtProvider.generateAccessToken(any())).thenReturn("accessToken");
        when(jwtProvider.generateRefreshToken(any())).thenReturn("refreshToken");
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        // when
        TokenResponse response = authService.login(request);

        // then
        assertThat(response.getAccessToken()).isEqualTo("accessToken");
        assertThat(response.getRefreshToken()).isEqualTo("refreshToken");
    }

    @Test
    void 로그인_실패_잘못된비밀번호() {
        // given
        LoginRequest request = mock(LoginRequest.class);
        when(request.getEmail()).thenReturn("test@example.com");
        when(request.getPassword()).thenReturn("wrongPassword");

        User user = User.create("test@example.com", "hashedPassword", "닉네임");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongPassword", "hashedPassword")).thenReturn(false);

        // when & then
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("이메일 또는 비밀번호가 올바르지 않습니다");
    }
}