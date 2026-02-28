# Design: PPI Report Template

**Status:** Draft
**Author:** Riley
**Requirement:** #539
**Date:** 2026-02-28

## Context

Pre-Purchase Inspection (PPI) reports follow NZS 4306:2005, not NZBC clause review. The structure is fundamentally different from COA/CCC — inspectors assess by **building element** (site → exterior → interior → services) with narrative conclusions per section, not a clause-by-clause table.

Analysis of real PPI reports (`docs/domain/report-analysis.md`) shows the Abacus/Eastern format has 11 sections + 3 appendices.

## Decision

Add a PPI report type using the existing template engine (Handlebars + Puppeteer) with PPI-specific templates. Reuse shared infrastructure (template engine, PDF renderer, photo embedder, variable substitution) but with a new template directory and section structure.

## Architecture

### Template Directory Structure

```
api/templates/ppi/
  base.hbs                    # Main layout
  cover.hbs                   # Cover page
  sections/
    01-report-info-summary.hbs
    02-introduction.hbs
    03-building-site-description.hbs
    04-inspection-methodology.hbs
    05-summary-of-inspection.hbs
    06-site-ground-condition.hbs
    07-exterior.hbs
    08-interior.hbs
    09-service-systems.hbs
    10-limitations.hbs
    11-signatures.hbs
  appendices/
    a-photos.hbs
    b-thermal-imaging.hbs
    c-floor-level-survey.hbs
  partials/
    header.hbs
    footer.hbs
    section-conclusion.hbs
```

### Data Model Changes

```prisma
// Add PPI to existing ReportType enum
enum ReportType {
  COA
  CCC
  PPI        // NEW
  SS         // NEW (for #540)
}
```

No new entities required — PPI uses the existing inspection data model. The key difference is **how the data is presented**, not what data is captured.

### PPI-Specific Template Data

The template context needs these PPI-specific fields:

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

interface PPISection {
  narrativeText: string;
  conclusion: string;       // "No obvious defects" or findings
  photoRefs: string;        // "Photograph 1~10" (range notation)
  needsAttention: boolean;
  needsFurtherInvestigation: boolean;
}
```

### Section Content Guide

| Section | Content | Data Source |
|---------|---------|-------------|
| Report Info Summary | Project #, activity ("Pre-purchase Inspection"), address, client, TA, author, inspector, date, weather | Report + Project + Personnel |
| Introduction | Engagement statement + purpose (NZS 4306:2005 reference) | Template boilerplate + variables |
| Building & Site | Site info (zones from BRANZ), building info (rooms, year, CCC status) | Property + zone data (#543) |
| Methodology | Personnel credentials, inspection approach, equipment | Personnel + template |
| Summary | Overall condition rating + key findings | Inspector input |
| Site & Ground | Topography, access paths, garden areas | Inspector narrative |
| Exterior | Roof, cladding, joinery, foundation | Inspector narrative |
| Interior | Room-by-room condition | Inspector narrative |
| Service Systems | Power, water, gas, drainage, alarms, ventilation | Inspector narrative |
| Limitations | Standard disclaimers | Template boilerplate |
| Signatures | Author signature block | Personnel |

### Photo Reference Convention

PPI uses range notation: `[ Appendix A ] Photograph 1~10`

The photo embedder needs to support this format alongside the existing comma-separated format used by COA (`Photograph 7,8,9`).

### Seed Templates

Seed the following PPI boilerplate templates:

**Introduction:**
> "[Company Name] have been engaged to carry out a pre-purchase inspection at [Property Address]. The purpose of this inspection is to independently inspect and report on the condition of the building works and findings of defects during inspection against relevant clauses of the New Zealand Standard 4306:2005 [Residential Property Inspection]."

**Limitations:**
> Standard PPI limitations text (longer than COA — covers asbestos, concealed elements, intermittent faults, etc.)

## Dependencies

- #543 (BRANZ zone data) — needed for Building & Site Description section
- Existing template engine, PDF renderer, variable substitution

## Stories Breakdown

_(To be created after design approval)_

Estimated stories:
1. Add PPI to ReportType enum + API support
2. Create PPI Handlebars templates (sections 1-11)
3. Create PPI appendix templates (photos, thermal, floor survey)
4. Add PPI section data capture API (narrative + conclusion per section)
5. Seed PPI boilerplate templates
6. Add PPI to report generation service
7. PPI photo range notation support

## Alternatives Considered

**Reuse COA template with different sections** — Rejected. The structure is too different (narrative vs table). Sharing a base template would create a mess of conditionals.

**Separate PPI inspection flow** — Rejected. PPI uses the same inspection data; only the report presentation differs. No need for a separate inspection model.
