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

    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> withdraw(
            @RequestHeader("Authorization") String authHeader) {
        String accessToken = authHeader.replace("Bearer ", "");
        authService.withdraw(accessToken);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/admin/users")
    public ResponseEntity<ApiResponse<List<MeResponse>>> getAdminUsers(
            @RequestHeader("Authorization") String authHeader) {
        String accessToken = authHeader.replace("Bearer ", "");
        return ResponseEntity.ok(ApiResponse.ok(authService.getAdminUsers(accessToken)));
    }
}