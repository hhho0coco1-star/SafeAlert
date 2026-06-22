package com.safealert.auth.service;

import com.safealert.auth.domain.User;
import com.safealert.auth.dto.SignupRequest;
import com.safealert.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.safealert.auth.dto.LoginRequest;
import com.safealert.auth.dto.AdminUsersResponse;
import com.safealert.auth.dto.MeResponse;
import com.safealert.auth.dto.TokenResponse;
import com.safealert.auth.dto.ChangePasswordRequest;
import com.safealert.auth.dto.UpdateNicknameRequest;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import com.safealert.auth.security.JwtProvider;
import org.springframework.data.redis.core.RedisTemplate;
import java.util.concurrent.TimeUnit;
import java.util.UUID;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;
import java.security.SecureRandom;
import org.springframework.beans.factory.annotation.Value;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final RedisTemplate<String, String> redisTemplate;
    private final JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Transactional // All or Nothing
    public User signup(SignupRequest request) {
        String done = redisTemplate.opsForValue().get("email:verify:done:" + request.getEmail());
        if (done == null) 
            throw new IllegalArgumentException("이메일 인증이 완료되지 않았습니다.");

        if (userRepository.existsByEmail(request.getEmail()))
            throw new IllegalArgumentException("이미 가입된 이메일입니다.");

        String encodedPassword = passwordEncoder.encode(request.getPassword()); // 비밀번호 암호화
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

        String accessToken = jwtProvider.generateAccessToken(user.getUserId(), user.getRole());
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

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return jwtProvider.generateAccessToken(userId, user.getRole());
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
                user.getRole(), user.getOauthProvider(), user.getCreatedAt());
    }

    @Transactional
    public MeResponse updateNickname(String accessToken, UpdateNicknameRequest request) {
        UUID userId = jwtProvider.getUserId(accessToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        user.updateNickname(request.getNickname());
        return new MeResponse(user.getUserId(), user.getEmail(), user.getNickname(),
                user.getRole(), user.getOauthProvider(), user.getCreatedAt());
    }

    @Transactional
    public void changePassword(String accessToken, ChangePasswordRequest request) {
        UUID userId = jwtProvider.getUserId(accessToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("현재 비밀번호가 올바르지 않습니다");
        }
        user.updatePasswordHash(passwordEncoder.encode(request.getNewPassword()));
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
    public AdminUsersResponse getAdminUsers(String accessToken, int page, int size, String keyword) {
        UUID requesterId = jwtProvider.getUserId(accessToken);
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        if (!"ADMIN".equals(requester.getRole())) {
            throw new IllegalArgumentException("관리자 권한이 필요합니다");
        }
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<User> userPage = (keyword != null && !keyword.isBlank())
                ? userRepository.searchByKeyword(keyword, pageRequest)
                : userRepository.findByIsDeletedFalseOrderByCreatedAtDesc(pageRequest);
        List<MeResponse> users = userPage.getContent().stream()
                .map(u -> new MeResponse(u.getUserId(), u.getEmail(), u.getNickname(),
                        u.getRole(), u.getOauthProvider(), u.getCreatedAt()))
                .toList();
        return new AdminUsersResponse(userPage.getTotalElements(), users, page, userPage.getTotalPages());
    }

    @Transactional
    public void updateUserRole(String accessToken, UUID targetUserId, String role) {
        UUID requesterId = jwtProvider.getUserId(accessToken);
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        if (!"ADMIN".equals(requester.getRole())) {
            throw new IllegalArgumentException("관리자 권한이 필요합니다");
        }
        if (requesterId.equals(targetUserId)) {
            throw new IllegalArgumentException("자신의 권한은 변경할 수 없습니다");
        }
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        target.updateRole(role);
    }

    public void sendVerificationCode(String email) {
        if (userRepository.existsByEmail(email))
            throw new IllegalArgumentException("이미 가입된 메일입니다.");

        String code = String.format("%06d", new SecureRandom().nextInt(1000000));
        redisTemplate.opsForValue().set(
            "email:verify:code:" + email, code, 5, TimeUnit.MINUTES);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setTo(email);
            helper.setSubject("[SafeAlert] 이메일 인증 코드");
            helper.setText("인증 코드 : <b>" + code + "</b><br>5분 내에 입력해주세요.", true);
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("메일 발송에 실패했습니다: " + e.getMessage());
        }
    }

    public void verifyCode(String email, String code) {
        String saved = redisTemplate.opsForValue().get("email:verify:code:" + email); 
        // opsForValue() -> key : value
        if (saved == null || !saved.equals(code))
            throw new IllegalArgumentException("인증 코드가 올바르지 않거나 만료되었습니다.");

        redisTemplate.delete("email:verify:code:" + email);
        redisTemplate.opsForValue().set(
            "email:verify:done:" + email, "true", 30, TimeUnit.MINUTES);
    }

    // 비밀번호 재설정 이메일 발송
    public void sendPasswordReset(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            // ifPresent : Optional 객체가 비어있지 않고 데이터(User)가
            // 실제로 존재할 때만 내부 코드를 실행

            // 소셜 로그인 계정은 비밀번호가 없으므로 재설정 불가 → 조용히 무시
            if (user.getOauthProvider() != null) return;

            String token = UUID.randomUUID().toString();
            // randomUUID() 메서드는 무작위(Random) 숫자를 기반으로 하는 UUID 버전 4 객체를 생성

            // redisTemplate : "Spring 애플리케이션에서 복잡한 연결 관리나 데이터 변환 신경 쓸 필요 없이, Java 코드로 
            // Redis 데이터베이스를 쉽게 조작할 수 있도록 도와주는 스프링 전용 만능 도구(Helper)"
            redisTemplate.opsForValue().set(
                "password:reset:" + token, // key
                user.getUserId().toString(), // value
                10, TimeUnit.MINUTES // 만료시간, 시간단위
            );

            try {
                MimeMessage message = mailSender.createMimeMessage();
                // Spring의 JavaMailSender를 사용하여 첨부 파일이나 HTML 서식이 
                // 포함된 복잡한 이메일을 보내기 위해 빈 메일 객체(MimeMessage)를 생성하는 코드
                MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
                helper.setTo(email);
                helper.setSubject("[SafeAlert] 비밀번호 재설정 안내");
                String link = frontendUrl + "/reset-password?token=" + token;
                helper.setText(
                    "<p>아래 링크를 클릭하여 비밀번호를 재설정하세요. (10분 내 유효)</p>"
                    + "<a href='" + link + "'>" + link + "</a>", true
                );
                mailSender.send(message);
            } catch (Exception e) {
                throw new RuntimeException("메일 발송에 실패했습니다.");
            }

        });
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        // 1. Redis에서 토큰으로 userId 조회
        String userIdStr = redisTemplate.opsForValue().get("password:reset:" + token);
        if (userIdStr == null)
            throw new IllegalArgumentException("토큰이 유효하지 않거나 만료되었습니다.");

        // 2. userId 로 사용자 조회
        UUID userId = UUID.fromString(userIdStr);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 3. 새 비밀번호 해싱 후 저장
        user.updatePasswordHash(passwordEncoder.encode(newPassword));

        // 4. 토큰 삭제 (재사용 방지)
        redisTemplate.delete("password:reset:" + token);
    }
}