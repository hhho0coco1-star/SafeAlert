package com.safealert.auth.service;

import com.safealert.auth.domain.User;
import com.safealert.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate = new DefaultOAuth2UserService();
        OAuth2User oAuth2User = delegate.loadUser(userRequest);

        String provider = userRequest.getClientRegistration().getRegistrationId(); // "google" or "kakao"
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String oauthId;
        String email;
        String nickname;

        if ("google".equals(provider)) {
            oauthId = (String) attributes.get("sub");
            email = (String) attributes.get("email");
            nickname = (String) attributes.get("name");
        } else { // kakao
            oauthId = String.valueOf(attributes.get("id"));
            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            email = (String) kakaoAccount.get("email");
            Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
            nickname = (String) profile.get("nickname");
        }

        userRepository.findByOauthProviderAndOauthId(provider, oauthId)
                .orElseGet(() -> userRepository.findByEmail(email)
                        .map(existing -> {
                            existing.updateOauth(provider, oauthId);
                            return userRepository.save(existing);
                        })
                        .orElseGet(() -> userRepository.save(
                                User.createOAuth(email, nickname, provider, oauthId))));

        return new DefaultOAuth2User(
                oAuth2User.getAuthorities(),
                attributes,
                "google".equals(provider) ? "sub" : "id"
        );
    }
}
