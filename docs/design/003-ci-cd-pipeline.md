# Design: CI/CD Pipeline with Test Environment

**Status:** Draft  
**Requirement:** #71  
**Author:** Archer  
**Date:** 2026-02-18

---

## Context

ai-inspection needs automated CI/CD to:
- Catch bugs before merge (CI)
- Keep test environment up-to-date (CD)
- Run E2E tests against real deployments

Current state: Basic CI exists for `server/` but needs updating for new monorepo structure (`api/`, `mcp/`, `web/`, `shared/`).

---

## Decision

Two-stage pipeline:
1. **CI** — runs on every PR and push
2. **CD** — runs on develop branch merge, deploys to test env

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Actions                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ CI Pipeline (on: push, pull_request)                      │   │
│  │                                                           │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │   │
│  │  │  Lint   │  │  Type   │  │  Unit   │  │ Integr. │     │   │
│  │  │         │  │  Check  │  │  Tests  │  │  Tests  │     │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │   │
│  │       ↓            ↓            ↓            ↓           │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │              All must pass to merge                 │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ CD Pipeline (on: push to develop)                         │   │
│  │                                                           │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │   │
│  │  │ Deploy  │  │ Deploy  │  │  Wait   │  │  E2E    │     │   │
│  │  │  API    │──│  Web    │──│  Ready  │──│  Tests  │     │   │
│  │  │ Fly.io  │  │ Vercel  │  │         │  │         │     │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │   │
│  │                                              ↓           │   │
│  │                                    ┌─────────────────┐   │   │
│  │                                    │ Notify on fail  │   │   │
│  │                                    └─────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## CI Pipeline

### Triggers
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

### Jobs

#### 1. Lint & Typecheck (parallel per workspace)

```yaml
jobs:
  lint:
    strategy:
      matrix:
        workspace: [api, mcp, web, shared]
    steps:
      - npm run lint --workspace=${{ matrix.workspace }}
      - npm run typecheck --workspace=${{ matrix.workspace }}
```

#### 2. Unit Tests (parallel per workspace)

```yaml
  test:
    needs: lint
    strategy:
      matrix:
        workspace: [api, mcp]  # web tests later
    steps:
      - npm test --workspace=${{ matrix.workspace }}
```

#### 3. Integration Tests (API with Postgres)

```yaml
  integration:
    needs: lint
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
    steps:
      - npm run test:integration --workspace=api
```

#### 4. Docker Build (verify images build)

```yaml
  docker:
    needs: [test, integration]
    steps:
      - docker build -t api:test ./api
      - docker build -t mcp:test ./mcp
```

### PR Requirements
- All jobs must pass
- Branch protection enforces this

---

## CD Pipeline

### Triggers
- Push to `develop` branch only
- Runs after CI passes

### Jobs

#### 1. Deploy API to Fly.io

```yaml
  deploy-api:
    steps:
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --app ai-inspection-api-test
        working-directory: ./api
```

**Fly.io Config (`api/fly.toml`):**
```toml
app = "ai-inspection-api-test"
primary_region = "syd"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "test"

[http_service]
  internal_port = 3000
  force_https = true
```

#### 2. Deploy Web to Vercel

```yaml
  deploy-web:
    steps:
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./web
```

#### 3. Run E2E Tests

```yaml
  e2e:
    needs: [deploy-api, deploy-web]
    steps:
      - name: Wait for deployments
        run: |
          # Poll health endpoints until ready
          timeout 120 bash -c 'until curl -s $API_URL/health; do sleep 5; done'
      
      - name: Run Playwright tests
        run: npm run test:e2e
        env:
          API_URL: https://ai-inspection-api-test.fly.dev
          WEB_URL: https://ai-inspection-test.vercel.app
```

#### 4. Notify on Failure

```yaml
  notify:
    needs: e2e
    if: failure()
    steps:
      - name: Discord notification
        uses: sarisia/actions-status-discord@v1
        with:
          webhook: ${{ secrets.DISCORD_WEBHOOK }}
          status: failure
          title: "E2E Tests Failed"
```

---

## Test Environment

| Component | Platform | URL | Free Tier |
|-----------|----------|-----|-----------|
| API | Fly.io | `ai-inspection-api-test.fly.dev` | ✅ 3 VMs |
| Web | Vercel | `ai-inspection-test.vercel.app` | ✅ Unlimited |
| DB | Fly.io Postgres | (internal) | ✅ 1GB |

### Environment Variables

**API (Fly.io secrets):**
```bash
flyctl secrets set \
  DATABASE_URL="postgres://..." \
  AUTH_PASSWORD="test-password" \
  JWT_SECRET="test-jwt-secret-min-32-chars"
```

**Web (Vercel env):**
```bash
NEXT_PUBLIC_API_URL=https://ai-inspection-api-test.fly.dev
```

---

## Secrets Required

| Secret | Used By | Description |
|--------|---------|-------------|
| `FLY_API_TOKEN` | CD | Fly.io deploy token |
| `VERCEL_TOKEN` | CD | Vercel deploy token |
| `VERCEL_ORG_ID` | CD | Vercel organization |
| `VERCEL_PROJECT_ID` | CD | Vercel project |
| `DISCORD_WEBHOOK` | CD | Failure notifications |

---

## Workflow Files

```
.github/workflows/
├── ci.yml          # Lint, test, build on PR
└── cd.yml          # Deploy on develop push
```

---

## User Stories

After design approval, break into:

1. **Update CI for monorepo** — lint/test all workspaces
2. **Add integration tests job** — API + Postgres
3. **Set up Fly.io test environment** — API deployment
4. **Set up Vercel test environment** — Web deployment  
5. **Add CD workflow** — auto-deploy on develop
6. **Add E2E test job** — Playwright after deploy
7. **Add failure notifications** — Discord webhook

---

## Alternatives Considered

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **GitHub Actions** | Free, integrated | YAML verbose | ✅ Selected |
| CircleCI | Good caching | Separate service | ❌ |
| Railway (instead of Fly.io) | Simple | Less free tier | ❌ |

---

## Open Questions

1. **MCP deployment?** — MCP is OpenClaw skill, not deployed separately. Confirm skip.
2. **Preview environments?** — Deploy PR branches to preview URLs? (nice-to-have)
3. **Staging vs Test?** — One test env for now, add staging later?

---

## Success Criteria

- [ ] PRs cannot merge with failing tests
- [ ] develop branch auto-deploys within 5 minutes
- [ ] E2E tests run against deployed environment
- [ ] Team notified on E2E failures
