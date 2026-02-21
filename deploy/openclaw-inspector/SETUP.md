# Railway Setup: openclaw-inspector

Step-by-step guide to deploy the OpenClaw inspector service on Railway.

## Prerequisites

- Railway account with project access
- Anthropic API key
- Backend API deployed (API_URL, API_KEY)

## 1. Create Service

```bash
# Via CLI
railway add --service openclaw-inspector

# Or via Dashboard:
# Project → New Service → Empty Service → Name: "openclaw-inspector"
```

## 2. Link to GitHub

Connect the service to the repository:
- Source: `apexphere/ai-inspection`
- Branch: `develop`
- Root Directory: `/` (Dockerfile path is in railway.toml)

## 3. Configure Environment Variables

Add these in Railway Dashboard → Service → Variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Claude API key |
| `API_URL` | `https://ai-inspection-api.up.railway.app` | Backend API URL |
| `API_KEY` | `(generate)` | Backend API auth key |
| `NODE_ENV` | `production` | |

## 4. Add Persistent Volume

WhatsApp auth must persist across deploys:

```bash
# Via CLI
railway volume add --mount /app/auth

# Or via Dashboard:
# Service → Settings → Volumes → Add Volume
# Mount Path: /app/auth
```

## 5. Configure Networking

- Port: `3000` (auto-detected from EXPOSE)
- Health Check: `/health` (configured in railway.toml)

## 6. Deploy

```bash
railway up
```

Or push to `develop` branch for auto-deploy.

## 7. WhatsApp Pairing

After first deploy, pair WhatsApp:

```bash
# SSH into service
railway run bash

# Start pairing
openclaw whatsapp pair

# Scan QR code with phone
# Session stored in /app/auth volume
```

## Verification

```bash
# Check health
curl https://openclaw-inspector.up.railway.app/health

# Check logs
railway logs -f
```

## Troubleshooting

### Container restarts repeatedly
- Check `railway logs` for errors
- Verify ANTHROPIC_API_KEY is valid
- Ensure volume is mounted at `/app/auth`

### WhatsApp disconnected
- SSH in and run `openclaw whatsapp pair` again
- Check if phone has WhatsApp Web disabled

### Health check failing
- Gateway takes ~60s to start (healthcheckTimeout: 120s)
- Check if port 3000 is exposed correctly

## Cost Estimate

| Component | Cost |
|-----------|------|
| Railway (Starter) | ~$5/mo |
| Volume (1GB) | Included |
| **Total** | **~$5/mo** |
