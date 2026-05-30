# SafeAlert Todo (2026-05-30 기준)

---

## 🔜 다음 작업 — 우선순위 순

---

### Phase 4 — 관측 가능성

#### 4-1 ~ 4-2: Prometheus + Grafana
> Prometheus + Grafana 구성 완료. JVM 대시보드 + Kafka Consumer Lag 패널 운영 중.

- [ ] 서비스별 HTTP 메트릭 대시보드 구성

---

#### ~~4-3: Jaeger 분산 트레이싱~~ ✅ 완료

---

#### ~~4-4: ELK 스택 로그 수집~~ ✅ 완료

---

#### 4-D: 관측 가능성 스택 K8s 이전
> docker-compose로 기능 검증 후 K8s로 이전해야 Phase 5 부하 테스트 시
> HPA 스케일 아웃을 Grafana로 실시간 관측할 수 있다. (기획서 safealert-monitor 네임스페이스 완성 목표)
- [x] Prometheus + Grafana → `safealert-monitor` 네임스페이스 Helm 배포
- [x] Jaeger → `safealert-monitor` Helm 배포 + otel endpoint 환경변수 적용 (6개 서비스)
- [x] ELK → `safealert-monitor` 경량 YAML 배포 + LOGSTASH_HOST 환경변수 적용 (6개 서비스 `logback-spring.xml`)
- [ ] `docker-compose.yml` 모니터링 스택 제거 + 전체 동작 검증

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
