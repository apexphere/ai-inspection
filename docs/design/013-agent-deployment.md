# Design: AI Agent Deployment

**Status:** Draft  
**Author:** Archer  
**Date:** 2026-02-20  
**Ticket:** #290

---

## Problem

We have built the inspection tools (MCP server) and backend API, but the AI agent that ties it all together is not deployed. An inspector cannot yet WhatsApp a number and start an inspection.

**Current state:**
- ✅ MCP server with inspection_* tools
- ✅ Backend API (Railway)
- ✅ Web UI (Vercel)
- ✅ Skill definition (SKILL.md)
- ❌ OpenClaw agent not configured
- ❌ WhatsApp channel not connected
- ❌ No production deployment

---

## Goals

1. Inspector can WhatsApp a number and start an inspection
2. Full workflow: start → capture findings/photos → generate report
3. Handles off-topic messages gracefully
4. Supports multiple concurrent inspectors
5. Production-ready (monitoring, error handling, scaling)

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
│                      WHATSAPP BUSINESS API                               │
│                                                                          │
│  Provider options:                                                       │
│  • Meta Cloud API (direct)                                              │
│  • Twilio                                                               │
│  • 360dialog                                                            │
│  • MessageBird                                                          │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ webhook
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            OPENCLAW                                      │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Gateway                                                          │    │
│  │ • Receives webhooks from WhatsApp                               │    │
│  │ • Manages sessions (per phone number)                           │    │
│  │ • Routes to agent                                               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                │                                         │
│                                ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Agent (Claude)                                                   │    │
│  │ • System prompt from SKILL.md                                   │    │
│  │ • Understands inspection workflow                               │    │
│  │ • Calls MCP tools as needed                                     │    │
│  └──────────────────────────┬──────────────────────────────────────┘    │
│                             │                                            │
└─────────────────────────────┼────────────────────────────────────────────┘
                              │ stdio
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      MCP SERVER (ai-inspection)                          │
│                                                                          │
│  Tools:                                                                  │
│  • inspection_start                                                     │
│  • inspection_add_finding                                               │
│  • inspection_navigate                                                  │
│  • inspection_complete                                                  │
│  • inspection_get_report                                                │
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

---

## Components

### 1. WhatsApp Business API

**Options:**

| Provider | Pros | Cons | Cost |
|----------|------|------|------|
| **Meta Cloud API** | Direct, official | Complex setup, approval process | Per-conversation pricing |
| **Twilio** | Easy integration, good docs | Middle-man | ~$0.005/msg + fees |
| **360dialog** | WhatsApp partner, simple | Less known | Per-conversation |
| **MessageBird** | Multi-channel | Overkill for single channel | Variable |

**Recommendation:** Start with **Twilio** for ease of integration, evaluate Meta direct later for cost optimization.

**Requirements:**
- WhatsApp Business Account
- Verified business
- Phone number (dedicated)
- Webhook endpoint (HTTPS)

---

### 2. OpenClaw Configuration

**Deployment options:**

| Option | Pros | Cons |
|--------|------|------|
| **Same server as API** | Simple, one deployment | Coupling, scaling together |
| **Separate service** | Independent scaling, isolation | More infra to manage |
| **Managed OpenClaw** | Zero ops | Dependency on service |

**Recommendation:** Start with **separate Railway service** for OpenClaw. Keeps concerns separated.

**Config structure:**

```yaml
# openclaw.yml
gateway:
  host: 0.0.0.0
  port: 3001

channels:
  whatsapp:
    provider: twilio  # or meta, 360dialog
    account_sid: ${TWILIO_ACCOUNT_SID}
    auth_token: ${TWILIO_AUTH_TOKEN}
    phone_number: ${WHATSAPP_PHONE_NUMBER}
    webhook_path: /webhook/whatsapp

agent:
  model: claude-sonnet-4-20250514
  max_tokens: 1024
  
  # Skill loaded from file
  skill: ./skill/SKILL.md
  
  # Or inline system prompt
  system_prompt: |
    You are a building inspection assistant...

mcp:
  servers:
    ai-inspection:
      command: node
      args: ["./server/dist/index.js"]
      env:
        API_URL: ${API_URL}
        API_KEY: ${API_KEY}

sessions:
  # Session = one phone number
  # Persist across messages
  storage: redis  # or memory, postgres
  ttl: 86400  # 24 hours
```

---

### 3. Session Management

**Model:** One session per phone number

```
Phone: +64 21 123 4567
  └── Session
        ├── Conversation history
        ├── Active inspection ID (if any)
        └── Last activity timestamp
```

**Session lifecycle:**
1. First message → Create session
2. Subsequent messages → Load session, continue conversation
3. Idle timeout (24h) → Session expires
4. "Start new inspection" → Can have active inspection
5. "Done" → Inspection complete, session continues

**Resumption:**
```
Inspector: "Hey"
AI: (checks session, finds active inspection)
    "Welcome back! You have an inspection in progress at 42 Oak Street.
     Currently on Interior. Ready to continue?"
```

---

### 4. Conversation Boundaries

**Skill update needed for:**

#### Off-Topic Handling

```markdown
## Conversation Boundaries

### During Active Inspection

Stay focused. Acknowledge briefly, redirect.

| User says | Response |
|-----------|----------|
| Weather, news, jokes | "Let's stay focused on the inspection. Still on [section] — anything to note?" |
| "Hello" / "Hi" | "Hi! We're inspecting [address]. Currently on [section]." |
| Unrelated question | "I'm here to help with inspections. What did you find in [section]?" |

### No Active Inspection

Be helpful but purposeful.

| User says | Response |
|-----------|----------|
| "Hey" / "Hello" | "Hi! Ready to start an inspection? Just tell me the address." |
| Random question | "I'm a building inspection assistant. Give me an address to get started." |
| "What can you do?" | "I guide building inspections via WhatsApp. Tell me an address to start, and I'll walk you through section by section, capture your findings and photos, then generate a PDF report." |

### Explicit Off-Topic Request

If user clearly wants to chat:

"I'm focused on inspections — not great at small talk! 😄 Ready to inspect something?"
```

#### Error Recovery

```markdown
## Error Handling

### API Failure

"Hmm, having trouble saving that. Let me try again..."
(retry)
"Got it now — [confirm what was saved]"

If persistent:
"I'm having technical difficulties. Your inspection is saved up to [last section]. 
 Try again in a few minutes, or contact support."

### Photo Processing Failed

"Couldn't process that photo. Can you send it again?"

### Context Too Long

(Approaching token limit)
Summarize and compact context internally.
"Quick recap: [address], [X findings] so far. Continuing with [section]..."
```

---

### 5. Multi-Tenant Considerations

**Option A: Single number, multiple inspectors**
- Phone number identifies inspector (lookup in DB)
- Pro: One number to manage
- Con: Need phone → inspector mapping

**Option B: Number per inspector**
- Each inspector gets their own WhatsApp number
- Pro: Clear separation
- Con: Number provisioning cost

**Recommendation:** Start with **Option A** (single number). Map phone → inspector via database lookup. Add provisioned numbers later if needed.

**User identification flow:**
```
Incoming message from +64 21 123 4567
  → Lookup in inspectors table
  → Found: Jake Li (inspector_id: abc123)
  → All inspections tagged with inspector_id
```

**First-time user:**
```
"Hi! I don't have you registered yet. 
 Please contact admin to set up your inspector profile."
```

---

### 6. Media Handling

**Photos from WhatsApp:**

```
Inspector sends photo
  → WhatsApp delivers media URL (temporary, expires ~5 min)
  → OpenClaw downloads immediately
  → Uploads to R2 storage
  → Passes R2 URL to MCP tool
```

**Implementation:**
```typescript
// In OpenClaw message handler
if (message.hasMedia) {
  const mediaUrl = message.mediaUrl;  // Temporary WhatsApp URL
  const buffer = await fetch(mediaUrl).then(r => r.buffer());
  const r2Url = await uploadToR2(buffer, `photos/${uuid()}.jpg`);
  // Pass r2Url to agent context
}
```

---

## Deployment Plan

### Phase 1: Local Development
- [ ] OpenClaw running locally
- [ ] ngrok tunnel for WhatsApp webhook
- [ ] Test with personal WhatsApp

### Phase 2: Staging Deployment
- [ ] Deploy OpenClaw to Railway (separate service)
- [ ] Configure Twilio sandbox
- [ ] Test full flow with team

### Phase 3: Production
- [ ] Provision production WhatsApp number
- [ ] WhatsApp Business verification
- [ ] Production OpenClaw deployment
- [ ] Monitoring and alerting

---

## Environment Variables

**OpenClaw service (Railway):**

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key |
| `TWILIO_ACCOUNT_SID` | Twilio credentials |
| `TWILIO_AUTH_TOKEN` | Twilio credentials |
| `WHATSAPP_PHONE_NUMBER` | WhatsApp number |
| `API_URL` | Backend API URL |
| `API_KEY` | Backend API auth |
| `R2_*` | R2 credentials for photo upload |
| `REDIS_URL` | Session storage (optional) |

---

## Cost Estimate

| Component | Cost |
|-----------|------|
| OpenClaw (Railway) | ~$5/mo |
| Twilio WhatsApp | ~$0.005/msg sent, $0.005/msg received |
| WhatsApp conversations | ~$0.03-0.08/conversation (24h window) |
| Claude API | ~$0.003/1K input, $0.015/1K output |

**Per inspection estimate:**
- ~20 messages × $0.005 = $0.10 (Twilio)
- ~1 conversation = $0.05 (WhatsApp)
- ~5K tokens = $0.03 (Claude)
- **Total: ~$0.20/inspection**

---

## Open Questions

1. **WhatsApp approval timeline?** Business verification can take 1-4 weeks.
2. **Phone number provisioning?** Use existing or provision new?
3. **Redis for sessions?** Or simpler in-memory/postgres?
4. **Rate limits?** WhatsApp has limits on messages per day for new numbers.
5. **Compliance?** Data retention, GDPR, NZ Privacy Act considerations.

---

## Next Steps

1. [ ] Review and approve this design
2. [ ] Decision on WhatsApp provider (Twilio recommended)
3. [ ] Provision WhatsApp Business account
4. [ ] Break into implementation tickets
5. [ ] Phase 1: Local development setup

---

## References

- [OpenClaw Documentation](https://docs.openclaw.ai)
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)
- [WhatsApp Business Platform](https://developers.facebook.com/docs/whatsapp)
- [MCP Protocol](https://modelcontextprotocol.io)
