# SafeAlert 기술 결정 근거 (Architecture Decision Records)

> 이 문서는 각 기술 선택의 **왜** 를 기록한다.
> 면접에서 "왜 이 기술을 썼나요?" 질문에 이 문서의 내용으로 답변하라.

---

## ADR-001: 메시지 브로커로 Kafka를 선택한 이유

### 상태
결정됨

### 맥락
Alert Collector → Alert Processor → Notification Service 사이에서
재난 알림 메시지를 안정적으로 전달해야 한다.
메시지 유실 시 실제 재난 상황에서 사용자가 알림을 못 받을 수 있다.

### 선택지 비교

| 선택지 | 장점 | 단점 |
|--------|------|------|
| RabbitMQ | 설정 간단, 라우팅 유연 | 메시지 영속성 약함, 대용량 처리 한계 |
| Redis Pub/Sub | 매우 빠름, 이미 사용 중 | 영속성 없음 (구독자 없으면 메시지 유실) |
| **Kafka** ✅ | 영속성, Consumer 재처리, 파티션 기반 확장, Consumer Lag 모니터링 | 운영 복잡도, Zookeeper 필요 |

### 결정
**Kafka** 선택.

재난 알림은 유실되면 안 된다는 도메인 특성상 메시지 영속성이 필수다.
또한 Notification Service를 3개 인스턴스로 확장할 때 파티션 기반으로 자연스럽게 부하가 분산된다.
Redis Pub/Sub는 이미 WebSocket 세션 동기화 용도로 사용 중이라, 중요 메시지 파이프라인에는 Kafka를 분리 적용했다.

### 결과

**트레이드오프:**
- Consumer가 재시작해도 마지막 offset부터 재처리 가능 → 유실 없음
- Kafka Consumer Lag 모니터링으로 처리 지연을 수치로 파악 가능
- 단, 로컬 환경에서 Kafka + Zookeeper Pod 리소스 소모 큼 (minikube 메모리 최소 8GB 필요)

---

## ADR-002: 인프라로 Docker Compose 대신 Kubernetes를 선택한 이유

### 상태
결정됨

### 맥락
8개 마이크로서비스와 5개 미들웨어를 로컬에서 운영해야 한다.
포트폴리오 목적이므로 실제 운영 환경과 가장 가까운 구성을 선택해야 한다.

### 선택지 비교

| 선택지 | 장점 | 단점 |
|--------|------|------|
| Docker Compose | 설정 간단, 빠른 시작 | HPA 없음, 자동 복구 제한, 실무 K8s와 괴리 |
| **Kubernetes (minikube)** ✅ | 실무와 동일 API, HPA/자동복구/Namespace 지원 | 러닝커브 높음, 리소스 많이 사용 |
| K3s | K8s보다 가볍고 빠름 | 일부 기능 제한, minikube보다 생태계 작음 |

### 결정
**Kubernetes (minikube)** 선택.

이 프로젝트의 핵심 학습 목표 중 하나가 "고가용성의 확장 가능한 시스템 설계와 운영"이다.
HPA, ReplicaSet, Liveness/Readiness Probe는 Docker Compose에서 지원하지 않는다.
minikube와 실제 EKS의 API가 동일하므로 취업 후 전환 비용이 최소화된다.

### 결과

**트레이드오프:**
- HPA, 자동 복구, Namespace 분리 → 실무 운영 경험 가능
- minikube 구동에 CPU 4코어, 메모리 8GB 이상 필요
- 초기 설정 비용(YAML 작성, Helm 학습)이 Docker Compose 대비 높음

---

## ADR-003: 모놀리식 대신 MSA 구조를 선택한 이유

### 상태
결정됨

### 맥락
이 프로젝트는 1인 개발 포트폴리오다.
MSA는 팀 단위 협업에 유리하지만 1인 프로젝트에는 오버엔지니어링일 수 있다.

### 선택지 비교

| 선택지 | 장점 | 단점 |
|--------|------|------|
| 모놀리식 | 개발 빠름, 배포 단순, 디버깅 쉬움 | 학습 목표인 MSA 기술 경험 불가 |
| **MSA** ✅ | Kafka/Saga/CQRS 자연스럽게 적용, 서비스 독립 배포 경험 | 개발 복잡도 높음, 분산 디버깅 어려움 |

### 결정
**MSA** 선택.

이 프로젝트의 목적 자체가 MSA 관련 기술(Kafka, Saga, CQRS, Circuit Breaker)을 경험하는 것이다.
모놀리식으로 구현하면 학습 목표를 달성할 수 없다.
단, 8개 서비스 중 Statistics와 Admin은 규모가 작아 나중에 합칠 수도 있다.

### 결과

**트레이드오프:**
- 서비스별 독립 배포, 확장, 장애 격리 경험 가능
- 1인 개발 시 코드베이스 유지에 더 많은 노력 필요
- 분산 트레이싱(Jaeger)이 없으면 디버깅이 매우 어려움 → Phase 4에서 반드시 구현

---

## ADR-004: Saga Choreography를 선택한 이유 (vs Orchestration)

### 상태
결정됨

### 맥락
구독 등록 시 Subscription Service와 Notification Service가 협력해야 한다.
두 서비스는 서로 다른 DB를 사용하므로 분산 트랜잭션이 필요하다.

### 선택지 비교

| 선택지 | 장점 | 단점 |
|--------|------|------|
| **Choreography** ✅ | 서비스 독립성 유지, 중앙 SPOF 없음 | 전체 흐름 파악 어려움, 이벤트 추적 필요 |
| Orchestration | 흐름이 한 곳에 집중, 디버깅 쉬움 | Orchestrator가 단일 장애 지점(SPOF), 서비스 간 결합 증가 |

### 결정
**Choreography** 선택.

서비스 수가 8개로 비교적 적어 이벤트 흐름 파악이 가능한 범위다.
각 서비스가 이벤트만 발행/구독하고 서로를 직접 호출하지 않으므로 MSA의 독립성이 유지된다.
Orchestration의 SPOF 문제는 고가용성 요구사항과 충돌한다.
Jaeger 분산 트레이싱으로 이벤트 흐름 파악 문제를 보완한다.

### 결과

**트레이드오프:**
- 새 서비스 추가 시 기존 서비스 변경 없이 이벤트만 구독하면 됨
- 전체 Saga 흐름을 파악하려면 Jaeger UI + Kafka 토픽 메시지 조합 필요
- 보상 트랜잭션(롤백)을 각 서비스가 직접 구현해야 함

---

## ADR-005: Event Store로 MongoDB를 선택한 이유

### 상태
결정됨

### 맥락
Alert Processor가 처리한 이벤트를 저장하는 Event Store가 필요하다.
재난 알림 데이터는 스키마가 API마다 다르고 자주 변경될 수 있다.

### 선택지 비교

| 선택지 | 장점 | 단점 |
|--------|------|------|
| PostgreSQL | 이미 사용 중, ACID 보장 | 스키마 변경 시 마이그레이션 필요, JSON 처리 제한 |
| **MongoDB** ✅ | 유연한 스키마, JSON 문서 저장 최적, 집계 파이프라인 강력 | ACID 트랜잭션 제한적 |
| Elasticsearch | 검색 최적화 | 집계 외 일반 저장/수정에 부적합 |

### 결정
**MongoDB** 선택.

기상청, 행정안전부, 환경부 API 응답 형식이 모두 다르고 시간이 지나면 변경될 수 있다.
MongoDB의 유연한 스키마로 `rawData` 필드에 원본 데이터를 그대로 저장할 수 있다.
Statistics Service의 집계 쿼리에 MongoDB의 Aggregation Pipeline이 적합하다.
Event Store는 주로 쓰기 중심이라 ACID 트랜잭션의 필요성이 낮다.

### 결과

**트레이드오프:**
- 스키마 변경 없이 새로운 공공 API 추가 가능
- TTL 인덱스로 30일 지난 이벤트 자동 삭제 가능
- 복잡한 JOIN 쿼리는 불가 → 필요 시 PostgreSQL과 조합

---

## ADR-006: Transactional Outbox 패턴을 적용한 이유

### 상태
결정됨

### 맥락
Subscription Service에서 구독 등록 시 DB 저장과 Kafka 이벤트 발행이 함께 필요하다.
이 두 작업을 하나의 트랜잭션으로 묶을 수 없는 분산 환경이다.

### 선택지 비교

| 선택지 | 장점 | 단점 |
|--------|------|------|
| DB 저장 후 Kafka 발행 | 구현 단순 | Kafka 발행 실패 시 데이터 불일치 |
| Kafka 발행 후 DB 저장 | 구현 단순 | DB 저장 실패 시 이미 발행된 이벤트 취소 불가 |
| **Transactional Outbox** ✅ | DB와 Kafka 최종 일관성 보장 | 구현 복잡도 증가, 스케줄러 필요 |
| 분산 트랜잭션 (2PC) | 강한 일관성 | 성능 저하, 구현 복잡도 매우 높음 |

### 결정
**Transactional Outbox** 패턴 선택.

단일 DB 트랜잭션 안에서 비즈니스 데이터와 Outbox 이벤트를 함께 저장한다.
별도 스케줄러가 Outbox 이벤트를 Kafka에 발행하고, 성공 시 PUBLISHED로 상태를 업데이트한다.
분산 트랜잭션(2PC)은 성능과 복잡도 문제로 MSA에서 권장하지 않는다.

### 결과

**트레이드오프:**
- DB 저장과 Kafka 발행의 Eventual Consistency 보장
- At Least Once 발행 → Consumer에서 멱등 처리 필요 (alertId로 중복 체크)
- Outbox 테이블 크기 관리 필요 (PUBLISHED 이벤트 주기적 삭제)

---

## ADR-007: CQRS를 Statistics Service에만 제한 적용한 이유

### 상태
결정됨

### 맥락
CQRS(Command Query Responsibility Segregation)는 쓰기와 읽기 모델을 분리하는 패턴이다.
모든 서비스에 적용하면 복잡도가 급격히 높아진다.

### 선택지 비교

| 선택지 | 장점 | 단점 |
|--------|------|------|
| 전체 서비스 CQRS 적용 | 쓰기/읽기 성능 최적화 | 구현 복잡도 매우 높음 |
| CQRS 미적용 | 단순 | 통계 집계 쿼리 성능 저하 |
| **Statistics에만 CQRS** ✅ | 필요한 곳에만 적용, 복잡도 최소화 | 부분 적용이라 패턴 혜택이 제한적 |

### 결정
**Statistics Service에만 CQRS 제한 적용**.

통계 데이터는 특성상 쓰기(Alert Processor → Event Store)와 읽기(관리자 대시보드 집계)의 패턴이 완전히 다르다.
Event Store(MongoDB)를 Write Model, 집계 결과(stats_db)를 Read Model로 분리한다.
다른 서비스는 CRUD 중심이라 CQRS 적용 효과가 없다.

### 결과

**트레이드오프:**
- 통계 집계 쿼리가 Event Store 직접 조회 대비 빠름 (사전 집계)
- Read Model 동기화 지연 발생 가능 (Eventual Consistency)
- 전체 CQRS 대비 구현 복잡도 크게 낮음

---

## ADR-008: WebSocket + STOMP를 선택한 이유

### 상태
결정됨

### 맥락
재난 알림을 사용자에게 실시간으로 전달해야 한다.
서버에서 클라이언트로 단방향/양방향 통신 방식을 선택해야 한다.

### 선택지 비교

| 선택지 | 장점 | 단점 |
|--------|------|------|
| Polling | 구현 단순 | 불필요한 요청 다수, 지연 발생 |
| SSE (Server-Sent Events) | 단방향 스트림, 구현 간단 | 단방향만 지원, 연결 수 제한 |
| **WebSocket + STOMP** ✅ | 양방향, 실시간, STOMP로 구독/발행 패턴 지원 | 연결 유지 리소스 비용, 다중 인스턴스 세션 동기화 필요 |

### 결정
**WebSocket + STOMP** 선택.

재난 알림은 서버 → 클라이언트 단방향이지만, 나중에 사용자 확인 응답 등 양방향 기능 확장을 고려한다.
STOMP 프로토콜로 `/topic/alerts/{userId}` 구조의 구독 패턴을 명확하게 구현할 수 있다.
Spring에서 STOMP WebSocket 지원이 잘 되어 있어 구현 비용이 낮다.
다중 인스턴스 세션 동기화 문제는 Redis Pub/Sub로 해결한다 (→ Step 12 참고).

### 결과

**트레이드오프:**
- 클라이언트당 하나의 WebSocket 연결 유지 → 10,000 동시 연결 시 리소스 부하
- Notification Service HPA로 부하에 따라 인스턴스 자동 증가로 해결
- SSE 대비 구현 복잡도 약간 높음 (STOMP 프로토콜 이해 필요)
