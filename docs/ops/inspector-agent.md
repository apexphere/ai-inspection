# Inspector Agent Operations Runbook

**Last Updated:** 2026-02-23  
**Owner:** Alex

Operations guide for the AI Building Inspection Agent running on OpenClaw.

---

## Table of Contents

1. [Overview](#overview)
2. [WhatsApp Pairing](#whatsapp-pairing)
3. [Re-Pairing After Disconnection](#re-pairing-after-disconnection)
4. [Inspector Onboarding](#inspector-onboarding)
5. [Log Locations](#log-locations)
6. [Common Error Scenarios](#common-error-scenarios)
7. [Health Monitoring](#health-monitoring)

---

## Overview

The inspector agent enables building inspectors to conduct inspections via WhatsApp. The agent:
- Receives messages from WhatsApp
- Uses MCP tools to interact with the inspection API
- Guides inspectors through the inspection workflow
- Generates PDF reports

### Architecture

```
WhatsApp ──▶ OpenClaw Agent ──▶ MCP Server ──▶ API (Railway)
                │                                    │
                └── Claude (Anthropic) ◀─────────────┘
```

### Service Locations

| Component | Location | Access |
|-----------|----------|--------|
| OpenClaw Agent | Railway / Local | SSH or local terminal |
| MCP Server | Bundled with agent | stdio transport |
| API | Railway | HTTPS |
| Logs | Railway dashboard | `railway logs` |

---

## WhatsApp Pairing

Initial pairing links the service to a WhatsApp account.

### Prerequisites
- WhatsApp account on a phone
- Railway CLI: `npm i -g @railway/cli`
- Access to Railway project

### Steps

1. **SSH into the service**
   ```bash
   railway run bash --service openclaw-inspector
   ```

2. **Start pairing**
   ```bash
   openclaw whatsapp pair
   ```

3. **Scan QR code**
   - Open WhatsApp on phone
   - Settings → Linked Devices → Link a Device
   - Scan the QR code in terminal

4. **Verify connection**
   ```bash
   openclaw whatsapp status
   ```
   Expected output: `Connected: +64 21 XXX XXXX`

5. **Exit SSH**
   ```bash
   exit
   ```

---

## Re-Pairing After Disconnection

### When Re-Pairing is Required

| Scenario | Symptom | Action |
|----------|---------|--------|
| Session expired | `logged_out` in logs | Re-pair |
| Phone logged out devices | `replaced` in logs | Re-pair |
| Volume reset | No auth files | Re-pair |
| Service redeployed | Usually auto-reconnects | Check status first |

### Re-Pairing Steps

1. **SSH into service**
   ```bash
   railway run bash --service openclaw-inspector
   ```

2. **Clear existing auth** (if corrupted)
   ```bash
   rm -rf /app/auth/*
   ```

3. **Run pairing**
   ```bash
   openclaw whatsapp pair
   ```

4. **Scan new QR code** from phone

5. **Verify**
   ```bash
   openclaw whatsapp status
   ```

---

## Inspector Onboarding

To add a new inspector to the system:

### 1. Add to API (Inspector Record)

Create inspector in the API database:
```bash
curl -X POST https://api-ai-inspection.apexphere.co.nz/api/inspectors \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "email": "john@example.com",
    "phoneNumber": "+64211234567",
    "lbpNumber": "BP123456"
  }'
```

### 2. Add to WhatsApp Allowlist

Update the `WHATSAPP_ALLOW` environment variable:

**Railway Dashboard:**
1. Go to openclaw-inspector service
2. Variables tab
3. Edit `WHATSAPP_ALLOW`
4. Add phone number (comma-separated E.164 format):
   ```
   +64211234567,+64219876543
   ```
5. Save and redeploy

**Or via CLI:**
```bash
railway variables set WHATSAPP_ALLOW="+64211234567,+64219876543" --service openclaw-inspector
railway up --service openclaw-inspector
```

### 3. Verify Access

Have inspector send a test message to the WhatsApp number:
```
Hi
```

Expected response: Agent greeting and inspection start prompt.

### Removing an Inspector

1. Remove from `WHATSAPP_ALLOW` env var
2. Optionally deactivate in API database
3. Redeploy service

---

## Log Locations

### Railway Logs

**Live logs:**
```bash
railway logs -f --service openclaw-inspector
```

**Last N lines:**
```bash
railway logs --service openclaw-inspector -n 100
```

**Filter by pattern:**
```bash
railway logs -f --service openclaw-inspector | grep -i error
```

### Log Patterns to Watch

| Pattern | Meaning | Severity |
|---------|---------|----------|
| `WhatsApp connected` | Successfully connected | Info |
| `WhatsApp disconnected: connection_lost` | Network issue, auto-reconnects | Warning |
| `WhatsApp disconnected: logged_out` | Session expired, needs re-pair | Critical |
| `WhatsApp disconnected: replaced` | Another device linked | Critical |
| `MCP tool error` | Tool execution failed | Error |
| `API request failed` | Backend API issue | Error |
| `Rate limited` | Too many requests | Warning |

### Structured Log Fields

Logs are JSON formatted with these fields:
```json
{
  "timestamp": "2026-02-23T10:00:00Z",
  "level": "info",
  "message": "Inspection started",
  "inspectionId": "abc-123",
  "phone": "+64211234567",
  "tool": "inspection_start"
}
```

---

## Common Error Scenarios

### 1. Messages Not Arriving

**Symptoms:** Inspector sends message, no response

**Checklist:**
1. Check WhatsApp connection:
   ```bash
   railway run openclaw whatsapp status --service openclaw-inspector
   ```
2. Check phone is in allowlist (`WHATSAPP_ALLOW`)
3. Check service is running:
   ```bash
   railway status --service openclaw-inspector
   ```
4. Check logs for errors:
   ```bash
   railway logs --service openclaw-inspector -n 50 | grep -i error
   ```

**Fix:** Usually re-pair WhatsApp or add phone to allowlist.

### 2. API Connection Failures

**Symptoms:** `API request failed` or `ECONNREFUSED` in logs

**Checklist:**
1. Verify API is running:
   ```bash
   curl https://api-ai-inspection.apexphere.co.nz/api/health
   ```
2. Check `API_URL` env var is correct
3. Check `API_KEY` env var is valid
4. Check API logs for errors

**Fix:** Usually API is down or credentials are wrong.

### 3. MCP Tool Errors

**Symptoms:** `MCP tool error: inspection_start failed`

**Checklist:**
1. Check MCP server started (in logs)
2. Verify API credentials work
3. Check specific tool error message

**Fix:** Restart service, check API health.

### 4. Photo Upload Failures

**Symptoms:** `Failed to process photo` or `R2 upload error`

**Checklist:**
1. Check R2 credentials (`R2_*` env vars)
2. Check photo size (max 10MB)
3. Check R2 bucket exists

**Fix:** Verify R2 configuration.

### 5. Session/Context Issues

**Symptoms:** Agent "forgets" inspection context mid-conversation

**Checklist:**
1. Check for service restarts in logs
2. Verify session persistence (volume mounted)
3. Check context length (very long inspections may exceed limits)

**Fix:** If volume issue, check Railway volume mount. For long inspections, may need to split.

---

## Health Monitoring

### Health Endpoint

```bash
curl https://openclaw-inspector.up.railway.app/health
```

Response:
```json
{
  "status": "healthy",
  "whatsapp": {
    "connected": true,
    "phone": "+64 21 XXX XXXX"
  },
  "mcp": {
    "connected": true,
    "tools": 12
  },
  "uptime": "2d 4h 30m"
}
```

### Setting Up Alerts

**Railway Notifications:**
1. Project Settings → Notifications
2. Enable: Deploy failures, Health check failures
3. Add webhook or email

**External Monitoring (Recommended):**
- Uptime Robot or Better Uptime
- Monitor: `GET /health`
- Alert on: non-200 or `whatsapp.connected: false`

### Key Metrics

| Metric | Warning | Critical |
|--------|---------|----------|
| Response time | > 5s | > 30s |
| Error rate | > 1% | > 5% |
| WhatsApp connected | — | false |
| Memory usage | > 80% | > 95% |

---

## Quick Reference

### Common Commands

```bash
# Check service status
railway status --service openclaw-inspector

# View logs
railway logs -f --service openclaw-inspector

# SSH into service
railway run bash --service openclaw-inspector

# Check WhatsApp status
railway run openclaw whatsapp status --service openclaw-inspector

# Re-pair WhatsApp
railway run openclaw whatsapp pair --service openclaw-inspector

# Restart service
railway up --service openclaw-inspector

# Set env var
railway variables set KEY=value --service openclaw-inspector
```

### Emergency Contacts

| Issue | Contact |
|-------|---------|
| WhatsApp down | On-call engineer |
| API errors | Backend team |
| Billing/Limits | Account owner |

---

## See Also

- [WhatsApp Pairing Runbook](whatsapp-pairing.md)
- [Deployment Runbook](deployment.md)
- [Infrastructure Overview](infrastructure.md)
