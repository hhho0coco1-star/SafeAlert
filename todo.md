# SafeAlert TODO

---

## [완료] Phase 1-G — 실시간 테스트 페이지

**목적:** 전국 실시간 알림 수신 현황을 UI에서 직접 확인 (공공데이터 파이프라인 검증용)

**작업 목록:**
- [x] 분석 및 계획 수립
- [x] `notification-service` AlertProcessedConsumer 수정 — "전국" → 17개 지역 코드 분배 broadcast
- [x] `frontend/src/pages/TestPage.jsx` 생성
- [x] `frontend/src/App.jsx` — `/test` 라우트 추가
- [x] `frontend/src/components/Navbar.jsx` — 로그인 후 첫 번째 탭으로 "실시간 테스트" 추가
- [x] notification-service 재기동 후 동작 검증 ✅

---

## [진행중] Phase 1-H — 공공 API 수집 파이프라인 버그 수정

**분석 결과 (2026-05-22):**
- 기상청 API: `tmFc` 필수 파라미터 누락 → 매번 `NO_MANDATORY_REQUEST_PARAMETERS_ERROR`
- 환경부 API: URL에 한글(`서울`) 인코딩 안 됨 → `400 Bad Request`
- 행정안전부 API: 키 `43K1J1M92B0J4S30` 유효성 불명확 → `500 Unexpected errors`
- alert-collector / alert-processor: Kafka 기본값 `kafka:9092` → 호스트 실행 시 연결 불가

**작업 목록:**
- [ ] alert-collector `application.properties` — Kafka/Redis 기본값 `localhost` 수정
- [ ] alert-processor `application.properties` — Kafka/Redis/MongoDB 기본값 `localhost` 수정
- [ ] `WeatherAlertClient.java` — `tmFc` 동적 생성 추가 (최근 6시간 단위 발표시각)
- [ ] `DustAlertClient.java` — URL 한글 인코딩 수정 (`UriComponentsBuilder` 사용)
- [ ] `DisasterAlertClient.java` — API 키 유효성 확인 및 URL 인코딩 수정
- [ ] 서비스 재기동 후 실제 데이터 수집 검증
