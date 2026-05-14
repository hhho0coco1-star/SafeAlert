package com.safealert.auth.controller;

import com.safealert.auth.domain.User;
import com.safealert.auth.dto.*;
import com.safealert.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
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
}