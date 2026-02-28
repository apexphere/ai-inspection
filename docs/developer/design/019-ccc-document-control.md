# Design: CCC Executive Summary & Document Control

**Status:** Draft
**Author:** Riley
**Requirement:** #541
**Date:** 2026-02-28

## Context

Real CCC Gap Analysis reports have two sections our templates don't generate:

1. **Document Control Records** (page 2, before TOC) — revision history + acceptance sign-off
2. **Executive Summary** (after TOC, before Section 1) — key findings at a glance

These are CCC-specific — COA/PPI/SS reports do not use them.

Analysis: `docs/domain/report-analysis.md` — Type 2: CCC section.

## Decision

Add two new template sections to the CCC report template. Both can be auto-populated from existing data.

## Architecture

### 1. Document Control Records

Added after cover page, before TOC.

```
Document Control Records

Document Prepared by:
  [Author Name]
  for and on behalf of [Company Name]

  Telephone:    [Phone]
  Email:        [Email]

Revision History
| Revision No. | Prepared By | Description        | Date       |
|--------------|-------------|--------------------|------------|
| R1           | Jake Li     | First draft        | 01/12/2025 |
| R2           | Ian Fong    | Review comments    | 05/12/2025 |
| R3           | Ian Fong    | Final              | 16/12/2025 |

Document Acceptance
| Action    | Name     | Signed | Date       |
|-----------|----------|--------|------------|
| Prepared  | Jake Li  |        | 16/12/2025 |
| Reviewed  | Ian Fong |        | 16/12/2025 |
```

**Data source:** Existing report versioning data + personnel data. No new entities needed.

```typescript
interface DocumentControlData {
  preparedBy: {
    name: string;
    company: string;
    phone: string;
    email: string;
  };
  revisionHistory: {
    revisionNo: string;      // "R1", "R2", "R3"
    preparedBy: string;
    description: string;
    date: string;
  }[];
  documentAcceptance: {
    action: string;          // "Prepared", "Reviewed"
    name: string;
    signed: boolean;
    date: string;
  }[];
}
```

### 2. Executive Summary

Added after TOC, before Section 1.

Auto-generated from defect data:

```
EXECUTIVE SUMMARY

Non-invasive site investigations to the property has identified the following:

  • Roof parapet – absence of cap flashings and kick-out flashings.
  • Wall Claddings – lack of control joints / deck and ground clearance
  • Window / Door Joinery – lack of head / jamb / sill flashings
  • Sub-floor – Garage timber-framed walls in direct-contact with natural ground

The above result in a breach of Building Code clauses:
  o B1 Structure
  o B2 Durability
  o E2 External Moisture
  o F7 Warning Systems

To resolve this, [remedial recommendation summary].
```

**Data source:** Generated from defect schedule data.

```typescript
interface ExecutiveSummaryData {
  findings: string[];           // Bullet list of key findings
  breachedClauses: string[];    // ["B1 Structure", "B2 Durability", ...]
  remedialRecommendation: string; // High-level recommendation
}

// Auto-generation logic:
// 1. findings = defects grouped by area, summarised
// 2. breachedClauses = unique NZBC clauses from all defects
// 3. remedialRecommendation = from report's recommendation field
```

### Template Changes

```
api/templates/ccc/
  sections/
    00-document-control.hbs    # NEW
    00-executive-summary.hbs   # NEW
    ... (existing sections unchanged)
```

Update `base.hbs` to include new sections in render order:
1. Cover → **Document Control** → TOC → **Executive Summary** → Section 1...

### API Changes

New endpoint to set/override executive summary text:

```
PUT /api/reports/:id/executive-summary
{
  "findings": ["string"],
  "breachedClauses": ["string"],
  "remedialRecommendation": "string"
}
```

Auto-generation endpoint:
```
POST /api/reports/:id/executive-summary/generate
```
→ Generates from defect data, returns preview. Inspector can edit before finalizing.

## Dependencies

- Existing CCC templates
- Existing defect schedule data
- Existing report versioning

## Stories Breakdown

_(To be created after design approval)_

Estimated stories:
1. Create Document Control template + data mapping
2. Create Executive Summary template + auto-generation service
3. Executive Summary API (generate + override)
4. Update CCC base template render order
5. Seed Document Control boilerplate

## Alternatives Considered

**Manual-only Executive Summary** — Rejected. Can be 80% auto-generated from defect data. Manual override for the remaining 20%.

**Add Document Control to all report types** — Rejected. Only CCC uses it per industry practice. Can extend later if needed.
