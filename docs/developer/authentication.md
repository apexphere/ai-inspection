# Authentication & Authorization

## Overview

The API supports two authentication methods:

| Method | Used By | Header | Middleware |
|--------|---------|--------|------------|
| **JWT** | Web UI users | `Authorization: Bearer <token>` or `token` cookie | `authMiddleware` |
| **API Key** | OpenClaw agent (Kai) | `X-API-Key: <key>` | `serviceAuthMiddleware` |

## JWT Authentication (Web Users)

Users authenticate via `/api/auth/login` with password credentials. On success, a signed JWT is returned (24h expiry) containing `{ sub: userId }`.

The token can be sent as:
- **Cookie:** `token=<jwt>` (set automatically by the auth endpoint)
- **Header:** `Authorization: Bearer <jwt>`

**Middleware:** `authMiddleware` — validates the JWT and sets `req.userId` to the authenticated user's ID.

## API Key Authentication (Service/Agent)

The OpenClaw agent (Kai) authenticates using a shared secret configured via the `API_SERVICE_KEY` environment variable. The key must be set in both:
1. **Railway** (API server) — so the middleware can validate incoming keys
2. **Host environment** (where OpenClaw runs) — so the agent sends the key

**Middleware:** `serviceAuthMiddleware` — checks `X-API-Key` header first. If it matches `API_SERVICE_KEY`, the request is authenticated with `req.userId = 'service'`. If no API key is present, falls back to JWT validation.

## Route Configuration

Routes are wired in `api/src/index.ts`:

- **Public routes** (no auth): `/health`, `/api/auth`, `/api` (OpenAPI docs)
- **Service routes** (`serviceAuthMiddleware` — JWT or API key): Routes the agent needs (inspections, projects, site-inspections, checklist-items, clause-reviews, building-code, inspectors)
- **Protected routes** (`authMiddleware` — JWT only): Admin/sensitive routes (personnel, credentials, companies, report-management)

## How the Agent Authenticates

```
Kai (OpenClaw agent)
  → Reads SKILL.md (building-inspection)
  → Makes curl calls with -H "X-API-Key: $API_SERVICE_KEY"
  → Hits Railway API
  → serviceAuthMiddleware validates key
  → Request proceeds as userId "service"
```

## Key Files

| File | Purpose |
|------|---------|
| `api/src/middleware/auth.ts` | Both middleware functions + token generation |
| `api/src/index.ts` | Route-to-middleware wiring |
| `~/.openclaw/agents/kai/workspace/skills/building-inspection/SKILL.md` | Agent's API call templates |

## Known Limitations

- **No scoped permissions** — API key grants full access to all wired routes (see #577)
- **No actor context** — all service requests are attributed to `userId: 'service'`, no audit trail of which agent or on whose behalf (see #577)
- **Single shared key** — no per-service identity or rotation mechanism

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `JWT_SECRET` | Railway | Signs/verifies JWT tokens |
| `API_SERVICE_KEY` | Railway + OpenClaw host | Shared secret for agent auth |
| `AI_INSPECTION_API_URL` | OpenClaw host | API base URL for agent calls |
| `ADMIN_USER_IDS` | Railway | Comma-separated user IDs for admin access |
