# SafeAlert Todo (2026-06-22 기준)

---

## ✅ 완료된 작업

- Phase 0~4 전체 완료
- Phase 5: k6 부하 테스트, HikariCP 개선, Swagger UI, README 정리, 기술선택 이유 문서, 시퀀스 다이어그램, 장애 테스트 결과 문서, 트러블슈팅 가이드
- Phase 6: AWS EC2 t3.xlarge minikube 전체 배포 + HPA 스케일아웃(2→4) 검증 + README 반영 완료
- 데모 영상 촬영 완료 (파트 A 로컬 + 파트 B AWS EC2 K8s HPA)
- AWS EC2 인스턴스 종료(Terminate) → 과금 완전 중단

---

## 🔜 남은 작업

### 🔴 버그·보안 수정 (우선순위 높음)

- [x] **[버그] validateAdmin() ADMIN 역할 검증 누락** ✅
  - auth-service JwtProvider: `generateAccessToken(userId, role)` — role 클레임 추가
  - AuthService.login(), OAuth2LoginSuccessHandler: `generateAccessToken(userId, role)` 호출로 변경
  - notification-service JwtProvider: `getRole(token)` 메서드 추가
  - NotificationService.validateAdmin(): role 꺼내서 ADMIN 아니면 예외 발생으로 수정

- [x] **[버그] Docker 환경 JWT Secret 불일치 → 모든 API 401** ✅
  - auth-service/application.yml: secret 하드코딩 → `${JWT_SECRET:safealert-jwt-secret-key-...-for-hs256}` 환경변수화
  - docker-compose.yml: auth-service 환경변수 블록에 `JWT_SECRET` 추가 (gateway/notification과 동일값)

- [x] **[보안] Gmail 앱 비밀번호 소스코드 노출** ✅
  - application.yml: `username`, `password` 기본값 제거 → `${MAIL_USERNAME}`, `${MAIL_PASSWORD}` 환경변수만 참조
  - application-local.yml: 실제 값 이동 (gitignore 대상이라 커밋 안 됨)

- [x] **[보안] 공공 API 키 하드코딩** ✅
  - application.properties: API 키 3개 → `${WEATHER_API_KEY}`, `${DISASTER_API_KEY}`, `${DUST_API_KEY}` 환경변수로 교체
  - .gitignore: `application-local.properties` 추가
  - application-local.properties 생성: 실제 키 값 보관 (gitignore 대상)
  - docker-compose.yml: alert-collector-service에 API 키 환경변수 3개 추가

### 🟡 품질 개선 (우선순위 보통)

- [x] **[성능] notification-service show-sql: true → false 변경** ✅
  - notification-service/application.yml 18번째 줄: `show-sql: true` → `false`

- [x] **[성능] 구독자 알림 저장 N+1 → saveAll() 일괄 처리** ✅
  - AlertProcessedConsumer.java 85번째 줄: for문 개별 `save()` → stream + `saveAll()` 일괄 처리로 변경

- [x] **[보안] 이메일 인증 코드 `new Random()` → `SecureRandom` 교체** ✅
  - AuthService.java: import `java.util.Random` → `java.security.SecureRandom` 교체
  - 177번째 줄: `new Random().nextInt()` → `new SecureRandom().nextInt()` 변경

### 🔵 런타임 검증 (docker-compose up 필요)

- [ ] **validateAdmin() role 검증 확인**
  - 일반 유저 로그인 → `GET /api/admin/stats` 호출 → 400 응답 확인
  - 관리자 로그인 → 동일 API 호출 → 정상 응답 확인

- [ ] **Docker JWT Secret 수정 검증**
  - `docker-compose up` 실행 후 로그인 → 구독 조회·알림 API 호출 → 401 없이 정상 응답 확인

- [ ] **Gmail 비밀번호 환경변수화 검증**
  - 회원가입 → 이메일 인증 코드 실제 수신 확인

- [ ] **공공 API 키 환경변수화 검증**
  - alert-collector-service 기동 로그에서 수집 성공 메시지 확인
  - `[스케줄러] 기상청 수집 완료 - N건` 로그 출력 여부

### 영상 편집 및 README 업데이트

- [x] 파트 A + 파트 B Clipchamp(클립챔프)에서 합치기 ✅
- [x] 영상 편집 (장면 3·장면 7 비중 크게) ✅
- [x] 포트폴리오 업로드 완료 ✅
- [x] 유튜브 업로드 완료 ✅ (https://youtu.be/hhbrZ7_pNX4)
- [x] README 데모 섹션 수정 — 유튜브 썸네일 + 링크 방식(A) 적용 ✅
- [x] README 수정 후 커밋 + push ✅
