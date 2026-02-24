# AI Inspection — Workflow Scenario

## Purpose

This is the **primary workflow reference** for AI Inspection. It demonstrates the complete two-phase workflow that applies to all inspection types:

1. **Phase 1 (On-Site):** WhatsApp + OpenClaw for guided data capture
2. **Phase 2 (Office):** Web interface for review, editing, and report generation

The example below uses a **COA (Certificate of Acceptance)** inspection, but the same workflow applies to PPI, CCC Gap Analysis, and other report types.

---

## Example Scenario: COA for Bathroom Renovation

**Situation:** Homeowner did a bathroom renovation in 2020 without building consent. Now selling the property and needs a COA for settlement.

**Property:** 42 Smith Street, Henderson  
**Client:** John & Jane Smith  
**Inspector:** Jake Li  
**Senior Surveyor:** Ian Fong

---

# PHASE 1: ON-SITE (WhatsApp)

Inspector Jake arrives at property with phone.

---

## 1.1 Starting the Inspection

**Jake (WhatsApp):** "Starting COA at 42 Smith Street Henderson, client John Smith, bathroom conversion"

**OpenClaw:** "Got it — COA inspection started.

**Project:** 42 Smith Street, Henderson  
**Client:** John Smith  
**Type:** COA (Certificate of Acceptance)  
**Scope:** Bathroom conversion

I'll guide you through the Building Code clauses. Let's start with **B1 Structure**.

Check:
- Wall framing (if visible)
- Any structural modifications

Send photos + notes."

---

## 1.2 Clause-by-Clause Capture

### B1 Structure

**Jake:** [sends 2 photos] "Wall framing visible through access panel, looks compliant"

**OpenClaw:** "Captured for B1:
- 2 photos
- Observation: wall framing visible, appears compliant

Need PS3 Structural? Or N/A for this scope?"

**Jake:** "N/A, no structural work done"

**OpenClaw:** "Noted — B1 N/A (no structural work). Moving to **B2 Durability**.

Check:
- Timber treatment (H3.2 for wet areas)
- Any exposed framing

Send photos if visible."

### B2 Durability

**Jake:** [sends 2 photos] "H3.2 treated timber verified on framing"

**OpenClaw:** "Captured for B2:
- 2 photos  
- Observation: H3.2 treated timber verified

Will need PS3 to confirm. Moving to **E2 External Moisture**."

### E2 External Moisture

**Jake:** "N/A - internal bathroom only, no external walls affected"

**OpenClaw:** "Noted — E2 N/A (internal bathroom only). Moving to **E3 Internal Moisture**.

Check:
- Tanking/waterproofing
- Upstands at floor junction  
- Shower base, walls
- Take moisture reading if you have meter

This is critical for bathroom COA. Send photos."

### E3 Internal Moisture

**Jake:** [sends 5 photos] "Tanking installed, upstands look OK. Taking moisture reading..."

**Jake:** "12% at shower base"

**OpenClaw:** "Captured for E3:
- 5 photos
- Observation: tanking installed, upstands OK
- Moisture reading: 12% (acceptable ✅)

Documents needed:
- PS3 Waterproofing
- Tanking warranty

Collect from owner. Moving to **G12 Water Supplies**."

### G12 Water Supplies

**Jake:** [sends 2 photos] "Copper pipes, isolation valves installed"

**OpenClaw:** "Captured for G12:
- 2 photos
- Observation: copper pipes, isolation valves

Need PS3 Plumbing. Moving to **G13 Foul Water**."

### G13 Foul Water

**Jake:** [sends 2 photos] "PVC drainage, falls look correct"

**OpenClaw:** "Captured for G13:
- 2 photos
- Observation: PVC drainage, correct falls

PS3 Plumbing covers this too. Moving to **G9 Electricity**."

### G9 Electricity

**Jake:** [sends 2 photos] "Fan, lights, power points all installed"

**OpenClaw:** "Captured for G9:
- 2 photos
- Observation: fan, lights, power points installed

Documents needed:
- Electrical CoC
- Electrical Safety Certificate (ESC)

Get from owner or electrician."

---

## 1.3 Areas Not Accessed

**OpenClaw:** "Any areas you couldn't access?"

**Jake:** "Couldn't get under floor - crawlspace too tight"

**OpenClaw:** "Noted — under-floor not accessed (crawlspace too tight). This goes in report limitations."

---

## 1.4 Finishing On-Site

**Jake:** "Done on site"

**OpenClaw:** "Good work Jake! Here's your capture summary for **42 Smith Street**:

**Clauses Reviewed:**
| Clause | Status | Photos | Docs Needed |
|--------|--------|--------|-------------|
| B1 Structure | N/A | 2 | — |
| B2 Durability | ✅ | 2 | PS3 |
| E2 External Moisture | N/A | — | — |
| E3 Internal Moisture | ✅ | 5 | PS3, Warranty |
| G9 Electricity | ✅ | 2 | CoC, ESC |
| G12 Water Supplies | ✅ | 2 | PS3 |
| G13 Foul Water | ✅ | 2 | PS3 |

**Totals:**
- 17 photos captured
- 1 measurement (moisture 12%)
- 5 documents to collect from owner

**Still needed from owner:**
- PS3 Plumbing
- PS3 Waterproofing
- Tanking warranty
- Electrical CoC
- Electrical ESC

When you're back at the office, open the web app to review and complete the report."

---

# PHASE 2: OFFICE (Web Interface)

Jake returns to office, logs into web app.

---

## 2.1 Project Review

**Dashboard shows:**
```
Project: 260219 — 42 Smith Street, Henderson
Type: COA (Certificate of Acceptance)
Client: John & Jane Smith
Status: In Progress

Captured On-Site:
├── Photos: 17
├── Clauses: 5 applicable, 2 N/A
├── Measurements: 1 (moisture 12%)
└── Areas not accessed: 1

Outstanding:
└── Documents: 5 required
```

**Expected Behavior:**
- All WhatsApp-captured data visible
- Photos organized by clause
- Observations editable
- Document checklist shows Required status

---

## 2.2 Document Upload

Owner emails the documents. Jake uploads each:

| Document | Type | Status | Linked Clause |
|----------|------|--------|---------------|
| PS3 - Plumbing | PS3 | ✅ Received | G12, G13 |
| PS3 - Waterproofing | PS3 | ⏳ Required | E3 |
| Warranty - Tanking | Warranty | ✅ Received | E3 |
| CoC - Electrical | CoC | ✅ Received | G9 |
| ESC - Electrical | ESC | ⏳ Required | G9 |

**Expected Behavior:**
- Upload via drag & drop or file picker
- Auto-detect document type from filename/content
- Auto-link to relevant clauses
- Status changes: Required → Received
- System shows: "2 documents outstanding"

---

## 2.3 Observation Editing

Jake clicks into **E3 Internal Moisture** to refine:

**Before (from WhatsApp):**
> tanking installed, upstands OK

**After (edited):**
> Tanking system (Ardex WPM 300 membrane) installed to shower walls and floor. Upstands at floor junction measured at 150mm — compliant with E3/AS1. Moisture reading at shower base: 12% (acceptable, <18% threshold). No signs of moisture damage to adjacent areas.

**Expected Behavior:**
- Original WhatsApp notes shown as starting point
- Rich text editing
- Can add/remove photo links
- Can add measurements
- Auto-save on edit

---

## 2.4 Submit for Peer Review (#157)

Jake clicks **Submit for Review**.

**System:**
- Validates all applicable clauses have observations
- Warns: "2 documents still Required — continue anyway?"
- Jake confirms (will follow up with owner)
- Status changes: **In Progress → In Review**
- Senior Surveyor Ian notified

**Expected Behavior:**
- Validation before submission
- Warning for incomplete documents (not blocking at review stage)
- Notification to reviewer
- Audit trail entry

---

## 2.5 Peer Review

**Ian (Senior Surveyor)** opens project:

Reviews each clause, adds comment on E3:
> "Need to note moisture reading location more precisely — shower base centre or perimeter?"

Clicks **Request Revision**.

**Expected Behavior:**
- Reviewer can view all captured data
- Comments linked to specific clauses
- Revision request returns to author
- Status changes: **In Review → Revision**
- Jake notified

---

## 2.6 Revision

Jake sees revision request:
- Opens E3
- Updates observation: "...Moisture reading at shower base (centre): 12%..."
- Clicks **Resubmit**

Meanwhile, owner sends remaining documents (PS3 Waterproofing, ESC).
- Jake uploads both
- All documents now Received ✅

**Expected Behavior:**
- Comment visible on clause
- Edit and resubmit flow
- Document status all green
- Status changes: **Revision → In Review**

---

## 2.7 Approval

Ian reviews again, satisfied with changes.
- All clauses have evidence
- All documents received
- Clicks **Approve**

**Expected Behavior:**
- Status changes: **In Review → Approved**
- Report ready for generation
- Jake notified

---

## 2.8 Report Generation (#149, #158)

Jake clicks **Generate Report**.

**System generates PDF:**

```
CERTIFICATE OF ACCEPTANCE REPORT

42 Smith Street, Henderson

Section 1: Report Information Summary
  - Project: 260219
  - Client: John & Jane Smith
  - Inspector: Jake Li
  - Reviewer: Ian Fong
  - Date: 19 February 2026

Section 2: Introduction
  - Engagement statement (template)
  - Purpose of assessment

Section 3: Building & Site Description
  - Property details (Lot/DP, zones)
  - Building history (1985 dwelling, no prior bathroom consent)
  - Scope: Wine cellar converted to bathroom

Section 4: Assessment Methodology
  - Personnel credentials
  - Equipment: Moisture meter, camera
  - Areas not accessed: Under-floor (crawlspace too tight)

Section 5: NZBC Code Clause Review
  | Clause | Applicable | Photos | Observations | Compliance |
  |--------|------------|--------|--------------|------------|
  | B1 | N/A | — | No structural work | — |
  | B2 | Yes | 9,10 | H3.2 treated timber | B2.3.1 |
  | E2 | N/A | — | Internal bathroom only | — |
  | E3 | Yes | 11-15 | Tanking, moisture 12% | E3/AS1 |
  | G9 | Yes | 16,17 | Electrical installed | G9.3.1 |
  | G12 | Yes | 18,19 | Copper pipes, isolation | G12.3.1 |
  | G13 | Yes | 20,21 | PVC drainage | G13.3.1 |

Section 6: Scope of Remedial Works
  - Nil

Section 7: Signatures
  - Prepared by: Jake Li
  - Reviewed by: Ian Fong (Registered Building Surveyor)

Appendix A: Inspection Photographs (17 photos)
Appendix B: Producer Statements (PS3 x2)
Appendix C: Warranties (tanking)
Appendix D: Electrical Certificates (CoC, ESC)
```

**Expected Behavior:**
- PDF generates in <30 seconds
- Cross-references work ("Photograph 11-15" links to Appendix A)
- Photos numbered sequentially
- Documents grouped by type in appendices
- Professional formatting

---

## 2.9 Council Submission (#149)

Report supports **Form 9** application:

| Form 9 Field | Source |
|--------------|--------|
| Building Code clauses satisfied | B2, E3, G9, G12, G13 |
| Qualifications | Visual inspection only |
| Limitations | Under-floor not accessed |
| Documents relied upon | PS3 x2, Warranty, CoC, ESC |

**Expected Behavior:**
- Export Form 9 summary data
- List all clauses claimed compliant
- Include inspection limitations

---

# Acceptance Criteria Checklist

## Phase 1: On-Site (WhatsApp)

| Step | Criteria | Pass/Fail |
|------|----------|-----------|
| 1.1 | Start inspection via WhatsApp with address/client/type | ☐ |
| 1.2 | OpenClaw prompts for each Building Code clause | ☐ |
| 1.2 | Capture photos via WhatsApp, stored per clause | ☐ |
| 1.2 | Capture text observations via WhatsApp | ☐ |
| 1.2 | Capture measurements (moisture reading) | ☐ |
| 1.2 | Mark clauses as N/A with reason | ☐ |
| 1.2 | OpenClaw reminds what documents to collect | ☐ |
| 1.3 | Record areas not accessed | ☐ |
| 1.4 | Show capture summary when finished | ☐ |
| 1.4 | List outstanding documents needed | ☐ |

## Phase 2: Office (Web)

| Step | Criteria | Pass/Fail |
|------|----------|-----------|
| 2.1 | View all captured data from WhatsApp | ☐ |
| 2.1 | Photos organized by clause | ☐ |
| 2.2 | Upload documents, auto-detect type | ☐ |
| 2.2 | Document status tracking (Required/Received) | ☐ |
| 2.2 | Outstanding documents flagged | ☐ |
| 2.3 | Edit observations captured on-site | ☐ |
| 2.3 | Link/unlink photos to clauses | ☐ |
| 2.4 | Submit for peer review | ☐ |
| 2.4 | Validation warns on incomplete data | ☐ |
| 2.5 | Reviewer can comment on clauses | ☐ |
| 2.5 | Request revision workflow | ☐ |
| 2.6 | Author can edit and resubmit | ☐ |
| 2.7 | Reviewer can approve | ☐ |
| 2.8 | Generate PDF with correct structure | ☐ |
| 2.8 | Cross-references resolve correctly | ☐ |
| 2.8 | Photos numbered in appendix | ☐ |
| 2.8 | PDF generation <30 seconds | ☐ |
| 2.9 | Form 9 data exportable | ☐ |

---

## Related Requirements

- #149 — COA Report Generation
- #150 — Inspection Checklist System
- #151 — Building Code Reference Data
- #152 — Document & Photo Attachments
- #154 — Project & Property Management
- #155 — Personnel & Credentials
- #157 — Report Workflow & Lifecycle
- #158 — Report Generation & Export
