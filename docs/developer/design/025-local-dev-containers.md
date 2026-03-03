# 025 — Local Dev Container Stack

**Status:** Proposed  
**Author:** Megan  
**Date:** 2026-03-03  

## Problem

The current dev/test loop depends on Railway (API) and Vercel (web) for even basic integration testing. This means:

- Every change requires a PR → CI → deploy cycle before E2E tests can run
- Railway migration failures block all deploys
- Vercel infrastructure errors cause false CI failures
- Kai's `AI_INSPECTION_API_URL` points at a shared test environment — risky for parallel development
- No way to debug locally against a real stack

## Goal

A fully self-contained local Docker stack that mirrors production. Developers and Kai can run the full system locally with a single command.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   web (Next.js) │────▶│   api (Express) │────▶│  postgres (DB)  │
│   :3001         │     │   :3000         │     │   :5432         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

All three services run in Docker containers orchestrated by `docker-compose.yml` at the repo root.

## Services

### postgres
- Image: `postgres:16-alpine`
- Port: `5432`
- Persistent named volume: `pgdata`
- Env: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- Health check: `pg_isready`

### api
- Built from `api/Dockerfile`
- Port: `3000`
- Source volume-mounted for hot reload (`tsx watch`)
- Depends on postgres (healthy)
- On startup: runs `prisma migrate deploy` then `tsx scripts/seed-test-env.ts`
- Env: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=development`

### web
- Built from `web/Dockerfile` (new)
- Port: `3001`
- Source volume-mounted for Next.js hot reload
- Depends on api
- Env: `NEXT_PUBLIC_API_URL=http://localhost:3000`, `AUTH_SECRET`, `NEXTAUTH_URL=http://localhost:3001`

## Files to Create/Modify

| File | Action |
|------|--------|
| `docker-compose.yml` | Create — root orchestration |
| `docker-compose.override.yml` | Create — dev overrides (volumes, hot reload) |
| `api/Dockerfile` | Update — add dev target with tsx watch |
| `web/Dockerfile` | Create — dev target with Next.js dev server |
| `.env.example` | Create — document all required env vars |
| `scripts/dev-up.sh` | Create — convenience script (up + seed) |

## Developer Workflow

```bash
# First time / fresh start
cp .env.example .env.local
docker compose up

# Wipe and restart (DB reset)
docker compose down -v && docker compose up

# Tail logs
docker compose logs -f api
docker compose logs -f web

# Run migrations manually
docker compose exec api npx prisma migrate dev
```

## Kai Integration

Update `~/.openclaw/agents/kai/workspace/.env`:
```
AI_INSPECTION_API_URL=http://localhost:3000
```

Kai works against the local stack — no shared test env dependency.

## Environment Variables

```env
# postgres
POSTGRES_USER=dev
POSTGRES_PASSWORD=devpassword
POSTGRES_DB=ai_inspection

# api
DATABASE_URL=postgresql://dev:devpassword@postgres:5432/ai_inspection
JWT_SECRET=dev-jwt-secret-change-in-prod
NODE_ENV=development

# web
NEXT_PUBLIC_API_URL=http://localhost:3000
AUTH_SECRET=dev-auth-secret-change-in-prod
NEXTAUTH_URL=http://localhost:3001
```

## Out of Scope

- Production Docker builds (separate concern)
- Kubernetes local dev (k3d remains for CI/staging)
- Hot reload for shared package changes (manual rebuild required)

## Acceptance Criteria

- [ ] `docker compose up` starts all three services cleanly from a fresh clone
- [ ] Migrations run automatically on startup
- [ ] Test seed data is available (test@example.com / test123)
- [ ] Web app is accessible at http://localhost:3001 and can log in
- [ ] API is accessible at http://localhost:3000/health
- [ ] Hot reload works for both api and web source changes
- [ ] Kai can complete a full PPI inspection flow against local stack
- [ ] `docker compose down -v && docker compose up` gives a clean slate
