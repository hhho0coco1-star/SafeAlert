package com.safealert.auth.handler;

import com.safealert.auth.domain.User;
import com.safealert.auth.repository.UserRepository;
import com.safealert.auth.security.JwtProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

//특정 이벤트가 발생했을 때 실행되는 처리기 클래스
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtProvider jwtProvider; // 토큰 발급 및 검증기
    private final UserRepository userRepository; // 회원정보 데이터베이스 문지기
    private final RedisTemplate<String, String> redisTemplate; // 초고속 임시 저장소

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess (HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String provider = determineProvider(oAuth2User);
        String oauthId = determineOauthId(oAuth2User, provider);

        User user = userRepository.findByOauthProviderAndOauthId(provider, oauthId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        String accessToken = jwtProvider.generateAccessToken(user.getUserId(), user.getRole());
        String refreshToken = jwtProvider.generateRefreshToken(user.getUserId());

        redisTemplate.opsForValue().set(
            "token:refresh:" + user.getUserId(),
            refreshToken,
            7, TimeUnit.DAYS
        );

        String redirectUrl = frontendUrl + "/oauth2/success"
                + "?accessToken=" + accessToken
                + "&refreshToken=" + refreshToken;
        
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }

        private String determineProvider(OAuth2User oAuth2User) {
        if (oAuth2User.getAttribute("sub") != null) {
            return "google";
        }
        return "kakao";
    }

    private String determineOauthId(OAuth2User oAuth2User, String provider) {
        if ("google".equals(provider)) {
            return oAuth2User.getAttribute("sub");
        }
        Object kakaoId = oAuth2User.getAttribute("id");
        return String.valueOf(kakaoId);
    }
}

