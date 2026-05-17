---
description: SafeAlert 전체 서버(minikube + 백엔드 + 프론트엔드)를 순서대로 기동하고 정상 동작을 확인합니다
---

SafeAlert 프로젝트의 전체 서버를 순서대로 기동하고 정상 동작을 확인합니다.

다음 순서로 진행하세요:

## Step 1 — minikube 상태 확인 및 시작

`minikube status` 를 실행하여 상태를 확인합니다.
- `Running` 상태이면 이미 실행 중이므로 Step 2로 넘어갑니다.
- 그 외 상태이면 `minikube start` 를 실행하고, 클러스터가 준비될 때까지 대기합니다.

## Step 2 — 인프라 파드 확인 (safealert-infra)

`kubectl get pods -n safealert-infra` 를 실행하여 PostgreSQL, Redis, Kafka, MongoDB 파드 상태를 확인합니다.
- 모든 파드가 `Running` 이면 Step 3으로 넘어갑니다.
- `Running` 이 아닌 파드가 있으면 최대 2분간 10초 간격으로 재확인합니다.
- 2분이 지나도 Running이 안 되면 사용자에게 해당 파드 이름과 상태를 보고하고 중단합니다.

## Step 3 — 앱 파드 확인 (safealert-app)

`kubectl get pods -n safealert-app` 를 실행하여 api-gateway, auth-service, subscription-service, notification-service 파드 상태를 확인합니다.
- 모든 파드가 `Running` 이면 Step 4로 넘어갑니다.
- `Running` 이 아닌 파드가 있으면 최대 2분간 10초 간격으로 재확인합니다.
- 2분이 지나도 Running이 안 되면 사용자에게 해당 파드 이름과 상태를 보고하고 중단합니다.

## Step 4 — API Gateway port-forward (새 창)

아래 명령어로 API Gateway를 로컬 8080 포트로 노출하는 새 PowerShell 창을 엽니다:

```powershell
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'kubectl port-forward svc/api-gateway 8080:8080 -n safealert-app'
```

실행 후 3초 대기합니다.

## Step 5 — 프론트엔드 dev 서버 (새 창)

아래 명령어로 프론트엔드 개발 서버를 실행하는 새 PowerShell 창을 엽니다:

```powershell
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location c:\study\SafeAlert\frontend; npm run dev'
```

실행 후 5초 대기합니다.

## Step 6 — 동작 확인 및 결과 보고

아래 두 주소에 각각 HTTP 요청을 보내 응답 여부를 확인합니다:
- 프론트엔드: `http://localhost:5173`
- API Gateway: `http://localhost:8080/actuator/health`

결과를 아래 형식으로 출력합니다:

```
========================================
  SafeAlert 서버 기동 완료
========================================
  [완료] 프론트엔드  → http://localhost:5173
  [완료] API Gateway → http://localhost:8080
========================================
```

접속이 안 되는 항목은 `[실패]` 로 표시하고 원인을 안내합니다.
