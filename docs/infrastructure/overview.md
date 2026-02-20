# Infrastructure Overview

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Test Environment                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│   │   Vercel    │     │   Railway   │     │ Cloudflare  │      │
│   │   (Web)     │────▶│   (API)     │────▶│    R2       │      │
│   └─────────────┘     └──────┬──────┘     │  (Storage)  │      │
│                              │            └─────────────┘      │
│                              ▼                                  │
│                       ┌─────────────┐                          │
│                       │  Railway    │                          │
│                       │  Postgres   │                          │
│                       └─────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Services

| Service | Platform | URL | Purpose |
|---------|----------|-----|---------|
| Web UI | Vercel | https://app-test-ai-inspection.apexphere.co.nz | Next.js frontend |
| API | Railway | https://api-test-ai-inspection.apexphere.co.nz | Express backend |
| Database | Railway Postgres | (internal) | Data persistence |
| Storage | Cloudflare R2 | (pending #272) | Photo/document storage |
| CI/CD | GitHub Actions | — | Automated testing |

## Environment Variables

### Railway (API)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Auto-injected by Railway Postgres |
| `NODE_ENV` | `test` |
| `APP_DOMAIN` | `apexphere.co.nz` |
| `JWT_SECRET` | Session signing key |
| `TEST_PASSWORD` | For seeded test user |
| `R2_ACCOUNT_ID` | Cloudflare account (pending) |
| `R2_ACCESS_KEY_ID` | R2 credentials (pending) |
| `R2_SECRET_ACCESS_KEY` | R2 credentials (pending) |
| `R2_BUCKET_NAME` | R2 bucket name (pending) |

### Vercel (Web)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://api-test-ai-inspection.apexphere.co.nz` |

### GitHub Secrets

| Secret | Description |
|--------|-------------|
| `VERCEL_AUTOMATION_BYPASS_SECRET` | E2E test access |
| `TEST_PASSWORD` | E2E login |
| `DISCORD_WEBHOOK` | Failure notifications |

## Deployment

### API (Railway)
- **Trigger:** Push to `develop` branch
- **Process:** Railway auto-deploys from GitHub
- **Pre-deploy:** `npx prisma migrate deploy`
- **Start:** `npm start`
- **Health check:** `/health`

### Web (Vercel)
- **Trigger:** Push to `develop` branch
- **Process:** Vercel auto-deploys from GitHub
- **Build:** `npm run build` (from monorepo root)

### CD Pipeline (GitHub Actions)
1. CI check passes
2. Wait for Railway deployment
3. Wait for Vercel deployment
4. Run E2E tests (Playwright)
5. Publish test report

## DNS (Cloudflare)

| Record | Type | Value |
|--------|------|-------|
| `api-test-ai-inspection` | CNAME | `<railway-domain>.railway.app` |
| `app-test-ai-inspection` | CNAME | `cname.vercel-dns.com` |

## Cost

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Railway | Hobby | ~$5 (usage-based) |
| Vercel | Hobby | Free |
| Cloudflare R2 | Free tier | Free (10GB) |
| GitHub Actions | Free tier | Free |

**Total:** ~$5/month

## Monitoring

- **Railway:** Built-in logs and metrics
- **Vercel:** Built-in analytics
- **Errors:** Discord webhook notifications on CD failure

## Production (Future)

Production environment will mirror test with:
- Separate Railway project
- Separate R2 bucket
- Production domains (`api-ai-inspection.apexphere.co.nz`, `app-ai-inspection.apexphere.co.nz`)
