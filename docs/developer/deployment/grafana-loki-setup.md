# Grafana Cloud + Loki Setup Guide

**Issue:** #575
**Author:** Alex
**Date:** 2026-03-01

## Overview

Ships structured JSON logs from Railway (API) and OpenClaw (MCP server) to Grafana Cloud Loki for centralized log search and dashboards.

**Cost:** Free tier — 50GB logs/month, 14-day retention.

---

## Step 1: Create Grafana Cloud Account

1. Go to [grafana.com/auth/sign-up/create-user](https://grafana.com/auth/sign-up/create-user)
2. Create a free account (no credit card required)
3. Note your **Grafana Cloud stack URL** (e.g. `https://yourorg.grafana.net`)

## Step 2: Get Loki Push Credentials

1. In Grafana Cloud → **Connections** → **Hosted Logs (Loki)**
2. Note these values:
   - **Loki push URL:** `https://logs-prod-XXX.grafana.net/loki/api/v1/push`
   - **User ID:** (numeric, e.g. `123456`)
   - **API Key:** Generate one via **Security** → **API Keys** → **Add API Key** (role: `MetricsPublisher`)
3. The HTTP basic auth is: `user:apiKey`

## Step 3: Configure Railway Log Drain

Railway supports HTTP log drains that POST JSON logs to an endpoint.

1. In Railway dashboard → **Project Settings** → **Log Drains**
2. Add a new log drain:
   - **Type:** HTTP
   - **Endpoint:** `https://<USER_ID>:<API_KEY>@logs-prod-XXX.grafana.net/loki/api/v1/push`
   - **Format:** JSON (ndjson)
3. Railway will ship all stdout/stderr from the API service to Loki

### Alternative: Grafana Alloy (Agent)

If Railway's built-in log drain doesn't support Loki's push format directly, deploy Grafana Alloy as a sidecar or separate service:

```yaml
# alloy-config.yaml
loki.write "default" {
  endpoint {
    url = "https://logs-prod-XXX.grafana.net/loki/api/v1/push"
    basic_auth {
      username = env("LOKI_USER")
      password = env("LOKI_API_KEY")
    }
  }
}
```

## Step 4: Verify Logs in Grafana

1. Go to Grafana Cloud → **Explore**
2. Select **Loki** data source
3. Run query: `{service="api"}`
4. You should see structured JSON log lines from the API
5. Try filtering: `{service="api"} | json | level="error"`

## Step 5: Environment Variables

Add to Railway environment (NOT in repo):

| Variable | Description |
|----------|-------------|
| `LOG_LEVEL` | `info` (production default) |
| `LOKI_USER` | Grafana Cloud user ID (if using Alloy) |
| `LOKI_API_KEY` | Grafana Cloud API key (if using Alloy) |

## Log Format Reference

All services emit newline-delimited JSON:

```json
{"level":30,"time":1709312400000,"service":"api","msg":"GET /api/projects 200","req":{"id":"abc123","method":"GET","url":"/api/projects"},"res":{"statusCode":200},"responseTime":42}
```

### Labels for Loki Queries

| Label | Values | Description |
|-------|--------|-------------|
| `service` | `api`, `mcp-server` | Which service emitted the log |
| `level` | `10-60` | pino log level (30=info, 40=warn, 50=error) |

### Useful LogQL Queries

```logql
# All API errors
{service="api"} | json | level >= 50

# Request latency > 1 second
{service="api"} | json | responseTime > 1000

# Auth failures
{service="api"} |= "401"

# MCP server tool calls
{service="mcp-server"} | json | tool != ""

# Errors in last hour
{service=~"api|mcp-server"} | json | level >= 50
```

## Troubleshooting

**No logs appearing:**
- Check Railway log drain is active and endpoint is correct
- Verify API key has `MetricsPublisher` role
- Check Loki data source is selected in Grafana Explore

**Logs appear but not structured:**
- Ensure pino logger is used (not console.log)
- Check `NODE_ENV=production` (disables pino-pretty)
