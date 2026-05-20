# 이메일 인증 구현 TODO

## 사전 준비
- [x] Gmail 앱 비밀번호 발급 (Google 계정 → 보안 → 2단계 인증 → 앱 비밀번호)

---

## 백엔드 (auth-service)

### 1. build.gradle
- [x] `spring-boot-starter-mail` 의존성 추가

### 2. application.yml
- [x] Gmail SMTP 설정 추가
  ```yaml
  spring:
    mail:
      host: smtp.gmail.com
      port: 587
      username: ${MAIL_USERNAME:your@gmail.com}
      password: ${MAIL_PASSWORD:your-app-password}
      properties:
        mail.smtp.auth: true
        mail.smtp.starttls.enable: true
  ```

### 3. DTO 생성
- [x] `SendCodeRequest.java` 생성 — 필드: `email`
- [x] `VerifyCodeRequest.java` 생성 — 필드: `email`, `code`

### 4. AuthService.java
- [x] `JavaMailSender mailSender` 주입 추가
- [x] `sendVerificationCode(String email)` 메서드 구현
  - [x] 이미 가입된 이메일이면 예외 처리
  - [x] 6자리 난수 코드 생성 (`String.format("%06d", random.nextInt(1000000))`)
  - [x] Redis `email:verify:code:{email}` 저장 (TTL 5분)
  - [x] JavaMailSender로 인증 메일 발송
- [x] `verifyCode(String email, String code)` 메서드 구현
  - [x] Redis에서 코드 조회 → 없거나 불일치 시 예외
  - [x] 코드 삭제 후 `email:verify:done:{email}` = `"true"` 저장 (TTL 30분)
- [x] `signup()` 수정
  - [x] 가입 전 `email:verify:done:{email}` Redis 확인 → 없으면 예외

### 5. AuthController.java
- [x] `POST /api/auth/email/send-code` 엔드포인트 추가
- [x] `POST /api/auth/email/verify-code` 엔드포인트 추가

---

## 프론트엔드 (Login.jsx)

### 상태(state) 변경
- [ ] `lastName`, `firstName` 제거 → `nickname` 단일 state로 교체
- [ ] `codeSent` (boolean) state 추가 — 코드 발송 여부
- [ ] `code` (string) state 추가 — 사용자 입력 코드
- [ ] `codeVerified` (boolean) state 추가 — 인증 완료 여부
- [ ] `timer` (number) state 추가 — 카운트다운 초 (300 = 5분)

### UI 변경
- [ ] 이름 입력: 성+이름 2칸 → 닉네임 1칸으로 교체
- [ ] 이메일 필드 아래 [인증코드 발송] 버튼 추가
- [ ] `codeSent === true`일 때 코드 입력 필드 + 카운트다운 타이머 + [확인] 버튼 표시
- [ ] `codeVerified === true`일 때 ✓ 이메일 인증 완료 배지 표시
- [ ] 타이머 만료 시 [재발송] 버튼 활성화
- [ ] 회원가입 버튼: `codeVerified === false`이면 `disabled`

### API 연동
- [ ] `POST /api/auth/email/send-code` 호출 연동 (이메일 발송)
- [ ] `POST /api/auth/email/verify-code` 호출 연동 (코드 확인)
- [ ] API 요청 payload에서 `nickname: lastName + firstName` → `nickname` 단일 필드로 수정

---

## 검증
- [ ] `http://localhost:5173/login?mode=signup` 접속
- [ ] 이메일 입력 → [인증코드 발송] → Gmail 수신함에서 코드 확인
- [ ] 코드 입력 → [확인] → ✓ 배지 표시 확인
- [ ] 나머지 입력 후 [회원가입] → 대시보드 이동 확인
- [ ] 인증 없이 가입 시도 → 서버 오류 메시지 표시 확인
