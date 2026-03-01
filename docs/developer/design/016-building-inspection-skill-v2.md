# Design: Building Inspection Skill v2

**Issue:** #584
**Author:** Riley 📐
**Status:** Draft

## Overview

Redesign the building-inspection skill to support all four inspection types (PPI, COA, CCC, SS), use the current site-inspection API (replacing the legacy inspection API), and include a deployment mechanism to sync the skill from repo to Kai's workspace.

## Current State

The skill:
- Hardcodes PPI flow with `"checklist": "nz-ppi"`
- Uses legacy `/api/inspections` endpoints (pre-site-inspection era)
- Has a fixed 8-section walkthrough (exterior → roof_space)
- No type selection, no clause review support

## Design

### 1. Conversation Flow

```
Inspector: "I'm at 45 Oak Avenue"

Kai: "Got it — 45 Oak Avenue. What type of inspection?
      1️⃣ PPI (Pre-Purchase)
      2️⃣ COA (Code of Compliance)
      3️⃣ CCC (CCC Gap Analysis)
      4️⃣ SS (Safe & Sanitary)"

Inspector: "PPI"

Kai: → Creates project + site inspection
     → Starts type-specific workflow
```

#### Pre-requisites Before Creating Inspection

The API requires `projectId`, which requires `propertyId` and `clientId`. Flow:

1. **Address** → search or create Property (`POST /api/properties`)
2. **Client** → ask client name, search or create (`POST /api/clients`)
3. **Project** → create with reportType + propertyId + clientId (`POST /api/projects`)
4. **Site Inspection** → create with projectId + type + stage (`POST /api/projects/:id/inspections`)

On WhatsApp, keep this conversational and fast — don't ask for data the inspector hasn't volunteered. Minimum viable start: address + type + inspector name. Client can default to "TBC".

### 2. Inspection Type Mapping

| User Choice | `reportType` (Project) | `type` (Inspection) | `stage` | Workflow |
|-------------|----------------------|---------------------|---------|----------|
| PPI | `PPI` | `SIMPLE` | `INS_01` | Checklist by category |
| COA | `COA` | `CLAUSE_REVIEW` | `COA` | Clause-by-clause NZBC review |
| CCC | `CCC_GAP` | `SIMPLE` | `CCC_GA` | Defect checklist |
| SS | `SAFE_SANITARY` | `SIMPLE` | `S_AND_S` | Simplified checklist |

### 3. Type-Specific Workflows

#### PPI (Pre-Purchase Inspection)
- **API:** Checklist items (`/api/site-inspections/:id/checklist-items`)
- **Categories:** `SITE`, `EXTERIOR`, `INTERIOR`, `DECKS`, `SERVICES`
- **Decision per item:** `PASS` / `FAIL` / `NA`
- **Section prompts:**

| Category | Prompt |
|----------|--------|
| SITE | "Check drainage, landscaping, fencing, paths, driveways" |
| EXTERIOR | "Check roof, gutters, cladding, external walls, windows, doors" |
| INTERIOR | "Check walls, ceilings, floors, doors, windows, moisture" |
| DECKS | "Check deck structure, balustrades, waterproofing, fixings" |
| SERVICES | "Check electrical, plumbing, hot water, ventilation, insulation" |

- **Flow:** Walk through categories in order. For each finding, create a checklist item. Inspector can skip categories.

#### COA (Code of Compliance Assessment)
- **API:** Clause reviews (`/api/site-inspections/:id/clause-reviews`)
- **Init:** Call `/clause-reviews/init` with all clause IDs from `/api/building-code/clauses`
- **Categories:** B (Structure), C (Fire), D (Access), E (Moisture), F (Safety), G (Services), H (Energy)
- **Per clause:** `APPLICABLE` or `NA` (with reason), plus observations, photos, docs
- **Flow:** Work through clauses by category. Show clause code + title, ask for applicability and observations.

#### CCC (CCC Gap Analysis)
- **API:** Checklist items
- **Categories:** Same as PPI but focused on defects against consented plans
- **Flow:** Similar to PPI but framed as "defect found / no defect / N/A"

#### SS (Safe & Sanitary)
- **API:** Checklist items
- **Categories:** Subset — focus on habitability (EXTERIOR, INTERIOR, SERVICES)
- **Flow:** Shorter inspection. Building Act 1991 s.64 criteria. Binary safe/insanitary assessment per element.

### 4. API Endpoints Used

All calls include `-H "X-API-Key: $SERVICE_API_KEY"`.

| Action | Method | Endpoint |
|--------|--------|----------|
| Create property | POST | `/api/properties` |
| Search properties | GET | `/api/properties?streetAddress=...` |
| Create client | POST | `/api/clients` |
| Create project | POST | `/api/projects` |
| Get project | GET | `/api/projects/:id` |
| Create inspection | POST | `/api/projects/:projectId/inspections` |
| Update inspection | PUT | `/api/site-inspections/:id` |
| Get inspection | GET | `/api/site-inspections/:id` |
| Add checklist item | POST | `/api/site-inspections/:id/checklist-items` |
| Bulk add items | POST | `/api/site-inspections/:id/checklist-items/bulk` |
| Get checklist summary | GET | `/api/site-inspections/:id/checklist-summary` |
| Init clause reviews | POST | `/api/site-inspections/:id/clause-reviews/init` |
| Update clause review | PUT | `/api/clause-reviews/:id` |
| Mark clause N/A | POST | `/api/clause-reviews/:id/mark-na` |
| Get clause review summary | GET | `/api/site-inspections/:id/clause-review-summary` |
| Get building code clauses | GET | `/api/building-code/clauses` |
| Get clause hierarchy | GET | `/api/building-code/clauses/hierarchy` |
| Upload photo | POST | `/api/projects/:id/photos/base64` |

### 5. Skill Structure

```
skills/building-inspection/
  SKILL.md          # Main skill file (conversation flow + API reference)
```

The skill stays as a single SKILL.md — Kai reads it when the skill triggers. Sections:

1. **API Configuration** — base URL, auth header
2. **Onboarding Flow** — address → type → create project/inspection
3. **PPI Workflow** — checklist flow
4. **COA Workflow** — clause review flow
5. **CCC Workflow** — defect checklist flow
6. **SS Workflow** — simplified checklist flow
7. **Common Operations** — photos, status, completion
8. **Error Handling**
9. **API Reference Table**

### 6. Skill Deployment

**Sync mechanism:** A deploy script copies the skill from repo to Kai's workspace.

```bash
# scripts/deploy-skill.sh
cp skills/building-inspection/SKILL.md \
   ~/.openclaw/agents/kai/workspace/skills/building-inspection/SKILL.md
```

Run manually after merging skill changes. Future: automate via post-merge hook or CI step.

### 7. Versioning

Add a version header to SKILL.md:

```markdown
---
name: building-inspection
version: 2.0.0
description: ...
---
```

Changelog maintained in `skills/building-inspection/CHANGELOG.md`.

## Files Changed

| File | Change |
|------|--------|
| `skills/building-inspection/SKILL.md` | Complete rewrite |
| `skills/building-inspection/CHANGELOG.md` | New — version history |
| `scripts/deploy-skill.sh` | New — deployment script |

## Out of Scope

- Report generation flow (handled by existing report system)
- Photo viewing/management (future)
- Multi-inspector support (future)
- Scoped service auth (#577)

---

## Addendum: PPI Element-Level Guidance

*Added 2026-03-01 — Ref #584*

The skill must walk through specific NZS 4306:2005 elements per category rather than giving a single broad prompt. See full element structure and conversation flow below.

### Problem

Current skill gives one prompt per category (e.g. "Check roof, gutters, cladding..."). Inspector must remember everything — items get missed.

### NZS 4306:2005 Element List

**SITE:**
Site drainage · Landscaping · Fencing/gates · Paths/driveways · Retaining walls · Outbuildings · Services/utilities

**EXTERIOR — Roof:**
Roof covering · Roof structure · Gutters and downpipes · Flashings · Fascia and bargeboards

**EXTERIOR — Walls:**
Wall cladding · Cladding/wall junctions · Window/door frames and flashings · Soffits · External painting

**EXTERIOR — Foundation:**
Foundation type/condition · Subfloor structure · Subfloor moisture/ventilation · Piles/bearers/joists

**INTERIOR (per room group — living · kitchen · bedrooms · bathrooms · laundry · hallways · roof space):**
Walls and linings · Ceilings · Floors · Windows and doors · Moisture/dampness

**DECKS (if present):**
Deck structure/framing · Deck surface · Balustrades · Waterproofing/falls · Fixings to house

**SERVICES:**
Electrical (switchboard/wiring) · Plumbing (supply) · Hot water system · Drainage · Gas · Heating/ventilation · Smoke alarms · Insulation

### Conversation Flow

Kai prompts each element in turn with a short question. Inspector responds with:
- `"pass"` — records PASS, moves to next
- `"fail [note]"` — records FAIL with note
- `"skip"` — records N/A, moves to next
- `"all pass"` — marks remaining items in category as PASS
- `"done"` — moves to next category

### Skill Impact

Add element lists and loop logic to the PPI section of `SKILL.md`. Use bulk checklist endpoint for efficiency when inspector uses "all pass".
