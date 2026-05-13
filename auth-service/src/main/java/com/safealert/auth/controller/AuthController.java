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
}