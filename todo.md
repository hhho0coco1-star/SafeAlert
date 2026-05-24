## [진행 중] Phase 1-N — DUST 시/군/구 단위 수집 확장

**목적:** 현재 시도당 첫 번째 측정소 1건(동 단위 이름 "삼천동")만 사용 → 전국 시/군/구 단위(수원시·천안시·강남구 등)로 확장

**문제 요약:**

| # | 문제 | 원인 |
|---|------|------|
| 1 | DUST 알림 수가 너무 적음(17건/사이클) | DustAlertClient가 `items.get(0)` 첫 번째 측정소만 사용 |
| 2 | "전북 삼천동" 같은 동 단위 표시로 시·군이 빠져 오해 유발 | 미세먼지 측정정보 API가 시/군/구 정보 없이 측정소명만 반환 |
| 3 | getMsrstnList API 403 오류 | API 키가 MsrstnInfoInqireSvc 미등록 → data.go.kr 활용신청 완료, 승인 대기 중 |
| 4 | recent API 30건 제한 | findTop30 → findTop300 으로 수정 완료 |

**현재 전략:** API 승인 전까지 heuristic(stationName 끝글자 시/군/구)으로 임시 운영 → 승인 후 getMsrstnList 방식으로 복원해 200~250건 달성

**작업 목록:**
- [x] `DustAlertClient.java` — `parseDustContent(JsonNode)` 시그니처 변경, content 포맷 `{sigungu} | PM10...` 으로 교체
- [x] `DustAlertClient.java` — fetch() 내부 items 전체 순회 + 시군구 단위 중복 제거(HashSet) + 중복필터 키 `"DUST:{sigungu}:{date}"` 로 변경 + numOfRows 10→100
- [x] `MeasureStationCacheService.java` 임시 heuristic — stationName이 시/군/구로 끝나면 그대로 반환 (약 49건/사이클)
- [x] `NotificationHistoryRepository.java` — findTop30 → findTop300 으로 변경
- [x] `NotificationService.java` — getRecentAlerts() 호출 메서드명 변경
- [x] data.go.kr `한국환경공단_에어코리아_측정소정보` API 활용신청 완료 (승인 대기)
- [ ] API 승인 확인 → getMsrstnList 호출 테스트 → `MeasureStationCacheService.java` 원래 방식으로 복원
- [ ] Redis `alert:seen:DUST:*` 키 전체 초기화 + 서비스 재기동
- [ ] DB 검증 + TestPage 확인 (시/군/구 단위 알림 200~250건)

---

## [대기 중] Phase 1-O — DISASTER 지역 코드 매핑 (별도 진행)

**목적:** DISASTER `RCPTN_RGN_NM` 원문("충청남도 천안시")이 17개 숫자 코드와 불일치 → 지역별 카운터 미반영

**작업 목록:**
- [ ] `DisasterAlertClient.java` — `FULL_TO_ABBREV` 매핑(충청남도→충남 등 17개 시도) 적용해 region을 "충남 천안시" 형태로 단축
- [ ] `TestPage.jsx` — 카운터용 키워드 매핑 로직 추가 (region 텍스트 → 숫자 코드 역변환)
- [ ] 재검증 (DISASTER 알림이 지역별 카운터에 반영되는지)
