# CONTRIBUTING.md — Contribution Guide

> **Last Updated:** June 23, 2026

Thank you for your interest in contributing to Vallexis. This guide covers everything you need to get your development environment running and submit a quality pull request.

---

## Table of Contents

1. [Before You Start](#before-you-start)
2. [Local Development Setup](#local-development-setup)
3. [Development Workflow](#development-workflow)
4. [Commit Convention](#commit-convention)
5. [Pull Request Process](#pull-request-process)
6. [Code Standards](#code-standards)
7. [Testing Requirements](#testing-requirements)
8. [Review Checklist](#review-checklist)

---

## Before You Start

- Read [ARCHITECTURE.md](ARCHITECTURE.md) to understand the system.
- Read [SECURITY.md](SECURITY.md) — security issues must **never** be filed as public GitHub issues. Email `security@vallexis.io` instead.
- Check the [ROADMAP.md](ROADMAP.md) to see if your idea is already planned.
- For large features, open a **Discussion** or draft PR first to align before writing code.

---

## Local Development Setup

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Docker | 27+ | https://docs.docker.com/get-docker/ |
| Docker Compose | 2+ | Bundled with Docker Desktop |
| Go | 1.22+ | https://go.dev/dl/ |
| Node.js | 20+ | https://nodejs.org/ |
| `make` | any | `sudo apt install make` |

### Step-by-step

```bash
# 1. Clone the repo
git clone https://github.com/vallexis/vallexis.git
cd vallexis

# 2. Copy and configure environment variables
cp .env.example .env
# Open .env and fill in required values
# See docs/ENV.md for descriptions of every variable

# 3. Start infrastructure services (Postgres, Redis, MinIO)
docker compose -f docker-compose.dev.yml up -d postgres redis minio

# 4. Run database migrations
make migrate

# 5. Seed development data (optional — creates test users and projects)
make seed

# 6. Start backend services in development mode (hot-reload via Air)
make dev-backend

# 7. In a separate terminal: start the frontend
cd src/frontend
npm install
npm run dev
```

**Dashboard:** http://localhost:5173  
**API:** http://localhost:3000  
**MinIO console:** http://localhost:9001 (minioadmin / minioadmin)

For PayMongo webhook forwarding in local dev, use [ngrok](https://ngrok.com/) to expose your local service:
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3002
# Copy the https forwarding URL (e.g. https://abc123.ngrok.io)
# Add it as a webhook in PayMongo Dashboard → Developers → Webhooks
# Set endpoint to: https://abc123.ngrok.io/webhooks/paymongo
# Copy the webhook secret into .env → PAYMONGO_WEBHOOK_SECRET
```

---

## Development Workflow

```
main
  │
  └── feature/your-feature-name
        │
        ├── commits...
        │
        └── PR ──► CI passes ──► review ──► merge to main
```

1. **Branch from `main`** — always branch from the latest `main`.
2. **Name your branch** — use the pattern `type/short-description`:
   - `feat/custom-domains`
   - `fix/deploy-timeout`
   - `docs/update-api-ref`
   - `chore/upgrade-go-1.23`
3. **Keep PRs small** — aim for <400 lines changed. Larger PRs are harder to review and slower to merge.
4. **Never push directly to `main`** — all changes go through PRs.

---

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]

[optional footer: BREAKING CHANGE or issue reference]
```

### Types

| Type | When to use |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `style` | Code formatting, no logic change |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Tooling, dependencies, CI changes |
| `security` | Security-related fix or hardening |

### Scope (optional but recommended)

`api`, `deploy`, `payment`, `seo`, `frontend`, `db`, `ci`, `infra`

### Examples

```
feat(deploy): add rollback endpoint for failed deploys

fix(payment): handle PayMongo webhook timeout with retry

docs(api): add WebSocket log streaming documentation

security(auth): rotate JWT signing key rotation interval to 90d

chore(deps): upgrade paymongo-go client to v2.1.0
```

### Breaking Changes

Add `BREAKING CHANGE:` in the commit footer:

```
feat(api)!: change project ID format from integer to UUID

BREAKING CHANGE: All project IDs are now UUIDs (e.g. proj_abc123).
Integer IDs from v0.1.x are no longer supported.
```

---

## Pull Request Process

### 1. Open the PR

- Use the PR template (auto-populated from `.github/PULL_REQUEST_TEMPLATE.md`).
- Link the related issue: `Closes #123`.
- Add a clear description of **what** changed and **why**.
- Add screenshots / recordings for UI changes.

### 2. CI must pass

All PRs must pass:

| Check | Tool | Command |
|---|---|---|
| Unit tests | `go test` | `make test` |
| Linter | `golangci-lint` | `make lint` |
| Frontend tests | Vitest | `npm test` |
| Security scan | Trivy | `make scan` |
| Build check | Docker | `make build` |

### 3. Request a review

- Assign at least one reviewer.
- Address all review comments before merging.
- Don't resolve threads opened by reviewers — let reviewers resolve their own.

### 4. Merge

- We use **Squash and Merge** to keep `main` history clean.
- The squash commit message should follow the commit convention above.
- Delete the branch after merging.

---

## Code Standards

### Go

- `gofmt` formatting enforced by CI — run `make fmt` before committing.
- `golangci-lint` with the project's `.golangci.yml` config.
- All exported functions and types must have godoc comments.
- Error wrapping: use `fmt.Errorf("context: %w", err)` — never discard errors.
- No panics in HTTP handlers — recover at middleware level only.
- Avoid `interface{}` / `any` without a type assertion justification.

```go
// ✅ Good
func (s *Service) CreateProject(ctx context.Context, req CreateProjectRequest) (*Project, error) {
    if err := req.Validate(); err != nil {
        return nil, fmt.Errorf("validate request: %w", err)
    }
    // ...
}

// ❌ Bad
func CreateProject(req interface{}) interface{} {
    // no context, no typed error, no validation
}
```

### TypeScript / React

- Strict TypeScript (`"strict": true` in tsconfig).
- No `any` types — use `unknown` + type narrowing.
- Components: functional components with typed props interfaces.
- State management: React Query for server state; `useState`/`useReducer` for local UI state.
- CSS: use design tokens from `index.css` — no magic numbers.

```tsx
// ✅ Good
interface ProjectCardProps {
  project: Project;
  onDeploy: (id: string) => void;
}

export function ProjectCard({ project, onDeploy }: ProjectCardProps) { ... }

// ❌ Bad
export function ProjectCard({ project, onDeploy }: any) { ... }
```

### SQL

- All queries must use parameterized statements — no string interpolation.
- New tables or columns require a migration file in `src/migrations/`.
- Migrations must be reversible (include `DOWN` SQL).

### General

- No secrets or credentials committed — even in tests (use env vars or fixtures).
- Log structured data (`slog` / `zerolog`), not `fmt.Println`.
- Every new HTTP endpoint needs a unit test and documentation update in [API.md](API.md).

---

## Testing Requirements

See [TESTING.md](TESTING.md) for the full testing strategy. In summary:

| Layer | Minimum coverage | Tooling |
|---|---|---|
| Go unit tests | 70% per package | `go test` |
| Go integration tests | Key flows covered | `testcontainers-go` |
| Frontend component tests | New components | Vitest + Testing Library |
| E2E (critical paths) | Auth, deploy, payment | Playwright |

**Run all tests locally before pushing:**

```bash
make test        # Go unit + integration tests
make test-fe     # Frontend tests
make test-e2e    # End-to-end (requires services running)
```

---

## Review Checklist

Use this when reviewing a PR (or self-reviewing before opening one):

### Correctness
- [ ] The change does what the description says
- [ ] Edge cases are handled (empty state, large input, network failure)
- [ ] No obvious race conditions (Go goroutines / shared state)
- [ ] Database queries are indexed for the access pattern

### Security
- [ ] No secrets or credentials in the diff
- [ ] User input is validated before use
- [ ] SQL queries use parameterized statements
- [ ] New API endpoints require authentication where appropriate
- [ ] File uploads validate MIME type server-side

### Quality
- [ ] Tests are included for new behaviour
- [ ] No new linter warnings
- [ ] Documentation updated (API.md, CHANGELOG.md, etc.)
- [ ] No commented-out code or debug statements

### Design (UI changes)
- [ ] Uses design tokens from the design system (see [DESIGN.md](DESIGN.md))
- [ ] Accessible (keyboard nav, contrast, aria labels)
- [ ] Responsive (tested at mobile, tablet, desktop)
- [ ] `prefers-reduced-motion` respected for animations
