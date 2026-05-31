# SafeAlert Todo (2026-05-31 기준)

---

## 🔜 다음 작업 — 우선순위 순

---

### ~~Phase 4 — 관측 가능성~~ ✅ 완료

---

### Phase 5 — 부하 테스트 + 문서 마무리

#### ~~5-1 ~ 5-2: k6 부하 테스트 + 병목 분석~~ ✅ 완료
> 로그인 100명 (p95 2.66s → 1.86s, HikariCP 개선), 구독 조회 100명 (p95 375ms), WebSocket 50개 (p95 9.91ms)

---

#### ~~5-4: API 명세 문서~~ ✅ 완료
> 5개 서비스 Swagger UI 추가 (auth 12개, subscription 8개, notification 6개 API 문서화)

---

#### 5-3: README 최종 정리
- [ ] 아키텍처 다이어그램 작성 (Mermaid 또는 draw.io)
- [ ] 로컬 실행 방법 (`docker compose up` → Spring Boot 순서 안내)
- [ ] 기술 스택 표 (언어·프레임워크·인프라)
- [ ] 주요 기능 GIF 또는 스크린샷 첨부
