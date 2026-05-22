# SafeAlert 버그 수정 TODO

---

## [완료] 버그 1 — API Gateway JWT 시크릿 불일치

**증상:** 로그인 후 대시보드의 모든 API가 401 Unauthorized

**원인:** api-gateway의 JWT 검증 시크릿이 auth-service 발급 시크릿과 달랐음

**수정:** `api-gateway/src/main/resources/application.yml` 54번 줄 시크릿 값 수정

---

## [완료] 버그 2 — notification-service JWT 시크릿 불일치

**증상:** `/api/notifications/summary`, `/api/notifications?page=0&size=20` → 500

**원인:** notification-service의 JwtProvider가 auth-service와 다른 시크릿으로 JWT 검증 시도 → SignatureException

**수정:** `notification-service/src/main/resources/application.yml` 33번 줄 시크릿 통일

---

## [완료] 버그 3 — subscription-service GlobalExceptionHandler 누락

**증상:** `/api/subscriptions` → 500 (구독 정보 없는 신규 사용자)

**원인:** `findByUserId()` 결과 없음 → IllegalArgumentException 발생 → 핸들러 없어서 500 반환

**수정:** `subscription-service/src/main/java/com/safealert/subscription/exception/GlobalExceptionHandler.java` 신규 생성

---

## [완료] 버그 4 — React StrictMode 이중 호출

**증상:** 같은 API가 콘솔에 2번씩 표시됨

**원인:** React 18 개발 모드 StrictMode의 정상 동작 (운영 빌드에서는 1번만 실행)

**수정:** 수정 불필요

---

## [완료] 버그 5 — axios.js refresh 토큰 중복 요청

**증상:** 401 발생 시 refresh 요청이 여러 번 동시 발생

**원인:** 여러 API가 동시에 401을 받으면 각각 독립적으로 refresh를 시도함. `_retry` 플래그는 각 요청별로 독립적이라 중복 방지 불가

**수정 예정:** `frontend/src/api/axios.js` — `isRefreshing` 플래그 + `failedQueue` 패턴 적용

- [x] axios.js 수정
- [x] 브라우저에서 401 발생 시 refresh 요청 1번만 발생하는지 확인

## [완료] 버그 6 — notifications JPQL LIKE 문법 오류

**증상:** `/api/notifications?page=0&size=20` → 500

**원인:** Hibernate 6에서 `LIKE %:keyword%` 문법 미지원

**수정:** `NotificationHistoryRepository.java` 19번 줄 → `LIKE CONCAT('%',:keyword,'%')` 로 변경

## [완료] 버그 7 — 신규 사용자 구독 없음 NPE

**증상:** `/api/subscriptions` → 400 Bad Request

**원인:** 구독 없는 사용자 → orElseThrow → GlobalExceptionHandler → 400 반환

**수정:**
- `SubscriptionService.java` 34번 줄 → `orElse(null)` 로 변경
- `SubscriptionResponse.java` 32번 줄 → `if (subscription == null) return;` 추가

---

## 진행 순서

1. ~~버그 1 — API Gateway JWT~~ ✅
2. ~~버그 2 — notification-service JWT~~ ✅
3. ~~버그 3 — subscription GlobalExceptionHandler~~ ✅
4. ~~버그 4 — StrictMode~~ ✅ (수정 불필요)
5. ~~버그 5 — axios.js refresh 중복~~ ✅
6. ~~버그 6 — notifications JPQL LIKE 문법~~ ✅
7. ~~버그 7 — 신규 사용자 구독 NPE~~ ✅

---

## [진행중] Phase 1-G — 실시간 테스트 페이지

**목적:** 전국 실시간 알림 수신 현황을 UI에서 직접 확인 (공공데이터 파이프라인 검증용)

**사용 API:**
- `GET /api/alerts/recent` — 초기 알림 목록 로드 (공개 API, 인증 불필요)
- WebSocket `/topic/alerts/{regionCode}` × 17개 지역 — 실시간 수신

- [ ] `frontend/src/pages/TestPage.jsx` 생성
- [ ] `frontend/src/App.jsx` — `/test` 라우트 추가
- [ ] `frontend/src/components/Navbar.jsx` — "실시간 테스트" 탭 추가
