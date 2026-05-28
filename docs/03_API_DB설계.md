# SafeAlert API 설계서 + DB 설계서

---

# PART 1. API 설계서

## 공통 규칙

- Base URL: `http://localhost:8080/api`
- 인증: `Authorization: Bearer {accessToken}` (공개 API 제외)
- 응답 형식:

```json
{
  "success": true,
  "data": { ... },
  "message": "OK",
  "timestamp": "2025-01-01T12:00:00Z"
}
```

- 에러 응답:

```json
{
  "success": false,
  "code": "ALERT_NOT_FOUND",
  "message": "알림을 찾을 수 없습니다.",
  "timestamp": "2025-01-01T12:00:00Z"
}
```

---

## 1. Auth Service API

### POST /api/auth/email/send-code — 이메일 인증 코드 발송

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`

**에러:**
- `400 Bad Request` — 이미 가입된 이메일

---

### POST /api/auth/email/verify-code — 이메일 인증 코드 확인

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:** `200 OK`

**에러:**
- `400 Bad Request` — 코드 불일치 또는 만료

---

### POST /api/auth/signup — 회원가입

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123!",
  "nickname": "홍길동"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "nickname": "홍길동"
  }
}
```

---

### POST /api/auth/login — 로그인

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 900
  }
}
```

---

### POST /api/auth/refresh — 토큰 갱신

**Request:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "expiresIn": 900
  }
}
```

---

### POST /api/auth/logout — 로그아웃

**Response:** `200 OK`

---

### GET /api/auth/me — 내 정보 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "nickname": "홍길동",
    "role": "USER",
    "oauthProvider": "google",
    "createdAt": "2026-01-01T12:00:00Z"
  }
}
```

---

### PUT /api/auth/me — 닉네임 수정

**Request:**
```json
{
  "nickname": "새닉네임"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "nickname": "새닉네임"
  }
}
```

---

### PUT /api/auth/me/password — 비밀번호 변경

**Request Body:**
```json
{
  "currentPassword": "현재비밀번호",
  "newPassword": "새비밀번호8자이상"
}
```

- 현재 비밀번호 불일치 시 `400 Bad Request`
- 소셜 로그인 계정(`password_hash = NULL`)에서는 호출 불가

**Response:** `200 OK`

---

### DELETE /api/auth/me — 회원 탈퇴

- 소프트 삭제 처리 (`is_deleted = true`)
- Redis Refresh Token 즉시 삭제

**Response:** `200 OK`

---

### GET /api/auth/oauth2/google — Google 간편로그인 시작

- 인증 불필요
- 브라우저를 Google 로그인 페이지로 리다이렉트

---

### GET /api/auth/oauth2/kakao — Kakao 간편로그인 시작

- 인증 불필요
- 브라우저를 Kakao 로그인 페이지로 리다이렉트

---

### GET /api/auth/oauth2/callback/google — Google 로그인 콜백

- Google 인증 완료 후 자동 호출
- 신규 사용자 자동 가입 처리

**Response:** 프론트엔드 콜백 URL로 리다이렉트
```
/oauth2/success?accessToken=eyJ...&refreshToken=eyJ...
```

---

### GET /api/auth/oauth2/callback/kakao — Kakao 로그인 콜백

- Kakao 인증 완료 후 자동 호출
- 신규 사용자 자동 가입 처리

**Response:** 프론트엔드 콜백 URL로 리다이렉트
```
/oauth2/success?accessToken=eyJ...&refreshToken=eyJ...
```

---

## 2. Subscription Service API

### POST /api/subscriptions — 구독 생성

- 최초 1회 구독 레코드 생성 (ACTIVE 상태)
- 이미 구독이 존재하면 `400 Bad Request`

**Response:** `200 OK`

---

### GET /api/subscriptions — 내 구독 목록 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "regions": [
      { "code": "11010", "name": "서울특별시 종로구" }
    ],
    "categories": ["WEATHER", "EARTHQUAKE", "DUST"]
  }
}
```

---

### POST /api/subscriptions/regions — 지역 구독 추가

**Request:**
```json
{
  "regionCode": "11010"
}
```

**Response:** `201 Created`

---

### DELETE /api/subscriptions/regions/{regionCode} — 지역 구독 삭제

**Response:** `204 No Content`

---

### PUT /api/subscriptions/categories — 카테고리 구독 변경

**Request:**
```json
{
  "categories": ["WEATHER", "EARTHQUAKE"]
}
```

**Response:** `200 OK`

---

### GET /api/subscriptions/regions/available — 사용 가능한 지역 목록

- 인증 불필요
- 시도(17개) + 시군구(228개) 트리 구조로 반환

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "code": "11",
      "name": "서울특별시",
      "children": [
        { "code": "11010", "name": "종로구" }
      ]
    }
  ]
}
```

---

### GET /api/subscriptions/subscribers — 지역·카테고리별 구독자 조회 (내부 서비스용)

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| regionCode | string | 필수 | 지역 코드 (2자리 시도 또는 5자리 시군구) |
| category | string | 필수 | 카테고리 (WEATHER / EARTHQUAKE / DUST / DISASTER) |

**Response:**
```json
{
  "data": {
    "regionCode": "11",
    "category": "WEATHER",
    "userIds": ["uuid1", "uuid2"]
  }
}
```

---

### GET /api/subscriptions/subscribers/by-region — 지역별 구독자 조회 (카테고리 무관, 내부 서비스용)

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| regionCode | string | 필수 | 지역 코드 (2자리 시도) |

- 지역 코드만으로 구독자 조회 (카테고리 필터 없음)
- 관리자 수동 발송 시 사용 — 구독 지역이 일치하면 카테고리 무관하게 수신
- 2자리 시도 코드로 쿼리 시 5자리 시군구 구독자도 포함

**Response:**
```json
{
  "data": {
    "regionCode": "11",
    "category": null,
    "userIds": ["uuid1", "uuid2"]
  }
}
```

---

### GET /api/subscriptions/admin/count — 활성 구독자 수 조회 (관리자용)

**Response:**
```json
{
  "success": true,
  "data": 152
}
```

---

## 3. Notification Service API

### GET /api/notifications/summary — 오늘 알림 카테고리별 카운트

**Response:**
```json
{
  "total": 5,
  "weather": 2,
  "earthquake": 1,
  "dust": 1,
  "disaster": 1
}
```

- 오늘 00:00 ~ 현재 기준, 로그인 사용자 본인 데이터만 집계
- 대시보드 미니 스탯 4개 표시용

---

### GET /api/notifications — 알림 이력 조회

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| page | int | 선택 | 페이지 번호 (기본값: 0) |
| size | int | 선택 | 페이지 크기 (기본값: 7) |
| category | string | 선택 | 카테고리 필터 (WEATHER / EARTHQUAKE / DUST / DISASTER) |
| startDate | string | 선택 | 시작 날짜 (ISO 8601) |
| endDate | string | 선택 | 종료 날짜 (ISO 8601) |
| keyword | string | 선택 | 제목 검색어 |

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "uuid",
        "category": "WEATHER",
        "severity": "HIGH",
        "title": "서울 폭설 경보",
        "content": "서울 전역에 폭설 경보가 발령되었습니다.",
        "region": "서울특별시",
        "source": "기상청",
        "createdAt": "2026-01-01T12:00:00Z"
      }
    ],
    "totalElements": 100,
    "totalPages": 5,
    "number": 0
  }
}
```

---

### GET /api/alerts/recent — 최근 알림 조회 (랜딩 페이지용)

- 인증 불필요 (공개 API)
- 가장 최근 발령된 알림 N건 반환

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| limit | int | 선택 | 반환 건수 (기본값: 8, 최대: 20) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "category": "WEATHER",
      "title": "서울특별시 전역 호우 경보 발령",
      "source": "기상청",
      "createdAt": "2026-01-01T12:00:00Z"
    }
  ]
}
```

---

### GET /api/notifications/ws — WebSocket 연결 엔드포인트

- 프로토콜: WebSocket (STOMP)
- 연결 URL: `ws://localhost:8080/api/notifications/ws`
- 구독 경로: `/topic/public/alerts` (전국 단일 채널 — 모든 알림 수신 후 프론트엔드에서 필터링)
- 인증: 연결 시 STOMP CONNECT 헤더에 JWT 포함

---

## 4. Admin Service API

### GET /api/admin/stats — 관리자 요약 통계

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMembers": 1284,
    "todaySent": 47,
    "totalSent": 38920,
    "activeSubscriptions": 3671
  }
}
```

---

### GET /api/admin/alerts — 최근 발송 알림 목록

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| size | int | 선택 | 반환 건수 (기본값: 7) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "category": "WEATHER",
      "title": "서울특별시 전역 호우 경보 발령",
      "region": "서울특별시",
      "createdAt": "2026-01-01T12:00:00Z",
      "recipientCount": 412
    }
  ]
}
```

---

### GET /api/auth/admin/users — 전체 회원 목록 (페이지네이션 + 키워드 검색)

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| page | int | 선택 | 페이지 번호 (기본값: 0) |
| size | int | 선택 | 페이지 크기 (기본값: 7) |
| keyword | string | 선택 | 이메일 또는 닉네임 검색어 (빈 값이면 전체 조회) |

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCount": 152,
    "users": [
      {
        "userId": "uuid",
        "email": "user@example.com",
        "nickname": "홍길동",
        "role": "USER",
        "oauthProvider": null,
        "createdAt": "2026-01-01T12:00:00Z"
      }
    ],
    "page": 0,
    "totalPages": 22
  }
}
```

---

### PUT /api/auth/admin/users/{userId}/role — 회원 권한 변경

**Path Parameters:** `userId` — 대상 사용자 UUID

**Request:**
```json
{
  "role": "ADMIN"
}
```

- `ADMIN` ↔ `USER` 전환 가능
- 자기 자신의 권한은 변경 불가

**Response:** `200 OK`

---

### POST /api/admin/alerts/manual — 수동 알림 발송

**Request:**
```json
{
  "category": "CUSTOM",
  "severity": "MEDIUM",
  "title": "테스트 알림",
  "content": "관리자 테스트 알림입니다.",
  "targetRegions": ["11", "26"]
}
```

**Response:** `202 Accepted`

---

## 6. 프론트엔드 페이지 설계

### 기술 스택
- React 18 + Vite
- Axios (API 호출, JWT 인터셉터)
- React Router v6 (페이지 라우팅)
- STOMP.js + SockJS (WebSocket 실시간 알림)
- Tailwind CSS (스타일링)

### 페이지 목록

| 페이지 | 경로 | 인증 | 사용 API | 상태 |
|--------|------|------|---------|------|
| 랜딩 | `/` | 불필요 | GET /api/alerts/recent | ✅ |
| 로그인 + 회원가입 | `/login` | 불필요 | POST /api/auth/login, POST /api/auth/signup, POST /api/auth/email/send-code, POST /api/auth/email/verify-code | ✅ (회원가입 탭 통합) |
| 메인 대시보드 | `/dashboard` | 필요 | GET /api/subscriptions, GET /api/notifications/summary, WebSocket(/topic/public/alerts) | ✅ |
| 구독 설정 | `/subscriptions` | 필요 | GET /api/subscriptions, POST /api/subscriptions/regions, DELETE /api/subscriptions/regions/{code}, PUT /api/subscriptions/categories, GET /api/subscriptions/regions/available | ✅ |
| 알림 이력 | `/history` | 필요 | GET /api/notifications | ✅ |
| 내 계정 | `/profile` | 필요 | GET /api/auth/me, PUT /api/auth/me, PUT /api/auth/me/password, DELETE /api/auth/me, POST /api/auth/logout | ✅ |
| 관리자 대시보드 | `/admin` | 관리자 | GET /api/admin/stats, GET /api/admin/alerts, GET /api/auth/admin/users, GET /api/subscriptions/admin/count, POST /api/admin/alerts/manual, PUT /api/auth/admin/users/{userId}/role | ✅ |
| 실시간 테스트 | `/test` | 불필요 | WebSocket(/topic/public/alerts) | ✅ |
| Google OAuth 콜백 | `/oauth2/success` | 불필요 | — | ✅ |
| 이용약관 | `/terms` | 불필요 | — | ✅ |
| 개인정보처리방침 | `/privacy` | 불필요 | — | ✅ |
| 비밀번호 찾기 | `/find-password` | 불필요 | POST /api/auth/password/send-reset | ⬜ 미구현 |
| 비밀번호 재설정 | `/reset-password` | 불필요 | POST /api/auth/password/reset | ⬜ 미구현 |

### 공통 규칙
- JWT Access Token → `localStorage`에 저장
- 모든 API 요청 시 axios 인터셉터가 자동으로 `Authorization: Bearer {token}` 헤더 추가
- Access Token 만료 시 자동으로 `/api/auth/refresh` 호출 후 재요청
- 로그인 안 한 사용자가 인증 필요 페이지 접근 시 `/login`으로 자동 이동
- 관리자가 아닌 사용자가 `/admin` 접근 시 `/dashboard`로 자동 이동

---

## 7. 에러 코드 정의

| 코드 | HTTP 상태 | 설명 |
|------|----------|------|
| `AUTH_INVALID_TOKEN` | 401 | 유효하지 않은 토큰 |
| `AUTH_EXPIRED_TOKEN` | 401 | 만료된 토큰 |
| `AUTH_DUPLICATE_EMAIL` | 409 | 이미 가입된 이메일 |
| `SUB_REGION_NOT_FOUND` | 404 | 존재하지 않는 지역 코드 |
| `SUB_ALREADY_EXISTS` | 409 | 이미 구독 중인 지역 |
| `NOTIFICATION_NOT_FOUND` | 404 | 알림을 찾을 수 없음 |
| `RATE_LIMIT_EXCEEDED` | 429 | 요청 횟수 초과 |
| `INTERNAL_SERVER_ERROR` | 500 | 서버 내부 오류 |

---

---

# PART 2. DB 설계서

---

## 1. Auth Service — PostgreSQL (auth_db)

### users 테이블

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| user_id | UUID | PK | 사용자 ID |
| email | VARCHAR(100) | UNIQUE, NOT NULL | 이메일 |
| password_hash | VARCHAR(255) | NULL | bcrypt 해시 (소셜 로그인 시 NULL) |
| nickname | VARCHAR(50) | NOT NULL | 닉네임 |
| role | VARCHAR(20) | NOT NULL | USER / ADMIN |
| oauth_provider | VARCHAR(20) | NULL | google / kakao (일반 로그인 시 NULL) |
| oauth_id | VARCHAR(100) | NULL | OAuth 제공자의 사용자 고유 ID |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |
| is_deleted | BOOLEAN | DEFAULT false | 소프트 삭제 |

**인덱스:** `email (UNIQUE)`, `(oauth_provider, oauth_id) UNIQUE`

---

## 2. Subscription Service — PostgreSQL (subscription_db)

### subscriptions 테이블

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| subscription_id | UUID | PK | 구독 ID |
| user_id | UUID | NOT NULL, INDEX | 사용자 ID |
| status | VARCHAR(20) | NOT NULL | ACTIVE / PENDING / CANCELLED |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |

### subscription_regions 테이블

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| subscription_id | UUID | FK(subscriptions), NOT NULL | |
| region_code | VARCHAR(10) | NOT NULL | 행정구역 코드 |
| region_name | VARCHAR(100) | NOT NULL | 지역명 |

**인덱스:** `(subscription_id, region_code) UNIQUE`

### subscription_categories 테이블

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| subscription_id | UUID | FK(subscriptions), NOT NULL | |
| category | VARCHAR(30) | NOT NULL | WEATHER / EARTHQUAKE / DUST / DISASTER |

**인덱스:** `(subscription_id, category) UNIQUE`

### outbox_events 테이블 (Transactional Outbox 패턴)

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| event_id | UUID | PK | 이벤트 ID |
| aggregate_type | VARCHAR(50) | NOT NULL | 집합체 유형 (SUBSCRIPTION) |
| aggregate_id | UUID | NOT NULL | 집합체 ID |
| event_type | VARCHAR(50) | NOT NULL | 이벤트 유형 |
| payload | JSONB | NOT NULL | 이벤트 데이터 |
| status | VARCHAR(20) | NOT NULL | PENDING / PUBLISHED / FAILED |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| published_at | TIMESTAMP | | 발행일시 |

**인덱스:** `status, created_at` (PENDING 이벤트 배치 조회용)

---

## 3. Notification Service — PostgreSQL (notification_db)

### notification_history 테이블

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| notification_id | UUID | PK | 알림 ID |
| user_id | UUID | NULL, INDEX | 수신 사용자 ID (NULL = 공개 브로드캐스트 이력) |
| alert_id | UUID | NULL | 원본 알림 ID |
| category | VARCHAR(30) | NOT NULL | 알림 카테고리 |
| severity | VARCHAR(20) | NOT NULL | LOW / MEDIUM / HIGH / CRITICAL |
| title | VARCHAR(200) | NOT NULL | 알림 제목 |
| content | TEXT | NOT NULL | 알림 내용 |
| region_code | VARCHAR(10) | NULL | 발령 지역 코드 (숫자 시도 코드 또는 "전국") |
| source | VARCHAR(100) | NULL | 알림 출처 (기상청 / 환경부 / 행안부 / 관리자) |
| status | VARCHAR(20) | NOT NULL | SENT / FAILED / PENDING |
| issued_at | TIMESTAMP | NULL | 재난 발생 시각 |
| sent_at | TIMESTAMP | NULL | 발송 시각 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |

> **설계 변경 이유:** `user_id = NULL` 레코드는 공개 브로드캐스트 이력(랜딩 페이지 recent API, 관리자 발송 이력용)으로 사용됨. 사용자별 알림 이력은 `user_id IS NOT NULL` 레코드로 구분.

**인덱스:**
- `(user_id, created_at DESC)` — 사용자별 이력 조회
- `(alert_id, user_id)` — 중복 발송 방지

### outbox_events 테이블 (Notification Service용 — 위와 동일 구조)

---

## 4. Alert Processor — MongoDB (event_store)

### alert_events 컬렉션

```json
{
  "_id": "uuid",
  "alertId": "uuid",
  "source": "KMA",
  "category": "WEATHER",
  "severity": "HIGH",
  "title": "서울 폭설 경보",
  "content": "...",
  "regions": ["11", "11010"],
  "rawData": { ... },
  "processedAt": "ISODate",
  "status": "PROCESSED",
  "traceId": "uuid"
}
```

**인덱스:**
- `alertId` (UNIQUE)
- `processedAt` (TTL 인덱스: 30일 자동 삭제)
- `category, severity`

---

## 5. Statistics Service — MongoDB (stats_db)

### alert_stats_hourly 컬렉션 (집계 결과 저장)

```json
{
  "_id": "2025-01-01T12:00:00Z_WEATHER",
  "hour": "ISODate",
  "category": "WEATHER",
  "totalCount": 150,
  "byRegion": {
    "11": 80,
    "26": 70
  },
  "bySeverity": {
    "HIGH": 10,
    "MEDIUM": 140
  },
  "updatedAt": "ISODate"
}
```

---

## 6. Redis Key 설계 요약

| 용도 | Key 패턴 | 타입 | TTL | 예시 |
|------|----------|------|-----|------|
| Refresh Token | `token:refresh:{userId}` | String | 7일 | `token:refresh:abc123` |
| 이메일 인증 코드 | `email:verify:code:{email}` | String | 5분 | `email:verify:code:user@gmail.com` |
| 이메일 인증 완료 | `email:verify:done:{email}` | String | 30분 | `email:verify:done:user@gmail.com` |
| Rate Limit | `ratelimit:{ip}` | String | 1분 | `ratelimit:192.168.1.1` |
| 알림 중복 방지 | `alert:dedup:{alertId}` | String | 24시간 | `alert:dedup:uuid` |
| 알림 캐시 | `alert:recent:{regionCode}` | List | 5분 | `alert:recent:11010` |
| WS 세션 | `ws:user:{userId}` | String | Session | `ws:user:abc123` |
| WS 서버 매핑 | `ws:server:{userId}` | String | Session | `ws:server:abc123` |

---

## 7. ERD 관계 요약

```
users (auth_db)
  └── (userId 참조) subscriptions (subscription_db)
        ├── subscription_regions
        └── subscription_categories

alert_events (event_store) ─→ notification_history (notification_db)
                                    └── (userId 참조) users
```

> 마이크로서비스 간 DB는 물리적으로 분리되어 있어 외래키 제약 없음.
> 서비스 간 데이터 일관성은 Saga 패턴과 이벤트 기반 동기화로 보장.
