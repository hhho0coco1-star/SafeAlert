# SafeAlert 개발 계획서 (WBS)

---

## 전체 일정 개요

| Phase | 내용 | 기간 | 주요 산출물 |
|-------|------|------|-----------|
| Phase 0 | 환경 구성 | 1주 | K8s 클러스터, 인프라 배포 |
| Phase 1 | 핵심 서비스 구현 | 3~4주 | Auth, Subscription, API Gateway |
| Phase 2 | 이벤트 파이프라인 | 3~4주 | Kafka 파이프라인, 실시간 알림 |
| Phase 3 | 안정성 / 복원력 | 2주 | Circuit Breaker, Saga, Outbox |
| Phase 4 | 관측 가능성 | 2주 | Prometheus, Grafana, Jaeger, ELK |
| Phase 5 | 부하 테스트 및 마무리 | 1주 | 부하 테스트 결과, 문서 |

**총 예상 기간: 12~14주**

---

## 현재 진행 전략 (2026-05-16 기준)

Phase 1-A~C, 1-B 완료 후 설계서 전체 검토 결과, 아래 순서로 진행한다.

```
[완료] Phase 0, 1-A(1~8), 1-B, 1-C
         ↓
[1단계] 1-A-9~12  auth-service 프로필 API 추가
        → GET/PUT/DELETE /api/auth/me, GET /api/admin/users
        → auth-service 완전 마무리
         ↓
[2단계] notification-service HTTP API 먼저 구현 (Kafka 없이)
        → GET /api/notifications, GET /api/alerts/recent
        → GET /api/admin/stats·alerts, POST /api/admin/alerts/manual
        → DB + REST API만 완성 → 프론트엔드 전체 언블록
         ↓
[3단계] 1-D  React 프론트엔드 전체 (실제 API 연결)
         ↓
[4단계] Phase 2-A, 2-B  공공 API 수집 + Kafka 파이프라인
         ↓
[5단계] 2-C  WebSocket 실시간 알림 + Kafka Consumer 추가
         ↓
[6단계] 1-E  OAuth2 소셜 로그인
         ↓
[7단계] Phase 3~5  안정성·관측 가능성·부하 테스트
```

**2단계를 Kafka 없이 먼저 진행하는 이유:**
notification-service를 Kafka까지 한 번에 완성하면 2~3주 동안 프론트엔드를 전혀 진행할 수 없다.
HTTP API만 먼저 구현하면 1주일 안에 전체 화면이 실제 데이터로 동작하는 모습을 확인할 수 있다.
Kafka Consumer는 Phase 2-A, 2-B 완료 후 notification-service에 추가하면 된다.

---

## Phase 0 — 환경 구성 (1주)

### 목표
로컬 Kubernetes 클러스터 위에 인프라 컴포넌트를 배포하고 개발 환경을 완성한다.

### 작업 목록

| # | 작업 | 예상 소요 | 완료 |
|---|------|---------|------|
| 0-1 | minikube 설치 및 클러스터 시작 | 0.5일 | [O] |
| 0-2 | Helm 설치 및 저장소 추가 | 0.5일 | [O] |
| 0-3 | Kafka 배포 (apache/kafka KRaft 모드) | 1일 | [O] |
| 0-4 | Redis standalone 배포 | 0.5일 | [O] |
| 0-5 | PostgreSQL 배포 (auth/subscription/notification DB) | 1일 | [O] |
| 0-6 | MongoDB 배포 (event_store) | 0.5일 | [O] |
| 0-7 | Namespace 분리 (app/infra/monitor) | 0.5일 | [O] |
| 0-8 | NGINX Ingress Controller 설치 | 0.5일 | [O] |
| 0-9 | 인프라 연결 테스트 (Redis PING, PostgreSQL DB 조회, Kafka 토픽 생성) | 0.5일 | [O] |

**검증 기준:**
- `kubectl get pods -n safealert-infra` → 모든 Pod Running
- Kafka 토픽 생성/소비 테스트 성공
- Redis, PostgreSQL, MongoDB 접속 확인

---

## Phase 1 — 핵심 서비스 구현 (3~4주)

### 목표
인증, 구독, API Gateway를 구현하여 기본 사용자 흐름을 완성한다.

### 1-A. Auth Service (1주)

| # | 작업 | 예상 소요 | 완료 |
|---|------|---------|------|
| 1-A-1 | Spring Boot 프로젝트 생성 및 의존성 설정 | 0.5일 | [O] |
| 1-A-2 | User 엔티티, Repository 구현 | 0.5일 | [O] |
| 1-A-3 | 회원가입 API 구현 (bcrypt 해싱) | 0.5일 | [O] |
| 1-A-4 | 로그인 + JWT Access/Refresh Token 발급 | 1일 | [O] |
| 1-A-5 | Redis에 Refresh Token 저장/검증 | 0.5일 | [O] |
| 1-A-6 | 토큰 갱신 / 로그아웃 API 구현 | 0.5일 | [O] |
| 1-A-7 | Kubernetes Deployment, Service YAML 작성 | 0.5일 | [O] |
| 1-A-8 | 단위 테스트 작성 | 0.5일 | [O] |
| 1-A-9 | GET /api/auth/me — 내 정보 조회 API 구현 | 0.5일 | [O] |
| 1-A-10 | PUT /api/auth/me — 닉네임 수정 API 구현 | 0.5일 | [O] |
| 1-A-11 | DELETE /api/auth/me — 회원 탈퇴 API 구현 | 0.5일 | [O] |
| 1-A-12 | GET /api/admin/users — 최근 가입 회원 목록 API 구현 | 0.5일 | [O] |

### 1-B. API Gateway (0.5주)

| # | 작업 | 예상 소요 | 완료 |
|---|------|---------|------|
| 1-B-1 | Spring Cloud Gateway 프로젝트 생성 | 0.5일 | [O] |
| 1-B-2 | 라우팅 설정 (각 서비스 경로 매핑) | 0.5일 | [O] |
| 1-B-3 | JWT 인증 필터 구현 | 1일 | [O] |
| 1-B-4 | Rate Limiting 필터 (Redis 기반) | 0.5일 | [O] |
| 1-B-5 | K8s 배포 | 0.5일 | [O] |

### 1-E. OAuth2 간편로그인 (Google + Kakao) — 1-D 완료 후 진행

| # | 작업 | 예상 소요 | 완료 |
|---|------|---------|------|
| 1-E-1 | Google OAuth2 앱 등록 + Spring Security OAuth2 Client 설정 | 0.5일 | [ ] |
| 1-E-2 | Kakao OAuth2 앱 등록 + Spring Security OAuth2 Client 설정 | 0.5일 | [ ] |
| 1-E-3 | users 테이블 oauth_provider / oauth_id 컬럼 추가 | 0.5일 | [ ] |
| 1-E-4 | OAuth2 로그인 성공 핸들러 구현 (JWT 발급 + 리다이렉트) | 1일 | [ ] |
| 1-E-5 | 프론트엔드 소셜 로그인 버튼 + 콜백 페이지 추가 | 0.5일 | [ ] |
| 1-E-6 | API Gateway 화이트리스트에 OAuth2 경로 추가 | 0.5일 | [ ] |

---

### 1-D. React 프론트엔드 (1.5주)

| # | 작업 | 예상 소요 | 완료 |
|---|------|---------|------|
| 1-D-1 | React 프로젝트 생성 + 공통 설정 (라우팅, 헤더/네비, axios JWT 인터셉터) | 0.5일 | [O] |
| 1-D-2 | 랜딩 페이지 `/` (서비스 소개, 로그인/회원가입 진입) | 0.5일 | [O] |
| 1-D-3 | 로그인 + 회원가입 페이지 `/login`, `/signup` | 0.5일 | [O] |
| 1-D-4 | 메인 대시보드 `/dashboard` (구독 현황 + 최근 알림 + WebSocket 실시간 알림) | 1일 | [O] |
| 1-D-5 | 구독 설정 페이지 `/subscriptions` (지역 추가/삭제, 카테고리 선택) | 0.5일 | [ ] |
| 1-D-6 | 알림 이력 페이지 `/history` (과거 알림 목록, 페이지네이션) | 0.5일 | [ ] |
| 1-D-7 | 내 계정 페이지 `/profile` (닉네임/이메일 표시, 로그아웃) | 0.5일 | [ ] |
| 1-D-8 | 관리자 대시보드 `/admin` (통계 조회 + 수동 알림 발송 탭 형식) | 0.5일 | [ ] |
| 1-D-9 | K8s 배포 (Dockerfile + NGINX + K8s YAML) | 0.5일 | [ ] |

### 1-C. Subscription Service (1.5주)

| # | 작업 | 예상 소요 | 완료 |
|---|------|---------|------|
| 1-C-1 | 프로젝트 생성 및 엔티티 설계 | 0.5일 | [O] |
| 1-C-2 | 구독 CRUD API 구현 | 1일 | [O] |
| 1-C-3 | 지역 코드 데이터 로드 (행정구역 코드) | 0.5일 | [O] |
| 1-C-4 | 구독자 목록 조회 API (Notification Service 호출용) | 0.5일 | [O] |
| 1-C-5 | Outbox 테이블 및 발행 스케줄러 구현 | 1일 | [O] |
| 1-C-6 | Kafka Producer 연동 | 0.5일 | [O] |
| 1-C-7 | K8s 배포 | 0.5일 | [O] |

**Phase 1 검증 기준:**
- 회원가입 → 로그인 → JWT 발급 흐름 성공
- API Gateway를 통해 각 서비스 라우팅 동작
- 구독 등록/조회/삭제 API 정상 동작
- Postman 또는 cURL로 전체 플로우 테스트

---

## Phase 2 — 이벤트 파이프라인 구현 (3~4주)

### 목표
공공 API 수집부터 WebSocket 실시간 알림까지 전체 파이프라인을 완성한다.

### 2-A. Alert Collector Service (1주)

| # | 작업 | 예상 소요 | 완료 |
|---|------|---------|------|
| 2-A-1 | 공공데이터포털 API 키 발급 (기상청, 행정안전부, 환경부) | 0.5일 | [ ] |
| 2-A-2 | 기상청 기상특보 API 연동 | 1일 | [ ] |
| 2-A-3 | 행정안전부 재난문자 API 연동 | 1일 | [ ] |
| 2-A-4 | 환경부 미세먼지 API 연동 | 0.5일 | [ ] |
| 2-A-5 | Redis 기반 중복 수집 방지 구현 | 0.5일 | [ ] |
| 2-A-6 | Kafka Producer 연동 (alert.raw 발행) | 0.5일 | [ ] |
| 2-A-7 | Circuit Breaker (Resilience4j) 적용 | 1일 | [ ] |
| 2-A-8 | K8s 배포 및 스케줄러 동작 확인 | 0.5일 | [ ] |

### 2-B. Alert Processor Service (1주)

| # | 작업 | 예상 소요 | 완료 |
|---|------|---------|------|
| 2-B-1 | Kafka Consumer 설정 (alert.raw 구독) | 0.5일 | [ ] |
| 2-B-2 | 지역 코드 매핑 로직 구현 | 1일 | [ ] |
| 2-B-3 | 카테고리 분류 및 심각도 판단 로직 | 0.5일 | [ ] |
| 2-B-4 | 중복 알림 필터 (Redis TTL 24시간) | 0.5일 | [ ] |
| 2-B-5 | MongoDB Event Store 저장 구현 | 0.5일 | [ ] |
| 2-B-6 | Kafka Producer (alert.processed 발행) | 0.5일 | [ ] |
| 2-B-7 | K8s 배포 (Replica 3) | 0.5일 | [ ] |

### 2-C. Notification Service (1.5주)

| # | 작업 | 예상 소요 | 완료 |
|---|------|---------|------|
| 2-C-1 | Spring WebSocket + STOMP 설정 | 1일 | [ ] |
| 2-C-2 | JWT 기반 WebSocket 인증 | 0.5일 | [ ] |
| 2-C-3 | Kafka Consumer (alert.processed 구독) | 0.5일 | [ ] |
| 2-C-4 | Subscription Service에서 구독자 조회 | 0.5일 | [ ] |
| 2-C-5 | WebSocket 세션으로 알림 Push | 1일 | [ ] |
| 2-C-6 | 다중 인스턴스 세션 동기화 (Redis Pub/Sub) | 1일 | [ ] |
| 2-C-7 | 알림 이력 저장 + Outbox 패턴 적용 | 1일 | [ ] |
| 2-C-8 | GET /api/notifications — 알림 이력 조회 HTTP API 구현 | 0.5일 | [O] |
| 2-C-9 | GET /api/alerts/recent — 랜딩용 최근 알림 HTTP API 구현 | 0.5일 | [O] |
| 2-C-10 | GET /api/admin/stats — 관리자 요약 통계 API 구현 | 0.5일 | [O] |
| 2-C-11 | GET /api/admin/alerts — 최근 발송 알림 목록 API 구현 | 0.5일 | [O] |
| 2-C-12 | Retry 로직 (Resilience4j Retry) | 0.5일 | [ ] |
| 2-C-13 | K8s 배포 (Replica 3, HPA 설정) | 0.5일 | [ ] |

**Phase 2 검증 기준:**
- 브라우저에서 WebSocket 연결 후 실시간 알림 수신 확인
- Kafka 토픽 간 메시지 흐름 Kafka UI로 확인
- 공공 API에서 데이터 수집 → 알림 발송까지 E2E 흐름 5초 이내 완료
- 다중 Notification 인스턴스에서 동일 사용자에게 중복 발송 없음 확인

---

## Phase 3 — 안정성 / 복원력 (2주)

### 목표
장애 상황에서도 시스템이 정상 동작하는지 검증하고, 분산 트랜잭션 패턴을 완성한다.

### 3-A. Saga 패턴 구현 (1주)

| # | 작업 | 예상 소요 | 완료 |
|---|------|---------|------|
| 3-A-1 | 구독 등록 Saga 설계 (Choreography) | 0.5일 | [ ] |
| 3-A-2 | Subscription Service Saga 발행 구현 | 1일 | [ ] |
| 3-A-3 | Notification Service Saga 소비/응답 구현 | 1일 | [ ] |
| 3-A-4 | 실패 시 보상 트랜잭션 구현 | 1일 | [ ] |
| 3-A-5 | Saga 흐름 통합 테스트 | 0.5일 | [ ] |

### 3-B. 장애 주입 테스트 (1주)

| # | 작업 | 예상 소요 | 완료 |
|---|------|---------|------|
| 3-B-1 | Notification Pod 강제 종료 → 자동 복구 확인 | 0.5일 | [ ] |
| 3-B-2 | Kafka 브로커 중단 → 메시지 유실 없음 확인 | 1일 | [ ] |
| 3-B-3 | Redis 장애 → Fallback 동작 확인 | 0.5일 | [ ] |
| 3-B-4 | 공공 API 응답 지연 → Circuit Breaker OPEN 확인 | 0.5일 | [ ] |
| 3-B-5 | Network Partition 시뮬레이션 | 0.5일 | [ ] |
| 3-B-6 | 장애 상황별 복구 과정 문서화 | 1일 | [ ] |

**장애 테스트 체크리스트:**
- [ ] Notification Pod 3개 중 1개 종료 → 알림 정상 발송 확인
- [ ] Alert Processor Pod 종료 → Kafka Consumer Rebalancing 확인
- [ ] Redis 접속 불가 → Rate Limit 비활성화 (Fallback) 확인
- [ ] 공공 API Timeout → Circuit Breaker OPEN → 30초 후 HALF_OPEN 전환 확인

---

## Phase 4 — 관측 가능성 (2주)

### 목표
시스템 전체의 상태를 대시보드로 시각화하고, 분산 추적으로 요청 흐름을 추적할 수 있게 한다.

### 4-A. Prometheus + Grafana (1주)

| # | 작업 | 예상 소요 | 완료 |
|---|------|---------|------|
| 4-A-1 | Prometheus Operator Helm 배포 | 0.5일 | [ ] |
| 4-A-2 | 각 서비스 Micrometer + Actuator 설정 | 0.5일 | [ ] |
| 4-A-3 | ServiceMonitor 리소스 생성 | 0.5일 | [ ] |
| 4-A-4 | Grafana 배포 및 Prometheus 데이터소스 연결 | 0.5일 | [ ] |
| 4-A-5 | 서비스별 HTTP 메트릭 대시보드 구성 | 1일 | [ ] |
| 4-A-6 | Kafka Consumer Lag 대시보드 구성 | 0.5일 | [ ] |
| 4-A-7 | JVM 메트릭 대시보드 구성 | 0.5일 | [ ] |
| 4-A-8 | 알림 임계치 설정 (AlertManager) | 0.5일 | [ ] |

### 4-B. Jaeger 분산 트레이싱 (0.5주)

| # | 작업 | 예상 소요 | 완료 |
|---|------|---------|------|
| 4-B-1 | Jaeger Helm 배포 | 0.5일 | [ ] |
| 4-B-2 | 각 서비스 OpenTelemetry 설정 | 1일 | [ ] |
| 4-B-3 | Kafka 메시지에 TraceId 전파 | 0.5일 | [ ] |
| 4-B-4 | Jaeger UI에서 E2E 추적 확인 | 0.5일 | [ ] |

### 4-C. ELK Stack (0.5주)

| # | 작업 | 예상 소요 | 완료 |
|---|------|---------|------|
| 4-C-1 | Elasticsearch + Kibana 배포 | 0.5일 | [ ] |
| 4-C-2 | Filebeat DaemonSet 배포 | 0.5일 | [ ] |
| 4-C-3 | 각 서비스 JSON 로그 포맷 통일 | 0.5일 | [ ] |
| 4-C-4 | Kibana 로그 검색 인덱스 패턴 설정 | 0.5일 | [ ] |

**Phase 4 검증 기준:**
- Grafana에서 모든 서비스의 요청 수 / 에러율 / 응답 시간 확인
- Kafka lag이 0에 수렴하는 그래프 확인
- Jaeger UI에서 공공 API 수집 → Kafka → 알림 발송까지 TraceId 연결 확인
- Kibana에서 ERROR 로그 필터링 조회 확인

---

## Phase 5 — 부하 테스트 및 마무리 (1주)

### 목표
실제 대규모 트래픽을 시뮬레이션하고, 성능 병목을 개선하여 프로젝트를 완성한다.

### 부하 테스트 시나리오

| 시나리오 | 도구 | 목표 |
|---------|------|------|
| 동시 WebSocket 연결 | k6 | 1,000 동시 연결 유지 |
| 알림 동시 발송 | k6 | 10,000 사용자 동시 알림 수신 |
| API 엔드포인트 부하 | k6 | 500 VU, 에러율 1% 이하 |
| Kafka 처리량 | 자체 스크립트 | 초당 10,000 메시지 처리 |

### 작업 목록

| # | 작업 | 예상 소요 | 완료 |
|---|------|---------|------|
| 5-1 | k6 설치 및 테스트 스크립트 작성 | 1일 | [ ] |
| 5-2 | WebSocket 동시 연결 부하 테스트 실행 | 0.5일 | [ ] |
| 5-3 | 알림 동시 발송 시뮬레이션 | 0.5일 | [ ] |
| 5-4 | 부하 테스트 결과 분석 (Grafana) | 0.5일 | [ ] |
| 5-5 | 병목 지점 개선 (DB 인덱스, 캐시 전략 등) | 1일 | [ ] |
| 5-6 | 재테스트 후 성능 비교 | 0.5일 | [ ] |
| 5-7 | 프로젝트 README 작성 | 0.5일 | [O] |
| 5-8 | 아키텍처 다이어그램 최종 정리 | 0.5일 | [O] |
| 5-9 | 장애 테스트 결과 문서화 | 0.5일 | [ ] |
| 5-10 | GitHub 포트폴리오 정리 | 0.5일 | [ ] |

### 문서 보완 TODO (프로젝트 완성 후 진행)

> 아래 항목은 Phase 2 이후 프로젝트가 더 완성된 시점에 작성한다.

| # | 문서 | 작성 시점 | 완료 |
|---|------|---------|------|
| D-1 | README에 동작 스크린샷/GIF 추가 | 1-D 프론트엔드 완성 후 | [ ] |
| D-2 | 시퀀스 다이어그램 (로그인, 알림 발송 플로우) | Phase 2 완성 후 | [ ] |
| D-3 | 기술 선택 이유 문서 (Kafka vs RabbitMQ, MSA 이유 등) | Phase 3 완성 후 | [ ] |
| D-4 | `.env.example` 파일 작성 | Phase 2 완성 후 | [ ] |
| D-5 | 로컬 실행 가이드 상세화 (트러블슈팅 포함) | 전체 완성 후 | [ ] |

---

## 마일스톤

| 마일스톤 | 기준 | 목표 주차 |
|---------|------|---------|
| M1: 인프라 완성 | K8s + Kafka + Redis + DB 모두 Running | 1주차 |
| M2: 인증/구독 완성 | 로그인 → JWT → 구독 등록 플로우 동작 | 4주차 |
| M3: 알림 파이프라인 완성 | 공공 API → WebSocket 알림 E2E 동작 | 8주차 |
| M4: 장애 복원력 완성 | Circuit Breaker / Saga / Chaos Test 통과 | 10주차 |
| M5: 관측 가능성 완성 | Grafana / Jaeger / ELK 모두 동작 | 12주차 |
| M6: 프로젝트 완료 | 부하 테스트 통과 + 문서 완성 | 13주차 |

---

## 기술 학습 우선순위

| 선학습 필요 항목 | 참고 자료 |
|--------------|---------|
| Kafka 기본 개념 (토픽/파티션/컨슈머 그룹) | Kafka 공식 문서, Udemy |
| Kubernetes 기본 (Pod/Deployment/Service) | k8s 공식 튜토리얼 |
| Spring Cloud Gateway 설정 | Spring 공식 문서 |
| Resilience4j Circuit Breaker | GitHub 공식 예제 |
| Transactional Outbox 패턴 | microservices.io |
| Saga Choreography 패턴 | microservices.io |
