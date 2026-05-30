# SafeAlert 개발 계획서 (WBS)

---

## 전체 일정 개요

| Phase | 내용 | 기간 | 주요 산출물 | 상태 |
|-------|------|------|-----------|------|
| Phase 0 | 환경 구성 | 1주 | K8s 클러스터, 인프라 배포 | ✅ 완료 |
| Phase 1 | 핵심 서비스 구현 | 3~4주 | Auth, Subscription, API Gateway, React 프론트엔드, 이메일 인증, OAuth2 소셜 로그인, 비밀번호 찾기, 실시간 테스트 페이지, WebSocket 채널 분리, TestPage 알림 상세 표시, 알림 content 필드 정상화, DUST 전국 수집 범위 확장, 지역 코드 불일치 + Recent API 버그 수정, DUST 시/군/구 단위 수집 확장, WEATHER 지역 코드 매핑, 시/군/구 단위 구독 시스템(계층 매칭), 프론트엔드 페이지 전체 검증, DISASTER 지역 코드 매핑, 비밀번호 찾기/재설정 | 🔄 진행 중 |
| Phase 2 | 이벤트 파이프라인 | 3~4주 | Kafka 파이프라인, 실시간 알림 | ✅ 완료 |
| Phase 3 | 안정성 / 복원력 | 2주 | Circuit Breaker, Saga, Outbox | ✅ 완료 |
| Phase 4 | 관측 가능성 | 2주 | Prometheus, Grafana, Jaeger, ELK, K8s 이전 | 🔄 진행 중 |
| Phase 5 | 부하 테스트 및 마무리 | 1주 | 부하 테스트 결과, 문서 | ⬜ 대기 |

**총 예상 기간: 12~14주**

---

## 현재 진행 전략 (2026-05-28 기준)

```
✅ Phase 0     — 인프라 구성 완료
✅ Phase 1-A   — Auth Service 완료
✅ Phase 1-B   — API Gateway 완료 (JWT 필터, Rate Limiting)
✅ Phase 1-C   — Subscription Service 완료
✅ Phase 1-D   — React 프론트엔드 완료 (비밀번호 찾기/재설정 페이지 포함)
✅ Phase 1-E   — OAuth2 소셜 로그인 완료 (Google, Kakao)
✅ Phase 1-H~P — 공공 API 파이프라인 버그 수정 + DUST 시군구 수집 확장 + WEATHER 지역코드 매핑 완료
✅ Phase 1-R   — 시/군/구 단위 구독 시스템 (계층 매칭) 완료
✅ Phase 1-O   — DISASTER 지역 코드 매핑 완료
✅ Phase 1-Q   — 프론트엔드 페이지 전체 검증 완료 (관리자 페이지 포함)
🔄 Phase 1-S   — 기획문서 설계서 업데이트 진행 중 (03_API_DB설계.md 반영 완료, 05_화면설계.md 미완료)
✅ Phase 2-A   — Alert Collector Service 완료 (공공 API 3종 + Kafka + Circuit Breaker + K8s)
✅ Phase 2-B   — Alert Processor Service 완료 (Kafka Consumer + MongoDB + Kafka Producer + K8s Replica 3)
✅ Phase 2-C   — Notification Service 완료 (WebSocket + Kafka Consumer + Redis Pub/Sub)
✅ Phase 3     — 안정성 · 복원력 완료 (Outbox·Kafka·Redis 장애 대응·DUST 버그 수정)
🔄 Phase 4     — 관측 가능성 진행 중 (Prometheus+Grafana 인프라 완료, 대시보드·Jaeger·ELK 잔여)
⬜ Phase 5     — 부하 테스트 및 마무리
```

**현재 작업:** Phase 4-A — Grafana 대시보드 구성

---

## Phase 0 — 환경 구성 ✅

| # | 작업 | 완료 |
|---|------|------|
| 0-1 | minikube 설치 및 클러스터 시작 | [O] |
| 0-2 | Helm 설치 및 저장소 추가 | [O] |
| 0-3 | Kafka 배포 (KRaft 모드) | [O] |
| 0-4 | Redis standalone 배포 | [O] |
| 0-5 | PostgreSQL 배포 (auth/subscription/notification DB) | [O] |
| 0-6 | MongoDB 배포 (event_store) | [O] |
| 0-7 | Namespace 분리 (safealert-app / safealert-infra) | [O] |
| 0-8 | NGINX Ingress Controller 설치 | [O] |
| 0-9 | 인프라 연결 테스트 | [O] |

---

## Phase 1 — 핵심 서비스 구현 ✅

### 1-A. Auth Service ✅

| # | 작업 | 완료 |
|---|------|------|
| 1-A-1 | Spring Boot 프로젝트 생성 및 의존성 설정 | [O] |
| 1-A-2 | User 엔티티, Repository 구현 | [O] |
| 1-A-3 | 회원가입 API (bcrypt 해싱) | [O] |
| 1-A-4 | 로그인 + JWT Access/Refresh Token 발급 | [O] |
| 1-A-5 | Redis에 Refresh Token 저장/검증 | [O] |
| 1-A-6 | 토큰 갱신 / 로그아웃 API | [O] |
| 1-A-7 | K8s Deployment, Service YAML 작성 | [O] |
| 1-A-8 | 단위 테스트 작성 | [O] |
| 1-A-9 | GET /api/auth/me — 내 정보 조회 | [O] |
| 1-A-10 | PUT /api/auth/me — 닉네임 수정 | [O] |
| 1-A-11 | DELETE /api/auth/me — 회원 탈퇴 | [O] |
| 1-A-12 | GET /api/admin/users — 최근 가입 회원 목록 | [O] |
| 1-A-13 | 이메일 인증 코드 발송 API (POST /api/auth/email/send-code) | [O] |
| 1-A-14 | 이메일 인증 코드 확인 API (POST /api/auth/email/verify-code) | [O] |
| 1-A-15 | signup() 이메일 인증 완료 여부 검증 추가 | [O] |
| 1-A-16 | 프론트엔드 회원가입 이메일 인증 UI 및 API 연동 | [O] |
| 1-A-17 | 비밀번호 재설정 이메일 발송 API (POST /api/auth/password/send-reset) | [O] |
| 1-A-18 | 비밀번호 재설정 토큰 검증 + 새 비밀번호 저장 API (POST /api/auth/password/reset) | [O] |
| 1-A-19 | 단위 테스트 (비밀번호 재설정 플로우) | [O] |
| 1-A-20 | 비밀번호 변경 API (PUT /api/auth/me/password) — 현재 비밀번호 확인 후 새 비밀번호 저장, 소셜 로그인 계정 호출 불가 처리 | [O] |

### 1-B. API Gateway ✅

| # | 작업 | 완료 |
|---|------|------|
| 1-B-1 | Spring Cloud Gateway 프로젝트 생성 | [O] |
| 1-B-2 | 라우팅 설정 (각 서비스 경로 매핑) | [O] |
| 1-B-3 | JWT 인증 필터 구현 | [O] |
| 1-B-4 | Rate Limiting 필터 (Redis 기반) | [O] |
| 1-B-5 | K8s 배포 | [O] |

### 1-C. Subscription Service ✅

| # | 작업 | 완료 |
|---|------|------|
| 1-C-1 | 프로젝트 생성 및 엔티티 설계 | [O] |
| 1-C-2 | 구독 CRUD API 구현 | [O] |
| 1-C-3 | 지역 코드 데이터 로드 (행정구역 코드) | [O] |
| 1-C-4 | 구독자 목록 조회 API (Notification Service 호출용) | [O] |
| 1-C-5 | Outbox 테이블 및 발행 스케줄러 구현 | [O] |
| 1-C-6 | Kafka Producer 연동 | [O] |
| 1-C-7 | K8s 배포 | [O] |

### 1-D. React 프론트엔드 ✅

| # | 작업 | 완료 |
|---|------|------|
| 1-D-1 | React 프로젝트 생성 + 라우팅, axios JWT 인터셉터 설정 | [O] |
| 1-D-2 | 랜딩 페이지 `/` | [O] |
| 1-D-3 | 로그인 + 회원가입 페이지 `/login`, `/signup` | [O] |
| 1-D-4 | 메인 대시보드 `/dashboard` | [O] |
| 1-D-5 | 구독 설정 페이지 `/subscriptions` | [O] |
| 1-D-6 | 알림 이력 페이지 `/history` | [O] |
| 1-D-7 | 내 계정 페이지 `/profile` | [O] |
| 1-D-8 | 관리자 대시보드 `/admin` | [O] |
| 1-D-9 | K8s 배포 (Dockerfile + NGINX + K8s YAML) | [O] |
| 1-D-10 | 비밀번호 찾기 페이지 `/find-password` (이메일 입력 → 재설정 메일 발송) | [O] |
| 1-D-11 | 비밀번호 재설정 페이지 `/reset-password` (URL 토큰 파라미터 → 새 비밀번호 입력) | [O] |

> **버그 수정 이력:** 만료된 JWT 토큰이 로그인 요청에 포함되는 버그 수정 (axios 인터셉터 isAuthPath 체크 추가)

### 1-F. 버그 수정 ✅

| # | 작업 | 완료 |
|---|------|------|
| 1-F-1 | API Gateway JWT 시크릿 불일치 수정 (대시보드 전체 401 원인) | [O] |
| 1-F-2 | axios 응답 인터셉터 재시도 루프 방지 로직 개선 | [O] |
| 1-F-3 | Dashboard useEffect React StrictMode 이중 호출 대응 | [O] |
| 1-F-4 | notification-service JWT 시크릿 불일치 수정 (500 원인) | [O] |
| 1-F-5 | subscription-service GlobalExceptionHandler 누락 추가 | [O] |
| 1-F-6 | NotificationHistoryRepository JPQL LIKE CONCAT 수정 (Hibernate 6) | [O] |
| 1-F-7 | 신규 사용자 구독 없음 → orElse(null) + NPE 방어 처리 | [O] |
| 1-F-8 | Dashboard.jsx 구독 응답 형식 불일치 → flatMap 변환 처리 | [O] |

### 1-H. 공공 API 수집 파이프라인 버그 수정 ✅

| # | 작업 | 완료 |
|---|------|------|
| 1-H-1 | alert-collector application.properties Kafka/Redis 기본값 localhost 수정 | [O] |
| 1-H-2 | alert-processor application.properties Kafka/Redis/MongoDB 기본값 localhost 수정 | [O] |
| 1-H-3 | WeatherAlertClient getWthrWrnList 엔드포인트로 교체 + JSON 파싱 | [O] |
| 1-H-4 | DustAlertClient URL 한글 인코딩 수정 (UriComponentsBuilder) | [O] |
| 1-H-5 | DisasterAlertClient API 엔드포인트 교체 (apis.data.go.kr → safetydata.go.kr/V2/api/DSSP-IF-00247) | [O] |
| 1-H-6 | DisasterAlertClient body 배열 파싱 (MSG_CN/SN/CRT_DT/RCPTN_RGN_NM 개별 처리) | [O] |
| 1-H-7 | DisasterAlertClient 중복 필터 SN 기반으로 수정 | [O] |
| 1-H-8 | DisasterAlertClient issuedAt → CRT_DT 사용, region → RCPTN_RGN_NM 사용 | [O] |
| 1-H-9 | DustAlertClient .build(false).encode() + http→https 수정 (한글 인코딩 버그 제거) | [O] |
| 1-H-10 | 서비스 재기동 + 3개 API 실제 수집 검증 (기상청✅ 환경부✅ 행안부✅ 간헐적 오류 Circuit Breaker 방어) | [O] |

---

### 1-I. WebSocket 알림 파이프라인 버그 수정 + 채널 분리 ✅

| # | 작업 | 완료 |
|---|------|------|
| 1-I-1 | alert-processor-service MongoDB 인증 정보 추가 (username/password/auth-db) | [O] |
| 1-I-2 | useWebSocket.js — setTimeout connected=true 제거, onConnect 콜백 추가 | [O] |
| 1-I-3 | TestPage.jsx — 가짜 connected 타이머 제거, onConnect 연결 | [O] |
| 1-I-4 | AlertProcessedConsumer.java — alert:public Redis 채널 추가 발행 | [O] |
| 1-I-5 | AlertPublicSubscriber.java 신규 생성 (/topic/public/alerts WebSocket 발행) | [O] |
| 1-I-6 | RedisConfig.java — alert:public ChannelTopic 리스너 등록 | [O] |
| 1-I-7 | TestPage.jsx — 구독 토픽 17개 → /topic/public/alerts 단일 채널 교체 | [O] |
| 1-I-8 | 검증: 전국 알림 1건 수신 + WebSocket STOMP 연결됨 확인 | [O] |

---

### 1-K. 알림 content 필드 정상화 (DUST · WEATHER) ✅

| # | 작업 | 완료 |
|---|------|------|
| 1-K-1 | DustAlertClient — response JSON 파싱 후 요약 텍스트로 content 생성 | [O] |
| 1-K-2 | WeatherAlertClient — response JSON 파싱 후 기상특보 요약 텍스트로 content 생성 | [O] |
| 1-K-3 | alert-collector-service 재기동 + TestPage content 정상 표시 검증 | [O] |

---

### 1-L. DUST 전국 수집 범위 확장 ✅

| # | 작업 | 완료 |
|---|------|------|
| 1-L-1 | DustAlertClient — 17개 시도 리스트 루프, 시도별 API 호출 후 대표 측정소 1건씩 AlertRawMessage 생성 | [O] |
| 1-L-2 | DustAlertClient — region 필드를 실제 시도명으로 교체, 중복 필터 키를 "DUST+시도명+날짜" 기준으로 수정 | [O] |
| 1-L-3 | alert-collector-service 재기동 + 15개 시도 수집 확인 (15/17, 광주·제주 API 간헐 오류) | [O] |

---

### 1-M. DUST 지역 코드 불일치 + Recent API 버그 수정 ✅

**배경:** 1-L 검증 중 발견. region 필드를 한글 시도명으로 설정하여 downstream 2개 버그 유발

| # | 작업 | 완료 |
|---|------|------|
| 1-M-1 | DustAlertClient — region 필드를 숫자 지역코드(서울→"11", 경기→"41" 등)로 교체 (카운터·broadcast 동시 수정) | [O] |
| 1-M-2 | NotificationHistoryRepository + Service — recent API를 userId=null 공개 이력만 조회 + 조회 수 확대(30건) | [O] |
| 1-M-3 | alert-collector-service + notification-service 재기동 + DB 검증 (DUST 36건·DISASTER 13건, region 숫자 코드 확인) | [O] |

---

### 1-N. DUST 시/군/구 단위 수집 확장 🔄

**배경:** 1-M에서 sido 단위 17건/사이클로 확장했지만 사용자는 시/군/구 단위(수원시·천안시·강남구 등) 데이터를 원함. getMsrstnList API 403 오류(API 키 미등록)로 인해 stationName 끝글자(시/군/구) heuristic으로 대체.

**영향 범위:** alert-collector-service + notification-service 수정. 다른 서비스(processor, subscription, frontend) 무변경.

| # | 작업 | 완료 |
|---|------|------|
| 1-N-1 | MeasureStationCacheService 재작업 — getMsrstnList API 호출 제거, stationName 끝글자(시/군/구) heuristic으로 교체 (임시, 약 49건/사이클) | [O] |
| 1-N-2 | DustAlertClient — parseDustContent(JsonNode) 변경 + content 포맷 `{sigungu} \| PM10...` 으로 교체 | [O] |
| 1-N-3 | DustAlertClient — items 전체 순회 + 시군구 단위 중복 제거(HashSet) + 중복필터 키 `"DUST:{sigungu}:{date}"` 로 변경 + numOfRows 10→100 | [O] |
| 1-N-4 | NotificationHistoryRepository + Service — findTop30 → findTop300 으로 변경 (200건 수집 대응) | [O] |
| 1-N-5 | data.go.kr 측정소정보 API 활용신청 완료 → 승인 후 MeasureStationCacheService getMsrstnList 방식 복원 + Redis 초기화 + 재기동 + DB·TestPage 검증 (200~250건) | [O] |

---

### 1-P. WEATHER 지역 코드 매핑 + content 정상화 ✅

**배경:** WeatherAlertClient가 region="전국" 하드코딩, content는 실제로 없는 필드(warnVar 등) 참조해 항상 "기상특보 발효" 반환.

| # | 작업 | 완료 |
|---|------|------|
| 1-P-1 | WeatherAlertClient — STN_TO_REGION 맵 추가 (stnId → 숫자 시도 코드 17개) | [O] |
| 1-P-2 | WeatherAlertClient — region("전국") → STN_TO_REGION.getOrDefault(stnId, "전국") | [O] |
| 1-P-3 | WeatherAlertClient — parseWeatherContent(String title) 재작성 (title에서 " / " 이후 경보명 추출) | [O] |

---

### 1-R. 시/군/구 단위 구독 시스템 (계층 매칭) 🔄

**배경:** DUST는 시/군/구 단위로 수집되지만 region이 시도 코드("11")로 저장되어 강남구만 구독해도 서울 전체 알림이 옴. 구독 단위를 시/군/구로 확장하고 알림 매칭을 계층 구조로 업그레이드.

**설계 결정사항:**
- 코드 체계: 행정구역 표준 5자리 (예: "11680" 강남구)
- 시드 방식: data.sql 정적 시드(245개) + RegionCodeSyncService로 자동 동기화 (대체)
- 매칭 방향: **상향만** — 시군구 알림은 시도 구독자에게도 발송, 시도 알림은 시군구 구독자에게 전파하지 않음
- 최대 구독 지역: 5개 → **10개**로 확대

**단계 1 — 데이터 모델 확장 ✅**

| # | 작업 | 영향 서비스 | 완료 |
|---|------|------------|------|
| 1-R-1 | 행정구역 표준코드 API 신청 (행정안전부_행정표준코드_법정동코드) | 외부 | [O] |
| 1-R-2a | 임시 시드 SQL 작성 — data.sql에 시군구 228개 추가 (ON CONFLICT DO NOTHING) | subscription-service | [O] |
| 1-R-2b | subscription-service 재기동 + DB 검증 (시도 17 + 시군구 228 = 245개 확인) | subscription-service | [O] |
| 1-R-3 | `/regions/available` API — 트리 구조 응답 (시도 17개 + children: 시군구) 구현 및 검증 | subscription-service | [O] |
| 1-R-2c | RegionCodeSyncService 신설 — @PostConstruct에서 법정동코드 API 호출 → 시도+시군구 자동 동기화 (data.sql 대체) | subscription-service | [O] |

**단계 2 — 매칭 로직 상향 호환 (기존 시도 구독 유지)**

| # | 작업 | 영향 서비스 | 완료 |
|---|------|------------|------|
| 1-R-4 | SubscriptionRepository — 상향 매칭 쿼리 (알림 region이 시군구 코드이면 시군구+부모 시도 구독자 동시 조회) | subscription-service | [O] |
| 1-R-5 | 최대 구독 지역 5개 → 10개 (Subscription 도메인 검증 수정 + 프론트 메시지 수정) | subscription-service + frontend | [O] |
| 1-R-6 | AlertProcessedConsumer — region 코드 길이(2자리=시도, 5자리=시군구)로 판별 후 상향 매칭 구독자 조회 | notification-service | [O] |

**단계 3 — DUST region 시군구 코드로 교체**

| # | 작업 | 영향 서비스 | 완료 |
|---|------|------------|------|
| 1-R-7 | MeasureStationCacheService — addr(주소) 파싱 → 시군구 행정코드(5자리) 반환 메서드 추가 | alert-collector-service | [O] |
| 1-R-8 | DustAlertClient — region을 시도 코드("11") → 시군구 코드("11680")로 교체 | alert-collector-service | [O] |

**단계 4 — 프론트엔드 UI 업그레이드**

| # | 작업 | 영향 서비스 | 완료 |
|---|------|------------|------|
| 1-R-9 | Subscriptions.jsx — 2단계 드롭다운 (시도 선택 → 시군구 선택), "시도 전체" 옵션 유지, 최대 10개 | frontend | [O] |
| 1-R-10 | TestPage.jsx — 5자리 시군구 코드일 때 앞 2자리 시도로 집계 처리 | frontend | [O] |

**단계 5 — E2E 검증**

| # | 작업 | 영향 서비스 | 완료 |
|---|------|------------|------|
| 1-R-11 | E2E 검증 — Redis 5자리 코드 키 생성 ✓ / 서울("11") 구독자가 "11680"(강남구) DUST 알림 수신 ✓ / notification_history 5자리 region_code 저장 ✓ | 전체 | [O] |

---

### 1-Q. 프론트엔드 페이지 전체 검증 및 수정 🔄

**배경:** 공공데이터 파이프라인 구축 집중 기간 중 프론트엔드 페이지 동작 미검증. 구독 설정 페이지부터 정상 작동 여부 불확실.

| # | 페이지 | 경로 | 검증 항목 | 완료 |
|---|--------|------|-----------|------|
| 1-Q-1 | 랜딩 | `/` | 최근 알림 표시, 로그인/회원가입 버튼, 실시간 알림 수신 | [O] |
| 1-Q-2 | 로그인 | `/login` | 이메일/비밀번호 로그인, 소셜 로그인(Google/Kakao), 에러 처리 | [O] |
| 1-Q-3 | 회원가입 | `/signup` | 이메일 인증 코드 발송/확인, 가입 완료 | [O] |
| 1-Q-4 | 대시보드 | `/dashboard` | 실시간 알림 지역·내용 표시, 카테고리 필터 클릭, WebSocket 수신 | [O] |
| 1-Q-5 | 구독 설정 | `/subscriptions` | 2단계 드롭다운(시도→시군구), 추가·삭제, 저장, 토글 버튼 정상 | [O] |
| 1-Q-6 | 알림 이력 | `/history` | 지역명 변환, content 미리보기, 카테고리 필터, 페이지네이션 | [O] |
| 1-Q-7 | 내 계정 | `/profile` | 닉네임 수정, 회원 탈퇴 | [O] |
| 1-Q-8 | 관리자 | `/admin` | 통계 카드, 최근 알림 목록(지역코드→한글·메시지 미리보기·중복 제거·수신자 수 실집계), 수동 발송, 전체 회원 목록·페이지네이션·권한 관리·키워드 검색, 수동 알림 구독자 전달 | [O] |
| 1-Q-9 | 실시간 테스트 | `/test` | 카테고리·지역 AND 필터, 전국 기본값, WebSocket 연결 | [O] |

---

### 1-O. DISASTER 지역 코드 매핑 🔄

**배경:** DISASTER region이 RCPTN_RGN_NM 원문("충청남도 홍성군")으로 저장 → 17개 숫자 코드와 불일치 → TestPage 지역별 카운터 미반영.

| # | 작업 | 완료 |
|---|------|------|
| 1-O-1 | DisasterAlertClient — SIDO_NAME_TO_CODE 맵 추가 + parseRegionCode() 메서드로 RCPTN_RGN_NM → 2자리 시도 코드 변환 | [O] |
| 1-O-2 | DisasterAlertClient — region 필드를 parseRegionCode(regionRaw) 결과로 교체, 매핑 실패 시 "전국" 폴백 | [O] |
| 1-O-3 | 검증 — 전체 서버 기동 후 5분 스케줄러 실행 → notification_history DISASTER region_code 숫자 코드 확인 | [O] |

---

### 1-J. TestPage 알림 상세 내용 표시 ✅

| # | 작업 | 완료 |
|---|------|------|
| 1-J-1 | AlertProcessedConsumer — 구독자 없을 때도 공개 이력 DB 저장 (recent API 빈 배열 버그 수정) | [O] |
| 1-J-2 | TestPage.jsx — title truncate 제거 + content 전체 표시 | [O] |

---

### 1-G. 실시간 테스트 페이지 ✅

| # | 작업 | 완료 |
|---|------|------|
| 1-G-0 | 분석: 수집기 region="전국" 고정 → 17개 지역 분배 broadcast 필요 확인 | [O] |
| 1-G-1 | notification-service AlertProcessedConsumer 수정 (전국 → 17개 지역 코드 분배) | [O] |
| 1-G-2 | TestPage.jsx 생성 (17개 지역 WebSocket 구독 + 카테고리별 피드 UI) | [O] |
| 1-G-3 | App.jsx 라우트 추가 (/test → TestPage, 인증 불필요) | [O] |
| 1-G-4 | Navbar.jsx 첫 번째 탭으로 "실시간 테스트" 추가 (로그인 상태) | [O] |
| 1-G-5 | notification-service 재기동 + 동작 검증 | [O] |

---

### 1-E. OAuth2 소셜 로그인 ✅

| # | 작업 | 완료 |
|---|------|------|
| 1-E-1 | Google OAuth2 앱 등록 + Spring Security OAuth2 Client 설정 | [O] |
| 1-E-2 | Kakao OAuth2 앱 등록 + Spring Security OAuth2 Client 설정 | [O] |
| 1-E-3 | users 테이블 oauth_provider / oauth_id 컬럼 추가 | [O] |
| 1-E-4 | OAuth2 로그인 성공 핸들러 구현 (JWT 발급 + 리다이렉트) | [O] |
| 1-E-5 | 프론트엔드 소셜 로그인 버튼 + 콜백 페이지 추가 | [O] |
| 1-E-6 | API Gateway 화이트리스트에 OAuth2 경로 추가 | [O] |
| 1-E-7 | Redis 기반 OAuth2 state 저장소 구현 (API Gateway 환경 대응) | [O] |
| 1-E-8 | 이메일 우선 조회 + 기존 계정 OAuth 연동 처리 | [O] |
| 1-E-9 | 환경변수 분리 (application-local.yml, gitignore 적용) | [O] |

---

### 1-S. 기획문서 설계서 업데이트 ⬜

**배경:** 구현 과정에서 설계서와 달라진 스펙 6개 발견. 코드 변경 없이 문서만 수정.

| # | 대상 문서 | 수정 내용 | 완료 |
|---|----------|----------|------|
| 1-S-1 | `05_프론트엔드_화면설계.md` | 구독 최대 지역 수 `5개` → `10개` (1-R-5에서 변경) | [O] |
| 1-S-2 | `03_API_DB설계.md` | `notification_history.user_id` NOT NULL → NULL 허용 (공개 이력 저장, 1-M-2에서 변경) | [O] |
| 1-S-3 | `03_API_DB설계.md` | 관리자 통계 API 섹션 정리 — `GET /api/admin/stats/alerts` 미구현 항목 제거 | [O] |
| 1-S-4 | `03_API_DB설계.md` | WebSocket 구독 토픽 `/topic/alerts/{regionCode}` → `/topic/public/alerts` (전국 단일 채널) | [O] |
| 1-S-5 | `03_API_DB설계.md` | 프론트엔드 페이지 목록 실제 구현 기준 업데이트 (11개 페이지 + 미구현 2개 명시) | [O] |
| 1-S-6 | `03_API_DB설계.md` | Subscription Service 추가 API 5개 문서화 (by-region, admin/count 등) | [O] |
| 1-S-7 | `03_API_DB설계.md` | Auth Admin API 추가 — GET /api/auth/admin/users(페이지네이션+키워드), PUT /api/auth/admin/users/{userId}/role | [O] |
| 1-S-8 | `03_API_DB설계.md` | notification_history 테이블 source 컬럼 추가, alert_id·region_code NULL 허용으로 수정 | [O] |

---

## Phase 2 — 이벤트 파이프라인 ✅

### 2-A. Alert Collector Service ✅

> 새로 생성한 독립 마이크로서비스 (포트 8086, K8s safealert-app 네임스페이스)

| # | 작업 | 완료 |
|---|------|------|
| 2-A-1 | 공공데이터포털 API 키 발급 (기상청, 행정안전부, 환경부) | [O] |
| 2-A-2 | 기상청 기상특보 API 연동 | [O] |
| 2-A-3 | 행정안전부 재난문자 API 연동 | [O] |
| 2-A-4 | 환경부 미세먼지 API 연동 | [O] |
| 2-A-5 | Redis 기반 중복 수집 방지 (setIfAbsent TTL 24h) | [O] |
| 2-A-6 | Kafka Producer 연동 (alert.raw 토픽 발행) | [O] |
| 2-A-7 | Circuit Breaker (Resilience4j) 적용 — 3개 API 클라이언트 | [O] |
| 2-A-8 | K8s 배포 (Replica 1, 5분 스케줄러 동작 확인) | [O] |

### 2-B. Alert Processor Service ✅

> 새로 생성한 독립 마이크로서비스 (포트 8087, K8s safealert-app 네임스페이스)

| # | 작업 | 완료 |
|---|------|------|
| 2-B-1 | Kafka Consumer 설정 (alert.raw 구독, group-id: alert-processor-group) | [O] |
| 2-B-2 | 지역 정보 처리 (공공 API 응답의 region 텍스트 그대로 저장) | [O] |
| 2-B-3 | 카테고리 분류 및 심각도 판단 (DISASTER=HIGH, WEATHER/DUST 내용 기반) | [O] |
| 2-B-4 | 중복 알림 필터 (Redis TTL 24시간, processed:seen: 키 prefix) | [O] |
| 2-B-5 | MongoDB event_store 저장 (processed_alerts 컬렉션) | [O] |
| 2-B-6 | Kafka Producer (alert.processed 토픽 발행) | [O] |
| 2-B-7 | K8s 배포 (Replica 3, Consumer Group 파티션 분배 확인) | [O] |

### 2-C. Notification Service ✅

> 기존 notification-service에 WebSocket + Kafka Consumer 추가

**HTTP REST API (선행 구현 완료):**

| # | 작업 | 완료 |
|---|------|------|
| 2-C-1 | GET /api/notifications — 알림 이력 조회 | [O] |
| 2-C-2 | GET /api/alerts/recent — 랜딩용 최근 알림 조회 | [O] |
| 2-C-3 | GET /api/admin/stats — 관리자 요약 통계 | [O] |
| 2-C-4 | GET /api/admin/alerts — 최근 발송 알림 목록 | [O] |
| 2-C-5 | POST /api/admin/alerts/manual — 관리자 수동 알림 발송 | [O] |

**WebSocket + Kafka 파이프라인 (현재 진행 중):**

| # | 작업 | 완료 |
|---|------|------|
| 2-C-6 | build.gradle에 WebSocket + Kafka 의존성 추가 | [O] |
| 2-C-7 | WebSocket + STOMP 설정 (WebSocketConfig) | [O] |
| 2-C-8 | JWT 기반 WebSocket 인증 인터셉터 | [O] |
| 2-C-9 | Kafka Consumer (alert.processed 구독) | [O] |
| 2-C-10 | WebSocket으로 사용자에게 알림 Push | [O] |
| 2-C-11 | 다중 인스턴스 세션 동기화 (Redis Pub/Sub) | [O] |
| 2-C-12 | 프론트엔드 WebSocket 연결 (Landing + Dashboard) | [O] |
| 2-C-13 | K8s 재배포 (WebSocket + Kafka 반영) | [O] |

**Phase 2 완료 기준:**
- 브라우저 랜딩/대시보드에서 실시간 알림 수신 확인
- 공공 API 수집 → Kafka → Processor → Notification → WebSocket Push E2E 동작
- Kafka Consumer Group 다중 인스턴스 정상 동작

---

## Phase 3 — 안정성 / 복원력 🔄

### 3-A. Saga 패턴 구현

> **스킵 결정:** @Transactional + Outbox 조합으로 분산 트랜잭션 원자성 이미 보장됨

| # | 작업 | 완료 |
|---|------|------|
| 3-A-1 | ~~구독 등록 Saga 설계 (Choreography)~~ | 스킵 |
| 3-A-2 | ~~Subscription Service Saga 발행 구현~~ | 스킵 |
| 3-A-3 | ~~Notification Service Saga 소비/응답 구현~~ | 스킵 |
| 3-A-4 | ~~실패 시 보상 트랜잭션 구현~~ | 스킵 |
| 3-A-5 | ~~Saga 흐름 통합 테스트~~ | 스킵 |
| 3-A-6 | Outbox 폴링 스케줄러 완성 — FAILED 재시도(3회 제한) + DEAD 상태 전환 | [O] |
| 3-A-7 | schema.sql — outbox_events 테이블 retry_count 컬럼 추가 | [O] |
| 3-A-8 | DUST 수집 중단 버그 수정 — MeasureStationCacheService 6시간 자동 갱신 + 캐시 없을 시 API 스킵 | [O] |
| 3-A-9 | DUST 수집 주기 5분 → 1시간 변경 (API quota 초과 방지) | [O] |

### 3-B. 장애 주입 테스트

| # | 작업 | 완료 |
|---|------|------|
| 3-B-1 | ~~Notification Pod 강제 종료 → 자동 복구 확인~~ | 스킵 |
| 3-B-2 | Kafka 브로커 중단 → Outbox PENDING 이벤트 쌓임 + 재시작 후 PUBLISHED 전환 확인 | [O] |
| 3-B-3 | Redis 장애 → 503 응답 + Rate Limiting onErrorResume + Lettuce 빠른 실패 설정 | [O] |
| 3-B-4 | 공공 API quota 초과 → Circuit Breaker 미작동 버그 발견 및 근본 원인 수정 | [O] |
| 3-B-5 | ~~Network Partition 시뮬레이션~~ | 스킵 |
| 3-B-6 | 장애 상황별 복구 과정 문서화 | [ ] |

---

## Phase 4 — 관측 가능성 🔄

### 4-A. Prometheus + Grafana

> 구현 방식: docker-compose (K8s Helm 아님)

| # | 작업 | 완료 |
|---|------|------|
| 4-A-1 | docker-compose.yml — Prometheus(9090) 컨테이너 추가 | [O] |
| 4-A-2 | 6개 서비스 build.gradle — micrometer-registry-prometheus + actuator 의존성 추가 | [O] |
| 4-A-3 | prometheus.yml 생성 — 6개 서비스 scrape_config 작성 | [O] |
| 4-A-4 | docker-compose.yml — Grafana(3000) 컨테이너 추가 | [O] |
| 4-A-5 | Grafana 접속 → JVM 대시보드(ID: 4701) import | [O] |
| 4-A-6 | Kafka Consumer Lag 패널 추가 | [O] |
| 4-A-7 | 서비스별 HTTP 메트릭 대시보드 구성 | [ ] |

### 4-B. Jaeger 분산 트레이싱

| # | 작업 | 완료 |
|---|------|------|
| 4-B-1 | docker-compose.yml — Jaeger all-in-one 컨테이너 추가 (16686, 4317 포트) | [O] |
| 4-B-2 | 각 서비스 build.gradle — bootRun javaagent 설정 + application.yml otel 설정 | [O] |
| 4-B-3 | Kafka 메시지에 TraceId 전파 | [ ] |
| 4-B-4 | Jaeger UI에서 E2E 추적 확인 | [O] |
| 4-B-5 | K8s 전환 대비 — otel.exporter.otlp.endpoint, prometheus.yml scrape 주소를 환경변수로 교체 (6개 서비스) | [ ] |

### 4-C. ELK Stack

> 구현 방식: docker-compose + Logstash TCP appender (Filebeat 대신 logback-spring.xml 직접 전송)

| # | 작업 | 완료 |
|---|------|------|
| 4-C-1 | docker-compose.yml — Elasticsearch(9200), Logstash(5044), Kibana(5601) 컨테이너 추가 | [O] |
| 4-C-2 | logstash.conf 작성 — TCP 5044 수신 → safealert-{서비스명}-{날짜} 인덱스로 Elasticsearch 저장 | [O] |
| 4-C-3 | 6개 서비스 build.gradle — logstash-logback-encoder:7.4 의존성 추가 | [O] |
| 4-C-4 | 6개 서비스 logback-spring.xml — CONSOLE + Logstash TCP appender + service_name 필드 추가 | [O] |
| 4-C-5 | ELK 컨테이너 실행 + 서비스 재시작 + Logstash 로그 수신 확인 | [ ] |
| 4-C-6 | Kibana 인덱스 패턴 생성 + 서비스별 로그 검색 확인 | [ ] |

### 4-D. 관측 가능성 스택 K8s 이전

> **추가 이유:** Phase 4-A~C는 docker-compose로 기능을 먼저 검증하는 단계였다.
> Phase 5 k6 부하 테스트에서 HPA 스케일 아웃을 Grafana로 실시간 관측하려면
> 관측 도구가 K8s 안에 있어야 한다. docker-compose 상태로 Phase 5에 진입하면
> 기획서에서 목표로 한 safealert-monitor 네임스페이스가 완성되지 않은 채
> 포트폴리오가 끝나는 문제가 생긴다.

| # | 작업 | 완료 |
|---|------|------|
| 4-D-1 | Prometheus + Grafana → safealert-monitor 네임스페이스 Helm 배포 (kube-prometheus-stack) | [ ] |
| 4-D-2 | Jaeger → safealert-monitor Helm 배포 + otel.exporter.otlp.endpoint 환경변수 적용 (6개 서비스) | [ ] |
| 4-D-3 | ELK → safealert-monitor Helm 배포 + logstash TCP 주소 환경변수 적용 (6개 서비스 logback-spring.xml) | [ ] |
| 4-D-4 | docker-compose.yml 모니터링 스택 제거 + 전체 동작 검증 (Grafana 대시보드 + Jaeger UI + Kibana 접속 확인) | [ ] |

---

## Phase 5 — 부하 테스트 및 마무리 ⬜

### 부하 테스트 시나리오

| 시나리오 | 도구 | 목표 |
|---------|------|------|
| 동시 WebSocket 연결 | k6 | 1,000 동시 연결 유지 |
| 알림 동시 발송 | k6 | 10,000 사용자 동시 알림 수신 |
| API 엔드포인트 부하 | k6 | 500 VU, 에러율 1% 이하 |
| Kafka 처리량 | 자체 스크립트 | 초당 10,000 메시지 처리 |

### 작업 목록

| # | 작업 | 완료 |
|---|------|------|
| 5-1 | k6 설치 및 테스트 스크립트 작성 | [ ] |
| 5-2 | WebSocket 동시 연결 부하 테스트 실행 | [ ] |
| 5-3 | 알림 동시 발송 시뮬레이션 | [ ] |
| 5-4 | 부하 테스트 결과 분석 (Grafana) | [ ] |
| 5-5 | 병목 지점 개선 (DB 인덱스, 캐시 전략 등) | [ ] |
| 5-6 | 재테스트 후 성능 비교 | [ ] |
| 5-7 | 프로젝트 README 작성 | [O] |
| 5-8 | 아키텍처 다이어그램 최종 정리 | [O] |
| 5-9 | 장애 테스트 결과 문서화 | [ ] |
| 5-10 | GitHub 포트폴리오 정리 | [ ] |

### 문서 보완 TODO

| # | 문서 | 완료 |
|---|------|------|
| D-1 | README에 동작 스크린샷/GIF 추가 | [ ] |
| D-2 | 시퀀스 다이어그램 (로그인, 알림 발송 플로우) | [ ] |
| D-3 | 기술 선택 이유 문서 (Kafka vs RabbitMQ, MSA 이유 등) | [ ] |
| D-4 | `.env.example` 파일 작성 | [ ] |
| D-5 | 로컬 실행 가이드 상세화 (트러블슈팅 포함) | [ ] |

---

## 마일스톤

| 마일스톤 | 기준 | 상태 |
|---------|------|------|
| M1: 인프라 완성 | K8s + Kafka + Redis + DB 모두 Running | ✅ 완료 |
| M2: 인증/구독 완성 | 로그인 → JWT → 구독 등록 플로우 동작 | ✅ 완료 |
| M3: 알림 파이프라인 완성 | 공공 API → WebSocket 알림 E2E 동작 | ✅ 완료 |
| M4: 장애 복원력 완성 | Circuit Breaker / Saga / Chaos Test 통과 | ⬜ 대기 |
| M5: 관측 가능성 완성 | Grafana / Jaeger / ELK 모두 동작 | ⬜ 대기 |
| M6: 프로젝트 완료 | 부하 테스트 통과 + 문서 완성 | ⬜ 대기 |

---

## 현재 배포 중인 서비스 현황

| 서비스 | 포트 | Replica | 네임스페이스 |
|--------|------|---------|------------|
| api-gateway | 8080 | 2 | safealert-app |
| auth-service | 8081 | 1 | safealert-app |
| subscription-service | 8085 | 1 | safealert-app |
| notification-service | 8083 | 1 | safealert-app |
| alert-collector-service | 8086 | 1 | safealert-app |
| alert-processor-service | 8087 | 3 | safealert-app |
| frontend | 80 | 1 | safealert-app |
| kafka | 9092 | 1 | safealert-infra |
| postgresql | 5432 | 1 | safealert-infra |
| mongodb | 27017 | 1 | safealert-infra |
| redis-master | 6379 | 1 | safealert-infra |
