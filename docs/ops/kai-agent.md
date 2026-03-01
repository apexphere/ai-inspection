# Kai Agent — Deployment & Operations

**Last Updated:** 2026-03-01
**Owner:** Riley

Operations guide for the Kai WhatsApp building inspection agent running on OpenClaw.

---

## Overview

Kai is an OpenClaw agent that guides building inspectors through site inspections via WhatsApp. It runs locally on the host machine (not Railway) and communicates with the API via HTTPS.

### Architecture

```
Inspector (WhatsApp) ──▶ OpenClaw (local) ──▶ Kai agent
                                                  │
                                  skill-driven curl calls
                                                  │
                                          API (Railway)
```

Kai uses the building-inspection skill (`skills/building-inspection/SKILL.md`) to guide conversations and make API calls directly via curl — no MCP server required.

### Component Locations

| Component | Location |
|-----------|----------|
| OpenClaw runtime | Local machine (`~/.openclaw/`) |
| Kai agent workspace | `~/.openclaw/agents/kai/workspace/` |
| Kai skill | `~/.openclaw/agents/kai/workspace/skills/building-inspection/SKILL.md` |
| Skill source (versioned) | `skills/building-inspection/SKILL.md` in repo |
| API | Railway (`https://api-test-ai-inspection.apexphere.co.nz`) |

---

## Configuration

Kai's runtime configuration lives in `~/.openclaw/openclaw.json` under the `kai` agent entry.

```json
{
  "agents": {
    "list": [
      {
        "id": "kai",
        "name": "kai",
        "workspace": "/Users/megan/.openclaw/agents/kai/workspace",
        "model": "anthropic/claude-sonnet-4-6",
        "tools": {
          "deny": ["sessions_spawn", "subagents", "sessions_send", "sessions_list", "sessions_history"]
        },
        "env": {
          "API_SERVICE_KEY": "sk_..."
        }
      }
    ]
  }
}
```

### Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `API_SERVICE_KEY` | `openclaw.json` → Kai agent `env` | Scoped DB key for API auth |
| `AI_INSPECTION_API_URL` | Host environment | API base URL |

> **Security:** `openclaw.json` is not committed to the repo. Credentials live only on the host machine.

### API Service Key

Kai authenticates to the API using a scoped service key stored in `openclaw.json`:

- Key is stored as `API_SERVICE_KEY` in Kai's agent `env`
- Injected at runtime — never touches the workspace or git
- The skill reads `$API_SERVICE_KEY` and sends it as `X-API-Key` header
- Key is DB-backed with scoped permissions (see `docs/ops/service-keys.md`)

**To rotate the key:**
1. Generate a new key via `/admin/service-keys` in the web UI (or API)
2. Update `API_SERVICE_KEY` in `openclaw.json` under Kai's agent config
3. Restart Kai's session

---

## Skill Deployment

The building-inspection skill is versioned in the repo at `skills/building-inspection/SKILL.md`. After merging skill changes, sync to Kai's workspace:

```bash
./scripts/deploy-skill.sh
```

The script is version-aware and session-safe:
- Skips deploy if skill version hasn't changed
- Aborts if Kai has an active session in progress
- Uses atomic swap to avoid partial updates

**After deploying a new skill version:**
1. Verify skill version in Kai's workspace matches repo
2. Test with a sample inspection message

---

## WhatsApp Pairing

### Initial Pairing

```bash
openclaw whatsapp pair
```

Scan the QR code with WhatsApp → Settings → Linked Devices → Link a Device.

### Re-Pairing (After Disconnection)

| Symptom | Cause | Action |
|---------|-------|--------|
| `logged_out` in logs | Session expired | Re-pair |
| `replaced` in logs | Another device linked | Re-pair |
| Messages not received | Connection dropped | Check status, re-pair |

```bash
openclaw whatsapp status   # Check connection
openclaw whatsapp pair     # Re-pair if needed
```

### Inspector Access

Inspectors must be in the WhatsApp allowlist. Update `openclaw.json`:

```json
"channels": {
  "whatsapp": {
    "allowFrom": ["+64211234567", "+64219876543"]
  }
}
```

Restart the gateway after changes: `openclaw gateway restart`

---

## Starting / Stopping

```bash
openclaw gateway start    # Start the gateway (starts all agents including Kai)
openclaw gateway stop     # Stop the gateway
openclaw gateway restart  # Restart
openclaw status           # Check gateway + agent status
```

---

## Logs

```bash
openclaw gateway logs          # Gateway logs
openclaw gateway logs --tail   # Follow logs
```

Kai's structured logs are also shipped to Grafana Cloud Loki (see `docs/ops/logging.md`).

**Useful LogQL queries:**

```logql
# All Kai activity
{service="kai"}

# API call failures
{service="kai"} |= "401" OR |= "403" OR |= "500"

# Active inspections
{service="kai"} |= "Inspection created"
```

---

## Common Issues

### Kai not responding to messages

1. Check gateway: `openclaw status`
2. Check WhatsApp connection: `openclaw whatsapp status`
3. Check inspector is in allowlist
4. Check logs for errors

### API calls failing (401/403)

1. Verify `API_SERVICE_KEY` in `openclaw.json` is correct
2. Check key is active in `/admin/service-keys`
3. Check `AI_INSPECTION_API_URL` points to the right environment
4. Verify Railway API is up: `curl $AI_INSPECTION_API_URL/health`

### Skill out of date

1. Check deployed skill version: first line of `~/.openclaw/agents/kai/workspace/skills/building-inspection/SKILL.md`
2. Check repo version: `skills/building-inspection/SKILL.md`
3. If behind: `./scripts/deploy-skill.sh`

---

## See Also

- [Skill source](../../skills/building-inspection/SKILL.md)
- [Skill changelog](../../skills/building-inspection/CHANGELOG.md)
- [Service key management](service-keys.md)
- [Logging & observability](logging.md)
- [WhatsApp pairing](whatsapp-pairing.md)
- [Deployment runbook](deployment.md)
