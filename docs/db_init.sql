-- ============================================================
-- SafeAlert DB 초기화 스크립트
-- 실행 순서: auth_db → subscription_db → notification_db
-- ============================================================

-- ============================================================
-- 1. auth_db
-- ============================================================
-- \c auth_db 로 먼저 접속 후 실행

CREATE TABLE IF NOT EXISTS users (
    user_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email            VARCHAR(100) UNIQUE NOT NULL,
    password_hash    VARCHAR(255),
    nickname         VARCHAR(50) NOT NULL,
    role             VARCHAR(20) NOT NULL DEFAULT 'USER',
    oauth_provider   VARCHAR(20),
    oauth_id         VARCHAR(100),
    created_at       TIMESTAMP NOT NULL DEFAULT now(),
    updated_at       TIMESTAMP NOT NULL DEFAULT now(),
    is_deleted       BOOLEAN DEFAULT false
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
    ON users (email);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth
    ON users (oauth_provider, oauth_id)
    WHERE oauth_provider IS NOT NULL;

-- 이미 테이블이 있는 경우 ALTER로 컬럼 추가
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(100);


-- ============================================================
-- 2. subscription_db
-- ============================================================
-- \c subscription_db 로 먼저 접속 후 실행

CREATE TABLE IF NOT EXISTS subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
    ON subscriptions (user_id);

CREATE TABLE IF NOT EXISTS subscription_regions (
    id              BIGSERIAL PRIMARY KEY,
    subscription_id UUID NOT NULL REFERENCES subscriptions(subscription_id),
    region_code     VARCHAR(10) NOT NULL,
    region_name     VARCHAR(100) NOT NULL,
    UNIQUE (subscription_id, region_code)
);

CREATE TABLE IF NOT EXISTS subscription_categories (
    id              BIGSERIAL PRIMARY KEY,
    subscription_id UUID NOT NULL REFERENCES subscriptions(subscription_id),
    category        VARCHAR(30) NOT NULL,
    UNIQUE (subscription_id, category)
);

CREATE TABLE IF NOT EXISTS outbox_events (
    event_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type  VARCHAR(50) NOT NULL,
    aggregate_id    UUID NOT NULL,
    event_type      VARCHAR(50) NOT NULL,
    payload         TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    published_at    TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_outbox_status
    ON outbox_events (status, created_at);

CREATE TABLE IF NOT EXISTS region_codes (
    code        VARCHAR(10) PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    parent_code VARCHAR(10)
);


-- ============================================================
-- 3. notification_db
-- ============================================================
-- \c notification_db 로 먼저 접속 후 실행

CREATE TABLE IF NOT EXISTS notification_history (
    notification_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL,
    alert_id         UUID,
    category         VARCHAR(30) NOT NULL,
    severity         VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    title            VARCHAR(200) NOT NULL,
    content          TEXT NOT NULL,
    region_code      VARCHAR(10),
    source           VARCHAR(100),
    status           VARCHAR(20) NOT NULL DEFAULT 'SENT',
    issued_at        TIMESTAMP,
    sent_at          TIMESTAMP,
    created_at       TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_user_created
    ON notification_history (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_alert_user
    ON notification_history (alert_id, user_id);
