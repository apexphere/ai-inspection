# Design: PPI Report Template

**Status:** Approved (updated 2026-03-01 after code review)
**Author:** Riley
**Requirement:** #539
**Date:** 2026-02-28

## Context

Pre-Purchase Inspection (PPI) reports follow NZS 4306:2005, not NZBC clause review. The structure is fundamentally different from COA/CCC — inspectors assess by **building element** (site → exterior → interior → services) with narrative conclusions per section, not a clause-by-clause table.

Analysis of real PPI reports (`docs/domain/report-analysis.md`) shows the Abacus/Eastern format has 11 sections + 3 appendices.

## Current State

**PPI already exists in the codebase:**
- `PPI` is in the `ReportType` enum (Prisma schema)
- `api/templates/ppi/` has 8 sections, cover, base, CSS, and photo appendix
- Template engine is **generic** — `renderReport({reportType: 'ppi', data})` loads from `api/templates/ppi/`

### Existing Template Files
```
api/templates/ppi/
  base.hbs                           # ✅ exists
  cover.hbs                          # ✅ exists
  styles/report.css                  # ✅ exists
  appendices/photos.hbs              # ✅ exists
  sections/
    01-executive-summary.hbs         # ✅ exists (report info summary)
    02-introduction.hbs              # ✅ exists (NZS 4306:2005 reference)
    03-site-ground.hbs               # ✅ exists
    04-exterior.hbs                  # ✅ exists
    05-interior.hbs                  # ✅ exists
    06-services.hbs                  # ✅ exists
    07-conclusions.hbs               # ✅ exists
    08-signatures.hbs                # ✅ exists
```

### What's Missing (vs real PPI reports)
1. **Building & Site Description** — property details, zone data, building info (bedrooms, year built, CCC status)
2. **Inspection Methodology** — personnel credentials, approach, equipment
3. **Limitations** — standard PPI disclaimers (asbestos, concealed elements, intermittent faults)
4. **Appendix B — Thermal Imaging** — infrared results
5. **Appendix C — Floor Level Survey** — laser level measurements

## Decision

Add the 3 missing sections and 2 missing appendices. Renumber existing sections to accommodate.

## Architecture

### Template Engine Behaviour
The engine (`api/src/services/template-engine.ts`) is generic:
- Loads `api/templates/{reportType}/base.hbs` as main layout
- Loads all `.hbs` files from `sections/` in **alphabetical sort order** → injected into `{{{sections}}}`
- Loads all `.hbs` files from `appendices/` in **alphabetical sort order** → injected into `{{{appendixContent}}}`
- Optional `document-control.hbs` at root → rendered before TOC as `{{{documentControlHtml}}}`
- Shared partials from `api/templates/partials/` (header, footer)
- Optional `styles/report.css` → injected as `{{{css}}}`

### Files to Change

**Add new section templates:**
- `api/templates/ppi/sections/03-building-site.hbs` (new)
- `api/templates/ppi/sections/04-methodology.hbs` (new)
- `api/templates/ppi/sections/10-limitations.hbs` (new)

**Renumber existing sections:**
- `03-site-ground.hbs` → `05-site-ground.hbs`
- `04-exterior.hbs` → `06-exterior.hbs`
- `05-interior.hbs` → `07-interior.hbs`
- `06-services.hbs` → `08-services.hbs`
- `07-conclusions.hbs` → `09-conclusions.hbs`
- `08-signatures.hbs` → `11-signatures.hbs`

**Add appendix templates:**
- `api/templates/ppi/appendices/b-thermal-imaging.hbs` (new)
- `api/templates/ppi/appendices/c-floor-level-survey.hbs` (new)

**Final section order:**
```
sections/
  01-executive-summary.hbs      # existing
  02-introduction.hbs           # existing
  03-building-site.hbs          # NEW
  04-methodology.hbs            # NEW
  05-site-ground.hbs            # renamed from 03
  06-exterior.hbs               # renamed from 04
  07-interior.hbs               # renamed from 05
  08-services.hbs               # renamed from 06
  09-conclusions.hbs            # renamed from 07
  10-limitations.hbs            # NEW
  11-signatures.hbs             # renamed from 08
```

### PPI-Specific Template Data

```typescript
interface PPITemplateData {
  // Report metadata (shared)
  reportInfo: ReportInfoSummary;

  // Building info (PPI-specific additions)
  buildingInfo: {
    bedrooms: number;
    bathrooms: number;
    yearBuilt: number;
    cccStatus: string;    // "CCC & Title Issued" | "No CCC" | etc.
    garaging: string;
  };

  // Section assessments (PPI-specific structure)
  sections: {
    siteAndGround: PPISection;
    exterior: PPISection;
    interior: PPISection;
    serviceSystems: PPISection;
  };

  // Overall condition (PPI-specific)
  overallCondition: 'above-average' | 'average' | 'below-average';
  summaryText: string;

  // Appendices
  thermalImaging?: ThermalImage[];
  floorLevelSurvey?: FloorLevelData;
}
```

### Photo Reference Convention

PPI uses range notation: `[ Appendix A ] Photograph 1~10`

The photo embedder needs to support this format alongside the existing comma-separated format used by COA (`Photograph 7,8,9`).

## Dependencies

- #543 (BRANZ zone data) — needed for Building & Site Description section

## Stories

| # | Story | Status |
|---|-------|--------|
| ~~#548~~ | ~~Add PPI to ReportType enum~~ | Closed — already exists |
| #549 | Add missing PPI sections (building/site, methodology, limitations) | Ready |
| #550 | Add thermal imaging + floor survey appendices | Ready |
| #551 | Seed PPI boilerplate templates | Ready |

## Alternatives Considered

**Reuse COA template with different sections** — Rejected. The structure is too different (narrative vs table). Sharing a base template would create a mess of conditionals.

**Separate PPI inspection flow** — Rejected. PPI uses the same inspection data; only the report presentation differs.
