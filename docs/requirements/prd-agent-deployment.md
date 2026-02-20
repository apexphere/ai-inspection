# PRD: AI Agent Deployment

**Document:** PRD-290  
**Author:** Riley (BA)  
**Date:** 2026-02-20  
**Status:** Draft  
**Ticket:** #290

---

## Executive Summary

Deploy the AI building inspection assistant so inspectors can use WhatsApp to conduct guided inspections and generate professional reports automatically.

**Current state:** We have built the backend (MCP tools, API, database) but there is no way for inspectors to actually use it — the AI agent and WhatsApp integration are not deployed.

**Goal:** An inspector can WhatsApp a number, conduct a full inspection with AI guidance, and receive a professional PDF report — all from their phone.

---

## Business Goals

### Primary Goals

| Goal | Metric | Target |
|------|--------|--------|
| **Time savings** | Report writing time | From 2-3 hours → 0 |
| **Throughput** | Inspections per day | From 3 → 5+ |
| **Quality** | Report completeness | 100% sections covered |
| **Adoption** | Inspector satisfaction | Would recommend to peer |

### Secondary Goals

| Goal | Metric | Target |
|------|--------|--------|
| **Cost efficiency** | Cost per inspection | < $1.00 |
| **Reliability** | Successful completions | > 95% |
| **Response time** | AI response latency | < 5 seconds |

### Value Proposition

**For inspectors:**
> "Get your report done before you leave the property."

**Quantified:**
- 2.5 hours saved per inspection × 3 inspections/day = **7.5 hours saved daily**
- At $75/hour effective rate = **$562/day in recovered time**
- Or: Do 2 more inspections/day = **+$600/day revenue**

---

## User Stories

### Core Workflow

#### US-1: Start Inspection
> **As an** inspector arriving at a property,  
> **I want to** tell the AI the address and client name,  
> **So that** I can begin a guided inspection immediately.

**Acceptance Criteria:**
- [ ] Inspector sends WhatsApp message with address
- [ ] AI confirms and creates inspection record
- [ ] AI prompts for first section within 5 seconds
- [ ] Inspector sees clear confirmation of property and client

#### US-2: Capture Findings
> **As an** inspector examining a section,  
> **I want to** send photos and notes via WhatsApp,  
> **So that** my findings are captured and organized automatically.

**Acceptance Criteria:**
- [ ] Photos sent via WhatsApp are saved to correct section
- [ ] Text notes are captured with timestamp
- [ ] AI confirms receipt: "Got it — [summary]. Anything else?"
- [ ] Multiple photos can be sent in sequence
- [ ] Findings tagged to current section automatically

#### US-3: Guided Walkthrough
> **As an** inspector,  
> **I want to** be guided through each section systematically,  
> **So that** I don't miss anything and follow a professional checklist.

**Acceptance Criteria:**
- [ ] AI prompts for each section in standard order
- [ ] AI tells me what to check in each section
- [ ] I can say "next" to move forward
- [ ] I can say "back to [section]" to revisit
- [ ] I can skip sections if not applicable
- [ ] Progress is visible ("3 of 8 sections complete")

#### US-4: Complete and Get Report
> **As an** inspector finishing on-site,  
> **I want to** say "done" and receive a PDF report,  
> **So that** I can send it to my client immediately.

**Acceptance Criteria:**
- [ ] Saying "done" or "finished" triggers report generation
- [ ] PDF delivered via WhatsApp within 60 seconds
- [ ] Report includes all findings and photos
- [ ] Report follows professional template
- [ ] Report can be forwarded directly to client

### Edge Cases

#### US-5: Resume Interrupted Inspection
> **As an** inspector whose phone lost signal,  
> **I want to** continue where I left off,  
> **So that** I don't lose my work or have to start over.

**Acceptance Criteria:**
- [ ] Returning to chat shows inspection in progress
- [ ] AI reminds me of current section
- [ ] All previous findings preserved
- [ ] Can continue seamlessly

#### US-6: Handle Off-Topic Messages
> **As an** inspector who accidentally sends wrong message,  
> **I want** the AI to stay focused on the inspection,  
> **So that** I don't derail the workflow.

**Acceptance Criteria:**
- [ ] Off-topic messages get polite redirect
- [ ] Active inspection context maintained
- [ ] AI returns to current section prompt
- [ ] Doesn't interpret random text as findings

#### US-7: First-Time Setup
> **As a** new inspector,  
> **I want to** understand how to use the system,  
> **So that** I can start using it confidently.

**Acceptance Criteria:**
- [ ] First message gets friendly introduction
- [ ] Brief explanation of capabilities
- [ ] Clear prompt to start: "Give me an address to begin"
- [ ] Help available via "help" command

---

## MVP Scope

### In Scope (MVP)

| Feature | Priority | Notes |
|---------|----------|-------|
| WhatsApp text messaging | P0 | Core communication |
| Photo capture & storage | P0 | Essential for reports |
| Guided section workflow | P0 | Core value prop |
| PDF report generation | P0 | Key deliverable |
| Session persistence | P0 | Resume inspections |
| Single inspector | P0 | Jake as pilot user |
| Pre-purchase inspection type | P0 | Most common |
| Off-topic handling | P1 | Conversation quality |
| Error recovery | P1 | Reliability |

### Out of Scope (Future)

| Feature | Reason | When |
|---------|--------|------|
| Multiple inspectors | Need multi-tenant first | v1.1 |
| COA/CCC report types | Different workflow | Sprint 4a+ |
| Voice messages | Complexity | Future |
| Web dashboard | Sprint 4b | After MVP |
| Custom checklists | Need editor UI | Future |
| Branding/white-label | Per-company setup | Future |
| Offline mode | Architectural change | Future |

---

## Constraints

### Budget

| Item | Constraint |
|------|------------|
| WhatsApp API | Start with Twilio sandbox (free) |
| Production number | ~$15/month + per-message |
| Claude API | Budget: $50/month initial |
| Infrastructure | Use existing Railway/Vercel |
| **Target cost per inspection** | **< $0.50** |

### Timeline

| Milestone | Target |
|-----------|--------|
| Design approved | Week 1 |
| Local development working | Week 2 |
| Staging deployment | Week 3 |
| Jake pilot testing | Week 4 |
| Production launch | Week 5 |

### Compliance

| Requirement | Approach |
|-------------|----------|
| **Data retention** | Inspection data kept 7 years (legal requirement) |
| **Privacy** | NZ Privacy Act compliance — data stays in NZ/AU region |
| **WhatsApp ToS** | Business use only, no spam, opt-in |
| **Photo ownership** | Client owns photos, we store on their behalf |

### Technical

| Constraint | Impact |
|------------|--------|
| WhatsApp approval | 1-4 weeks for business verification |
| Message rate limits | New numbers limited to 1K msgs/day |
| Media expiry | WhatsApp media URLs expire in 5 min — must download immediately |
| Session storage | Need persistent storage for resume capability |

---

## Success Metrics

### MVP Launch Criteria

- [ ] Jake completes 5 inspections successfully
- [ ] Report quality matches manual reports
- [ ] No data loss incidents
- [ ] < 5% inspection abandonment rate
- [ ] Jake's feedback: "I would use this daily"

### Post-Launch Metrics (30 days)

| Metric | Target |
|--------|--------|
| Inspections completed | 50+ |
| Completion rate | > 90% |
| Average time on-site | Baseline established |
| Report delivery time | < 60 seconds |
| User-reported issues | < 5 |

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| WhatsApp approval delayed | Medium | High | Start process immediately, have backup (direct Meta) |
| AI gives wrong guidance | Low | Medium | Skill testing, human review of early reports |
| Inspector finds workflow confusing | Medium | Medium | Pilot with Jake, iterate on prompts |
| Cost exceeds budget | Low | Low | Monitor usage, optimize prompts |
| Data loss during inspection | Low | High | Save after each message, session persistence |

---

## Dependencies

| Dependency | Status | Owner |
|------------|--------|-------|
| MCP server deployed | ✅ Complete | — |
| Backend API deployed | ✅ Complete | — |
| PDF generation working | ✅ Complete | — |
| SKILL.md defined | ✅ Complete | — |
| WhatsApp Business account | ❌ Not started | Master |
| Twilio account setup | ❌ Not started | Master |
| OpenClaw deployment | ❌ Not started | Archer |

---

## Open Questions

1. **Phone number:** Use Master's existing number or provision new?
2. **Pilot scope:** Just Jake, or include one more inspector?
3. **Report branding:** Use generic template or Jake's company branding?
4. **Feedback mechanism:** How does Jake report issues during pilot?
5. **Rollback plan:** What if pilot fails — manual fallback?

---

## Appendix

### Reference Documents

- Technical Design: `docs/design/013-agent-deployment.md` (PR #291)
- User Workflow: `docs/showcase/a-day-with-ai-inspection.md`
- Main Workflow: `docs/workflow-scenario.md`
- Ticket: #290

### Glossary

| Term | Definition |
|------|------------|
| **MCP** | Model Context Protocol — how the AI calls backend tools |
| **OpenClaw** | The AI agent platform that powers the assistant |
| **Session** | A conversation thread tied to one phone number |
| **Finding** | An observation captured during inspection |
| **Section** | A category in the inspection checklist (e.g., Exterior, Interior) |
