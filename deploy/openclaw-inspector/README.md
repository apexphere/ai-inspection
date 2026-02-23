# OpenClaw Inspector Service

AI building inspection assistant with WhatsApp integration.

## Architecture

```
Inspector (WhatsApp) → OpenClaw Gateway → MCP Server → Backend API
```

## Local Development

```bash
# Build image
docker build -f deploy/openclaw-inspector/Dockerfile -t openclaw-inspector .

# Run with environment variables
docker run -it --rm \
  -p 3000:3000 \
  -v openclaw-auth:/app/auth \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e API_URL=https://api.example.com \
  -e API_KEY=your-api-key \
  openclaw-inspector
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key |
| `API_URL` | Yes | Backend API URL |
| `API_KEY` | Yes | Backend API auth key |
| `OPENCLAW_WHATSAPP_ALLOWLIST` | No | Comma-separated allowed phone numbers |

## WhatsApp Pairing

First-time setup requires QR code scan:

```bash
# SSH into container
railway run bash

# Start pairing
openclaw whatsapp pair

# Scan QR code with your phone
# Auth session stored in /app/auth volume
```

## Health Check

The gateway exposes `/health` endpoint on port 3000.

```bash
curl http://localhost:3000/health
```

## Monitoring

### Logging

All logs output as JSON for log aggregation:
- `logging.consoleStyle: json` in openclaw.yml
- WhatsApp connection events logged with `whatsapp.*` diagnostics flag

### View Logs

```bash
# Railway logs
railway logs --tail | jq .

# Filter WhatsApp events
railway logs | grep "whatsapp"
```

### Discord Alerts (Optional)

Set `DISCORD_ALERT_WEBHOOK` environment variable to enable alerts:

```bash
railway variables set DISCORD_ALERT_WEBHOOK=https://discord.com/api/webhooks/...
```

Use the alert script:
```bash
./scripts/send-alert.sh "WhatsApp disconnected"
```

### Health Check Script

```bash
./scripts/healthcheck.sh
```

## Volume Mounts

| Path | Purpose |
|------|---------|
| `/app/auth` | WhatsApp authentication (persist across restarts) |

## Railway Deployment

See #348 for Railway service configuration.
