# TESTING.md — Testing Strategy

> **Last Updated:** June 23, 2026

---

## Table of Contents

1. [Philosophy](#philosophy)
2. [Test Pyramid](#test-pyramid)
3. [Go Backend Tests](#go-backend-tests)
4. [Frontend Tests](#frontend-tests)
5. [End-to-End Tests](#end-to-end-tests)
6. [Running Tests](#running-tests)
7. [CI Test Pipeline](#ci-test-pipeline)
8. [Coverage Requirements](#coverage-requirements)
9. [Test Data & Fixtures](#test-data--fixtures)
10. [What Not to Test](#what-not-to-test)

---

## Philosophy

- **Test behaviour, not implementation.** Tests should verify what the code does, not how it does it internally. If a refactor breaks tests without changing behaviour, the tests are wrong.
- **Fast feedback loops.** Unit tests must complete in under 5 seconds. A slow test suite is a test suite developers skip.
- **Tests are first-class code.** Test code has the same standards as production code — no dead code, no copy-paste, no magic numbers without constants.
- **Fail loud.** Tests should produce clear, actionable failure messages. `expected 200, got 403` is good. `expected true, got false` is useless.
- **Don't test PayMongo or PostgreSQL internals.** We trust third-party libraries. We test our business logic that uses them.

---

## Test Pyramid

```
                      ┌────────────┐
                      │  E2E (few) │   ~10 tests, slow, highest confidence
                     / ─────────── \
                    /  Integration  \  ~100 tests, moderate speed
                   / ─────────────── \
                  /      Unit         \  ~500 tests, fast, many
                 └─────────────────────┘
```

| Layer | Count (target) | Speed | Confidence | Tooling |
|---|---|---|---|---|
| Unit | ~500 | <5s total | Low–Medium | `go test`, Vitest |
| Integration | ~100 | ~30s total | Medium–High | `testcontainers-go`, Vitest |
| E2E | ~15 | ~3 min total | Highest | Playwright |

---

## Go Backend Tests

### Unit Tests

Unit tests live in `_test.go` files alongside the code they test.

**Rules:**
- No network calls, no real database — use mocks/stubs.
- No `time.Sleep` — use dependency injection for clocks.
- Table-driven tests for multiple input scenarios.

```go
// src/api-gateway/auth/service_test.go

func TestHashPassword(t *testing.T) {
    tests := []struct {
        name     string
        password string
        wantErr  bool
    }{
        {"valid password", "SecurePass123!", false},
        {"too short", "abc", true},
        {"empty", "", true},
    }

    svc := auth.NewService(auth.DefaultConfig())

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            hash, err := svc.HashPassword(tt.password)
            if tt.wantErr {
                assert.Error(t, err)
                assert.Empty(t, hash)
            } else {
                assert.NoError(t, err)
                assert.NotEmpty(t, hash)
            }
        })
    }
}
```

### Integration Tests

Integration tests verify that services interact correctly with real infrastructure (PostgreSQL, Redis) via [testcontainers-go](https://golang.testcontainers.io/).

They live in `src/<service>/integration/` directories.

```go
// src/api-gateway/integration/auth_test.go

func TestLogin_Integration(t *testing.T) {
    ctx := context.Background()

    // Spin up a real Postgres container
    pg, err := testcontainers.RunContainer(ctx, postgres.RunOptions{...})
    require.NoError(t, err)
    t.Cleanup(func() { pg.Terminate(ctx) })

    db := connectToTestDB(t, pg.ConnectionString())
    svc := auth.NewService(auth.Config{DB: db})

    // Seed test user
    seedUser(t, db, "test@example.com", "SecurePass123!")

    // Test login
    token, err := svc.Login(ctx, "test@example.com", "SecurePass123!")
    assert.NoError(t, err)
    assert.NotEmpty(t, token.AccessToken)
}
```

### Test File Layout

```
src/
├── api-gateway/
│   ├── auth/
│   │   ├── service.go
│   │   └── service_test.go      ← unit test alongside code
│   ├── projects/
│   │   ├── handler.go
│   │   └── handler_test.go
│   └── integration/
│       ├── auth_test.go          ← integration tests in subdirectory
│       └── projects_test.go
├── deploy-service/
│   └── ...
```

### Mocking

Use interface-based mocks generated with [mockery](https://github.com/vektra/mockery):

```bash
# Install
go install github.com/vektra/mockery/v2@latest

# Generate mocks for all interfaces in a package
mockery --all --dir src/api-gateway/auth --output src/api-gateway/auth/mocks
```

Mocks live in `mocks/` subdirectories. Never hand-write mocks.

---

## Frontend Tests

### Component Tests (Vitest + Testing Library)

Test components in isolation. Render the component, interact with it, assert on what the user sees.

```tsx
// src/frontend/components/ProjectCard.test.tsx

import { render, screen, fireEvent } from '@testing-library/react'
import { ProjectCard } from './ProjectCard'
import { mockProject } from '../test-utils/fixtures'

describe('ProjectCard', () => {
  it('displays project name and status', () => {
    render(<ProjectCard project={mockProject} onDeploy={vi.fn()} />)

    expect(screen.getByText('My Test App')).toBeInTheDocument()
    expect(screen.getByText('deployed')).toBeInTheDocument()
  })

  it('calls onDeploy when deploy button is clicked', async () => {
    const onDeploy = vi.fn()
    render(<ProjectCard project={mockProject} onDeploy={onDeploy} />)

    fireEvent.click(screen.getByRole('button', { name: /deploy/i }))
    expect(onDeploy).toHaveBeenCalledWith(mockProject.id)
  })
})
```

### Hook Tests

Custom hooks are tested with `renderHook` from Testing Library:

```tsx
import { renderHook, waitFor } from '@testing-library/react'
import { useProjects } from './useProjects'

it('fetches and returns projects', async () => {
  const { result } = renderHook(() => useProjects(), { wrapper: QueryClientWrapper })

  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data?.projects).toHaveLength(1)
})
```

### What to Test in Frontend

| ✅ Test | ❌ Don't Test |
|---|---|
| Component renders correct content | CSS classes (use visual tests instead) |
| User interactions trigger correct callbacks | Internal component state directly |
| Error states render correctly | Third-party library behaviour |
| Form validation messages | Implementation details (private functions) |
| Loading states | Exact HTML structure |

---

## End-to-End Tests

E2E tests simulate real user journeys through the browser using [Playwright](https://playwright.dev/).

They require all services to be running (`make dev-backend && npm run dev` in frontend).

### Location

```
tests/
└── e2e/
    ├── auth.spec.ts
    ├── deploy.spec.ts
    ├── payment.spec.ts
    └── fixtures/
        └── users.ts
```

### Critical Path Coverage

These user journeys must have E2E coverage:

| Journey | File | Priority |
|---|---|---|
| Register → verify → login | `auth.spec.ts` | P0 |
| Create project → first deploy → verify live | `deploy.spec.ts` | P0 |
| Upgrade to Pro via PayMongo Payment Link | `payment.spec.ts` | P0 |
| Upload a file to storage | `storage.spec.ts` | P1 |
| Trigger SEO audit → view results | `seo.spec.ts` | P1 |

### Example

```typescript
// tests/e2e/deploy.spec.ts

import { test, expect } from '@playwright/test'
import { loginAs } from './fixtures/users'

test('create project and trigger deploy', async ({ page }) => {
  await loginAs(page, 'free@example.com')

  // Create project
  await page.goto('/projects/new')
  await page.fill('[data-testid="project-name"]', 'E2E Test App')
  await page.fill('[data-testid="git-repo"]', 'https://github.com/vallexis/demo-app')
  await page.click('[data-testid="create-project-btn"]')

  // Should redirect to project page
  await expect(page).toHaveURL(/\/projects\/proj_/)

  // Trigger deploy
  await page.click('[data-testid="deploy-btn"]')

  // Wait for deploy log stream to appear
  await expect(page.locator('[data-testid="deploy-log"]')).toBeVisible({ timeout: 5000 })

  // Wait for deploy to complete (max 2 minutes)
  await expect(page.locator('[data-testid="deploy-status"]'))
    .toHaveText('success', { timeout: 120000 })
})
```

---

## Running Tests

### All Tests

```bash
make test         # Go unit + integration tests
make test-fe      # Frontend unit + component tests
make test-e2e     # E2E tests (requires running services)
make test-all     # Everything
```

### Go Tests Only

```bash
# Run all tests
go test ./...

# Run with race detector (recommended)
go test -race ./...

# Run specific package
go test ./src/api-gateway/auth/...

# Run specific test
go test ./src/api-gateway/auth/ -run TestHashPassword

# Run integration tests (skipped by default)
go test ./src/api-gateway/integration/... -tags=integration

# With coverage
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out -o coverage.html
```

### Frontend Tests

```bash
cd src/frontend

# Run once
npm test

# Watch mode (during development)
npm run test:watch

# With coverage
npm run test:coverage
```

### E2E Tests

```bash
# Install Playwright browsers (one-time)
npx playwright install --with-deps

# Run all E2E tests
npm run test:e2e

# Run specific file
npx playwright test tests/e2e/auth.spec.ts

# Headed mode (see the browser)
npx playwright test --headed

# Debug mode (step through)
npx playwright test --debug

# View last test report
npx playwright show-report
```

---

## CI Test Pipeline

The CI pipeline runs on every push and PR (see `.github/workflows/ci.yml`):

```
PR opened / push
      │
      ├── [Parallel]
      │   ├── go test -race ./...
      │   ├── golangci-lint run
      │   ├── npm test (frontend)
      │   └── trivy image scan
      │
      ├── [Sequential — only on main branch]
      │   ├── go test -tags=integration ./...
      │   └── playwright test (E2E against staging)
      │
      └── [Gate]
          All checks must pass before merge is allowed
```

---

## Coverage Requirements

| Layer | Minimum | Target |
|---|---|---|
| Go unit tests | 70% per package | 80%+ |
| Go integration tests | Critical paths only | key happy + error paths |
| Frontend components | New components: 100% render | 70%+ statement |
| E2E | 5 critical journeys | All P0 + P1 journeys |

Coverage is checked in CI. PRs that reduce coverage below the minimum will fail.

```bash
# Check current Go coverage
go test ./... -coverprofile=coverage.out
go tool cover -func=coverage.out | tail -1
# total: (statements) 74.2%
```

---

## Test Data & Fixtures

### Go

Use the `testdata/` directory for JSON fixtures and SQL seed files:

```
src/api-gateway/
└── testdata/
    ├── fixtures/
    │   ├── users.sql
    │   └── projects.sql
    └── responses/
        ├── paymongo_webhook.json
        └── github_push_event.json
```

### Frontend

Centralise test fixtures in `src/frontend/test-utils/fixtures.ts`:

```ts
export const mockProject: Project = {
  id: 'proj_test123',
  name: 'My Test App',
  subdomain: 'my-test-app',
  status: 'deployed',
  // ...
}

export const mockUser: User = {
  id: 'usr_test123',
  email: 'test@example.com',
  plan: 'free',
  // ...
}
```

Never use real user emails, real payment details, or real API keys in test fixtures.

---

## What Not to Test

| Don't test | Reason |
|---|---|
| `fmt.Println` output | Not business logic |
| PayMongo SDK internals | We trust PayMongo's own tests |
| PostgreSQL query syntax | Tested by DB integration tests, not unit |
| CSS / visual rendering | Use visual regression tests (future) |
| Configuration parsing | Test config validation, not `os.Getenv` |
| The Go standard library | It has its own test suite |
