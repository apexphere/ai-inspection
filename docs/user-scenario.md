# AI Inspection — User Scenario

## Overview

AI Inspection is a building surveyor's assistant that combines:
- **WhatsApp companion** for on-site data capture
- **Web interface** for office review and report generation

The system uses OpenClaw (AI agent) connected to an MCP backend that handles data storage, checklist logic, and PDF generation.

---

## The Two-Phase Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PHASE 1: ON-SITE                              │
│                         (WhatsApp + OpenClaw)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Inspector at property with phone                                      │
│   ↓                                                                     │
│   Opens WhatsApp, tells OpenClaw the address                            │
│   ↓                                                                     │
│   OpenClaw guides through inspection:                                   │
│   • Prompts for each section/clause                                     │
│   • Reminds what evidence to collect                                    │
│   • Receives photos + notes                                             │
│   • Stores everything via MCP backend                                   │
│   ↓                                                                     │
│   Inspector finishes on-site work                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          PHASE 2: OFFICE                                │
│                        (Web Interface)                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Inspector back at computer                                            │
│   ↓                                                                     │
│   Opens web app, views captured project data                            │
│   ↓                                                                     │
│   Reviews and edits:                                                    │
│   • Observations per clause                                             │
│   • Photo captions and linking                                          │
│   • Document attachments (PS3, CoC, warranties)                         │
│   ↓                                                                     │
│   Submits for peer review                                               │
│   ↓                                                                     │
│   Senior surveyor reviews, approves or requests changes                 │
│   ↓                                                                     │
│   Generate final PDF report                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: On-Site (WhatsApp)

### Starting the Inspection

**Inspector:** "Starting COA inspection at 42 Smith Street, Henderson"

**OpenClaw:** "Got it — COA inspection at **42 Smith Street, Henderson**. 

This is a bathroom renovation without consent, right? I'll guide you through the clause review.

Let's start with **B1 Structure**. Check wall framing if visible. Send photos of any structural elements."

### Guided Data Capture

**OpenClaw:** "Moving to **E3 Internal Moisture**. 

Check:
- Tanking/waterproofing
- Upstands at floor junction
- Shower base condition
- Moisture readings if you have meter

Send photos + notes."

**Inspector:** [sends 3 photos] "Tanking installed, upstands look OK. Taking moisture reading now."

**OpenClaw:** "Captured 3 photos for E3. What's the moisture reading?"

**Inspector:** "12% at shower base"

**OpenClaw:** "Noted — 12% moisture (acceptable). 

E3 evidence so far:
- 3 photos
- Observation: tanking installed, upstands OK
- Moisture: 12%

Still need: waterproofing warranty, PS3. Collect from owner later?

Ready for **G12 Water Supplies**?"

### Reminders for Missing Evidence

**OpenClaw:** "Before you leave site, you still need photos for:
- G13 drainage (check under vanity)
- Electrical panel (for G9)

Also remind the owner to email:
- PS3 Waterproofing
- PS3 Plumbing  
- Tanking warranty"

### Finishing On-Site

**Inspector:** "Done on site"

**OpenClaw:** "Good work! Captured for 42 Smith Street:
- 19 photos across 6 clauses
- Moisture reading: 12%
- 3 documents still needed from owner

When you're back at the office, open the web app to review and complete the report."

---

## Phase 2: Office (Web Interface)

### Reviewing Captured Data

Inspector logs into web app, opens project **42 Smith Street**.

**Dashboard shows:**
```
Project: 260219 — 42 Smith Street, Henderson
Type: COA (Certificate of Acceptance)
Status: In Progress

Captured On-Site:
├── Photos: 19
├── Observations: 6 clauses with notes
└── Measurements: 1 (moisture 12%)

Outstanding:
├── Documents: 3 required (PS3 Plumbing, PS3 Waterproofing, Warranty)
└── Clauses: 2 need observations (F2, G4)
```

### Editing Observations

Inspector clicks into **E3 Internal Moisture**:

| Field | Value |
|-------|-------|
| Applicable | ✅ Yes |
| Photos | 11, 12, 13 (click to view) |
| Observations | Tanking installed, upstands OK at floor junction. Moisture reading 12% at shower base — within acceptable range. |
| Documents Provided | *(none yet)* |
| Documents Required | PS3 Waterproofing, Warranty |
| Remedial Works | Nil |

Inspector edits observation text, adds more detail, links additional photos.

### Uploading Documents

Owner emails the PS3 and warranty. Inspector:
1. Downloads attachments
2. Uploads to web app
3. System auto-assigns to correct clauses based on document type
4. Status changes: **Required → Received**

### Peer Review

Inspector clicks **Submit for Review**.

**Senior Surveyor** receives notification, opens project:
- Reviews each clause
- Adds comment: "Need to note the specific tanking product used"
- Clicks **Request Revision**

**Inspector** sees revision request:
- Edits E3 observation: "...Tanking system: Ardex WPM 300 membrane..."
- Clicks **Resubmit**

**Senior Surveyor** approves.

### Report Generation

Inspector clicks **Generate Report**.

System produces PDF:
```
CERTIFICATE OF ACCEPTANCE REPORT

42 Smith Street, Henderson

Section 1: Report Information Summary
Section 2: Introduction
Section 3: Building & Site Description
Section 4: Assessment Methodology
Section 5: NZBC Code Clause Review
Section 6: Scope of Remedial Works
Section 7: Signatures

Appendix A: Inspection Photographs (19 photos)
Appendix B: Producer Statements
Appendix C: Warranties
```

---

## System Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐
│   WhatsApp   │────▶│   OpenClaw   │────▶│   ai-inspection      │
│   (phone)    │     │   (agent)    │     │   (MCP server)       │
└──────────────┘     └──────┬───────┘     └──────────┬───────────┘
                            │                        │
                       conversation              ┌───┴───┐
                       + tool calls              │       │
                            │                    ▼       ▼
                            │              ┌─────────┐ ┌─────────┐
                            │              │ Database│ │  Files  │
                            │              │ (data)  │ │ (photos)│
                            │              └─────────┘ └─────────┘
                            │                    ▲       ▲
┌──────────────┐            │                    │       │
│  Web Browser │────────────┼────────────────────┴───────┘
│  (computer)  │            │         (same backend)
└──────────────┘            │
```

**Key point:** Both WhatsApp (via OpenClaw) and Web interface connect to the **same MCP backend**. Data captured on-site via WhatsApp is immediately available in the web interface.

---

## User Roles

| Role | Phase 1 (On-Site) | Phase 2 (Office) |
|------|-------------------|------------------|
| **Inspector** | Captures photos, notes, measurements | Reviews, edits, uploads docs |
| **Senior Surveyor** | — | Peer review, approve/reject |
| **Admin** | — | Project setup, user management |

---

## Report Types

| Type | Use Case | Complexity |
|------|----------|------------|
| **Residential PPI** | Pre-purchase inspection | Simple (MVP) |
| **COA** | Unauthorized work (post-1992) | Medium |
| **CCC Gap Analysis** | Consented but no CCC | High |
| **Safe & Sanitary** | Pre-1992 work | Low |

MVP started with Residential PPI. Sprint 4 adds COA report support.

---

## Key Benefits

1. **Guided capture** — OpenClaw reminds what to collect, reduces missed evidence
2. **Real-time storage** — Photos/notes stored immediately, nothing lost
3. **Seamless handoff** — On-site work flows directly into office review
4. **Professional output** — Consistent, high-quality PDF reports
5. **Audit trail** — Everything tracked from capture to final report
