# SafeAlert TODO

---

## [완료] Phase 1-G — 실시간 테스트 페이지
## [완료] Phase 1-H — 공공 API 수집 파이프라인 버그 수정
## [완료] Phase 1-I — WebSocket 알림 파이프라인 버그 수정 + 채널 분리

---

## [완료] Phase 1-J — TestPage 알림 상세 내용 표시

**목적:** 제목만으로는 알림 내용을 파악하기 어려움 → content 전체 표시 (TestPage는 검증 목적이므로 truncate 미적용)

**작업 목록:**
- [O] `AlertProcessedConsumer.java` — 구독자 없을 때도 공개 이력 DB 저장 (recent API 빈 배열 버그 수정)
- [O] `TestPage.jsx` — 피드 아이템 title truncate 제거 + content 전체 표시

---

## [다음 작업] Phase 1-K — 알림 content 필드 정상화 (DUST · WEATHER)

**목적:** DustAlertClient · WeatherAlertClient가 API 원본 JSON을 content에 그대로 저장 → 사람이 읽을 수 있는 요약 텍스트로 교체

**작업 목록:**
- [O] `DustAlertClient.java` — response JSON 파싱 후 `PM10 27㎍/㎥(좋음) · PM2.5 20㎍/㎥(좋음)` 형식으로 content 생성
- [O] `WeatherAlertClient.java` — response JSON 파싱 후 기상특보 내용 요약 텍스트로 content 생성
- [ ] alert-collector-service 재기동 후 TestPage에서 content 정상 표시 검증
