CREATE TABLE IF NOT EXISTS subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions (user_id);

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

CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox_events (status, created_at);

CREATE TABLE IF NOT EXISTS region_codes (
    code        VARCHAR(10) PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    parent_code VARCHAR(10)
);