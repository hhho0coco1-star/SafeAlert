CREATE TABLE IF NOT EXISTS notification_history (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL,
    category      VARCHAR(20) NOT NULL,
    title         VARCHAR(200) NOT NULL,
    content       TEXT NOT NULL,
    region        VARCHAR(50),
    source        VARCHAR(100),
    severity      VARCHAR(10),
    created_at    TIMESTAMP DEFAULT now()
);