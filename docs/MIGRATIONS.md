# MIGRATIONS.md — Database Migration Guide

> **Last Updated:** June 23, 2026

This guide covers writing, testing, and deploying database migrations for Vallexis.

---

## Table of Contents

1. [Migration Files](#migration-files)
2. [Writing Migrations](#writing-migrations)
3. [Backwards Compatibility](#backwards-compatibility)
4. [Rollback](#rollback)
5. [Testing](#testing)
6. [Production Checklist](#production-checklist)
7. [Common Patterns](#common-patterns)

---

## Migration Files

Migrations live in `migrations/` at the project root.

```
migrations/
├── 001_initial_schema.sql
├── 002_add_audit_log.sql
└── 003_add_seo_audits.sql
```

**Naming convention:** `NNN_description.sql` where `NNN` is a zero-padded sequential number.

Migrations are applied in filename order. Never rename or reorder committed migrations.

---

## Writing Migrations

Each migration is a plain SQL file executed against PostgreSQL.

```sql
-- 004_add_user_preferences.sql
-- Migration: Add user preferences table
-- Author: your-name
-- Date: 2026-06-23

CREATE TABLE user_preferences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key         TEXT NOT NULL,
  value       JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, key)
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

**Rules:**
- Use `IF NOT EXISTS` / `IF EXISTS` for idempotency
- Add comments explaining non-obvious choices
- Keep migrations small and focused — one logical change per file
- Never modify a migration that has been applied to production

---

## Backwards Compatibility

Migrations must be backwards-compatible to allow zero-downtime deploys. The old application version must work with the new schema during the rollout window.

### Safe Changes (backwards-compatible)

```sql
-- Adding a new column (with default)
ALTER TABLE projects ADD COLUMN description TEXT DEFAULT '';

-- Adding a new table
CREATE TABLE new_table (...);

-- Adding an index (non-blocking)
CREATE INDEX CONCURRENTLY idx_new_table_col ON new_table(col);

-- Adding a new enum value (PostgreSQL 10+)
ALTER TYPE status ADD VALUE IF NOT EXISTS 'paused';
```

### Unsafe Changes (breaking)

```sql
-- ❌ Removing a column — old code still reads it
ALTER TABLE projects DROP COLUMN old_field;

-- ❌ Renaming a column — old code references old name
ALTER TABLE projects RENAME COLUMN old_name TO new_name;

-- ❌ Changing a column type — old code may cast incorrectly
ALTER TABLE projects ALTER COLUMN status TYPE INTEGER;
```

### Safe Migration for Breaking Changes

Use a multi-step migration across two deploys:

```sql
-- Step 1 (deploy v1): Add new column, backfill, keep old
ALTER TABLE projects ADD COLUMN new_name TEXT;
UPDATE projects SET new_name = old_name;
-- Deploy v1 — both columns exist, code writes to new_name

-- Step 2 (deploy v2): Drop old column (separate migration)
ALTER TABLE projects DROP COLUMN old_name;
```

---

## Rollback

Roll back the last applied migration:

```bash
make migrate-down
```

This is a manual operation. The rollback script should undo the last migration's changes.

**Limitations:**
- Data backfill migrations cannot be automatically rolled back
- Column drops cannot be rolled back (data is lost)
- Test rollbacks locally before production use

---

## Testing

### Local Testing

```bash
# Apply all migrations
make migrate

# Verify schema
docker exec -it vallexis-postgres psql -U vallexis -d vallexis_db -c "\dt"

# Roll back and re-apply
make migrate-down
make migrate
```

### CI Testing

Migrations run automatically in CI against a test database:

```yaml
# In .github/workflows/ci.yml
services:
  postgres:
    image: postgres:16-alpine
    env:
      POSTGRES_DB: vallexis_test
```

Tests verify:
- Migrations apply without errors
- Schema matches expected structure
- Rollback succeeds

---

## Production Checklist

Before running a migration in production:

| Step | Command / Action |
|---|---|
| 1. Test locally | `make migrate && make test` |
| 2. Review SQL | No `DROP TABLE`, no `DROP COLUMN` without multi-step |
| 3. Check indexes | Use `CREATE INDEX CONCURRENTLY` for large tables |
| 4. Back up database | `make backup` (see RUNBOOK.md) |
| 5. Deploy migration | `docker exec -i vallexis-postgres psql -U vallexis -d vallexis_db < migrations/NNN_description.sql` |
| 6. Verify | `\dt` in psql, run application tests |
| 7. Monitor | Check Grafana dashboards for errors post-migration |

---

## Common Patterns

### Add a New Table

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, read, created_at DESC);
```

### Add a Column

```sql
-- Safe: adds column with default, no lock on large tables
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
```

### Rename a Column (two-step)

```sql
-- Step 1: Add new column, backfill
ALTER TABLE users ADD COLUMN display_name TEXT;
UPDATE users SET display_name = name WHERE display_name IS NULL;
ALTER TABLE users ALTER COLUMN display_name SET NOT NULL;

-- Step 2 (next deploy): Drop old column
ALTER TABLE users DROP COLUMN IF EXISTS name;
ALTER TABLE users RENAME COLUMN display_name TO name;
```

### Data Migration

```sql
-- Backfill storage_bytes for existing projects
UPDATE projects p
SET storage_bytes = COALESCE((
  SELECT SUM(size_bytes) FROM storage_files sf
  WHERE sf.project_id = p.id
), 0)
WHERE p.storage_bytes = 0;
```

---

## References

- [ARCHITECTURE.md](ARCHITECTURE.md) — Database schema reference
- [ONBOARDING.md](ONBOARDING.md) — Local migration commands
- [CONTRIBUTING.md](CONTRIBUTING.md) — Code standards for migrations
- [RUNBOOK.md](RUNBOOK.md) — Backup before migration
