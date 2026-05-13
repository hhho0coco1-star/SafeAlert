package com.safealert.auth.controller;

import com.safealert.auth.dto.ApiResponse;
import com.safealert.auth.dto.SignupRequest;
import com.safealert.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.safealert.auth.dto.LoginRequest;
import com.safealert.auth.dto.TokenResponse;
import org.springframework.http.HttpHeaders;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // "회원가입 요청을 받아서 처리하고, 성공했다는 응답을 보내주는 창구" 역할
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<Void>> signup(@Valid @RequestBody SignupRequest request) {
        // ResponseEntity<ApiResponse<Void>>
        // @RequestBody -> 사용자가 보낸 데이터(ID, 비밀번호 등)를 SignupRequest라는 자바 객체에 통째로 담겠다는 뜻
        // @Valid -> "데이터가 들어오자마자 제대로 된 형식인지 검사해라"라는 뜻
        authService.signup(request);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenResponse>> login(@Valid @RequestBody LoginRequest request) {
        TokenResponse tokenResponse = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok(tokenResponse));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<String>> refresh(@RequestBody String refreshToken) {
        String newAccessToken = authService.refresh(refreshToken);
        return ResponseEntity.ok(ApiResponse.ok(newAccessToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @org.springframework.web.bind.annotation.RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
        // ResponseEntity<...> (가장 바깥 상자 - HTTP 상태 코드)
        // ApiResponse<...> (중간 상자 - 공통 응답 포맷)
        // <Void> (가장 안쪽 - 데이터 내용물)
        String accessToken = authHeader.replace("Bearer ", "");
        authService.logout(accessToken);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}