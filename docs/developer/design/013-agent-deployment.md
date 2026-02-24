# Design: AI Agent Deployment

**Status:** Ready for Review  
**Author:** Archer  
**Date:** 2026-02-21 (Updated)  
**Ticket:** #290

---

## Problem

We have built the inspection tools (MCP server) and backend API, but the AI agent that ties it all together is not deployed. An inspector cannot yet WhatsApp a number and start an inspection.

**Current state:**
- ✅ MCP server with inspection_* tools
- ✅ Backend API (Railway)
- ✅ Web UI (Vercel)
- ✅ Skill definition (skill/SKILL.md)
- ❌ OpenClaw agent not deployed
- ❌ WhatsApp channel not connected

---

## Goals

1. Inspector can WhatsApp a number and start an inspection
2. Full workflow: start → capture findings/photos → generate report
3. Handles off-topic messages gracefully
4. Supports multiple concurrent inspectors
5. Production-ready (monitoring, error handling)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              INSPECTOR                                   │
│                         (WhatsApp on phone)                             │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     OPENCLAW GATEWAY (Railway)                           │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ WhatsApp Channel (native via Baileys)                           │    │
│  │ • QR code pairing (WhatsApp Web)                                │    │
│  │ • Direct message handling                                       │    │
│  │ • Media download (photos)                                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                │                                         │
│                                ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Inspector Agent (dedicated)                                      │    │
│  │ • SOUL.md — inspection assistant persona                        │    │
│  │ • SKILL.md — inspection workflow                                │    │
│  │ • Model: Claude Sonnet                                          │    │
│  └──────────────────────────┬──────────────────────────────────────┘    │
│                             │                                            │
└─────────────────────────────┼────────────────────────────────────────────┘
                              │ stdio (MCP)
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      MCP SERVER (same container)                         │
│                                                                          │
│  Tools:                                                                  │
│  • inspection_start(address, type)                                      │
│  • inspection_add_finding(section, description, severity, photos)       │
│  • inspection_navigate(section)                                         │
│  • inspection_complete()                                                │
│  • inspection_get_report(format)                                        │
│                              │                                           │
└──────────────────────────────┼───────────────────────────────────────────┘
                               │ HTTP
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND API (Railway)                            │
│                                                                          │
│  • Inspection CRUD                                                      │
│  • Photo storage (R2)                                                   │
│  • PDF generation                                                       │
│  • Database (Postgres)                                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key simplification:** No Twilio or WhatsApp Business API needed. OpenClaw connects directly via WhatsApp Web (Baileys library).

---

## Dedicated Agent Structure

```
agents/
  inspector/
    workspace/
      SOUL.md          # Persona: helpful inspection assistant
      SKILL.md         # Inspection workflow (from skill/)
      MEMORY.md        # Persistent context
      USER.md          # Inspector info template
```

**SOUL.md:**
```markdown
# Inspector Agent

You are a building inspection assistant. You help inspectors conduct 
thorough building assessments via WhatsApp.

## Personality
- Professional but friendly
- Concise — inspectors are on-site, busy
- Proactive — suggest next steps
- Patient — handle photos, typos, interruptions

## Core workflow
1. Get address → start inspection
2. Guide through sections (Exterior → Interior → ...)
3. Capture findings + photos for each
4. Generate report when complete
```

---

## OpenClaw Configuration

```yaml
# openclaw.yml
agents:
  inspector:
    enabled: true
    model: claude-sonnet-4
    
channels:
  whatsapp:
    enabled: true
    dmPolicy: allowlist
    allowFrom:
      - "+6421..."  # Inspector 1
      - "+6422..."  # Inspector 2
    session:
      dmScope: agent  # Each inspector gets own session
    ackReaction:
      emoji: "👀"
      direct: true

mcp:
  servers:
    inspection:
      command: ["node", "server/dist/index.js"]
      env:
        API_URL: "https://api.example.com"
        API_KEY: "${API_KEY}"
```

---

## Media Handling (Photos)

```
Inspector sends photo via WhatsApp
    │
    ▼
OpenClaw Gateway receives media
    │ (Baileys downloads from WhatsApp servers)
    ▼
Agent receives image in context
    │
    ▼
MCP tool: inspection_add_finding(..., photos: [base64])
    │
    ▼
API uploads to R2, stores URL in finding
```

**Note:** WhatsApp media URLs are temporary (~5 min). OpenClaw downloads immediately on receipt.

---

## Conversation Boundaries

### During Active Inspection

| User says | Response |
|-----------|----------|
| Off-topic (weather, jokes) | "Let's stay focused. Still on [section] — anything to note?" |
| "Hello" / "Hi" | "Hi! We're at [address], checking [section]." |
| Unrelated question | "I'm here for inspections. What did you find?" |

### No Active Inspection

| User says | Response |
|-----------|----------|
| "Hey" | "Hi! Ready to inspect? Give me an address." |
| "What can you do?" | "I guide building inspections via WhatsApp. Give me an address to start." |

### Error Recovery

| Situation | Response |
|-----------|----------|
| API failure | "Trouble saving that. Trying again..." (retry) |
| Photo failed | "Couldn't process that photo. Send again?" |
| Long inspection | Auto-summarize, continue from checkpoint |

---

## Multi-Inspector Support

**Approach:** Single WhatsApp number, phone→inspector lookup.

```
Incoming from +64 21 123 4567
    │
    ▼
Lookup in inspectors table
    │
    ├─ Found: Inspector "Jake Li" (id: abc123)
    │   └─ Tag all inspections with inspector_id
    │
    └─ Not found:
        └─ "I don't have you registered. Contact admin."
```

**Session isolation:** Each phone number gets own OpenClaw session (dmScope: agent).

---

## Deployment

### Phase 1: Local Development (v1)

OpenClaw runs on local machine, connects to Railway API.

```
Inspector (WhatsApp) → OpenClaw (local) → MCP Server (local) → Railway API
```

**Setup:**
```bash
# Clone repo
cd ai-inspection

# Build MCP server
cd server && npm ci && npm run build && cd ..

# Configure OpenClaw
openclaw init  # or copy config

# Pair WhatsApp
openclaw whatsapp pair  # scan QR with phone

# Start gateway
openclaw gateway start
```

**Environment Variables (local .env):**
| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key |
| `API_URL` | `https://api-test-ai-inspection.apexphere.co.nz` |
| `API_KEY` | Backend API auth key |

### Phase 2: Railway Deployment (future)

Move OpenClaw to Railway when ready for production:
- Dockerfile for openclaw-inspector service
- Persistent volume for WhatsApp auth
- Auto-deploy from develop branch

---

## Cost Estimate

| Component | Cost |
|-----------|------|
| OpenClaw (Railway) | ~$5/mo |
| Claude API | ~$0.03/inspection (~5K tokens) |
| **Total per inspection** | **~$0.03** |

No Twilio or WhatsApp Business API fees.

---

## Implementation Stories

### Phase 1: Local Setup (v1)
1. **#344 Create inspector agent structure** — SOUL.md, config
2. **#345 Configure WhatsApp channel** — pairing, allowlist
3. **#346 Connect MCP server** — stdio transport, tools working

### Phase 2: Polish
4. **#350 Conversation boundaries** — off-topic handling in SKILL.md
5. **#351 Multi-inspector support** — phone lookup (Alex)
6. **#352 Monitoring and alerts** — health checks
7. **#353 Ops runbook** — documentation

### Phase 3: Railway Deployment (future)
- Dockerfile for openclaw-inspector
- Railway service configuration
- Persistent WhatsApp auth

---

## Open Questions

1. ~~WhatsApp Business API provider?~~ → Not needed, use native WhatsApp Web
2. **Phone number:** Use existing or provision new?
3. **Auth persistence:** Volume mount or external store?
4. **Rate limits:** WhatsApp Web has informal limits (~200 msg/day for new numbers)

---

## Next Steps

1. ✅ Design approved
2. Create implementation tickets (#1-12 above)
3. Taylor: Railway service setup (#4, #5)
4. Alex: API inspector lookup endpoint (#8)
5. Archer: Agent config and skill (#1, #2, #7)

---

## References

- [OpenClaw WhatsApp Docs](https://docs.openclaw.ai/channels/whatsapp)
- [MCP Protocol](https://modelcontextprotocol.io)
- [Baileys Library](https://github.com/WhiskeySockets/Baileys)

---

## See Also

- [MVP Inspection Workflow](001-mvp-inspection-workflow.md) — Core workflow design
- [Deployment Runbook](../../ops/deployment.md) — Production deployment
- [WhatsApp Pairing](../../ops/whatsapp-pairing.md) — WhatsApp setup
- [Inspector Agent Ops](../../ops/inspector-agent.md) — Operations guide
- [Inspector Workflow Guide](../../user/inspector-workflow.md) — User guide
