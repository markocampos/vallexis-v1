# API-VERSIONING.md — API Versioning Strategy

> **Last Updated:** June 23, 2026

This document defines how the Vallexis API is versioned, how breaking changes are managed, and how clients are notified of deprecations.

---

## Table of Contents

1. [Versioning Scheme](#versioning-scheme)
2. [What Counts as Breaking](#what-counts-as-breaking)
3. [Non-Breaking Changes](#non-breaking-changes)
4. [Deprecation Policy](#deprecation-policy)
5. [Client Communication](#client-communication)
6. [Migration Guide Template](#migration-guide-template)

---

## Versioning Scheme

Vallexis uses **URL-based versioning**:

```
https://api.vallexis.io/api/v1/auth/login
https://api.vallexis.io/api/v1/projects
https://api.vallexis.io/api/v2/projects    ← next version
```

### Rules

| Rule | Description |
|---|---|
| Version in URL path | `/api/v1/`, `/api/v2/` |
| Major version only | No `/v1.1/` — breaking changes bump major |
| Current version | **v1** (since launch) |
| Default version | Omitted version defaults to latest stable (`/api/` → `/api/v1/`) |

### Response Headers

Every API response includes version information:

```http
X-API-Version: v1
X-API-Deprecation: true          ← only if endpoint is deprecated
X-API-Sunset: 2027-01-01         ← only if deprecated
```

---

## What Counts as Breaking

A **breaking change** is any modification that would cause existing API clients to fail or produce incorrect results.

### Breaking Changes (require new major version)

| Change Type | Example |
|---|---|
| Removing a field | `email` field removed from user response |
| Renaming a field | `created_at` → `createdAt` |
| Changing a field type | `status: string` → `status: number` |
| Changing authentication | JWT → API key |
| Changing error format | `{ error: "msg" }` → `{ message: "msg" }` |
| Removing an endpoint | `DELETE /projects/:id` removed |
| Changing URL structure | `/api/v1/users/me` → `/api/v1/me` |
| Adding required parameter | `POST /projects` now requires `template` field |

### Non-Breaking Changes (allowed in current version)

| Change Type | Example |
|---|---|
| Adding optional parameter | `?include=stats` query param |
| Adding new field to response | `projects` response gains `last_deployed_at` |
| Adding new endpoint | `POST /projects/:id/domains` |
| Adding new enum value | `status` gains `"paused"` value |
| Relaxing validation | Required field becomes optional |
| Adding new header | `X-RateLimit-Remaining` added |

---

## Non-Breaking Changes

New fields and endpoints can be added to the current version without version bumps. Clients should:

- **Ignore unknown fields** in responses
- **Not depend on field order** in JSON objects
- **Use optional parameters** only when needed

### Adding New Fields

When adding a field to an existing endpoint:

```json
// Before
{ "id": "abc", "name": "My Project" }

// After — new field added, existing fields unchanged
{ "id": "abc", "name": "My Project", "last_deployed_at": "2026-06-23T10:00:00Z" }
```

Clients that don't know about `last_deployed_at` simply ignore it.

### Adding New Endpoints

New endpoints are always non-breaking:

```
POST /api/v1/projects/:id/domains     ← new, no impact on existing endpoints
GET  /api/v1/projects/:id/analytics   ← new, no impact
```

---

## Deprecation Policy

When an endpoint or field must be removed or changed incompatibly:

### Timeline

| Phase | Duration | Action |
|---|---|---|
| **Announcement** | Day 0 | Deprecation announced in changelog, email, dashboard |
| **Deprecation** | 6 months | Endpoint still works, returns `X-API-Deprecation: true` |
| **Sunset** | After 6 months | Endpoint returns `410 Gone` with migration link |
| **Removal** | After 9 months | Endpoint removed from codebase |

### Sunset Response

When a deprecated endpoint is called after sunset:

```http
HTTP/1.1 410 Gone
X-API-Version: v1
X-API-Sunset: 2027-01-01
Content-Type: application/json

{
  "error": "deprecated_endpoint",
  "message": "This endpoint has been removed. See https://docs.vallexis.io/api/migrate/v1-to-v2",
  "migration_guide": "https://docs.vallexis.io/api/migrate/v1-to-v2"
}
```

### During Deprecation Period

Deprecated endpoints return additional headers:

```http
HTTP/1.1 200 OK
X-API-Deprecation: true
X-API-Sunset: 2027-01-01
X-API-Deprecation-Info: https://docs.vallexis.io/api/deprecations#v1-auth-basic
```

---

## Client Communication

### Channels

| Channel | Timing | Content |
|---|---|---|
| CHANGELOG.md | At announcement | Deprecation details + migration link |
| Email | 30 days before sunset | Direct notification to affected users |
| Dashboard banner | 14 days before sunset | In-app warning for active users |
| API headers | Every request | `X-API-Deprecation` + `X-API-Sunset` |

### Version Support Window

| Version | Status | Supported Until |
|---|---|---|
| v1 | Current | Until v2 releases + 9 months |
| v2 | Next | Will be defined at v2 launch |

When a new major version is released:
- Previous version enters deprecation (6-month window)
- Clients are notified via all channels
- Documentation updates to show new version as current

---

## Migration Guide Template

When releasing a new major version, create `docs/api-migration/v1-to-v2.md`:

```markdown
# Migrating from API v1 to v2

## Overview
- Release date: YYYY-MM-DD
- Sunset date: YYYY-MM-DD (6 months later)
- Breaking changes: [list]

## Endpoint Changes

### GET /projects (renamed)
**v1:** `GET /api/v1/projects`
**v2:** `GET /api/v2/projects`

Changes:
- `created_at` field renamed to `created_at` (ISO 8601 format)
- `status` field changed from string to enum

### POST /auth/login (auth change)
**v1:** `POST /api/v1/auth/login` (returns JWT in body)
**v2:** `POST /api/v2/auth/login` (returns JWT in Set-Cookie header)

## Field Changes

| v1 Field | v2 Field | Type Change |
|---|---|---|
| `created_at` | `created_at` | string → ISO 8601 |
| `status` | `status` | string → enum |

## Testing Your Integration

Run your test suite against the v2 endpoints. All v1 responses include `X-API-Deprecation: true` headers during the transition period.
```

---

## Version Lifecycle Diagram

```
v1 released ──────────────────────────────────────────────────────
                          │
                     v2 announced
                          │
              ┌───────────┴───────────┐
              │  v1 deprecated        │  v2 current
              │  (6 month window)     │
              │  Headers: Deprecated  │
              └───────────┬───────────┘
                          │
                     v1 sunset (410 Gone)
                          │
                     v1 removed (9 months after announce)
```

---

## References

- [API.md](API.md) — Current API reference (v1)
- [CHANGELOG.md](CHANGELOG.md) — Version history
- [CONTRIBUTING.md](CONTRIBUTING.md) — How to add new endpoints
- [SECURITY.md](SECURITY.md) — Authentication changes
