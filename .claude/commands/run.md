---
description: SafeAlert 전체 서버(백엔드 + 프론트엔드)를 순서대로 기동하고 정상 동작을 확인합니다
---

SafeAlert 프로젝트의 전체 서버를 순서대로 기동하고 정상 동작을 확인합니다.

다음 순서로 진행하세요:

## Step 1 — Docker Compose 인프라 실행

아래 명령어로 PostgreSQL, Redis, Kafka, MongoDB를 실행합니다:

```bash
docker compose -f c:/study/SafeAlert/docker-compose.yml up -d postgresql redis kafka mongodb
```

실행 후 5초 대기합니다.

## Step 2 — Spring Boot 서비스 실행 (새 창 4개)

아래 명령어로 각 서비스를 별도 PowerShell 창에서 실행합니다:

```powershell
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location c:\study\SafeAlert\api-gateway; ./gradlew bootRun'
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location c:\study\SafeAlert\auth-service; ./gradlew bootRun --args=''--spring.profiles.active=local'''
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location c:\study\SafeAlert\notification-service; ./gradlew bootRun'
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location c:\study\SafeAlert\subscription-service; ./gradlew bootRun'
```

실행 후 20초 대기합니다 (Spring Boot 기동 시간).

## Step 3 — 프론트엔드 dev 서버 실행 (새 창)

아래 명령어로 프론트엔드 개발 서버를 실행합니다:

```powershell
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location c:\study\SafeAlert\frontend; npm run dev'
```

실행 후 5초 대기합니다.

## Step 4 — 동작 확인 및 결과 보고

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
