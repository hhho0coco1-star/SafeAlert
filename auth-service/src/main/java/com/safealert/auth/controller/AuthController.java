package com.safealert.auth.controller;

import com.safealert.auth.domain.User;
import com.safealert.auth.dto.*;
import com.safealert.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.safealert.auth.dto.SendCodeRequest;
import com.safealert.auth.dto.VerifyCodeRequest;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<UserResponse>> signup(@Valid @RequestBody SignupRequest request) {
        User user = authService.signup(request);
        UserResponse userResponse = new UserResponse(user.getUserId(), user.getEmail(), user.getNickname());
        return ResponseEntity.ok(ApiResponse.ok(userResponse));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenResponse>> login(@Valid @RequestBody LoginRequest request) {
        TokenResponse tokenResponse = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok(tokenResponse));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<RefreshResponse>> refresh(@RequestBody Map<String, String> body) {
        String newAccessToken = authService.refresh(body.get("refreshToken"));
        return ResponseEntity.ok(ApiResponse.ok(new RefreshResponse(newAccessToken)));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestHeader("Authorization") String authHeader) {
        String accessToken = authHeader.replace("Bearer ", "");
        authService.logout(accessToken);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<MeResponse>> getMe(
            @RequestHeader("Authorization") String authHeader) {
        String accessToken = authHeader.replace("Bearer ", "");
        return ResponseEntity.ok(ApiResponse.ok(authService.getMe(accessToken)));
    }
    
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<MeResponse>> updateNickname(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody UpdateNicknameRequest request) {
        String accessToken = authHeader.replace("Bearer ", "");
        return ResponseEntity.ok(ApiResponse.ok(authService.updateNickname(accessToken, request)));
    }

    @PutMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ChangePasswordRequest request) {
        String accessToken = authHeader.replace("Bearer ", "");
        authService.changePassword(accessToken, request);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> withdraw(
            @RequestHeader("Authorization") String authHeader) {
        String accessToken = authHeader.replace("Bearer ", "");
        authService.withdraw(accessToken);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/admin/users")
    public ResponseEntity<ApiResponse<AdminUsersResponse>> getAdminUsers(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "7") int size,
            @RequestParam(defaultValue = "") String keyword) {
        String accessToken = authHeader.replace("Bearer ", "");
        return ResponseEntity.ok(ApiResponse.ok(authService.getAdminUsers(accessToken, page, size, keyword)));
    }

    @PutMapping("/admin/users/{userId}/role")
    public ResponseEntity<ApiResponse<Void>> updateUserRole(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID userId,
            @RequestBody Map<String, String> body) {
        String accessToken = authHeader.replace("Bearer ", "");
        authService.updateUserRole(accessToken, userId, body.get("role"));
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/email/send-code")
    public ResponseEntity<ApiResponse<Void>> sendCode(@Valid @RequestBody SendCodeRequest request) {
        // @Valid -> 유효성 검사 규칙 -> 컨트롤러 진입하기 전에 자동 검증
        authService.sendVerificationCode(request.getEmail());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/email/verify-code")
    public ResponseEntity<ApiResponse<Void>> verifyCode(@Valid @RequestBody VerifyCodeRequest request) {
        authService.verifyCode(request.getEmail(), request.getCode());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}