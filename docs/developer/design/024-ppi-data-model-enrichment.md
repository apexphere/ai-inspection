# Design: PPI Data Model Enrichment for NZS4306:2005

**Status:** Draft  
**Author:** Megan  
**Date:** 2026-03-02  
**References:** Example reports — 25055 (185 Henwood Rd), 26015 (3 Seaford Pl)

---

## Real PPI Workflow (NZS4306:2005)

This is the authoritative description of what a PPI inspection captures, derived from real reports.

### Data Collected Upfront (before inspection starts)

- Property address, client name
- Weather conditions, rainfall in last 3 days (mm)
- BRANZ zone data: Climate Zone, Earthquake Zone, Exposure Zone, Lee Zone, Rainfall Range, Wind Region, Wind Zone
- Building info: type (new/existing), storeys, year built, bedrooms, bathrooms, rooms, parking

### Inspection Sections (NZS4306:2005 order)

1. **Site & Ground** — topography, boundaries, retaining walls, fencing, access paths, driveways, garden/landscaping
2. **Exterior** — roof (type, condition, flashings, gutters), cladding (type, condition, penetrations, sealants), joinery (glazing type, hardware, restrictors), foundation
3. **Interior** — room-by-room: floors, walls, ceilings, doors, windows, moisture readings, attic
4. **Services** — power, internet, water supply (potable/non-potable), hot water, gas, drainage, security, smoke alarms, ventilation, heat pump, stormwater

### Specialist Tests (recorded separately as Appendices)

- **Appendix B** — Non-invasive moisture testing: meter readings + floor plan location map
- **Appendix C** — Floor level laser survey: measurements per room/area
- **Appendix D** — Infrared thermal imaging: room by room

### Per Finding

Each finding records:
- What was observed (specific, technical description)
- Severity: `immediate-attention` | `further-investigation` | `monitor` | `no-action`
- Photo reference numbers
- Conclusion per section (free text summary)

---

## Problem

The current data model does not support this workflow:

| Required | Current State |
|----------|--------------|
| Weather + rainfall last 3 days | ❌ Weather string only, no rainfall |
| Building info (type, storeys, rooms, parking) | ❌ Only `yearBuilt` on Property |
| BRANZ zone data | ✅ Already on Property |
| Room-level interior findings | ❌ Category-level only (e.g. "INTERIOR") |
| Severity: immediate-attention / further-investigation / monitor / no-action | ❌ Only minor/major/urgent |
| Conclusion text per section | ❌ Not stored |
| Moisture readings (meter value + location) | ❌ Not stored |
| Floor level survey measurements | ❌ Not stored |
| Thermal imaging results (room by room) | ❌ Not stored |
| Photo reference linked to specific finding | ⚠️ Photos exist but not linked to checklist items |

---

## Proposed Schema Changes

### 1. Property — building info fields

```prisma
model Property {
  // existing fields unchanged ...

  // New: building info
  buildingType  String?   // e.g. "Two-Storey Residential House (New)", "Three-Storey (1990)"
  storeys       Int?
  bedrooms      Int?
  bathrooms     Int?
  rooms         String?   // free text: "Family 1, Dining 1, Kitchen 1, WC 1"
  parking       String?   // e.g. "Single Garaging", "Garage + off street"
}
```

### 2. SiteInspection — weather enrichment

```prisma
model SiteInspection {
  // existing fields unchanged ...

  // New
  rainfallLast3Days  Float?   // mm
  areasNotAccessed   String?  // limitations note for report
}
```

### 3. ChecklistItem — room + severity alignment

```prisma
model ChecklistItem {
  // existing fields unchanged ...

  // New
  room      String?  // e.g. "Bedroom 1", "Kitchen", "Attic" — null for site/exterior/services
  
  // severity enum extended:
  // existing: minor | major | urgent
  // add:      immediate-attention | further-investigation | monitor | no-action
}
```

### 4. InspectionSectionConclusion — new model

```prisma
model InspectionSectionConclusion {
  id            String         @id @default(cuid())
  inspectionId  String
  inspection    SiteInspection @relation(fields: [inspectionId], references: [id])
  section       String         // SITE | EXTERIOR | INTERIOR | SERVICES
  conclusion    String         // e.g. "No obvious defects were noted. No requirement of immediate attention."
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@unique([inspectionId, section])
}
```

### 5. SpecialistTest — new model

Covers all three appendices (moisture, floor survey, thermal imaging).

```prisma
enum SpecialistTestType {
  MOISTURE_READING     // Appendix B
  FLOOR_LEVEL_SURVEY   // Appendix C
  THERMAL_IMAGING      // Appendix D
}

model SpecialistTest {
  id            String             @id @default(cuid())
  inspectionId  String
  inspection    SiteInspection     @relation(fields: [inspectionId], references: [id])
  type          SpecialistTestType

  // MOISTURE_READING
  location      String?   // e.g. "RHS bottom corner, backdoor sill, Laundry"
  meterReading  Float?    // e.g. 95.0 (Trotec T660 scale 0–200)
  meterModel    String?   // e.g. "Trotec T660"
  result        String?   // "dry" | "elevated" | "wet"

  // FLOOR_LEVEL_SURVEY
  area          String?   // e.g. "Ground Floor", "1st Floor"
  maxDeviation  Float?    // mm
  withinTolerance Boolean?

  // THERMAL_IMAGING
  room          String?   // room imaged
  anomalyFound  Boolean?
  anomalyNotes  String?

  // shared
  conclusion    String?
  photoIds      String[]
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
| PUT | `/api/site-inspections/:id/specialist-tests/:tid` | Update a specialist test |
| POST | `/api/site-inspections/:id/section-conclusions` | Set/update conclusion for a section |
| GET | `/api/site-inspections/:id/section-conclusions` | Get all section conclusions |

### Modified endpoints

- `PUT /api/site-inspections/:id` — accept `rainfallLast3Days`, `areasNotAccessed`
- `POST /api/properties` / `PUT /api/properties/:id` — accept `buildingType`, `storeys`, `bedrooms`, `bathrooms`, `rooms`, `parking`
- `POST /api/site-inspections/:id/checklist-items` — accept `room`; extend severity values

---

## Kai / SKILL.md Changes (Phase 2 — after data model ships)

**Onboarding additions:**

1. After address confirmed → collect building info:
   > "Quick building details — new or existing? How many storeys, bedrooms, bathrooms? Parking?"

2. At inspection start → collect weather:
   > "Weather today? Rainfall in last 3 days (mm)?"

**Interior section:**
- Walk room by room, not category-level
- Each finding tagged with room name
- Prompt: *"Which room? Findings for [room]?"*

**After each section:**
- Prompt for conclusion text
- Prompt: *"Section conclusion for [Site/Exterior/Interior/Services]?"*

**Moisture readings** — captured inline during interior walk:
- When inspector reports elevated moisture → create `SpecialistTest(MOISTURE_READING)`
- Prompt: *"Where exactly? Meter reading?"*

**Specialist tests** — prompted at appropriate points:
- After interior: *"Floor level survey done? Results?"*
- After interior: *"Thermal imaging done? Any anomalies?"*

---

## Implementation Phases

### Phase 1 — Schema + API
- Prisma migration
- New models: `SpecialistTest`, `InspectionSectionConclusion`
- New fields on `Property`, `SiteInspection`, `ChecklistItem`
- New API endpoints
- Unit + integration tests

### Phase 2 — Kai / SKILL.md
- Rewrite PPI flow in SKILL.md
- Room-by-room interior guidance
- Moisture / conclusion prompts
- Smoke test with real scenario

### Phase 3 — Report Template (separate design)
- Update PPI PDF template to use new fields
- Appendix B (moisture table), C (floor survey), D (thermal imaging)

---

## Open Questions for Master

1. **Room discovery** — should Kai ask for the room list upfront ("how many bedrooms?") and walk through each in order, or let the inspector name rooms dynamically as they walk?
2. **Floor level survey** — always required for PPI, or only when relevant (e.g. ground floor slab, multi-storey)?
3. **Thermal imaging** — always done, or optional per job?
