-- seed.sql: development seed data
-- Password is "SecurePass123!" hashed with bcrypt cost 12

-- Pro user
INSERT INTO users (id, email, password_hash, name, plan, storage_used_bytes)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'admin@vallexis.io',
    '$2a$12$LJ3m4ys4Gz7Bx5kXQ7ZR5OX1pN7KHMvZQv8oF9K2c4B3dW6Ea5v2y',
    'Vallexis Admin',
    'pro',
    0
)
ON CONFLICT (email) DO NOTHING;

-- Free user
INSERT INTO users (id, email, password_hash, name, plan, storage_used_bytes)
VALUES (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'free@vallexis.io',
    '$2a$12$LJ3m4ys4Gz7Bx5kXQ7ZR5OX1pN7KHMvZQv8oF9K2c4B3dW6Ea5v2y',
    'Free User',
    'free',
    0
)
ON CONFLICT (email) DO NOTHING;

-- Starter user
INSERT INTO users (id, email, password_hash, name, plan, storage_used_bytes)
VALUES (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    'starter@vallexis.io',
    '$2a$12$LJ3m4ys4Gz7Bx5kXQ7ZR5OX1pN7KHMvZQv8oF9K2c4B3dW6Ea5v2y',
    'Starter User',
    'starter',
    0
)
ON CONFLICT (email) DO NOTHING;

-- Subscriptions for all users
INSERT INTO subscriptions (user_id, plan, status, current_period_end)
SELECT id, plan, 'active', now() + INTERVAL '30 days'
FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Sample project for pro user
INSERT INTO projects (user_id, name, git_repo, git_branch, subdomain, status)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'My App',
    'https://github.com/user/my-app',
    'main',
    'my-app',
    'deployed'
)
ON CONFLICT (subdomain) DO NOTHING;
