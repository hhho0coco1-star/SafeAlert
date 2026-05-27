# SafeAlert Todo (2026-05-26 기준)

## ✅ 완료

- **Phase 1-R** — 시/군/구 단위 구독 시스템 (상향 매칭) 전체 완료
- **1-O-1~3** — DisasterAlertClient RCPTN_RGN_NM → 2자리 시도 코드 변환 + DB 검증 완료
- **1-Q-4,5,6,9** — Dashboard·Subscriptions·History·TestPage UI 개선 완료

---

## 🔜 다음 작업 — 우선순위 순

### 1-Q 잔여: 미검증 페이지 5개

| # | 페이지 | 확인 항목 |
|---|--------|-----------|
| 1-Q-8 | `/admin` | 최근 가입 회원 목록 표시 |

---

### 1-A-17~20 + 1-D-10~11: 비밀번호 관련 미구현 항목

Phase 1 미완료 구현 항목.

**백엔드 (auth-service)**

| # | 내용 | 파일 |
|---|------|------|
| 1-A-17 | `POST /api/auth/password/send-reset` — 이메일 입력 → UUID 토큰 생성 → Redis 저장(TTL 10분) → 재설정 링크 메일 발송 | `AuthController`, `PasswordResetService` |
| 1-A-18 | `POST /api/auth/password/reset` — 토큰 검증 → 새 비밀번호 bcrypt 해싱 → DB 저장 → Redis 토큰 삭제 | `PasswordResetService` |
| 1-A-19 | 단위 테스트 — 토큰 만료, 존재하지 않는 이메일, 이미 사용된 토큰 케이스 | `PasswordResetServiceTest` |
| 1-A-20 | `PUT /api/auth/me/password` — 현재 비밀번호 확인 후 새 비밀번호 저장. 소셜 로그인 계정 호출 시 400 반환 (`password_hash = NULL` 체크) | `AuthController`, `AuthService` |

**프론트엔드 (React)**

| # | 내용 | 파일 |
|---|------|------|
| 1-D-10 | `/find-password` — 이메일 입력 폼 → send-reset API 호출 → 발송 완료 안내 | `FindPassword.jsx` |
| 1-D-11 | `/reset-password?token=xxx` — URL 토큰 파라미터 읽기 → 새 비밀번호 입력 폼 → reset API 호출 → 로그인 페이지 이동 | `ResetPassword.jsx` |

> **참고:** 1-A-20 (비밀번호 변경)은 `/profile` 페이지의 비밀번호 변경 카드와 연동. `03_API_DB설계.md` p.188에 설계 명세 있음.

---

---

### 1-S: 기획문서 설계서 업데이트 (문서 작업, 코드 변경 없음)

구현 과정에서 달라진 스펙을 설계서에 반영.

| # | 대상 | 수정 내용 |
|---|------|----------|
| 1-S-1 | `05_프론트엔드_화면설계.md` | 구독 최대 지역 수 5개 → 10개 |
| 1-S-2 | `03_API_DB설계.md` | `notification_history.user_id` NOT NULL → NULL 허용 |
| 1-S-3 | `05_프론트엔드_화면설계.md` | 관리자 통계 API URL `/api/admin/stats/alerts` → `/api/admin/stats` |
| 1-S-4 | `03_API_DB설계.md` | WebSocket 토픽 `/topic/alerts/{regionCode}` → `/topic/public/alerts` |
| 1-S-5 | `05_프론트엔드_화면설계.md` | 컴포넌트 구조 실제 구현 기준으로 업데이트 |
| 1-S-6 | `05_프론트엔드_화면설계.md` | Mock Fallback 현황 업데이트 (제거된 항목 반영) |

---

## ⬜ 이후 Phase

### Phase 3 — 안정성 / 복원력

| # | 내용 |
|---|------|
| 3-1 | Saga 패턴 — 구독 생성 실패 시 보상 트랜잭션 (Outbox 이미 일부 구현됨) |
| 3-2 | Outbox 폴링 스케줄러 완성 — 미발행 이벤트 재처리 |
| 3-3 | Circuit Breaker 임계값 조정 + Fallback 응답 검증 |
| 3-4 | 장애 주입 테스트 — Kafka 중단, Redis 중단 시 서비스 동작 확인 |

### Phase 4 — 관측 가능성

| # | 내용 |
|---|------|
| 4-1 | Prometheus + Micrometer — 각 서비스 `/actuator/prometheus` 노출 |
| 4-2 | Grafana 대시보드 — JVM, Kafka lag, API 응답시간 |
| 4-3 | Jaeger — 분산 트레이싱 (OpenTelemetry 연동) |
| 4-4 | ELK 스택 — Logstash + Elasticsearch + Kibana 로그 수집 |

### Phase 5 — 부하 테스트 + 문서 마무리

| # | 내용 |
|---|------|
| 5-1 | k6 부하 스크립트 — 로그인 + 알림 수신 동시 1000 VU |
| 5-2 | 병목 지점 분석 + 튜닝 |
| 5-3 | README 최종 정리 (아키텍처 다이어그램, 실행 방법) |
| 5-4 | API 명세 문서 (Swagger 또는 Notion) |
