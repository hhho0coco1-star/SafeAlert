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

## 3. Notification Service API

### GET /api/notifications — 알림 이력 조회

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| page | int | 선택 | 페이지 번호 (기본값: 0) |
| size | int | 선택 | 페이지 크기 (기본값: 20) |
| category | string | 선택 | 카테고리 필터 |
| startDate | string | 선택 | 시작 날짜 (ISO 8601) |
| endDate | string | 선택 | 종료 날짜 (ISO 8601) |

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "notificationId": "uuid",
        "category": "WEATHER",
        "severity": "HIGH",
        "title": "서울 폭설 경보",
        "content": "서울 전역에 폭설 경보가 발령되었습니다.",
        "region": "서울특별시",
        "issuedAt": "2025-01-01T12:00:00Z",
        "receivedAt": "2025-01-01T12:00:03Z"
      }
    ],
    "totalElements": 100,
    "totalPages": 5,
    "currentPage": 0
  }
}
```

---

### GET /api/notifications/ws — WebSocket 연결 엔드포인트

- 프로토콜: WebSocket (STOMP)
- 연결 URL: `ws://localhost:8080/api/notifications/ws`
- 구독 경로: `/topic/alerts/{userId}`
- 인증: 연결 시 STOMP CONNECT 헤더에 JWT 포함

---

## 4. Statistics Service API (관리자 전용)

### GET /api/admin/stats/alerts — 알림 통계 조회

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| from | string | 필수 | 시작 시간 |
| to | string | 필수 | 종료 시간 |
| groupBy | string | 선택 | `hour` / `day` / `region` / `category` |

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 1523,
    "byCategory": {
      "WEATHER": 800,
      "EARTHQUAKE": 23,
      "DUST": 700
    },
    "byHour": [
      { "hour": "2025-01-01T12:00:00Z", "count": 120 }
    ]
  }
}
```

---

## 5. Admin Service API

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

| 페이지 | 경로 | 인증 | 사용 API |
|--------|------|------|---------|
| 랜딩 | `/` | 불필요 | 없음 |
| 로그인 | `/login` | 불필요 | POST /api/auth/login |
| 회원가입 | `/signup` | 불필요 | POST /api/auth/signup |
| 메인 대시보드 | `/dashboard` | 필요 | GET /api/subscriptions, GET /api/notifications, WebSocket |
| 구독 설정 | `/subscriptions` | 필요 | GET/POST/DELETE /api/subscriptions/regions, PUT /api/subscriptions/categories |
| 알림 이력 | `/history` | 필요 | GET /api/notifications |
| 내 계정 | `/profile` | 필요 | POST /api/auth/logout |
| 관리자 대시보드 | `/admin` | 관리자 | GET /api/admin/stats/alerts, POST /api/admin/alerts/manual |

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
| user_id | UUID | NOT NULL, INDEX | 수신 사용자 ID |
| alert_id | UUID | NOT NULL | 원본 알림 ID |
| category | VARCHAR(30) | NOT NULL | 알림 카테고리 |
| severity | VARCHAR(20) | NOT NULL | LOW / MEDIUM / HIGH / CRITICAL |
| title | VARCHAR(200) | NOT NULL | 알림 제목 |
| content | TEXT | NOT NULL | 알림 내용 |
| region_code | VARCHAR(10) | NOT NULL | 발령 지역 코드 |
| status | VARCHAR(20) | NOT NULL | SENT / FAILED / PENDING |
| issued_at | TIMESTAMP | NOT NULL | 재난 발생 시각 |
| sent_at | TIMESTAMP | | 발송 시각 |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |

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
