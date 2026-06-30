-- 004_paymongo.sql: add PayMongo columns for payment integration

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS paymongo_customer_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS paymongo_subscription_id TEXT;
