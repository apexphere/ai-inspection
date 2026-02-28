# Design: Safe & Sanitary Report Template

**Status:** Draft
**Author:** Riley
**Requirement:** #540
**Date:** 2026-02-28

## Context

Safe & Sanitary (SS) reports assess pre-1992 building work against Building Act 1991 s.64 — not NZBC clauses. The report determines:
1. Is the building **unsafe** (s.64(1))? — likely to cause injury/death
2. Is the building **insanitary** (s.64(4))? — offensive, damp, no potable water, inadequate facilities

SS reports are the simplest type (10–20 pages). They share boilerplate with COA but use a different assessment framework.

Analysis: `docs/domain/report-analysis.md` — Type 4: SS section.

## Decision

Add an SS report type using the existing template engine. Shares many partials with COA (cover, intro, limitations, signatures) but has its own assessment framework table template.

## Architecture

### Template Directory Structure

```
api/templates/ss/
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
    a-photos.hbs
  partials/
    header.hbs
    footer.hbs
```

### Data Model Changes

```prisma
enum ReportType {
  COA
  CCC
  PPI
  SS        // NEW
}
```

### Assessment Framework Table

The core of SS reports — a table assessing building elements against s.64:

```typescript
interface SSAssessmentItem {
  // Building element group
  items: string;              // "Foundation", "Walls", "Roof", "Joinery", etc.
  details: string;            // "Raised Perimeter Block Wall and Post and Pier Foundation"

  // Assessment
  photoRefs: string;          // "Photograph 5,6,7,8,9,10,11"
  observations: string;       // Detailed observations
  complianceRequirement: string; // Building Act 1991 s.64(1) or s.64(4) text
  remedialWorks: string;      // "Nil" or specific works

  // Classification
  assessmentType: 'safety' | 'sanitary';
}

interface SSTemplateData {
  reportInfo: ReportInfoSummary;
  buildingInfo: SSBuildingInfo;
  assessmentItems: SSAssessmentItem[];

  // Conclusions
  isSafe: boolean;
  isSanitary: boolean;
  summaryText: string;
  remedialWorksNeeded: boolean;
  remedialWorksSummary: string;
}

interface SSBuildingInfo {
  buildingType: string;       // "Townhouse"
  buildingYear: number;       // 1969
  climateZone: string;
  earthquakeZone: string;
  exposureZone: string;
  windZone: string;
  rainfallRange: string;
}
```

### Safety vs Sanitary Assessment

The assessment table is split into two blocks:

**Safety (s.64(1)):** Foundation, Walls, Roof, Joinery, Block Party Wall, Smoke Alarms
> "Based on the on-site visual inspection... no apparent unsafe conditions were observed. Considering the building has been in safe service for over [X] years, it is concluded that the building does not meet the definition of an unsafe building under Building Act 1991, Section 64(1)."

**Sanitary (s.64(4)):** Shower, Vanity, Bath, Toilet, Kitchen Sink, Hot Water, Drainage, Ventilation
> "As observations and analysis above, it is concluded that the building does not meet the definition of an insanitary building under Building Act 1991, Section 64(4)."

### Shared Partials

Reuse from COA where text is identical:
- Cover page layout (shared partial, different title)
- Report Information Summary format
- Limitations boilerplate
- Signature block format
- Photo appendix format

### Seed Templates

**Introduction:**
> "[Company Name] have been engaged to carry out an independent assessment of the building works carried out before 1 July 1992 at [Property Address] to verify on reasonable grounds that the building work is safe and sanitary for its intended purpose."

**Summary (pass):**
> "Following review of site works and comparing with compliance requirement, it is concluded that the building of [Property Address] is in Safe and Sanitary condition."

**Summary (fail):**
> "Following review of site works, remedial works are required to bring the building into safe and sanitary condition as outlined in Section [X]."

## Dependencies

- #543 (BRANZ zone data) — needed for building info
- Shared partials from COA templates

## Stories Breakdown

_(To be created after design approval)_

Estimated stories:
1. Add SS to ReportType enum + API support
2. Create SS Handlebars templates (sections 1-9)
3. Create SS assessment framework data capture API
4. Seed SS boilerplate templates
5. Add SS to report generation service

## Alternatives Considered

**Reuse COA assessment table** — Rejected. COA assesses against NZBC clauses; SS assesses against Building Act 1991 s.64. Different columns, different compliance text.

**Merge with COA as "compliance report"** — Rejected. SS is specifically for pre-1992 work and uses a different legal framework. Merging would confuse the user.
