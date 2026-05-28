# SafeAlert Todo (2026-05-28 기준)

---

## 🔜 다음 작업 — 우선순위 순

---

### Phase 3 — 안정성 / 복원력

#### ~~3-1: Saga 패턴~~ — 스킵 (현재 @Transactional + Outbox 조합으로 원자성 이미 보장됨)

#### ✅ 3-2: Outbox 폴링 스케줄러 완성
- `OutboxEvent.java` — `retryCount` 필드 추가, `markFailed()` 3회 초과 시 DEAD 전환
- `OutboxEventRepository.java` — FAILED 재시도 쿼리 추가
- `OutboxScheduler.java` — PENDING + FAILED 합산 처리, retryCount 로그 추가

---

#### 3-2: Outbox 폴링 스케줄러 완성
> 현재 상태: `OutboxScheduler.java` 구현됨. FAILED 상태 재시도 로직 미구현.

- [ ] `OutboxScheduler.java`
  - FAILED 이벤트 재시도 횟수(`retryCount`) 필드 추가
  - 3회 이상 실패 시 `DEAD` 상태로 전환 (무한 재시도 방지)
- [ ] `OutboxEvent.java` — `retryCount`, `status=DEAD` 필드 추가
- [ ] DB 마이그레이션 — `outbox_events` 테이블에 `retry_count` 컬럼 추가

---

#### 3-3: Circuit Breaker 임계값 검증
> 현재 상태: weatherApi·dustApi·disasterApi 3개 CB 설정 완료 (slidingWindow=5, threshold=60%).

- [ ] `application.properties` 임계값 재검토
  - 현재 slidingWindowSize=5 → 실제 수집 주기(5분)에 맞게 적절한지 확인
  - waitDurationInOpenState=30s → 공공 API 특성상 더 길게 조정 필요 여부 확인
- [ ] `WeatherAlertClient`, `DustAlertClient`, `DisasterAlertClient`
  - fallback 메서드가 실제로 빈 리스트를 반환하는지, 로그를 남기는지 확인
  - CB OPEN 상태 전환 시 Slack/로그 알림 추가 (선택)
- [ ] 수동 테스트: 공공 API URL을 잘못된 주소로 임시 변경 → CB OPEN 전환 확인

---

#### 3-4: 장애 주입 테스트
> Kafka·Redis를 강제로 내리고 각 서비스가 정상 복구되는지 확인.

- [ ] **Kafka 중단 테스트**
  - `docker stop safealert-kafka-1` 실행
  - alert-processor-service, notification-service Consumer lag 발생 확인
  - `docker start safealert-kafka-1` 후 밀린 메시지 재처리 확인
  - OutboxScheduler가 PENDING 이벤트 재발행하는지 확인
- [ ] **Redis 중단 테스트**
  - `docker stop safealert-redis-1` 실행
  - auth-service 토큰 갱신 실패 응답 확인 (500 → 적절한 에러 메시지)
  - api-gateway Rate Limiting 비활성화 여부 확인
  - Redis 재시작 후 서비스 자동 복구 확인
- [ ] 테스트 결과 `docs/장애주입_테스트결과.md` 에 기록

---

### Phase 4 — 관측 가능성

#### 4-1 ~ 4-2: Prometheus + Grafana
> `docker-compose.yml`에 Prometheus, Grafana 컨테이너 없음. 각 서비스에 actuator 미노출.

- [ ] 각 서비스 `build.gradle` — `micrometer-registry-prometheus` 의존성 추가 (6개 서비스)
- [ ] 각 서비스 `application.yml` — actuator prometheus 엔드포인트 노출 설정 추가
- [ ] `prometheus.yml` 파일 생성 — 6개 서비스 scrape_config 작성
- [ ] `docker-compose.yml` — Prometheus(9090), Grafana(3000) 컨테이너 추가
- [ ] Grafana 접속 후 JVM 대시보드(ID: 4701) import
- [ ] Kafka consumer lag 패널 추가

---

#### 4-3: Jaeger 분산 트레이싱
- [ ] `docker-compose.yml` — Jaeger all-in-one 컨테이너 추가 (16686 포트)
- [ ] 각 서비스 `build.gradle` — OpenTelemetry 의존성 추가
- [ ] 각 서비스 실행 시 `-javaagent:opentelemetry-agent.jar` 옵션 추가
- [ ] Jaeger UI(`http://localhost:16686`)에서 auth → subscription 흐름 trace 확인

---

#### 4-4: ELK 스택 로그 수집
- [ ] `docker-compose.yml` — Elasticsearch(9200), Logstash(5044), Kibana(5601) 컨테이너 추가
- [ ] 각 서비스 `logback-spring.xml` — Logstash TCP appender 추가
- [ ] Kibana에서 서비스별 로그 인덱스 패턴 생성 및 검색 확인

---

### Phase 5 — 부하 테스트 + 문서 마무리

#### 5-1 ~ 5-2: k6 부하 테스트 + 병목 분석
- [ ] `load-test/login.js` — 로그인 시나리오 (1000 VU, 30초)
- [ ] `load-test/subscription.js` — 구독 조회 시나리오
- [ ] `load-test/websocket.js` — WebSocket 연결 유지 시나리오
- [ ] 테스트 실행 중 Grafana로 JVM 힙·API 응답시간 병목 구간 확인
- [ ] DB 슬로우 쿼리 발생 시 인덱스 추가, 커넥션 풀 조정

---

#### 5-3: README 최종 정리
- [ ] 아키텍처 다이어그램 작성 (Mermaid 또는 draw.io)
- [ ] 로컬 실행 방법 (`docker compose up` → Spring Boot 순서 안내)
- [ ] 기술 스택 표 (언어·프레임워크·인프라)
- [ ] 주요 기능 GIF 또는 스크린샷 첨부

---

#### 5-4: API 명세 문서
- [ ] 각 서비스 `build.gradle` — `springdoc-openapi-starter-webmvc-ui` 추가
- [ ] `SwaggerConfig.java` 생성 — API 그룹·설명 설정
- [ ] `http://localhost:{port}/swagger-ui.html` 접속 확인
