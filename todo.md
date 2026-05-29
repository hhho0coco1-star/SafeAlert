# SafeAlert Todo (2026-05-29 기준)

---

## 🔜 다음 작업 — 우선순위 순

---

### Phase 4 — 관측 가능성

#### 4-1 ~ 4-2: Prometheus + Grafana
> 인프라 완료 (docker-compose + prometheus.yml + 6개 서비스 actuator 모두 설정됨). 대시보드 구성만 남음.

- [ ] Grafana 접속(`http://localhost:3000`) → JVM 대시보드(ID: 4701) import
- [ ] Kafka consumer lag 패널 추가
- [ ] 서비스별 HTTP 메트릭 대시보드 구성

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
