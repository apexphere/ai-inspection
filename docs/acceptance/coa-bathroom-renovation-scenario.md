# Working Scenario: COA Report for Unauthorized Bathroom Renovation

## Purpose
End-to-end acceptance test scenario demonstrating system workflow for Certificate of Acceptance (COA) report generation.

---

## Scenario Background

**Situation:** Homeowner did a bathroom renovation in 2020 without building consent. Now selling the property and needs a COA for settlement.

---

## 1. Project Setup (#154)

**User Action:** Admin creates new project

**System Input:**
```
Job Number:          260219
Property:            42 Smith Street, Henderson
Client:              John & Jane Smith
Type:                COA (Certificate of Acceptance)
Territorial Authority: Auckland Council
```

**Expected Behavior:**
- System creates project record
- Building history shows original 1985 dwelling
- No prior consents for bathroom work displayed
- Project status: `Draft`

---

## 2. Site Inspection (#150)

**User Action:** Inspector arrives on-site with tablet, opens project

### 2.1 Equipment & Methodology

**System Captures:**
| Field | Value |
|-------|-------|
| Equipment used | Moisture meter, camera, borescope |
| Areas inspected | Bathroom, adjacent bedroom wall |
| Areas NOT accessed | Under-floor (crawlspace too tight) |

### 2.2 Clause Review Mode

For each applicable Building Code clause:

| Clause | Applicable? | Photos | Observations | Docs Needed |
|--------|-------------|--------|--------------|-------------|
| B1 Structure | ✅ | 7, 8 | Wall framing visible, appears compliant | - |
| B2 Durability | ✅ | 9, 10 | H3.2 treated timber verified | PS3 |
| E2 External Moisture | N/A | - | Internal bathroom only | - |
| E3 Internal Moisture | ✅ | 11-15 | Tanking installed, upstands OK | Warranty |
| G12 Water Supplies | ✅ | 16, 17 | Copper pipes, isolation valves | PS3 |
| G13 Foul Water | ✅ | 18, 19 | PVC drainage, correct falls | PS3 |

**Expected Behavior:**
- Each clause row is editable
- Photos can be linked by number
- Observations field supports free text
- Documents needed flags items for collection

---

## 3. Document Collection (#152)

**User Action:** Inspector/Admin uploads supporting documents

| Document | Status | Verified |
|----------|--------|----------|
| PS3 - Plumbing | ✅ Received | ✅ |
| PS3 - Waterproofing | ⏳ Required | - |
| Warranty - Tanking | ✅ Received | ✅ |
| CoC - Electrical | ✅ Received | ✅ |
| ESC - Electrical | ⏳ Required | - |

**Expected Behavior:**
- System flags: **2 documents outstanding**
- Cannot proceed to final report until all required docs received
- Document status: `Required` / `Received` / `Outstanding` / `N/A`

---

## 4. Report Generation (#149, #158)

### 4.1 Submit for Peer Review (#157)

**User Action:** Inspector completes clause review, submits for peer review

**Expected Behavior:**
- Report status changes to `In Review`
- Senior Surveyor notified

### 4.2 Peer Review

**Senior Surveyor Actions:**
- Checks all clauses have evidence
- Adds comment: "Need moisture reading at shower base"
- Returns for revision

**Expected Behavior:**
- Report status changes to `Revision Required`
- Comment attached to report
- Inspector notified

### 4.3 Revision

**Inspector Actions:**
- Adds moisture reading (12% - acceptable)
- Resubmits

**Expected Behavior:**
- Moisture reading captured in E3 observations
- Report status changes back to `In Review`

### 4.4 Approval

**Senior Surveyor Action:** Approves report

**Expected Behavior:**
- Report status changes to `Approved`
- Ready for PDF generation

---

## 5. Final Output (#158)

**User Action:** Generate PDF report

**Expected Output Structure:**
```
CERTIFICATE OF ACCEPTANCE REPORT

42 Smith Street, Henderson

Section 1: Introduction
Section 2: Building Description
Section 3: Scope of Assessment
Section 4: Assessment Methodology
Section 5: Clause Review (table with all clauses)
Section 6: Recommendations

Appendix A: Photographs (19 photos)
Appendix B: Producer Statements
Appendix C: Warranties
Appendix D: Electrical Certificates
```

**Expected Behavior:**
- Cross-references work: "Photograph 11-15" in E3 row links to Appendix A
- Photos auto-numbered in appendix order
- Documents grouped by type in appendices
- PDF generation < 30 seconds

---

## 6. Council Submission

**Report supports Form 9 application:**

| Field | Value |
|-------|-------|
| Clauses claimed | E3, G12, G13 |
| Evidence attached | ✅ |
| Surveyor sign-off included | ✅ |

---

## Acceptance Criteria Summary

| Step | Criteria | Pass/Fail |
|------|----------|-----------|
| 1 | Project created with all required fields | ☐ |
| 2 | Inspection captures equipment, areas, limitations | ☐ |
| 2 | Clause review allows photo linking | ☐ |
| 2 | Clause review captures observations | ☐ |
| 3 | Document status tracking works | ☐ |
| 3 | Outstanding documents flagged | ☐ |
| 4 | Peer review workflow functions | ☐ |
| 4 | Comments attach to report | ☐ |
| 4 | Revision cycle works | ☐ |
| 5 | PDF generates with correct structure | ☐ |
| 5 | Cross-references resolve correctly | ☐ |
| 5 | Photos numbered in appendix | ☐ |
| 6 | Form 9 data exportable | ☐ |

---

## Related Requirements

- #149 — COA Report Generation
- #150 — Inspection Checklist System
- #152 — Document & Photo Attachments
- #154 — Project & Property Management
- #157 — Report Workflow & Lifecycle
- #158 — Report Generation & Export
