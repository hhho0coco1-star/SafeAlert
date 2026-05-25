## ✅ 완료된 작업 (2026-05-25 기준)

- [x] getMsrstnList API 승인 + MeasureStationCacheService 복원 (시/군/구 230+개 캐싱)
- [x] Redis alert:seen:DUST:* 초기화 + 전체 재기동
- [x] DB 검증 — DUST 230+ 시/군/구 단위 수집 확인
- [x] WeatherAlertClient Method A — stnId→시도 매핑 + title 파싱으로 content 정상화
- [x] /run 스킬 — alert-collector(8086), alert-processor(8087) 추가
- [x] 1-R-1: 행정구역 표준코드 API 신청 (행정안전부_행정표준코드_법정동코드) ✅
- [x] 1-R-2a: data.sql에 시군구 228개 추가 (ON CONFLICT DO NOTHING) ✅
- [x] 1-R-2b: subscription-service 재기동 + DB 245개 확인 ✅
- [x] 1-R-3: `/regions/available` 트리 구조 응답 구현 (시도 17 + children 시군구) ✅
- [x] 1-R-2c: RegionCodeSyncService 신설 — 법정동코드 API @PostConstruct 자동 동기화 ✅
- [x] 1-R-4: SubscriptionRepository 상향 매칭 쿼리 (시군구 OR 부모 시도 동시 조회) ✅
- [x] 1-R-5: 최대 구독 5개 → 10개 (백엔드 검증 + 프론트 메시지) ✅

---

## 🔄 진행 중 — Phase 1-R: 시/군/구 단위 구독 시스템 (상향 매칭)

**현재 문제:** DUST는 시/군/구 단위로 수집되지만 region은 시도 코드("11")라 강남구만 구독 불가.

**설계 결정:**
- 코드: 행정구역 표준 5자리 ("11680" 강남구)
- 시드: data.sql 정적 시드(245개) → RegionCodeSyncService 자동 동기화로 대체
- 매칭: 상향만 (시군구 알림 → 시도 구독자에게도 발송)
- 최대 구독: 10개

### 작업 순서 (파이프라인 안전성 보장)

**단계 1 — 데이터 모델 확장 ✅ 완료 (1-R-2c 진행 중)**
- [x] 1-R-1: 행정구역 표준코드 API 신청
- [x] 1-R-2a: 임시 시드 SQL 작성 (data.sql 시군구 228개)
- [x] 1-R-2b: subscription-service 재기동 + DB 검증 (245개 확인)
- [x] 1-R-3: `/regions/available` 트리 구조 응답
- [x] 1-R-2c: RegionCodeSyncService 신설 ✅

**단계 2 — 매칭 로직 상향 호환 (기존 시도 구독 유지)**
- [x] 1-R-4: SubscriptionRepository 상향 매칭 쿼리 ✅
- [x] 1-R-5: 최대 구독 5개 → 10개 ✅
- [ ] 🔄 1-R-6: AlertProcessedConsumer — 코드 길이로 시도/시군구 판별 후 상향 매칭 호출
- [ ] 1-R-6: AlertProcessedConsumer — 코드 길이로 시도/시군구 판별 후 상향 매칭 호출

**단계 3 — DUST region 시군구 코드로 교체**
- [ ] 1-R-7: MeasureStationCacheService addr 파싱 → 시군구 행정코드(5자리) 반환
- [ ] 1-R-8: DustAlertClient.region "11" → "11680"

**단계 4 — 프론트 UI 업그레이드**
- [ ] 1-R-9: Subscriptions.jsx 2단계 드롭다운 (시도→시군구, 최대 10개)
- [ ] 1-R-10: TestPage.jsx — 5자리 코드 → 앞 2자리 시도로 카운터 집계

**단계 5 — 검증**
- [ ] 1-R-11: E2E 검증 (강남구↔서울 상향 매칭 확인)

---

## ⏸ 대기 중

### 1-Q: 프론트엔드 페이지 전체 검증 (9개 페이지)
시/군/구 구독 작업 후 통합 검증으로 함께 진행 권장.

### 1-O: DISASTER 지역 코드 매핑
행정안전부 API 불안정 → 1-R 완료 후 동일한 시군구 코드 체계로 작업.

### 1-A-17~19, 1-D-10~11: 비밀번호 찾기/재설정
Phase 1 마무리 항목. 우선순위 낮음.

---

## ⬜ 다음 Phase

| Phase | 내용 |
|-------|------|
| Phase 3 | 안정성/복원력 — Saga, 장애 주입 |
| Phase 4 | 관측 가능성 — Prometheus, Grafana, Jaeger, ELK |
| Phase 5 | 부하 테스트 + 문서 마무리 |
