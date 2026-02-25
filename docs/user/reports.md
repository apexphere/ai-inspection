# Report System Guide

> Create, review, and export professional building inspection reports.

**Status:** Current  
**Author:** Riley  
**Date:** 2026-02-25  
**Related:** #149, #156, #157, #158

---

## Overview

After completing an inspection (via WhatsApp or the web interface), you use the report system to generate professional documents for council submission. The system supports:

- **COA Reports** — Certificate of Acceptance for unauthorized building work
- **CCC Gap Analysis** — Code Compliance Certificate gap assessments *(coming soon)*
- **PDF and DOCX export** — Professional documents ready for council or editing
- **Review workflow** — Peer review before finalization
- **Templates** — Reusable boilerplate for consistency

---

## Report Types

| Type | Use Case | When |
|------|----------|------|
| **COA** | Unauthorized work (post-1992) | Building work done without consent |
| **CCC Gap Analysis** | Consented but no CCC issued | Building has consent but never got CCC |
| **PPI** | Pre-Purchase Inspection | Property purchase assessment |
| **Safe & Sanitary** | Pre-1992 work | Older buildings needing compliance review |

---

## Creating a Report

1. Open a project in the web interface
2. Navigate to the inspection you want to report on
3. Click **Generate Report**
4. Select the report type (COA, CCC, etc.)
5. The system creates a **Draft** report

The report pulls data from your inspection — findings, photos, clause reviews, and property details.

---

## Report Workflow

Reports follow a review lifecycle before they can be submitted to council.

```
Draft → In Review → Approved → Finalized → Submitted
              ↓
           Draft (changes requested)
```

### States

| State | What's Happening | Who Acts |
|-------|-----------------|----------|
| **Draft** | Work in progress — edit content, add observations | Author |
| **In Review** | Sent to peer reviewer for checking | Reviewer |
| **Approved** | Reviewer signed off | Author |
| **Finalized** | Locked — ready for export and submission | Author |
| **Submitted** | Sent to council | Admin |

### Actions

| Action | From → To | Who Can Do It |
|--------|-----------|---------------|
| Submit for review | Draft → In Review | Author |
| Request changes | In Review → Draft | Reviewer |
| Approve | In Review → Approved | Reviewer |
| Finalize | Approved → Finalized | Author |
| Mark submitted | Finalized → Submitted | Admin |

### Review Comments

Reviewers can leave comments on specific report sections:

- Comments have a **priority** (Low, Medium, High)
- Comments have a **status** (Open, Resolved)
- Authors address comments, then resubmit for review
- All comments are tracked for audit purposes

---

## Report Validation

Before generating a PDF or DOCX, the system validates your report:

| Check | What It Verifies |
|-------|-----------------|
| Observations | All applicable clauses have observations recorded |
| Photo captions | Every photo has a caption |
| Documents | Required supporting documents are attached |
| Approval status | Report must be Approved or Finalized |
| Clause coverage | At least one clause is marked as applicable |
| Inspector | An inspector is assigned to the inspection |

If validation fails, you'll see a list of issues to fix before generating.

---

## Templates and Boilerplate

The system includes pre-built templates for common report sections:

### Standard Templates

| Template | Content |
|----------|---------|
| **Introduction** | Engagement statement, purpose of inspection |
| **Methodology** | How the assessment was conducted |
| **Limitations** | Standard disclaimers and scope boundaries |

### Variable Substitution

Templates use `[Variable Name]` placeholders that automatically fill with real data:

| Variable | Example Value |
|----------|--------------|
| `[Company Name]` | Abacus Building Consulting Limited |
| `[Property Address]` | 45 Oak Avenue, Takapuna |
| `[Client Name]` | John Smith |
| `[Inspector Name]` | Ian Fong |
| `[Inspection Date]` | 25 February 2026 |
| `[Territorial Authority]` | Auckland Council |
| `[Job Number]` | ABC-2026-001 |

You don't need to type these — the system fills them from your project and inspection data.

### Custom Templates

You can create your own templates for sections you use frequently. Each template specifies:

- **Name** — What it's called
- **Report type** — Which report types it applies to (or all)
- **Content** — The text with `[Variable]` placeholders
- **Variables used** — Which placeholders are in the content

---

## COA Report Structure

A Certificate of Acceptance report has 7 sections plus appendices:

| Section | Content |
|---------|---------|
| **1. Report Summary** | Project details, personnel, dates |
| **2. Introduction** | Engagement statement, purpose |
| **3. Building Description** | Property details, building history, site data |
| **4. Methodology** | Assessment approach, documents reviewed |
| **5. Clause Review** | Building Code compliance — clause by clause |
| **6. Remedial Works** | Required fixes (if any) |
| **7. Signatures** | Author and reviewer sign-off |

### Appendices

| Appendix | Content |
|----------|---------|
| **A — Photos** | Inspection photos with captions and references |
| **B — Drawings** | Floor plans, site plans |
| **C — Reports** | Supporting technical reports |
| **D — Certificates** | Producer statements, test certificates |

### Clause Review (Section 5)

This is the core of a COA report. For each Building Code clause:

| Field | Description |
|-------|-------------|
| **NZBC Clause** | e.g., B1 Structure, E2 External Moisture |
| **Applicability** | Applicable or N/A (with reason) |
| **Observation** | What was found during inspection |
| **Evidence** | Photo references |

Common clauses: B1 (Structure), B2 (Durability), E2 (External Moisture), E3 (Internal Moisture), G1 (Personal Hygiene), G12 (Water Supply), G13 (Foul Water).

---

## Exporting Reports

### PDF

- Professional A4 format with company branding
- Cover page with project details
- Auto-generated Table of Contents
- Page numbers and job number in footer
- Photos embedded in appendices
- Clickable cross-references

Click **Download PDF** to get the file.

### DOCX (Word)

- Same content as PDF but editable in Microsoft Word
- Styled headings and tables
- Photos embedded
- Useful for making final edits before submission

Click **Download DOCX** to get the file.

### Image Handling

Photos are automatically:
- Resized to fit the page (max 1200×900)
- Compressed to keep file sizes manageable (max 1MB each, 80% JPEG quality)
- Captioned with your descriptions
- Numbered sequentially ("Photograph 1", "Photograph 2", etc.)

---

## Report Versioning

Reports track versions automatically:

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| R1 | 13/02/26 | Jake Li | First draft |
| R2 | 15/02/26 | Ian Fong | Review comments addressed |
| R3 | 16/02/26 | Ian Fong | Final |

Each time you regenerate after edits, the version increments. The version history appears in the report's Document Control section.

---

## Form 9 Export

For COA reports, you can export **Form 9** data for council submission. Form 9 is the Certificate of Acceptance application form.

The export extracts:

| Part | Data Source |
|------|------------|
| **A — Applicant** | Client details |
| **B — Building work** | Project and property data |
| **C — Compliant clauses** | From clause reviews |
| **D — Limitations** | From inspection notes |
| **E — Supporting documents** | From project documents |
| **F — Inspection details** | From site inspection |

Click **Export Form 9** on an approved report to download the structured data.

---

## Audit Trail

Every action on a report is logged:

- Who made the change
- What changed (before/after)
- When it happened

This provides a compliance trail for council and professional accountability.

---

## Tips

- **Validate before generating** — Fix issues early rather than regenerating multiple times
- **Use templates** — Consistent language across reports looks professional
- **Review photos** — Ensure captions are clear and photos are linked to the right clauses
- **Complete the review** — Don't skip peer review; councils expect it

---

## See Also

- [Getting Started](getting-started.md) — Overall introduction
- [Inspector Workflow](inspector-workflow.md) — WhatsApp field guide
- [Web UI Guide](web-ui.md) — Using the web interface
