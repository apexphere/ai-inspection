# Design: Centralized Logging with Grafana Loki

**Status:** Draft
**Author:** Riley
**Requirement:** #568
**Date:** 2026-03-01

## Context

We have zero visibility into production runtime logs. When Kai's auth failed today, we couldn't diagnose it because:
- API logs go to Railway's ephemeral stdout (lost on redeploy)
- MCP server logs go to OpenClaw gateway stdout (no remote access)
- No centralized place to search across services
- Agents (Riley, Alex, Casey) cannot access runtime logs at all

### Current Logging State

**API (`api/src/`):**
- Uses `console.log` / `console.error` throughout
- Error handler in `index.ts` logs method, path, error, stack
- `startup.ts` logs diagnostics on boot
- No structured format — plain text
- No logging library

**MCP Server (`server/src/`):**
- `interaction-logger.ts` exists — logs tool calls to DB via API
- Tool handlers use `console.error` for errors
- No structured format

**Deployment:**
- API: Railway (stdout logs available in Railway dashboard, limited retention)
- Web: Vercel (function logs in Vercel dashboard)
- MCP/Kai: Local machine via OpenClaw gateway (no remote access)

## Decision

Adopt **Grafana Loki** for log aggregation with **pino** for structured JSON logging in the application layer.

### Why Pino (not Winston)
- Fastest Node.js logger (5x faster than Winston)
- Outputs newline-delimited JSON by default — perfect for Loki
- Tiny footprint, zero dependencies
- `pino-http` middleware for Express request logging
- `pino-pretty` for local dev (human-readable)

### Why Grafana Loki (not alternatives)
- Label-based indexing — cheap storage, fast queries by service/level
- Lightweight — single binary, can run on same Railway project
- Grafana UI is free and mature
- Future: add Tempo (traces) + Prometheus (metrics) in same stack

## Architecture

### Log Flow

```
┌──────────────┐     ┌──────────────┐
│ API (pino)   │────▶│              │     ┌──────────────┐
│ stdout JSON  │     │  Grafana     │────▶│   Grafana    │
│              │     │  Alloy       │     │   Loki       │
│ MCP Server   │────▶│  (agent)     │     │   (storage)  │
│ stdout JSON  │     │              │     └──────┬───────┘
└──────────────┘     └──────────────┘            │
                                                  ▼
                                          ┌──────────────┐
                                          │   Grafana    │
                                          │   (UI)       │
                                          └──────────────┘
```

### Option A: Railway-hosted Loki (Recommended)

Deploy Loki + Grafana as additional Railway services alongside the API.

| Service | Railway Setup | Resource |
|---------|--------------|----------|
| API | Existing | Logs via Alloy sidecar or Railway log drain |
| Loki | New service (Docker) | 256MB RAM, 1GB disk |
| Grafana | New service (Docker) | 256MB RAM |
| Alloy | Sidecar on API service | Minimal |

**Cost:** ~$5-10/month on Railway (Starter plan).

### Option B: Grafana Cloud Free Tier

Grafana Cloud offers a free tier: 50GB logs/month, 14-day retention.

| Component | Where |
|-----------|-------|
| Loki | Grafana Cloud (managed) |
| Grafana | Grafana Cloud (managed) |
| Alloy | Railway sidecar (ships logs to cloud) |

**Cost:** Free for our volume. No infra to manage.

**Recommendation:** Start with **Option B** (Grafana Cloud free tier). Zero infra management, sufficient for our scale. Move to self-hosted (Option A) if we outgrow the free tier or need longer retention.

### Application Changes

#### 1. Add pino to API

**File: `api/package.json`** — add dependencies:
```json
"pino": "^9.0.0",
"pino-http": "^10.0.0",
"pino-pretty": "^11.0.0"  // devDependency
```

**File: `api/src/lib/logger.ts`** — new shared logger:
```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // Structured fields added to every log line
  base: {
    service: 'api',
    env: process.env.NODE_ENV || 'development',
  },
  // Redact sensitive fields
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token', 'secret'],
    censor: '[REDACTED]',
  },
});

export type Logger = pino.Logger;
```

**File: `api/src/index.ts`** — replace console.log with pino:
```typescript
import { logger } from './lib/logger.js';
import pinoHttp from 'pino-http';

// Add request logging middleware (before routes)
app.use(pinoHttp({ logger }));

// Replace error handler
app.use((err, req, res, _next) => {
  logger.error({
    err,
    method: req.method,
    path: req.path,
    statusCode: 500,
  }, 'Unhandled API error');
  res.status(500).json({ error: 'Internal server error' });
});
```

**Replace all `console.log/error` calls** across API source:
```typescript
// Before
console.log('API server running on port', PORT);
console.error('Database connection failed:', error);

// After
logger.info({ port: PORT }, 'API server started');
logger.error({ err: error }, 'Database connection failed');
```

Files to change (all `console.log/error` → `logger.info/error/warn`):
- `api/src/index.ts`
- `api/src/config/startup.ts`
- `api/src/config/redis.ts`
- `api/src/routes/auth.ts`
- `api/src/routes/companies.ts`
- `api/src/routes/generated-reports.ts`
- `api/src/routes/inspectors.ts`
- `api/src/routes/photos-public.ts`
- `api/src/services/checklist.ts`
- `api/src/services/photo.ts`
- Any other files with `console.log/error`

#### 2. Add pino to MCP Server

**File: `server/package.json`** — add pino
**File: `server/src/lib/logger.ts`** — same pattern, `service: 'mcp-server'`

Replace `console.error` in:
- `server/src/tools/finding.ts`
- `server/src/tools/index.ts`
- `server/src/tools/inspection.ts`
- `server/src/tools/report.ts`

#### 3. Log Format

Every log line is newline-delimited JSON:

```json
{"level":30,"time":1709283600000,"service":"api","env":"production","method":"POST","path":"/api/inspections","statusCode":201,"responseTime":45,"msg":"request completed"}
{"level":50,"time":1709283601000,"service":"api","env":"production","err":{"type":"Error","message":"Connection refused","stack":"..."},"msg":"Database connection failed"}
{"level":30,"time":1709283602000,"service":"mcp-server","env":"production","tool":"inspection_start","inspectionId":"abc-123","msg":"Tool call completed"}
```

#### 4. Log Levels

| Level | When |
|-------|------|
| `fatal` | App cannot continue |
| `error` | Operation failed, needs attention |
| `warn` | Unexpected but handled |
| `info` | Normal operations (requests, startup, tool calls) |
| `debug` | Diagnostic detail (only in dev) |

#### 5. Request Context

`pino-http` automatically logs for every request:
- Method, URL, status code, response time
- Request ID (via `req.id`)

For MCP tool calls, log:
- Tool name, parameters, result status, duration

#### 6. Grafana Alloy Configuration

Alloy collects stdout from Railway services and ships to Loki.

```hcl
// alloy-config.river
loki.source.docker "railway" {
  host = "unix:///var/run/docker.sock"
  targets = discovery.docker.railway.targets
  forward_to = [loki.write.default.receiver]
  labels = {
    job = "ai-inspection",
  }
}

loki.write "default" {
  endpoint {
    url = env("LOKI_URL")
    tenant_id = env("LOKI_TENANT_ID")
    basic_auth {
      username = env("LOKI_USERNAME")
      password = env("LOKI_PASSWORD")
    }
  }
}
```

For Grafana Cloud, Alloy ships via HTTPS to the cloud endpoint. Credentials from Grafana Cloud dashboard.

For Railway specifically, we may use Railway's **Log Drain** feature (sends logs to an HTTP endpoint) instead of Alloy, which is simpler:

```
Railway Log Drain → Loki HTTP Push endpoint
```

## Dependencies

- Grafana Cloud account (free tier) or self-hosted Loki
- Railway log drain or Alloy agent

## Stories Breakdown

| # | Story | Size | Who |
|---|-------|------|-----|
| 1 | Add pino logger to API — create shared logger, replace all console.log/error | Medium | Alex |
| 2 | Add pino-http request logging middleware to API | Small | Alex |
| 3 | Add pino logger to MCP server — replace console.error in tools | Small | Alex |
| 4 | Set up Grafana Cloud (free tier) + Loki data source | Small | Alex |
| 5 | Configure Railway log drain → Loki (or Alloy agent) | Small | Alex |
| 6 | Create Grafana dashboard — service health + error log view | Small | Alex |

## Alternatives Considered

**Keep console.log + Railway dashboard** — Rejected. Railway logs have limited retention, no cross-service search, and other agents can't access them.

**Winston** — Rejected. Slower than pino, more complex configuration, heavier.

**ELK Stack (Elasticsearch + Logstash + Kibana)** — Rejected. Way too heavy for our scale. Elasticsearch needs significant RAM.

**Structured console.log (no aggregation)** — Considered. Structured JSON to stdout is the first step regardless. But without Loki we still can't search cross-service or set up alerts.
