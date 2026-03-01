# Logging & Observability

## Overview

Structured JSON logging with Grafana Cloud for centralized log aggregation.

| Component | Purpose |
|-----------|---------|
| **Pino** | Structured JSON logger (API + MCP server) |
| **pino-http** | Automatic HTTP request/response logging (API) |
| **Grafana Cloud Loki** | Log storage + query engine |
| **Railway Log Drain** | Ships stdout logs → Loki |
| **Grafana** | UI for search, dashboards, alerting |

## Application Logging

Both the API and MCP server use [Pino](https://github.com/pinojs/pino) for structured JSON logging to stdout.

### Log Format

```json
{
  "level": 30,
  "time": 1709283600000,
  "msg": "Inspection created",
  "service": "api",
  "reqId": "abc-123",
  "userId": "user-uuid",
  "inspectionId": "insp-uuid"
}
```

### Log Levels

| Level | Value | Use |
|-------|-------|-----|
| `fatal` | 60 | Process cannot continue |
| `error` | 50 | Operation failed |
| `warn` | 40 | Unexpected but recoverable |
| `info` | 30 | Significant events (default) |
| `debug` | 20 | Diagnostic detail |
| `trace` | 10 | Verbose debugging |

**Default level:** `info` (override via `LOG_LEVEL` env var).

### HTTP Request Logging (API)

`pino-http` automatically logs every request/response:

```json
{
  "level": 30,
  "msg": "request completed",
  "req": { "method": "POST", "url": "/api/inspections" },
  "res": { "statusCode": 201 },
  "responseTime": 45
}
```

Errors (4xx/5xx) are logged at `warn`/`error` level automatically.

### Sensitive Data

**Never logged:** passwords, tokens, API keys, JWT contents, `SERVICE_API_KEY`.

Pino redaction is configured to strip sensitive fields from request headers and body.

## Infrastructure

### Grafana Cloud (Free Tier)

- **Loki** — log storage, 50GB/month free
- **Grafana** — dashboards and explore UI
- **Credentials** — stored in deployment runbook (not in repo)

### Railway Log Drain

Railway ships all stdout/stderr from the API service to Grafana Cloud Loki via HTTP push.

Configuration: Railway Dashboard → Service → Settings → Log Drain → Loki HTTP endpoint.

### Log Retention

- **Grafana Cloud free tier:** 30 days
- Sufficient for diagnosing recent issues; historical analysis not required

## Querying Logs

### Grafana Explore

Access via Grafana Cloud → Explore → Select Loki data source.

**Common queries (LogQL):**

```logql
# All API errors
{service="api"} |= "error" | json | level >= 50

# Auth failures
{service="api"} |= "401"

# Specific inspection
{service="api"} | json | inspectionId="<uuid>"

# Slow requests (>1s)
{service="api"} | json | responseTime > 1000
```

### Dashboard

The **Service Health** dashboard includes:

1. **Error rate over time** — line chart, per service
2. **Logs by level** — pie chart (info/warn/error)
3. **Recent errors** — log panel, filtered to level ≥ error
4. **Service selector** — dropdown to filter by api/mcp-server

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `LOG_LEVEL` | `info` | Minimum log level |

## Future Path

```
Phase 1 (done):  Loki (logs) + Grafana (UI)
Phase 2 (later): + Tempo (distributed traces)
Phase 3 (later): + Prometheus (metrics)
```

Same Grafana ecosystem — add trace IDs to logs, correlate in Grafana UI.
