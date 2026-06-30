-- 002_missing_tables.sql: deployments, billing, storage, seo, user extensions

-- User profile extensions
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS notifications JSONB NOT NULL DEFAULT '{"email":true,"deploy":true,"billing":true,"security":true}';

-- Deployments
CREATE TABLE IF NOT EXISTS deployments (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    status         TEXT NOT NULL DEFAULT 'pending',
    commit_hash    TEXT,
    commit_message TEXT,
    logs           TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_deployments_project_id ON deployments(project_id);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    plan                 TEXT NOT NULL DEFAULT 'free',
    status               TEXT NOT NULL DEFAULT 'active',
    current_period_end   TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- Storage objects
CREATE TABLE IF NOT EXISTS storage_objects (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    size       BIGINT NOT NULL DEFAULT 0,
    type       TEXT NOT NULL DEFAULT 'application/octet-stream',
    url        TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_storage_objects_user_id ON storage_objects(user_id);

-- SEO audits
CREATE TABLE IF NOT EXISTS seo_audits (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url        TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'pending',
    score      INTEGER DEFAULT 0,
    results    JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_audits_user_id ON seo_audits(user_id);

-- Seed subscriptions for existing users
INSERT INTO subscriptions (user_id, plan, status, current_period_end)
SELECT id, plan, 'active', now() + INTERVAL '30 days'
FROM users
ON CONFLICT DO NOTHING;
