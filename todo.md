# SafeAlert Todo (2026-06-02 기준)

---

## ✅ 완료된 작업

- Phase 0~4 전체 완료
- Phase 5: k6 부하 테스트, HikariCP 개선, Swagger UI, README 정리, 기술선택 이유 문서, 시퀀스 다이어그램, 장애 테스트 결과 문서, 트러블슈팅 가이드

---

## 🔜 남은 작업

### Phase 6 — K8s 전체 실배포 검증 + HPA (포트폴리오 어필용)

> 목표: 매니페스트만 있던 상태 → minikube에 실제 전체 배포 후 `kubectl`·부하 캡처로 K8s 실증
> 환경: 로컬 minikube (비용 0), PC RAM 16GB → 배포 중 IDE·브라우저 종료 권장

- [ ] **6-1** minikube 기동 (`minikube start --memory=12288 --cpus=8 --driver=docker`)
- [ ] **6-2** 네임스페이스 적용 (`kubectl apply -f infra/namespaces.yaml` → safealert-app·safealert-infra)
- [ ] **6-3** Secret 적용 (`kubectl apply -f infra/secrets.yaml`)
- [ ] **6-4** 인프라 배포 — Helm으로 PostgreSQL·MongoDB·Redis(infra/*/values.yaml) + Kafka(infra/kafka/kafka.yaml) 설치, Running 확인
- [ ] **6-5** 6개 백엔드 이미지 빌드 (`./gradlew bootBuildImage` 또는 Dockerfile) → `minikube image load <img>:latest` (deployment가 imagePullPolicy: Never라 필수)
- [ ] **6-6** frontend 이미지 빌드 + `minikube image load`
- [ ] **6-7** 7개 서비스 배포 (`kubectl apply -f <svc>/k8s/`) + safealert-app Pod 전체 Running 확인
- [ ] **6-8** 동작 검증 — port-forward(또는 Ingress)로 프론트·게이트웨이 접속, 로그인/구독/알림 E2E 확인
- [ ] **6-9** `kubectl get pods -A` 전체 Running 스크린샷 캡처 → docs/img/ 저장
- [ ] **6-10** HPA 사전 준비 — `minikube addons enable metrics-server`
- [ ] **6-11** HPA YAML 작성 — api-gateway·alert-processor 대상 (CPU 70% 기준, min 2 / max 5), `kubectl apply`
- [ ] **6-12** k6 부하 실행 중 `kubectl get hpa -w` + Pod 증가 스크린샷 캡처 (기획서 5.3 이행)
- [ ] **6-13** README "K8s 배포 검증" 섹션 추가 + 캡처 첨부, WBS·기획서 현황 정정 커밋

### 문서 보완 (기존)
- [ ] **D-1** 데모 동영상 촬영 + README/포트폴리오 첨부 (촬영 가이드: WBS D-1 참고)

### GitHub 직접 설정 필요
- [x] **5-10** GitHub 레포 description·topics 설정 + 프로필 핀 고정 완료
