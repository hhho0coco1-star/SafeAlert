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
