# API.md — Vallexis REST API Reference

> **Version:** v1
> **Last Updated:** June 23, 2026
> **Base URL (Production):** `https://api.vallexis.io/v1`
> **Base URL (Staging):** `https://api.staging.vallexis.io/v1`
> **Base URL (Local):** `http://localhost:3000/api/v1`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Versioning & Stability](#versioning--stability)
3. [Request Format](#request-format)
4. [Response Format](#response-format)
5. [Endpoints](#endpoints)
   - [Auth](#auth-endpoints)
   - [Users](#users-endpoints)
   - [Projects](#projects-endpoints)
   - [Deploys](#deploys-endpoints)
   - [Billing](#billing-endpoints)
   - [Storage](#storage-endpoints)
   - [SEO](#seo-endpoints)
6. [WebSocket / Real-time](#websocket--real-time)
7. [Error Responses](#error-responses)
8. [Rate Limits](#rate-limits)
9. [Pagination](#pagination)
10. [SDK Examples](#sdk-examples)

---

## Authentication

All authenticated endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

Tokens are short-lived JWTs signed with RS256 (15-minute TTL). Use the refresh endpoint to obtain a new access token without requiring the user to log in again.

### Obtain a Token

```bash
curl -X POST https://api.vallexis.io/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123!"}'
```

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2g...",
  "expires_in": 900,
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "plan": "free"
  }
}
```

### Refresh a Token

```bash
curl -X POST https://api.vallexis.io/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "dGhpcyBpcyBhIHJlZnJlc2g..."}'
```

---

## Versioning & Stability

- The current stable version is **`v1`**, included in all endpoint paths.
- Breaking changes will result in a new version prefix (`v2`). `v1` will remain supported for at least 12 months after a new version ships.
- Non-breaking additions (new fields, new endpoints) are made without a version bump.
- Deprecations are announced in the `Deprecation` response header (RFC 8594) at least 90 days before removal.

---

## Request Format

- All request bodies must be `Content-Type: application/json` unless otherwise specified (e.g. file uploads use `multipart/form-data`).
- `PATCH` endpoints accept partial updates — only the fields you include are modified.
- All timestamps use **ISO 8601 UTC** format: `2026-06-23T15:00:00Z`.
- IDs are prefixed strings (e.g. `usr_`, `proj_`, `dep_`, `inv_`) to prevent accidental cross-resource lookups.

---

## Response Format

All responses return JSON. HTTP status codes follow standard semantics.

```json
{
  "data": { ... },       // Present on success (sometimes the top-level object itself)
  "error": "ERROR_CODE", // Present on failure
  "message": "...",      // Human-readable description
  "details": { ... }     // Optional: validation errors, extra context
}
```

---

## Endpoints

### Auth Endpoints

#### `POST /auth/register`

Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "Jane Doe"
}
```

**Response `201`:**
```json
{
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "Jane Doe",
    "plan": "free"
  },
  "access_token": "eyJ...",
  "refresh_token": "dGhpcy...",
  "expires_in": 900
}
```

**Response `422`** — validation failure:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Password does not meet requirements",
  "details": {
    "password": ["Must be at least 12 characters", "Must include at least one number"]
  }
}
```

**Response `409`** — email already registered:
```json
{ "error": "EMAIL_TAKEN", "message": "An account with this email already exists." }
```

---

#### `POST /auth/login`

**Request:**
```json
{ "email": "user@example.com", "password": "SecurePass123!" }
```

**Response `200`:**
```json
{ "access_token": "...", "refresh_token": "...", "expires_in": 900, "user": { ... } }
```

**Response `401`:**
```json
{ "error": "INVALID_CREDENTIALS", "message": "Email or password is incorrect." }
```

**Response `429`:**
```json
{ "error": "RATE_LIMITED", "message": "Too many login attempts. Try again in 52 minutes." }
```

---

#### `POST /auth/logout`

Revokes the current refresh token. The access token expires naturally after 15 minutes.

**Response `200`:**
```json
{ "message": "Logged out successfully." }
```

---

#### `POST /auth/refresh`

Exchange a refresh token for a new token pair (refresh tokens are single-use and automatically rotated).

**Request:**
```json
{ "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2g..." }
```

**Response `200`:**
```json
{
  "access_token": "new_eyJ...",
  "refresh_token": "new_dGhpcy...",
  "expires_in": 900
}
```

---

#### `POST /auth/oauth/:provider`

Initiate OAuth flow. Supported `provider` values: `github`, `google`.

**Response `302`** — redirects to provider's OAuth page.

**Callback:** `GET /auth/oauth/:provider/callback` — handled server-side; redirects to dashboard on success.

---

### Users Endpoints

#### `GET /users/me`

Returns the authenticated user's profile and account details.

**Response `200`:**
```json
{
  "id": "usr_abc123",
  "email": "user@example.com",
  "name": "Jane Doe",
  "plan": "pro",
  "project_count": 2,
  "storage_used_bytes": 536870912,
  "storage_limit_bytes": 2147483648,
  "storage_used_human": "512 MB",
  "storage_limit_human": "2 GB",
  "created_at": "2026-05-20T10:00:00Z",
  "subscription": {
    "plan": "pro",
    "status": "active",
    "current_period_end": "2026-07-20T10:00:00Z",
    "cancel_at_period_end": false
  }
}
```

---

#### `PATCH /users/me`

Update the authenticated user's profile. All fields optional.

**Request:**
```json
{ "name": "Jane Smith" }
```

**Response `200`:** Updated user object (same shape as `GET /users/me`).

---

#### `DELETE /users/me`

Schedules the account for deletion. Data is purged within 30 days. All active projects are stopped immediately.

**Response `200`:**
```json
{ "message": "Account scheduled for deletion. All data will be purged within 30 days." }
```

---

#### `POST /users/me/change-password`

**Request:**
```json
{ "current_password": "OldPass123!", "new_password": "NewSecurePass456!" }
```

**Response `200`:**
```json
{ "message": "Password updated. All existing sessions have been revoked." }
```

---

### Projects Endpoints

#### `GET /projects`

List all projects for the authenticated user.

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `status` | string | Filter by status: `idle`, `building`, `deployed`, `failed` |
| `limit` | int | Results per page (default: 20, max: 100) |
| `cursor` | string | Pagination cursor from previous response |

**Response `200`:**
```json
{
  "projects": [
    {
      "id": "proj_abc123",
      "name": "My SaaS",
      "subdomain": "my-saas",
      "custom_domain": null,
      "status": "deployed",
      "git_repo": "github.com/user/my-saas",
      "git_branch": "main",
      "last_deployed_at": "2026-06-20T15:30:00Z",
      "created_at": "2026-05-25T10:00:00Z"
    }
  ],
  "total": 1,
  "next_cursor": null,
  "plan_limit": 1
}
```

---

#### `POST /projects`

Create a new project and trigger an initial deploy.

**Request:**
```json
{
  "name": "My New App",
  "git_repo": "https://github.com/user/new-app",
  "git_branch": "main"
}
```

**Response `201`:**
```json
{
  "id": "proj_def456",
  "name": "My New App",
  "subdomain": "my-new-app",
  "status": "building",
  "deploy_url": "https://my-new-app.vallexis.io",
  "deploy_id": "dep_ghi012"
}
```

**Response `403`:**
```json
{
  "error": "PLAN_LIMIT_REACHED",
  "message": "Free plan allows 1 project. Upgrade to Pro for up to 2.",
  "upgrade_url": "https://vallexis.io/billing/upgrade"
}
```

---

#### `GET /projects/:id`

**Response `200`:**
```json
{
  "id": "proj_abc123",
  "name": "My SaaS",
  "subdomain": "my-saas",
  "custom_domain": "app.mysaas.com",
  "status": "deployed",
  "git_repo": "github.com/user/my-saas",
  "git_branch": "main",
  "last_commit_sha": "abc1234",
  "last_commit_message": "Fix login bug",
  "last_deployed_at": "2026-06-20T15:30:00Z",
  "storage_used_bytes": 104857600,
  "urls": {
    "primary": "https://app.mysaas.com",
    "subdomain": "https://my-saas.vallexis.io"
  },
  "metrics": {
    "deploy_count": 47,
    "uptime_30d_pct": 99.8
  }
}
```

**Response `404`:**
```json
{ "error": "NOT_FOUND", "message": "Project not found or you do not have access to it." }
```

---

#### `PATCH /projects/:id`

Update project settings.

**Request:**
```json
{
  "name": "My Renamed App",
  "git_branch": "production",
  "custom_domain": "app.mynewdomain.com"
}
```

**Response `200`:** Updated project object.

---

#### `DELETE /projects/:id`

Stops and removes the project container and all associated data.

**Response `200`:**
```json
{ "message": "Project deleted. Container stopped and data purged." }
```

---

### Deploys Endpoints

#### `GET /projects/:id/deploys`

List deploy history for a project, newest first.

**Query parameters:** `limit` (default: 20), `cursor` (pagination)

**Response `200`:**
```json
{
  "deploys": [
    {
      "id": "dep_xyz789",
      "commit_sha": "abc1234",
      "commit_message": "Fix login bug",
      "status": "success",
      "duration_seconds": 45,
      "created_at": "2026-06-20T15:30:00Z"
    }
  ],
  "total": 47,
  "next_cursor": "dep_uvw456"
}
```

---

#### `POST /projects/:id/deploys`

Trigger a manual deploy.

**Request:**
```json
{ "force": true }
```

> `force: true` deploys even if no new commits are detected.

**Response `202`:**
```json
{
  "deploy_id": "dep_ghi012",
  "status": "queued",
  "message": "Deploy triggered. Stream logs via WebSocket or SSE.",
  "ws_url": "wss://api.vallexis.io/v1/projects/proj_abc123/deploys/dep_ghi012/logs/ws",
  "sse_url": "https://api.vallexis.io/v1/projects/proj_abc123/deploys/dep_ghi012/logs"
}
```

**Response `409`:**
```json
{ "error": "DEPLOY_IN_PROGRESS", "message": "A deploy is already running for this project." }
```

---

#### `GET /projects/:id/deploys/:deploy_id`

**Response `200`:**
```json
{
  "id": "dep_xyz789",
  "commit_sha": "abc1234",
  "commit_message": "Fix login bug",
  "status": "success",
  "duration_seconds": 45,
  "started_at": "2026-06-20T15:29:15Z",
  "completed_at": "2026-06-20T15:30:00Z",
  "logs_sse_url": "/v1/projects/proj_abc123/deploys/dep_xyz789/logs",
  "logs_ws_url": "wss://api.vallexis.io/v1/projects/proj_abc123/deploys/dep_xyz789/logs/ws",
  "rolled_back": false
}
```

---

#### `GET /projects/:id/deploys/:deploy_id/logs`

Stream build logs via Server-Sent Events (SSE). Connect with `EventSource` in the browser or `curl --no-buffer`.

**Response `200` (`text/event-stream`):**
```
data: [15:29:15] Cloning repository...

data: [15:29:18] Building Docker image (layer cache: HIT)...

data: [15:29:43] Image built in 25s

data: [15:29:44] Starting container...

data: [15:29:49] Health check passed: HTTP 200

data: [15:30:00] ✅ Deploy complete

event: done
data: {"status": "success", "duration_seconds": 45}
```

---

#### `POST /projects/:id/deploys/:deploy_id/rollback`

Roll back to this deploy version.

**Response `202`:**
```json
{ "message": "Rollback initiated.", "new_deploy_id": "dep_rollback_001" }
```

---

### Billing Endpoints

#### `GET /billing/subscription`

**Response `200`:**
```json
{
  "plan": "pro",
  "status": "active",
  "amount_cents": 24900,
  "currency": "php",
  "interval": "monthly",
  "current_period_start": "2026-06-20T10:00:00Z",
  "current_period_end": "2026-07-20T10:00:00Z",
  "cancel_at_period_end": false
}
```

---

#### `POST /billing/checkout`

Create a PayMongo Payment Link to upgrade to a paid plan.

**Request:**
```json
{ "plan": "pro", "interval": "monthly" }
```

**Response `200`:**
```json
{
  "checkout_url": "https://pm.link/vallexis/pro/xxxxx",
  "expires_at": "2026-06-23T17:00:00Z"
}
```

---

#### `POST /billing/portal`

Generate a PayMongo customer billing portal URL for the authenticated user to manage billing, cancel, or update payment method.

**Response `200`:**
```json
{ "portal_url": "https://billing.paymongo.com/portal/xxxxx" }
```

---

#### `POST /billing/cancel`

Schedule subscription cancellation at the end of the current billing period.

**Response `200`:**
```json
{
  "message": "Subscription will be cancelled on 2026-07-20. You retain Pro access until then.",
  "cancel_at": "2026-07-20T10:00:00Z"
}
```

---

#### `GET /billing/invoices`

**Query parameters:** `limit` (default: 20), `cursor`

**Response `200`:**
```json
{
  "invoices": [
    {
      "id": "inv_abc123",
      "amount_cents": 24900,
      "currency": "php",
      "status": "paid",
      "pdf_url": "https://api.paymongo.com/v1/payments/pay_xxx/receipt",
      "created_at": "2026-06-20T10:00:00Z"
    }
  ],
  "next_cursor": null
}
```

---

### Storage Endpoints

#### `GET /storage/usage`

**Response `200`:**
```json
{
  "used_bytes": 536870912,
  "limit_bytes": 2147483648,
  "used_human": "512 MB",
  "limit_human": "2 GB",
  "usage_percent": 1.0,
  "by_project": [
    {
      "project_id": "proj_abc123",
      "project_name": "My SaaS",
      "bytes": 536870912,
      "human": "512 MB"
    }
  ]
}
```

---

#### `POST /storage/upload`

Upload a file. Max file size: **100 MB**. Content type is auto-detected server-side.

```bash
curl -X POST https://api.vallexis.io/v1/storage/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@image.png" \
  -F "project_id=proj_abc123"
```

**Response `201`:**
```json
{
  "id": "file_xyz789",
  "url": "https://storage.vallexis.io/proj_abc123/image.png",
  "size_bytes": 104857,
  "content_type": "image/png",
  "created_at": "2026-06-23T15:00:00Z"
}
```

**Response `413`:**
```json
{ "error": "FILE_TOO_LARGE", "message": "File exceeds the 100 MB limit." }
```

---

#### `GET /storage/files`

List all uploaded files for the authenticated user.

**Query parameters:** `project_id` (filter by project), `limit`, `cursor`

**Response `200`:**
```json
{
  "files": [
    {
      "id": "file_xyz789",
      "project_id": "proj_abc123",
      "filename": "image.png",
      "url": "https://storage.vallexis.io/proj_abc123/image.png",
      "size_bytes": 104857,
      "content_type": "image/png",
      "created_at": "2026-06-23T15:00:00Z"
    }
  ],
  "next_cursor": null
}
```

---

#### `DELETE /storage/files/:file_id`

**Response `200`:**
```json
{ "message": "File deleted." }
```

---

### SEO Endpoints

#### `GET /projects/:id/seo`

Get the latest SEO audit results for a project.

**Response `200`:**
```json
{
  "project_id": "proj_abc123",
  "url": "https://my-saas.vallexis.io",
  "last_audit": "2026-06-17T06:00:00Z",
  "scores": {
    "performance": 87,
    "accessibility": 92,
    "seo": 95,
    "best_practices": 90
  },
  "issues": [
    {
      "type": "warning",
      "category": "performance",
      "message": "Largest Contentful Paint (LCP): 3.2s — target <2.5s",
      "impact": "medium"
    }
  ],
  "sitemap_url": "https://my-saas.vallexis.io/sitemap.xml",
  "robots_txt_url": "https://my-saas.vallexis.io/robots.txt",
  "robots_txt_valid": true
}
```

---

#### `POST /projects/:id/seo/audit`

Trigger an on-demand SEO audit (in addition to the weekly automated audit).

**Response `202`:**
```json
{ "message": "SEO audit started. Results available in approximately 2 minutes." }
```

---

## WebSocket / Real-time

### Deploy Log Streaming (WebSocket)

Connect to stream real-time build logs for a deploy:

```
wss://api.vallexis.io/v1/projects/:id/deploys/:deploy_id/logs/ws
```

**Authentication:** Pass the access token as a query parameter:
```
wss://api.vallexis.io/v1/projects/proj_abc123/deploys/dep_xyz789/logs/ws?token=eyJ...
```

**Message format (server → client):**
```json
{ "type": "log", "timestamp": "2026-06-23T15:30:01Z", "line": "[15:30:01] Building Docker image..." }
{ "type": "done", "status": "success", "duration_seconds": 45 }
{ "type": "done", "status": "failed", "error": "Health check failed after 10 retries" }
```

---

## Error Responses

All error responses share this structure:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description of what went wrong.",
  "details": {}
}
```

### Error Code Reference

| Code | HTTP Status | Description |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing or invalid access token |
| `TOKEN_EXPIRED` | 401 | Access token has expired — use refresh endpoint |
| `FORBIDDEN` | 403 | Valid token, but insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist or you do not have access |
| `EMAIL_TAKEN` | 409 | Registration attempted with an already-registered email |
| `DEPLOY_IN_PROGRESS` | 409 | A deploy is already running for this project |
| `VALIDATION_ERROR` | 422 | Request body failed validation — see `details` for field-level errors |
| `PLAN_LIMIT_REACHED` | 403 | Action requires a plan upgrade |
| `FILE_TOO_LARGE` | 413 | Uploaded file exceeds the 100 MB limit |
| `RATE_LIMITED` | 429 | Too many requests — see `Retry-After` header |
| `INTERNAL_ERROR` | 500 | Unexpected server error — please report with request ID |

---

## Rate Limits

All responses include the following headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1719038400
Retry-After: 13          (only present when 429 is returned)
```

| Plan | Requests/min | Deploys/hr | Storage uploads/hr |
|---|---|---|---|
| Free | 100 | 5 | 20 |
| Pro | 500 | 20 | 100 |
| Enterprise | 2,000 | 100 | Unlimited |

Rate limit windows reset every 60 seconds. If you exceed the limit, wait for the `Retry-After` duration before retrying.

---

## Pagination

List endpoints support **cursor-based pagination** for consistent, efficient paging through large result sets.

**Request:**
```
GET /projects?limit=20&cursor=proj_abc123
```

**Response:**
```json
{
  "projects": [ ... ],
  "total": 47,
  "next_cursor": "proj_xyz789"
}
```

- `next_cursor` is `null` when you have reached the last page.
- Pass `next_cursor` as the `cursor` parameter in your next request.
- Cursors are opaque — do not parse or construct them manually.

---

## SDK Examples

### Node.js

```javascript
import { Vallexis } from '@vallexis/sdk';

const client = new Vallexis({ apiKey: 'vli_live_...' });

// List projects
const { projects } = await client.projects.list();

// Trigger a deploy
const deploy = await client.projects.deploy('proj_abc123', { force: true });

// Stream deploy logs
for await (const line of deploy.logs()) {
  console.log(line);
}

// Upload a file
const file = await client.storage.upload('./image.png', {
  projectId: 'proj_abc123'
});
console.log(file.url);
```

### Python

```python
from vallexis import Vallexis

client = Vallexis(api_key="vli_live_...")

# List projects
projects = client.projects.list()

# Trigger a deploy
deploy = client.projects.deploy("proj_abc123", force=True)

# Poll until complete
result = deploy.wait(timeout=120)
print(f"Deploy status: {result.status}")
```

### cURL

```bash
export TOKEN="your_access_token"
export BASE="https://api.vallexis.io/v1"

# List projects
curl -H "Authorization: Bearer $TOKEN" "$BASE/projects" | jq .

# Create a project
curl -X POST "$BASE/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My App","git_repo":"https://github.com/user/app","git_branch":"main"}' \
  | jq .

# Trigger a deploy
curl -X POST "$BASE/projects/proj_abc123/deploys" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"force":true}' | jq .

# Stream deploy logs (SSE)
curl -N -H "Authorization: Bearer $TOKEN" \
  "$BASE/projects/proj_abc123/deploys/dep_xyz789/logs"
```
