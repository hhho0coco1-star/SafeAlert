# SafeAlert Todo (2026-06-08 기준)

---

## ✅ 완료된 작업

- Phase 0~4 전체 완료
- Phase 5: k6 부하 테스트, HikariCP 개선, Swagger UI, README 정리, 기술선택 이유 문서, 시퀀스 다이어그램, 장애 테스트 결과 문서, 트러블슈팅 가이드
- Phase 6: AWS EC2 t3.xlarge minikube 전체 배포 + HPA 스케일아웃(2→4) 검증 + README 반영 완료

---

## 🔜 남은 작업

### D-1 — 데모 동영상 촬영

> **파트 A**: 로컬 환경(docker-compose + npm run dev)으로 앱 기능 촬영
> **파트 B**: AWS EC2 VM 재시작 후 K8s HPA 장면 촬영
> 녹화 도구: `Win+G` (Xbox 게임바) | 목표 길이: 4~5분
> 대본: `docs/11_데모영상_시나리오.md` ✅ 준비 완료

**파트 A — 로컬 앱 기능 (사전 준비: docker-compose up + 서비스 bootRun + npm run dev)**

- [ ] 장면 0: `/` — 랜딩 페이지 인트로
- [ ] 장면 1: `/login` — 이메일 인증 → 회원가입 → 로그인
- [ ] 장면 2: `/subscriptions` — 시도·시군구 2단계 구독 설정
- [ ] 장면 3: `/admin` | `/dashboard` 분할 — **핵심** 수동 알림 발송 → 실시간 WebSocket 수신
- [ ] 장면 4: `/history` — 알림 이력 조회·필터
- [ ] 장면 5: Swagger·Grafana·Jaeger — 기술 아키텍처 증거 + 트러블슈팅

**파트 B — K8s HPA 데모 (사전 준비: EC2 인스턴스 시작 → SSH 접속 → minikube status 확인)**

- [ ] 장면 6: `kubectl get pods -A` — 전체 23개 Pod Running
- [ ] 장면 7: CPU 부하 → `kubectl get hpa -w` — REPLICAS 2→4 스케일아웃
- [ ] 장면 8: 아웃트로 — 기술 스택 로고

> 장면 7 부하 명령: `kubectl exec -n safealert-app <api-gateway-pod> -- sh -c "yes > /dev/null &"`

**촬영 후**

- [ ] 파트 A + 파트 B Clipchamp(클립챔프)에서 합치기
- [ ] 영상 편집 (장면 3·장면 7 비중 크게)
- [ ] ezgif.com으로 GIF 변환
- [ ] README 상단 데모 섹션에 GIF 첨부 + 커밋

### 데모 영상 촬영 완료 후 — AWS 리소스 정리

- [ ] EC2 인스턴스 종료(Terminate) → EBS 자동 삭제 → 과금 완전 중단
  - EC2 콘솔 → 인스턴스 선택 → 인스턴스 상태 → 종료

---

### 6-8 — E2E 동작 검증 (파트 B 촬영 시 함께 진행 가능)

- [ ] port-forward로 프론트·게이트웨이 접속, 로그인/구독/알림 E2E 확인
  - `kubectl port-forward svc/api-gateway 8080:8080 -n safealert-app`
  - `kubectl port-forward svc/frontend 3000:80 -n safealert-app`
