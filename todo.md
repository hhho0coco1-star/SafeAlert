# SafeAlert Todo (2026-05-26 기준)

## ✅ Phase 1-R 완료 — 시/군/구 단위 구독 시스템 (상향 매칭)

모든 1-R 작업 완료. 5자리 시군구 코드 수집 → Redis 중복 필터 → 상향 매칭 → WebSocket 발송 E2E 검증됨.

---

## 🔜 다음 작업 — 우선순위 순

### 1-O: DISASTER 지역 코드 매핑

✅ 코드 수정 완료 (`DisasterAlertClient.java`) — 1-O-1~3 완료
⏳ **1-O-4 검증 대기** — 전체 서버 기동 후 아래 순서로 검증 필요:
1. `/run` 으로 전체 서버 기동
2. 5분 스케줄러 실행 대기
3. `notification_history` 에서 DISASTER `region_code` 가 숫자 코드(`"44"` 등)인지 확인
4. TestPage 지역별 카운터 합산이 총 수신 건수와 일치하는지 확인

---

### 1-Q: 프론트엔드 9개 페이지 전체 검증

1-R 이후 드롭다운·카운터 변경 사항이 다른 페이지에 영향 없는지 확인.

| # | 페이지 | 확인 항목 |
|---|--------|-----------|
| 1-Q-1 | `/` 랜딩 | CTA 버튼, 소개 텍스트 표시 |
| 1-Q-2 | `/login` | 로그인 성공 → 대시보드 이동, 에러 메시지 |
| 1-Q-3 | `/signup` | 이메일 인증 → 회원가입 완료 흐름 |
| 1-Q-4 | `/dashboard` | 구독 지역·카테고리 표시, 최근 알림 목록 |
| 1-Q-5 | `/subscriptions` | 2단계 드롭다운(시도→시군구), 추가/삭제, 저장 |
| 1-Q-6 | `/history` | 알림 이력 목록, 날짜 필터 |
| 1-Q-7 | `/profile` | 닉네임 수정, 회원 탈퇴 |
| 1-Q-8 | `/admin` | 최근 가입 회원 목록 |
| 1-Q-9 | `/test` | WebSocket 연결, 지역별 카운터 합산, 실시간 피드 |

---

### 1-A-17~19 + 1-D-10~11: 비밀번호 찾기 / 재설정

Phase 1 미완료 항목. 이메일로 재설정 링크 발송 → 토큰 검증 → 새 비밀번호 저장 흐름.

**백엔드 (auth-service)**

| # | 내용 | 파일 |
|---|------|------|
| 1-A-17 | `POST /api/auth/password/send-reset` — 이메일 입력 → UUID 토큰 생성 → Redis 저장(TTL 10분) → 재설정 링크 메일 발송 | `AuthController`, `PasswordResetService` |
| 1-A-18 | `POST /api/auth/password/reset` — 토큰 검증 → 새 비밀번호 bcrypt 해싱 → DB 저장 → Redis 토큰 삭제 | `PasswordResetService` |
| 1-A-19 | 단위 테스트 — 토큰 만료, 존재하지 않는 이메일, 이미 사용된 토큰 케이스 | `PasswordResetServiceTest` |

**프론트엔드 (React)**

| # | 내용 | 파일 |
|---|------|------|
| 1-D-10 | `/find-password` — 이메일 입력 폼 → send-reset API 호출 → 발송 완료 안내 | `FindPassword.jsx` |
| 1-D-11 | `/reset-password?token=xxx` — URL 토큰 파라미터 읽기 → 새 비밀번호 입력 폼 → reset API 호출 → 로그인 페이지 이동 | `ResetPassword.jsx` |

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
