# Operations: Inspector Agent

Operations guide for the AI inspection assistant (OpenClaw inspector agent).

---

## Table of Contents

1. [Overview](#overview)
2. [Service Architecture](#service-architecture)
3. [WhatsApp Management](#whatsapp-management)
4. [Inspector Onboarding](#inspector-onboarding)
5. [Log Locations](#log-locations)
6. [Common Issues](#common-issues)
7. [Emergency Procedures](#emergency-procedures)

---

## Overview

The inspector agent is an OpenClaw-powered assistant that guides building inspectors through property inspections via WhatsApp.

**Components:**
- OpenClaw Gateway — Message handling, AI orchestration
- WhatsApp Channel — Baileys (WhatsApp Web)
- MCP Server — Inspection tools (CRUD via API)
- Backend API — Data persistence (Railway)

**Current deployment:** Local (v1) — runs on operator's machine

---

## Service Architecture

```
Inspector's Phone (WhatsApp)
         │
         ▼
┌─────────────────────────────────────────┐
│         OpenClaw Gateway (local)         │
│  ┌───────────┐  ┌───────────────────┐   │
│  │ WhatsApp  │  │ Inspector Agent   │   │
│  │ Channel   │──│ (Claude Sonnet)   │   │
│  └───────────┘  └─────────┬─────────┘   │
│                           │ stdio       │
│                 ┌─────────▼─────────┐   │
│                 │    MCP Server     │   │
│                 │ (inspection tools)│   │
│                 └─────────┬─────────┘   │
└───────────────────────────┼─────────────┘
                            │ HTTP
                            ▼
                    Railway API + DB
```

---

## WhatsApp Management

### Initial Pairing

See [WhatsApp Pairing Runbook](../runbooks/whatsapp-pairing.md) for detailed steps.

**Quick reference:**
```bash
# Start pairing
openclaw whatsapp pair

# Check status
openclaw whatsapp status

# Test send
openclaw whatsapp send +64XXXXXXXXX "test"
```

### Connection Status

```bash
# Check WhatsApp connection
openclaw status

# Output includes:
# WhatsApp: Connected (+64 21 XXX XXXX)
# or
# WhatsApp: Disconnected (reason)
```

### Re-Pairing Required When

| Symptom | Cause | Action |
|---------|-------|--------|
| Messages stop arriving | Session expired | Re-pair |
| "logged_out" in logs | Phone revoked access | Re-pair |
| "replaced" in logs | Another device linked | Re-pair |
| Volume reset | Auth tokens lost | Re-pair |

---

## Inspector Onboarding

### Adding a New Inspector

1. **Get inspector's phone number**
   - Must be WhatsApp-enabled
   - Format: `+6421XXXXXXX` (with country code)

2. **Add to allowlist in config**
   
   Edit `openclaw.yml`:
   ```yaml
   channels:
     whatsapp:
       dmPolicy: allowlist
       allowFrom:
         - "+64211234567"  # Existing inspector
         - "+64219876543"  # New inspector  ← Add here
   ```

3. **Restart gateway**
   ```bash
   openclaw gateway restart
   ```

4. **Verify**
   - Have inspector send "Hi" via WhatsApp
   - Should receive: "Hi! Ready to start an inspection? Give me the address."

5. **Register in backend** (if phone lookup enabled)
   
   API call to create/link inspector:
   ```bash
   curl -X POST https://api.example.com/inspectors \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name": "Jake Li", "phone": "+64219876543", "email": "jake@example.com"}'
   ```

### Removing an Inspector

1. Remove from `allowFrom` list in `openclaw.yml`
2. Restart gateway: `openclaw gateway restart`
3. (Optional) Deactivate in backend

### Inspector Not Receiving Responses

Checklist:
- [ ] Phone number in allowlist? (check `openclaw.yml`)
- [ ] Format correct? (must include `+` and country code)
- [ ] Gateway running? (`openclaw status`)
- [ ] WhatsApp connected? (`openclaw whatsapp status`)

---

## Log Locations

### OpenClaw Gateway Logs

```bash
# Live logs
openclaw gateway logs

# With filtering
openclaw gateway logs | grep -i error
openclaw gateway logs | grep -i whatsapp

# Log file location (if configured)
~/.openclaw/logs/gateway.log
```

### Log Levels

Set in `openclaw.yml`:
```yaml
logging:
  level: info  # debug | info | warn | error
```

### Key Log Patterns

| Pattern | Meaning | Action |
|---------|---------|--------|
| `WhatsApp connected` | Connection established | None |
| `WhatsApp disconnected: connection_lost` | Network issue | Auto-reconnects |
| `WhatsApp disconnected: logged_out` | Session revoked | Re-pair required |
| `MCP server started` | Tools available | None |
| `MCP error:` | Tool execution failed | Check API status |
| `API error: 401` | Auth failed | Check SERVICE_API_KEY |
| `API error: 500` | Backend error | Check API logs |
| `Rate limited` | Too many requests | Wait, check usage |

### MCP Server Logs

MCP server runs as subprocess — logs appear in gateway logs prefixed with `[mcp]`:

```bash
openclaw gateway logs | grep "\[mcp\]"
```

### API Logs (Railway)

```bash
railway logs --service api
```

---

## Common Issues

### Agent Not Responding

**Symptoms:** Inspector sends message, no response

**Checklist:**
1. Gateway running?
   ```bash
   openclaw status
   ```
   If not: `openclaw gateway start`

2. WhatsApp connected?
   ```bash
   openclaw whatsapp status
   ```
   If disconnected: Re-pair (see WhatsApp Management)

3. Phone in allowlist?
   Check `openclaw.yml` → `channels.whatsapp.allowFrom`

4. Check logs for errors:
   ```bash
   openclaw gateway logs | tail -50
   ```

### "Trouble saving that" Errors

**Cause:** API call failed

**Diagnosis:**
```bash
# Check API health
curl https://api-test-ai-inspection.apexphere.co.nz/health

# Check MCP → API auth
openclaw gateway logs | grep "API error"
```

**Common causes:**
- `401`: SERVICE_API_KEY mismatch
- `500`: Database or backend error
- `503`: API service down

**Fix:**
- Verify `SERVICE_API_KEY` matches Railway env var
- Check Railway API logs
- Restart API if needed

### Photos Not Processing

**Symptoms:** "Couldn't process that photo"

**Causes:**
1. WhatsApp media download failed
2. Image too large
3. R2 storage error (if enabled)

**Diagnosis:**
```bash
openclaw gateway logs | grep -i photo
openclaw gateway logs | grep -i media
```

**Workaround:**
- Ask inspector to re-send
- If persistent, check WhatsApp connection

### Inspection State Lost

**Symptoms:** "No inspection in progress" but inspector was mid-inspection

**Causes:**
- Gateway restarted
- Session timeout
- API error during save

**Recovery:**
1. Check API for active inspection:
   ```bash
   curl https://api.example.com/inspections?status=in_progress \
     -H "Authorization: Bearer $TOKEN"
   ```

2. If found, agent should resume on next message

3. If not found, inspector needs to start fresh

### High Latency

**Symptoms:** Responses take 10+ seconds

**Causes:**
- Claude API latency
- MCP tool execution slow
- API response slow

**Diagnosis:**
```bash
# Check response times in logs
openclaw gateway logs | grep "response time"
```

**Mitigations:**
- Check Anthropic status page
- Check Railway API response times
- Consider caching frequent lookups

---

## Emergency Procedures

### Service Down

1. **Check status:**
   ```bash
   openclaw status
   ```

2. **Restart gateway:**
   ```bash
   openclaw gateway restart
   ```

3. **If WhatsApp disconnected:**
   ```bash
   openclaw whatsapp status
   # If logged_out: re-pair
   openclaw whatsapp pair
   ```

4. **Check dependencies:**
   - Railway API: `curl https://api.../health`
   - Anthropic: Check status.anthropic.com

### Inspector Locked Out

If inspector messages aren't getting through:

1. Verify phone in allowlist
2. Check WhatsApp connection
3. Test with known-good number
4. Check logs for rejection reason

### Data Recovery

If inspection data lost:

1. Check API database for partial data
2. Review gateway logs for what was captured
3. Inspector may need to re-enter findings

### Rollback

If new config breaks things:

1. Restore previous `openclaw.yml`
2. Restart gateway: `openclaw gateway restart`

---

## Maintenance Windows

### Best Practices

- Schedule during low-usage hours
- Notify inspectors before planned maintenance
- Keep sessions short (complete inspection before maintenance)

### Graceful Shutdown

```bash
# Stop accepting new messages
openclaw gateway stop

# Wait for active inspections to complete (or notify inspectors)
# ...

# Perform maintenance
# ...

# Restart
openclaw gateway start
```

---

## Contacts

| Role | Contact | When |
|------|---------|------|
| On-call operator | TBD | Service issues |
| Backend developer | TBD | API issues |
| OpenClaw support | docs.openclaw.ai | Platform issues |

---

## Related Documentation

- [Deployment Runbook](../runbooks/deployment.md)
- [WhatsApp Pairing](../runbooks/whatsapp-pairing.md)
- [Agent Deployment Design](../design/013-agent-deployment.md)
