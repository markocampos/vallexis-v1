-- 003_billing_fixes.sql: bandwidth tracking for usage display

CREATE TABLE IF NOT EXISTS bandwidth_usage (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bytes       BIGINT NOT NULL DEFAULT 0,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bandwidth_usage_user_id ON bandwidth_usage(user_id);
