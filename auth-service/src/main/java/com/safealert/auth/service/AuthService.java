package com.safealert.auth.service;

import com.safealert.auth.domain.User;
import com.safealert.auth.dto.SignupRequest;
import com.safealert.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 가입된 이메일입니다");
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User user = User.create(request.getEmail(), encodedPassword, request.getNickname());
        userRepository.save(user);
    }
}