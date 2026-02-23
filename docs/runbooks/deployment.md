# Deployment Runbook

**Last Updated:** 2026-02-23  
**Owner:** Archer

This is the single source of truth for deploying AI Inspection.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Environment Variables](#environment-variables)
4. [Initial Setup](#initial-setup)
5. [Railway Deployment (API)](#railway-deployment-api)
6. [Vercel Deployment (Web)](#vercel-deployment-web)
7. [Cloudflare R2 (Storage)](#cloudflare-r2-storage)
8. [OpenClaw Agent](#openclaw-agent)
9. [DNS Configuration](#dns-configuration)
10. [CD Pipeline](#cd-pipeline)
11. [Verification](#verification)
12. [Troubleshooting](#troubleshooting)
13. [Cost Summary](#cost-summary)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              PRODUCTION                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐            │
│  │    Vercel    │     │   Railway    │     │  Cloudflare  │            │
│  │    (Web)     │────▶│    (API)     │────▶│     R2       │            │
│  │   Next.js    │     │   Express    │     │   (Photos)   │            │
│  └──────────────┘     └──────┬───────┘     └──────────────┘            │
│                              │                                          │
│                              ▼                                          │
│                       ┌──────────────┐                                  │
│                       │   Railway    │                                  │
│                       │   Postgres   │                                  │
│                       └──────────────┘                                  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    OpenClaw Agent (Local v1)                      │   │
│  │  ┌────────────┐    ┌────────────┐    ┌────────────┐              │   │
│  │  │  WhatsApp  │───▶│  Inspector │───▶│ MCP Server │──────────────┼───┤
│  │  │  Channel   │    │   Agent    │    │   (stdio)  │  HTTP to API │   │
│  │  └────────────┘    └────────────┘    └────────────┘              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

| Component | Platform | Test URL | Production URL |
|-----------|----------|----------|----------------|
| Web UI | Vercel | `app-test-ai-inspection.apexphere.co.nz` | `app-ai-inspection.apexphere.co.nz` |
| API | Railway | `api-test-ai-inspection.apexphere.co.nz` | `api-ai-inspection.apexphere.co.nz` |
| Database | Railway Postgres | (internal) | (internal) |
| Storage | Cloudflare R2 | (pending) | (pending) |
| Agent | Local (v1) | Local machine | Local machine |

---

## Prerequisites

### Accounts Required

| Service | Purpose | Sign Up |
|---------|---------|---------|
| Railway | API + Postgres hosting | [railway.app](https://railway.app) |
| Vercel | Web frontend hosting | [vercel.com](https://vercel.com) |
| Cloudflare | R2 storage + DNS | [cloudflare.com](https://cloudflare.com) |
| GitHub | Source code + CI/CD | [github.com](https://github.com) |
| Anthropic | Claude API (agent) | [console.anthropic.com](https://console.anthropic.com) |

### CLI Tools

```bash
# Railway CLI
npm install -g @railway/cli
railway login

# Vercel CLI
npm install -g vercel
vercel login

# OpenClaw
npm install -g openclaw
```

### Access Required

- GitHub repository write access
- Railway project admin
- Vercel project admin
- Cloudflare account (for R2 + DNS)
- Anthropic API key

---

## Environment Variables

### Railway (API)

Set via Railway dashboard or CLI:

```bash
railway variables set KEY=value
```

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Auto | Postgres connection string | Auto-injected by Railway |
| `NODE_ENV` | Yes | Environment | `test` or `production` |
| `JWT_SECRET` | Yes | Session signing key (min 32 chars) | `your-secure-secret-here` |
| `APP_DOMAIN` | Yes | Cookie domain | `apexphere.co.nz` |
| `SERVICE_API_KEY` | Yes | API key for MCP server auth | `sk-...` |
| `R2_ACCOUNT_ID` | Pending | Cloudflare account ID | `abc123...` |
| `R2_ACCESS_KEY_ID` | Pending | R2 API token ID | `...` |
| `R2_SECRET_ACCESS_KEY` | Pending | R2 API token secret | `...` |
| `R2_BUCKET_NAME` | Pending | R2 bucket name | `ai-inspection-photos` |
| `TEST_PASSWORD` | Test only | Seeded test user password | `test123` |

### Vercel (Web)

Set via Vercel dashboard → Settings → Environment Variables:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL | `https://api-test-ai-inspection.apexphere.co.nz` |

### GitHub Secrets

Set via GitHub → Settings → Secrets and variables → Actions:

| Secret | Required | Description |
|--------|----------|-------------|
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Yes | E2E test access to preview |
| `TEST_PASSWORD` | Yes | E2E login credentials |
| `DISCORD_WEBHOOK` | Yes | CD failure notifications |

### OpenClaw Agent (Local)

Set in `.env` or environment:

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key |
| `API_URL` | Yes | Backend API URL |
| `SERVICE_API_KEY` | Yes | API auth key (same as Railway) |

---

## Initial Setup

### First-Time Deployment

#### 1. Clone Repository

```bash
git clone https://github.com/apexphere/ai-inspection.git
cd ai-inspection
npm install
```

#### 2. Create Railway Project

```bash
# Create project
railway init

# Add Postgres
railway add --name postgres

# Link API service
cd api
railway link
```

#### 3. Configure Railway

Create `api/railway.toml`:

```toml
[build]
builder = "nixpacks"

[deploy]
preDeployCommand = "npx prisma migrate deploy"
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

#### 4. Set Railway Variables

```bash
railway variables set NODE_ENV=test
railway variables set JWT_SECRET="$(openssl rand -hex 32)"
railway variables set APP_DOMAIN=apexphere.co.nz
railway variables set SERVICE_API_KEY="$(openssl rand -hex 24)"
```

#### 5. Deploy API

```bash
railway up
```

#### 6. Create Vercel Project

```bash
cd ../web
vercel
# Follow prompts, link to GitHub
```

#### 7. Set Vercel Variables

```bash
vercel env add NEXT_PUBLIC_API_URL
# Enter: https://api-test-ai-inspection.apexphere.co.nz
```

#### 8. Deploy Web

```bash
vercel --prod
```

---

## Railway Deployment (API)

### Auto-Deploy (CD)

Railway auto-deploys on push to `develop` branch.

**Deployment flow:**
1. GitHub push triggers Railway webhook
2. Railway builds with Nixpacks
3. `preDeployCommand` runs migrations
4. New container starts
5. Health check validates
6. Traffic switches to new container

### Manual Deploy

```bash
cd api
railway up
```

### Rollback

```bash
# Via Railway dashboard:
# Deployments → Select previous → Redeploy

# Or via CLI:
railway rollback
```

### View Logs

```bash
railway logs
```

### Configuration Reference

**`api/railway.toml`:**
```toml
[build]
builder = "nixpacks"

[deploy]
preDeployCommand = "npx prisma migrate deploy"
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

**Key behaviors:**
- `preDeployCommand`: Runs AFTER build, BEFORE deploy. Has DB access. No timeout.
- `startCommand`: Starts the server after migrations complete.
- `healthcheckPath`: Railway polls this until healthy before switching traffic.

---

## Vercel Deployment (Web)

### Auto-Deploy (CD)

Vercel auto-deploys on push to `develop` branch.

### Manual Deploy

```bash
cd web
vercel --prod
```

### Preview Deployments

Every PR gets a preview deployment:
- URL: `ai-inspection-<hash>.vercel.app`
- E2E tests run against preview in CD pipeline

### Environment Variables

Set per-environment (Production, Preview, Development):

```bash
# Production only
vercel env add NEXT_PUBLIC_API_URL --production

# All environments
vercel env add NEXT_PUBLIC_API_URL
```

---

## Cloudflare R2 (Storage)

> **Status:** Pending (#278)

### Setup Steps

1. **Create R2 Bucket**
   - Cloudflare Dashboard → R2 → Create Bucket
   - Name: `ai-inspection-photos-test`
   - Location: Auto (or specific region)

2. **Create API Token**
   - R2 → Manage R2 API Tokens → Create
   - Permissions: Object Read & Write
   - Specify bucket: `ai-inspection-photos-test`

3. **Set Railway Variables**
   ```bash
   railway variables set R2_ACCOUNT_ID=<account-id>
   railway variables set R2_ACCESS_KEY_ID=<token-id>
   railway variables set R2_SECRET_ACCESS_KEY=<token-secret>
   railway variables set R2_BUCKET_NAME=ai-inspection-photos-test
   ```

4. **Configure CORS** (if needed for direct uploads)
   ```json
   {
     "AllowedOrigins": ["https://app-test-ai-inspection.apexphere.co.nz"],
     "AllowedMethods": ["GET", "PUT"],
     "AllowedHeaders": ["*"]
   }
   ```

---

## OpenClaw Agent

### v1: Local Deployment

OpenClaw runs locally, connects to Railway API.

#### 1. Install OpenClaw

```bash
npm install -g openclaw
```

#### 2. Create Agent Directory

```bash
mkdir -p agents/inspector/workspace
```

#### 3. Create Agent Config

**`agents/inspector/workspace/SOUL.md`:**
```markdown
# Inspector Agent

You are a building inspection assistant. You help inspectors conduct 
thorough building assessments via WhatsApp.

## Personality
- Professional but friendly
- Concise — inspectors are on-site, busy
- Proactive — suggest next steps

## Workflow
1. Get address → start inspection
2. Guide through sections
3. Capture findings + photos
4. Generate report when complete
```

#### 4. Configure OpenClaw

**`openclaw.yml`:**
```yaml
agents:
  inspector:
    enabled: true
    model: claude-sonnet-4
    workspace: ./agents/inspector/workspace

channels:
  whatsapp:
    enabled: true
    dmPolicy: allowlist
    allowFrom:
      - "+6421XXXXXXX"  # Inspector 1
    session:
      dmScope: agent

mcp:
  servers:
    inspection:
      command: ["node", "server/dist/index.js"]
      env:
        API_URL: "${API_URL}"
        SERVICE_API_KEY: "${SERVICE_API_KEY}"
```

#### 5. Build MCP Server

```bash
cd server
npm install
npm run build
```

#### 6. Pair WhatsApp

```bash
openclaw whatsapp pair
# Scan QR code with WhatsApp on your phone
```

#### 7. Start Gateway

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export API_URL=https://api-test-ai-inspection.apexphere.co.nz
export SERVICE_API_KEY=sk-...

openclaw gateway start
```

### Verify Agent

```bash
# Check status
openclaw status

# View logs
openclaw gateway logs

# Test MCP connection
openclaw mcp test inspection
```

---

## DNS Configuration

### Cloudflare DNS Records

| Record | Type | Name | Target | Proxy |
|--------|------|------|--------|-------|
| API (test) | CNAME | `api-test-ai-inspection` | `<project>.up.railway.app` | ❌ DNS only |
| Web (test) | CNAME | `app-test-ai-inspection` | `cname.vercel-dns.com` | ❌ DNS only |
| API (prod) | CNAME | `api-ai-inspection` | `<project>.up.railway.app` | ❌ DNS only |
| Web (prod) | CNAME | `app-ai-inspection` | `cname.vercel-dns.com` | ❌ DNS only |

**Note:** Disable Cloudflare proxy (orange cloud) for Railway/Vercel — they handle SSL.

### Railway Custom Domain

```bash
# Add domain to Railway
railway domain add api-test-ai-inspection.apexphere.co.nz
```

### Vercel Custom Domain

```bash
# Add domain to Vercel
vercel domains add app-test-ai-inspection.apexphere.co.nz
```

---

## CD Pipeline

### Workflow

```
Push to develop
    │
    ├─► Railway auto-deploys API
    │   └─► preDeployCommand: prisma migrate
    │   └─► startCommand: npm start
    │   └─► Health check passes
    │
    ├─► Vercel auto-deploys Web
    │
    └─► GitHub Actions (cd.yml)
        └─► Wait for deployments
        └─► Run E2E tests (Playwright)
        └─► Notify Discord on failure
```

### GitHub Actions

**`.github/workflows/cd.yml`:**
- Triggers on push to `develop`
- Waits for Railway/Vercel deployments
- Runs Playwright E2E tests
- Posts to Discord on failure

### Monitoring CD

- **Railway:** Dashboard → Deployments
- **Vercel:** Dashboard → Deployments
- **GitHub:** Actions tab
- **Discord:** #alerts channel

---

## Verification

### Health Checks

```bash
# API health
curl https://api-test-ai-inspection.apexphere.co.nz/health

# Expected response:
{
  "status": "ok",
  "version": "<git-sha>",
  "database": "connected"
}
```

### Smoke Tests

```bash
# 1. Web loads
curl -I https://app-test-ai-inspection.apexphere.co.nz

# 2. API responds
curl https://api-test-ai-inspection.apexphere.co.nz/health

# 3. Login works
curl -X POST https://api-test-ai-inspection.apexphere.co.nz/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 4. OpenClaw connected (if running)
openclaw status
```

### E2E Tests

```bash
# Run locally against test environment
cd e2e
npm test
```

---

## Troubleshooting

### Railway Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Deploy hangs | Health check failing | Check `/health` endpoint, view logs |
| Migration fails | DB connection issue | Verify `DATABASE_URL`, check Postgres service |
| Container crashes | Startup error | View logs: `railway logs` |
| High latency | Region mismatch | Check Railway region (should be `syd`) |

**View logs:**
```bash
railway logs --tail
```

### Vercel Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Build fails | Dependency issue | Check build logs in Vercel dashboard |
| Env var missing | Not set for environment | Verify in Settings → Environment Variables |
| API calls fail | Wrong API URL | Check `NEXT_PUBLIC_API_URL` |

### OpenClaw Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| WhatsApp disconnects | Auth expired | Re-pair: `openclaw whatsapp pair` |
| MCP tools fail | Server not running | Build: `cd server && npm run build` |
| API auth fails | Wrong SERVICE_API_KEY | Verify key matches Railway |
| No response | Gateway not running | Start: `openclaw gateway start` |

**Debug MCP:**
```bash
# Test MCP server directly
cd server
node dist/index.js

# Check tool list
openclaw mcp tools inspection
```

### Database Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Migration fails | Schema conflict | Check pending migrations, resolve conflicts |
| Connection refused | DB not ready | Wait for Postgres, check Railway status |
| Data missing | Wrong environment | Verify `DATABASE_URL` |

**Database access:**
```bash
# Connect to Railway Postgres
railway connect postgres

# Run migrations manually
railway run npx prisma migrate deploy
```

---

## Cost Summary

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Railway (API + Postgres) | Hobby | ~$5 (usage-based) |
| Vercel | Hobby | Free |
| Cloudflare R2 | Free tier | Free (10GB storage, no egress) |
| GitHub Actions | Free tier | Free (2000 mins/mo) |
| **Infrastructure Total** | | **~$5/month** |

| Usage Cost | Rate | Estimate |
|------------|------|----------|
| Claude API (per inspection) | ~$0.03 | Depends on usage |
| WhatsApp | Free (WhatsApp Web) | $0 |

---

## Appendix

### Useful Commands

```bash
# Railway
railway status              # Project status
railway logs                # View logs
railway up                  # Manual deploy
railway variables           # List env vars
railway connect postgres    # DB shell

# Vercel
vercel                      # Deploy preview
vercel --prod               # Deploy production
vercel env ls               # List env vars
vercel logs                 # View logs

# OpenClaw
openclaw status             # Gateway status
openclaw gateway start      # Start gateway
openclaw gateway logs       # View logs
openclaw whatsapp pair      # Pair WhatsApp
openclaw mcp tools <server> # List MCP tools
```

### Related Documentation

- [Infrastructure Overview](../infrastructure/overview.md)
- [CI/CD Pipeline Design](../design/003-ci-cd-pipeline.md)
- [Agent Deployment Design](../design/013-agent-deployment.md)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-23 | Initial version | Archer |
