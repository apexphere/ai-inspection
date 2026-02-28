# Requirement: Interaction Observability

> Created: 2026-02-28

## Problem Statement

The application isn't widely used yet. Performance and scale aren't the concern — **functional correctness is**.

We need to answer: **Are we doing the right thing in the right way?**

To answer that, we need to see:
- What the user actually input
- How the AI interpreted it
- What actions the AI took
- What the AI responded

## Goals

1. **Capture full interaction data** — every user input, AI interpretation, tool call, and response
2. **Enable session review** — replay any inspection session to evaluate AI behavior
3. **Support quality analysis** — identify patterns of correct/incorrect AI behavior
4. **Inform improvements** — use real data to improve prompts, tool logic, and UX

## What to Capture

| Data Point | Description | Example |
|------------|-------------|---------|
| `user_input` | What the user said/sent | "The guttering is rusted on the north side" |
| `user_media` | Photos, documents attached | photo_url, file reference |
| `ai_interpretation` | How AI understood the input | Extracted: finding about guttering condition |
| `tool_calls` | MCP tools invoked | `inspection_add_finding(section="exterior", ...)` |
| `tool_results` | What the tools returned | `{ success: true, finding_id: "f-123" }` |
| `ai_response` | What AI said back to user | "Got it. Noted rust on north guttering. Any photos?" |
| `session_id` | Which inspection session | `insp-456` |
| `timestamp` | When it happened | `2026-02-28T13:45:00Z` |

## Session Replay

Should be able to reconstruct any session as a timeline:

```
[13:45:00] USER: "Starting inspection at 42 Smith Street"
[13:45:01] AI_INTERPRET: New inspection, address extraction
[13:45:01] TOOL: inspection_start(address="42 Smith Street")
[13:45:02] TOOL_RESULT: { inspection_id: "insp-456", status: "started" }
[13:45:02] AI_RESPONSE: "Inspection started for 42 Smith Street. Which section first?"

[13:45:30] USER: "Let's do exterior"
[13:45:31] AI_INTERPRET: Navigate to exterior section
[13:45:31] TOOL: inspection_navigate(section="exterior")
[13:45:31] AI_RESPONSE: "Exterior section. Check: cladding, gutters, windows, doors..."

[13:46:00] USER: "Guttering rusted on north side" + [PHOTO]
[13:46:01] AI_INTERPRET: Finding about guttering, has photo
[13:46:01] TOOL: inspection_add_finding(section="exterior", element="guttering", ...)
[13:46:02] AI_RESPONSE: "Noted. Rust on north guttering. Anything else on exterior?"
```

## Quality Review Questions

With this data, we can ask:

| Question | How to Answer |
|----------|---------------|
| Did AI understand the user correctly? | Compare `user_input` vs `ai_interpretation` |
| Did AI take the right action? | Review `tool_calls` for the context |
| Did AI respond helpfully? | Read `ai_response` in context |
| Where does AI get confused? | Find sessions with corrections/retries |
| What inputs cause problems? | Pattern analysis on failed interpretations |

## Open Questions

1. **Storage** — Where to store this? Same DB as inspections? Separate observability store?
2. **Retention** — How long to keep? All sessions forever? Or rolling window?
3. **Access** — Who can review sessions? Just devs? Or inspectors reviewing their own?
4. **Privacy** — Any PII concerns with storing full conversations?
5. **Tooling** — Build custom viewer? Use existing tool (Langfuse, etc.)?

## Out of Scope (for now)

- Real-time alerting
- Performance metrics
- Usage analytics
- A/B testing

## Success Criteria

- [ ] Every interaction is logged with full context
- [ ] Any session can be replayed as a timeline
- [ ] Team can review sessions and evaluate AI quality
- [ ] Insights from review feed back into improvements
