-- seed.sql: development seed data
-- Password is "SecurePass123!" hashed with bcrypt cost 12
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
