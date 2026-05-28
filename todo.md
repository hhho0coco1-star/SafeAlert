# SafeAlert Todo (2026-05-28 기준)

## ✅ 완료

- **Phase 1-R** — 시/군/구 단위 구독 시스템 (상향 매칭) 전체 완료
- **1-O-1~3** — DisasterAlertClient RCPTN_RGN_NM → 2자리 시도 코드 변환 + DB 검증 완료
- **1-Q-4,5,6,9** — Dashboard·Subscriptions·History·TestPage UI 개선 완료
- **1-Q-7** — Profile 소셜 로그인 계정 비밀번호 카드 비활성화 (oauthProvider 필드 추가)
- **1-Q-8** — Admin 대시보드 전체 검증 완료 (통계 카드, 회원 목록·페이지네이션·권한 관리·키워드 검색, 수동 발송 구독자 전달)
- **1-Q-8 개선** — 최근 발송 알림 UI 개선 (지역코드→한글 변환, 메시지 미리보기, 중복 제거, 수신자 수 실집계, 목록 스크롤)
- **1-A-20** — 비밀번호 변경 API (PUT /api/auth/me/password) 구현 완료
- **1-S-2,3,4,5,6,7,8** — 03_API_DB설계.md 실제 구현 기준 동기화 완료
- **1-A-17** — POST /api/auth/password/send-reset 구현 완료 (소셜 로그인 계정 무시 처리 포함)
- **1-A-18** — POST /api/auth/password/reset 구현 완료
- **1-D-10** — /find-password 페이지 구현 완료
- **1-D-11** — /reset-password 페이지 구현 완료

---

## ✅ 완료 (추가)

- **1-A-19** — 비밀번호 재설정 단위 테스트 작성 완료 (토큰만료·재사용·존재하지않는이메일·OAuth계정 4케이스)
- **1-S-1** — `05_프론트엔드_화면설계.md` 업데이트 완료 (지역 최대 10개, WebSocket 토픽 단일화, 비밀번호 찾기/재설정 페이지 추가)

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
