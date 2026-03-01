# Working with Logs

## Overview

The API uses [Pino](https://github.com/pinojs/pino) for structured JSON logging. Logs are shipped to Grafana Cloud Loki where they can be searched, filtered, and visualized.

This guide covers how to add logging in your code and how to query logs for debugging.

## Writing Logs

### Import the Logger

```typescript
import { logger } from '../config/logger.js';
```

### Log Levels

| Level | Method | When to Use |
|-------|--------|-------------|
| `fatal` | `logger.fatal()` | Process cannot continue |
| `error` | `logger.error()` | Operation failed, needs attention |
| `warn` | `logger.warn()` | Unexpected but handled |
| `info` | `logger.info()` | Significant business events (default) |
| `debug` | `logger.debug()` | Diagnostic detail for development |
| `trace` | `logger.trace()` | Verbose debugging |

### Examples

```typescript
// Simple message
logger.info('Inspection created');

// With context (structured fields)
logger.info({ inspectionId, projectId, type }, 'Inspection created');

// Error with stack trace
logger.error({ err, inspectionId }, 'Failed to create inspection');

// Warning
logger.warn({ userId, route: req.path }, 'Deprecated endpoint called');

// Debug (only shown when LOG_LEVEL=debug)
logger.debug({ clauseId, applicability }, 'Clause review updated');
```

### Best Practices

1. **Always add context** — include IDs so logs are searchable:
   ```typescript
   // ✅ Good
   logger.info({ inspectionId, userId }, 'Inspection started');

   // ❌ Bad
   logger.info('Inspection started');
   ```

2. **Use `err` for errors** — Pino serializes Error objects specially:
   ```typescript
   // ✅ Good — includes stack trace
   logger.error({ err }, 'Database query failed');

   // ❌ Bad — loses stack trace
   logger.error(`Database query failed: ${error.message}`);
   ```

3. **Don't log sensitive data** — never log passwords, tokens, API keys, JWT contents:
   ```typescript
   // ❌ Never do this
   logger.info({ apiKey, password }, 'Auth attempt');
   ```

4. **Use appropriate levels** — `info` for business events, `debug` for internal state, `error` for failures.

### HTTP Request Logging

`pino-http` automatically logs every HTTP request/response. You don't need to add request logging manually.

Auto-logged fields:
- `req.method`, `req.url` — what was called
- `res.statusCode` — response status
- `responseTime` — duration in ms
- 4xx → `warn`, 5xx → `error` level (automatic)

## Querying Logs

### Grafana Explore

1. Open Grafana Cloud → **Explore**
2. Select **Loki** data source
3. Write LogQL queries

### LogQL Quick Reference

```logql
# All API logs
{service="api"}

# Errors only
{service="api"} | json | level >= 50

# Specific text search
{service="api"} |= "401"

# By inspection ID
{service="api"} | json | inspectionId="<uuid>"

# Slow requests (>1 second)
{service="api"} | json | responseTime > 1000

# Errors in the last hour
{service="api"} | json | level >= 50  [1h]

# Auth failures
{service="api"} |= "Authentication required"

# Specific endpoint
{service="api"} | json | req_url="/api/inspections"
```

### Common Debugging Scenarios

#### "Kai can't start an inspection"

```logql
# Check for auth failures from service calls
{service="api"} |= "401" | json | req_headers_x_api_key != ""

# Check inspection creation attempts
{service="api"} | json | req_url=~"/api/.*inspections" | req_method="POST"
```

#### "Report generation failed"

```logql
{service="api"} | json | req_url=~"/api/reports.*" | level >= 50
```

#### "Database errors"

```logql
{service="api"} |= "Prisma" | json | level >= 50
```

#### "What happened in the last 5 minutes?"

```logql
{service="api"} | json | level >= 40
```

### Dashboard

The **Service Health** dashboard shows:

| Panel | What It Shows |
|-------|---------------|
| Error rate over time | Line chart — spikes indicate incidents |
| Logs by level | Pie chart — healthy ratio is mostly info |
| Recent errors | Log panel — latest errors with full context |
| Service selector | Dropdown — filter by api/mcp-server |

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `LOG_LEVEL` | `info` | Minimum log level. Set to `debug` for verbose output locally. |

### Local Development

```bash
# Verbose logging
LOG_LEVEL=debug npm run dev

# Pretty print (if pino-pretty installed)
LOG_LEVEL=debug npm run dev | npx pino-pretty
```
