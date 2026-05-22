# SafeAlert TODO

---

## [진행중] Phase 1-G — 실시간 테스트 페이지

**목적:** 전국 실시간 알림 수신 현황을 UI에서 직접 확인 (공공데이터 파이프라인 검증용)

**분석 결과 (2026-05-22):**
- 기존 수집기 3종 모두 `region="전국"` 으로 고정 발송
- Redis 채널 `alert:broadcast:전국` 하나만 발행 → 17개 지역 코드 토픽 수신 불가
- `AlertProcessedConsumer` 수정으로 "전국" 수신 시 17개 지역 코드 전체에 분배 broadcast 필요

**사용 API:**
- `GET /api/alerts/recent` — 초기 알림 목록 로드 (공개 API, 인증 불필요)
- WebSocket `/topic/alerts/{regionCode}` × 17개 지역 — 실시간 수신

**작업 목록:**
- [x] 분석 및 계획 수립
- [x] `notification-service` AlertProcessedConsumer 수정 — "전국" → 17개 지역 코드 분배 broadcast
- [x] `frontend/src/pages/TestPage.jsx` 생성
- [x] `frontend/src/App.jsx` — `/test` 라우트 추가
- [x] `frontend/src/components/Navbar.jsx` — 로그인 후 첫 번째 탭으로 "실시간 테스트" 추가
- [x] notification-service 재기동 후 동작 검증 ✅
