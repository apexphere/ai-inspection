# Design: PPI Data Model Enrichment for NZS4306:2005

**Status:** Draft  
**Author:** Megan  
**Date:** 2026-03-02  
**References:** Example reports — 25055 (185 Henwood Rd), 26015 (3 Seaford Pl)

---

## Problem

The current data model captures inspection findings at a flat category level (SITE, EXTERIOR, INTERIOR, SERVICES) with pass/fail checklist items. Real NZS4306:2005 PPI reports require significantly richer structure:

- Room-level findings within Interior (not just "INTERIOR" as a category)
- Specialist test data: moisture readings (with meter values + locations), floor level survey, thermal imaging
- Building metadata: storeys, room count, CCC status, year built
- Weather conditions including rainfall in last 3 days
- Per-section conclusion text
- "Further investigation required" as a distinct severity/outcome
- Section-level photo groupings with specific captions (e.g. "Photograph 11 — Isolated decay in retaining wall posts")

Without this, Kai can guide an inspector through a walk but cannot produce a report that matches real PPI standards.

---

## Proposed Changes

### 1. SiteInspection — additional fields

```prisma
model SiteInspection {
  // existing fields ...
  
  // New fields
  rainfallLast3Days  Float?   // mm, e.g. 0.0
  inspectorNotes     String?  // free-form notes for report intro
  areasNotAccessed   String?  // limitations note
}
```

Weather is already partially captured (weatherConditions). Add `rainfallLast3Days`.

---

### 2. Property — building metadata fields

```prisma
model Property {
  // existing fields ...
  
  // New fields
  buildingType    String?   // e.g. "Two-Storey Residential House"
  storeys         Int?      // number of storeys
  bedrooms        Int?
  bathrooms       Int?
  cccStatus       String?   // e.g. "CCC & Title Issued", "Pre-CCC"
  // yearBuilt already exists
}
```

---

### 3. ChecklistItem — room-level support + section conclusion

Current: flat `category` + `description`.  
Proposed: add `room` (nullable) and a separate `InspectionSectionConclusion` model.

```prisma
model ChecklistItem {
  // existing fields ...
  
  // New fields
  room        String?  // e.g. "Bedroom 1", "Kitchen", "Attic" — null for exterior/site
  severity    String?  // existing: minor|major|urgent — add: "further-investigation"
}

model InspectionSectionConclusion {
  id            String         @id @default(cuid())
  inspectionId  String
  inspection    SiteInspection @relation(fields: [inspectionId], references: [id])
  section       String         // SITE | EXTERIOR | INTERIOR | SERVICES
  conclusion    String         // free text, e.g. "No obvious defects..."
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}
```

---

### 4. SpecialistTest — new model for moisture, floor survey, thermal imaging

These are distinct from checklist items. Each is a structured record tied to an inspection.

```prisma
enum SpecialistTestType {
  MOISTURE_READING
  FLOOR_LEVEL_SURVEY
  THERMAL_IMAGING
}

model SpecialistTest {
  id            String              @id @default(cuid())
  inspectionId  String
  inspection    SiteInspection      @relation(fields: [inspectionId], references: [id])
  type          SpecialistTestType
  
  // MOISTURE_READING fields
  location      String?   // e.g. "RHS bottom corner backdoor frame, Laundry"
  meterReading  Float?    // e.g. 95.0 (Trotec T660 units)
  meterModel    String?   // e.g. "Trotec T660"
  result        String?   // "dry" | "elevated" | "wet"
  
  // FLOOR_LEVEL_SURVEY fields
  maxDeviation  Float?    // mm
  conclusion    String?   // e.g. "Within acceptable tolerance"
  
  // THERMAL_IMAGING fields
  room          String?   // which room was imaged
  anomaly       Boolean?  // was an anomaly detected?
  notes         String?
  
  photoIds      String[]  // linked photo IDs
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

---

## API Changes

### New endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/site-inspections/:id/specialist-tests` | Add moisture/floor/thermal record |
| GET | `/api/site-inspections/:id/specialist-tests` | List all specialist tests |
| POST | `/api/site-inspections/:id/section-conclusions` | Set conclusion for a section |
| GET | `/api/site-inspections/:id/section-conclusions` | Get all section conclusions |

### Modified endpoints

- `PUT /api/site-inspections/:id` — accept `rainfallLast3Days`, `areasNotAccessed`
- `POST /api/properties` / `PUT /api/properties/:id` — accept `buildingType`, `storeys`, `bedrooms`, `bathrooms`, `cccStatus`
- `POST /api/site-inspections/:id/checklist-items` — accept `room`, extend `severity` enum

---

## Kai / SKILL.md Changes (after data model is built)

The SKILL.md onboarding flow gains two new phases:

**Phase A — Building info (after project confirmed):**
> "Quick building details — how many storeys? Year built? CCC issued?"

Stores to `property` fields.

**Phase B — Weather (at inspection start):**
> "Today's weather? And rainfall in the last 3 days (mm)?"

Stores to `siteInspection`.

**Interior section** changes from flat category prompts to room-by-room:
> "Moving to interior — which room are you in? Kitchen / Bedroom 1 / Bathroom..."

Each finding tagged with `room`.

**After each section**, Kai prompts for conclusion:
> "Section conclusion for Site — any defects? (or say 'no obvious defects')"

**Moisture readings** captured inline when inspector reports elevated moisture:
> "Elevated moisture — where exactly? What reading? (e.g. '95 at RHS sill, Master Bedroom')"

Creates a `SpecialistTest` of type `MOISTURE_READING`.

---

## Out of Scope (this design)

- Floor plan upload / moisture location mapping (requires UI work)
- Thermal imaging photo analysis (AI future feature)
- Report PDF template changes (separate design)

---

## Implementation Phases

### Phase 1 — Schema + API (backend)
- Prisma migration: new fields on `SiteInspection`, `Property`, `ChecklistItem`
- New models: `SpecialistTest`, `InspectionSectionConclusion`
- New API endpoints
- Unit + integration tests

### Phase 2 — Kai / SKILL.md update
- Rewrite PPI onboarding and section flows
- Add moisture reading capture inline
- Add section conclusion prompts
- Smoke test with real inspection scenario

### Phase 3 — Report template (separate)
- Update PPI PDF template to use new data
- Appendix B (moisture), C (floor survey), D (thermal) sections

---

## Open Questions for Master

1. **Room list** — should Kai prompt the inspector to list rooms at the start ("how many bedrooms?") and then walk through each, or discover rooms dynamically as the inspector walks through?
2. **Floor level survey** — is this always done for PPI, or only ground floor / multi-storey? Should Kai prompt for it or is it recorded separately?
3. **Thermal imaging** — always done? Some reports have it, some may not. Should it be optional in the flow?
4. **Building metadata** — some fields (bedrooms, bathrooms) could be pulled from BRANZ/council data or the listing. Worth scraping, or always ask Kai?
