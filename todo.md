# 간편로그인 (OAuth2) 구현 TODO

## 사전 준비

- [x] **Google Cloud Console** OAuth2 앱 등록
  1. console.cloud.google.com → API 및 서비스 → 사용자 인증 정보
  2. OAuth 2.0 클라이언트 ID 생성 (웹 애플리케이션)
  3. 승인된 리디렉션 URI: `http://localhost:8080/api/auth/oauth2/callback/google`
  4. Client ID, Client Secret 메모

- [x] **Kakao Developers** 앱 등록
  1. developers.kakao.com → 내 애플리케이션 → 애플리케이션 추가
  2. 플랫폼 → Web → 사이트 도메인: `http://localhost:5173`
  3. 카카오 로그인 → 활성화 설정 ON
  4. Redirect URI: `http://localhost:8080/api/auth/oauth2/callback/kakao`
  5. 동의항목: 이메일(account_email), 닉네임(profile_nickname) 선택
  6. REST API 키 메모 (Client ID로 사용)

---

## 백엔드 (auth-service)

### 1. build.gradle
- [x] `spring-boot-starter-oauth2-client` 의존성 추가

### 2. User.java 엔티티 수정
- [x] `oauthProvider` 필드 추가 (String, nullable) — "google" | "kakao"
- [x] `oauthId` 필드 추가 (String, nullable) — 소셜 계정 고유 ID
- [x] `password` 컬럼 nullable 변경 (소셜 로그인 사용자는 비밀번호 없음)

### 3. application.yml — OAuth2 클라이언트 설정 추가
- [x] Google 클라이언트 설정
  - client-id, client-secret, scope(email, profile)
  - redirect-uri: `http://localhost:8080/api/auth/oauth2/callback/google`
- [x] Kakao 클라이언트 설정 (커스텀 provider)
  - client-id, redirect-uri, scope
  - provider 설정: authorization-uri, token-uri, user-info-uri, user-name-attribute

### 4. CustomOAuth2UserService.java 생성
- [x] `OAuth2UserService<OAuth2UserRequest, OAuth2User>` 구현
- [x] Google/Kakao 응답에서 email, nickname, oauthId 추출 (provider별 분기)
- [x] DB에서 oauthProvider + oauthId로 기존 사용자 조회
- [x] 신규 사용자면 자동 회원가입 처리
- [x] `DefaultOAuth2User` 반환

### 5. OAuth2LoginSuccessHandler.java 생성
- [x] `SimpleUrlAuthenticationSuccessHandler` 상속
- [x] JWT Access Token + Refresh Token 발급
- [x] Redis에 Refresh Token 저장
- [x] 프론트엔드 콜백으로 리다이렉트:
  `http://localhost:5173/oauth2/success?accessToken=...&refreshToken=...`

### 6. SecurityConfig.java 수정
- [x] sessionManagement → `IF_REQUIRED` 변경 (OAuth2 state 임시 보관용)
- [x] `.oauth2Login()` 추가
  - authorizationEndpoint baseUri: `/api/auth/oauth2`
  - redirectionEndpoint baseUri: `/api/auth/oauth2/callback/*`
  - userService: CustomOAuth2UserService
  - successHandler: OAuth2LoginSuccessHandler
- [x] `requestMatchers("/api/auth/oauth2/**", "/login/oauth2/**").permitAll()` 추가

---

## 프론트엔드

### 7. OAuthSuccess.jsx 생성 (`/oauth2/success` 콜백 페이지)
- [x] URL에서 `accessToken`, `refreshToken` 파싱
- [x] `GET /api/auth/me` 호출로 사용자 정보 조회
- [x] `login()` 컨텍스트로 토큰 + 사용자 저장
- [x] `/dashboard`로 navigate

### 8. App.jsx 수정
- [x] `/oauth2/success` 라우트 추가

### 9. Login.jsx 수정 (로그인 탭 + 회원가입 탭 양쪽)
- [x] Google 버튼 onClick:
  `window.location.href = 'http://localhost:8080/api/auth/oauth2/google'`
- [x] Kakao 버튼 onClick:
  `window.location.href = 'http://localhost:8080/api/auth/oauth2/kakao'`

---

## 검증
- [x] Google 버튼 클릭 → Google 로그인 페이지 이동 확인
- [x] Google 인증 완료 → /oauth2/success → /dashboard 이동 확인
- [x] Kakao 버튼 클릭 → Kakao 로그인 페이지 이동 확인
- [ ] Kakao 인증 완료 → /dashboard 이동 확인 ← KOE205 오류 (아래 참고)
- [x] DB 확인: users 테이블에 oauthProvider, oauthId 저장
- [ ] 동일 소셜 계정 재로그인 → 중복 가입 없이 정상 로그인

### Kakao KOE205 오류 원인 및 해결
- **원인**: application.yml의 scope에 `account_email`이 있으나, Kakao Developers 콘솔 동의항목에서 미활성화
- **해결**: developers.kakao.com → 앱 → 카카오 로그인 → 동의항목 → 이메일(account_email) 선택 동의 또는 필수 동의로 설정
