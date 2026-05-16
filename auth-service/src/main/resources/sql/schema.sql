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
