# Design: Safe & Sanitary Report Template

**Status:** Approved (updated 2026-03-01 after code review)
**Author:** Riley
**Requirement:** #540
**Date:** 2026-02-28

## Context

Safe & Sanitary (SS) reports assess pre-1992 building work against Building Act 1991 s.64 — not NZBC clauses. The report determines:
1. Is the building **unsafe** (s.64(1))? — likely to cause injury/death
2. Is the building **insanitary** (s.64(4))? — offensive, damp, no potable water, inadequate facilities

SS reports are the simplest type (10–20 pages). They share boilerplate with COA but use a different assessment framework.

Analysis: `docs/domain/report-analysis.md` — Type 4: SS section.

## Current State

**`SAFE_SANITARY` already exists in the `ReportType` enum** but no templates exist yet. The template engine will look for `api/templates/safe_sanitary/` (needs verification — check how the enum value maps to directory name in `renderReport()`).

## Decision

Create a full SS template directory. Shares some styling with COA but has its own assessment framework table.

## Architecture

### Template Engine Behaviour
The engine (`api/src/services/template-engine.ts`) is generic:
- `renderReport({reportType, data})` loads templates from `api/templates/{reportType}/`
- `reportType` string maps to directory name — **verify** whether `SAFE_SANITARY` maps to `safe_sanitary` or something else in the calling code
- Sections loaded alphabetically from `sections/`
- Appendices loaded alphabetically from `appendices/`
- Shared partials from `api/templates/partials/`

### Files to Create

```
api/templates/safe_sanitary/     # verify directory name against enum mapping
  base.hbs
  cover.hbs
  sections/
    01-report-info-summary.hbs
    02-introduction.hbs
    03-building-site-description.hbs
    04-assessment-methodology.hbs
    05-assessment-framework.hbs    # Core — unique to SS
    06-remedial-works.hbs
    07-summary.hbs
    08-limitations.hbs
    09-signatures.hbs
  appendices/
    photos.hbs
  styles/
    report.css
```

### Assessment Framework Table (Core of SS)

The key section — a table assessing building elements against Building Act 1991 s.64:

```typescript
interface SSAssessmentItem {
  items: string;              // "Foundation", "Walls", "Roof", etc.
  details: string;            // "Raised Perimeter Block Wall and Post and Pier Foundation"
  photoRefs: string;          // "Photograph 5,6,7"
  observations: string;       // Detailed observations
  complianceRequirement: string; // Building Act 1991 s.64(1) or s.64(4) text
  remedialWorks: string;      // "Nil" or specific works
  assessmentType: 'safety' | 'sanitary';
}

interface SSTemplateData {
  reportInfo: ReportInfoSummary;
  buildingInfo: SSBuildingInfo;
  assessmentItems: SSAssessmentItem[];
  isSafe: boolean;
  isSanitary: boolean;
  summaryText: string;
  remedialWorksNeeded: boolean;
  remedialWorksSummary: string;
}
```

### Safety vs Sanitary Assessment

The table is split into two blocks:

**Safety (s.64(1)):** Foundation, Walls, Roof, Joinery, Block Party Wall, Smoke Alarms
**Sanitary (s.64(4)):** Shower, Vanity, Bath, Toilet, Kitchen Sink, Hot Water, Drainage, Ventilation

### Seed Templates

**Introduction:**
> "[Company Name] have been engaged to carry out an independent assessment of the building works carried out before 1 July 1992 at [Property Address] to verify on reasonable grounds that the building work is safe and sanitary for its intended purpose."

**Summary (pass):**
> "Following review of site works and comparing with compliance requirement, it is concluded that the building of [Property Address] is in Safe and Sanitary condition."

**Limitations:**
> Same boilerplate as COA (identical text per real report analysis).

## Dependencies

- #543 (BRANZ zone data) — needed for building info
- Shared partials from `api/templates/partials/`

## Stories

| # | Story | Status |
|---|-------|--------|
| ~~#552~~ | ~~Add SS to ReportType enum~~ | Closed — already exists |
| #553 | Create SS Handlebars templates (full set) | Ready |
| #554 | Seed SS boilerplate templates | Ready |

## Alternatives Considered

**Reuse COA assessment table** — Rejected. COA assesses against NZBC clauses; SS assesses against Building Act 1991 s.64. Different columns, different compliance text.

**Merge with COA as "compliance report"** — Rejected. SS is specifically for pre-1992 work and uses a different legal framework.
