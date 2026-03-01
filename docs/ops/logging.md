# Logging Infrastructure Setup

## Overview

Centralized log aggregation using Grafana Cloud (free tier) with Railway log drain.

```
Railway API (stdout) ──► Railway Log Drain ──► Grafana Cloud Loki ──► Grafana UI
```

## Account Required

| Service | Purpose | Sign Up |
|---------|---------|---------|
| **Grafana Cloud** | Loki (log storage) + Grafana (UI) | [grafana.com/cloud](https://grafana.com/products/cloud/) |

Free tier: 50GB/month logs, 14 day retention, 3 users.

## Setup Steps

### 1. Create Grafana Cloud Account

1. Sign up at [grafana.com/cloud](https://grafana.com/products/cloud/)
2. Create a stack (choose region closest to Railway — e.g., `us-east`)
3. Note your stack URL: `https://<your-stack>.grafana.net`

### 2. Get Loki Credentials

1. Grafana Cloud → **Connections** → **Hosted Logs (Loki)**
2. Note the push URL: `https://logs-prod-<region>.grafana.net/loki/api/v1/push`
3. Create an API token: **Configuration** → **API Keys** → **Add API Key**
   - Role: `MetricsPublisher`
   - Copy the token (shown once)
4. Note your Loki username (numeric ID shown on the Hosted Logs page)

### 3. Configure Railway Log Drain

1. Railway Dashboard → Select API service
2. **Settings** → **Observability** → **Log Drain**
3. Add log drain:
   - **Type:** HTTP
   - **URL:** `https://<loki-username>:<api-token>@logs-prod-<region>.grafana.net/loki/api/v1/push`
   - **Format:** JSON
4. Save — logs start shipping immediately

### 4. Verify

1. Open Grafana Cloud → **Explore**
2. Select **Loki** data source
3. Run query: `{service="api"}`
4. You should see logs from the API service

## Dashboard Setup

Import the service health dashboard:

1. Grafana → **Dashboards** → **New** → **Import**
2. Dashboard includes:
   - Error rate over time (line chart)
   - Logs by level (pie chart: info/warn/error)
   - Recent errors (log panel, filtered to level ≥ error)
   - Service selector dropdown

## Credentials Storage

| Credential | Where to Store |
|------------|---------------|
| Grafana Cloud URL | Deployment runbook (not in repo) |
| Loki username | Deployment runbook |
| Loki API token | Deployment runbook |
| Railway log drain URL | Railway dashboard (auto-saved) |

**⚠️ Never commit Grafana credentials to the repository.**

## Log Retention

| Tier | Retention | Storage |
|------|-----------|---------|
| Free | 14 days | 50GB/month |
| Pro | 30+ days | Pay-per-use |

Free tier is sufficient for diagnosing recent production issues.

## Future Path

```
Phase 1 (done):  Loki (logs) + Grafana (UI)
Phase 2 (later): + Tempo (distributed traces)
Phase 3 (later): + Prometheus (metrics)
```

Same Grafana ecosystem — all visible in the same UI.
