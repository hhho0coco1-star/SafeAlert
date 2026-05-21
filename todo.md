# 버그 수정 TODO (Phase 1-F)

## 버그 1 — API Gateway JWT 시크릿 불일치 (1-F-1)

**증상:** 로그인(일반/OAuth2) 후 대시보드의 모든 API가 401 Unauthorized

**원인:**
- auth-service 토큰 발급 시크릿: `safealert-auth-service-jwt-secret-key-must-be-at-least-256-bits-long`
- api-gateway 토큰 검증 시크릿: `default-secret-key-for-development-minimum-32-chars` ← 잘못된 값

**수정 내용:**
- [x] `api-gateway/src/main/resources/application.yml` 54번 줄 시크릿 값 수정 (완료)

**검증:**
- [ ] api-gateway 재시작 (Ctrl+C → `./gradlew bootRun`)
- [ ] 로그인 → 대시보드 진입 → Network 탭 `/api/notifications`, `/api/subscriptions`, `/api/notifications/summary` 200 확인

---

## 버그 2 — axios 응답 인터셉터 재시도 루프 (1-F-2)

**증상:** 401 발생 시 같은 요청이 콘솔에 여러 번 반복 출력 (Dashboard.jsx → axios.js → axios.js → ...)

**원인:**
- 401 발생 → refresh 시도 → 새 토큰으로 재시도(axios.js:41) → 또 401 → `_retry=true`라 더 이상 refresh 안 함 → 에러 반환
- 단, 여러 API가 동시에 401을 받으면 각각 독립적으로 refresh를 시도 → refresh 요청이 여러 번 중복 발생

**수정 내용:**
- [ ] `frontend/src/api/axios.js` — refresh 요청을 단 1번만 실행하도록 중복 방지 처리

**수정 방법 (isRefreshing 플래그 + 대기 큐):**
```javascript
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) prom.reject(error)
        else prom.resolve(token)
    })
    failedQueue = []
}

// response 인터셉터 내 401 처리:
if (error.response?.status === 401 && !original._retry && !isAuthPath) {
    if (isRefreshing) {
        return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
        }).then(token => {
            original.headers.Authorization = `Bearer ${token}`
            return api(original)
        }).catch(err => Promise.reject(err))
    }
    original._retry = true
    isRefreshing = true
    // ... refresh 로직 ...
    // 성공 시: processQueue(null, newToken); isRefreshing = false
    // 실패 시: processQueue(err); isRefreshing = false
}
```

**검증:**
- [ ] 개발자 도구 콘솔에서 401 발생 시 refresh 요청이 1번만 발생하는지 확인

---

## 버그 3 — Dashboard useEffect React StrictMode 이중 호출 (1-F-3)

**증상:** Dashboard 진입 시 같은 API가 두 번씩 호출됨 (콘솔에 Dashboard.jsx:58, 62, 66 패턴이 2번 반복)

**원인:**
- React 18 개발 모드 StrictMode: useEffect를 의도적으로 2번 실행해서 부작용(side effect)을 감지함
- 운영 빌드(`npm run build`)에서는 1번만 실행됨 → 실제 배포 환경에서는 문제 없음

**수정 여부:**
- 개발 환경에서만 발생하는 정상 동작이므로 코드 수정 불필요
- [x] StrictMode 이중 호출임을 확인, 별도 수정 없음

---

## 진행 순서

1. **버그 1 검증** — api-gateway 재시작 후 Network 탭 200 확인
2. **버그 2 수정** — axios.js 인터셉터 개선 (버그 1 해결 후 진행)
3. **버그 3** — 수정 불필요 (StrictMode 정상 동작)
