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

### 3. FloorPlan — new model

Captures the room layout per floor, collected upfront before the interior walk. The floor plan photo is reused as the base image for moisture and floor survey maps (Appendix B/C).

```prisma
model FloorPlan {
  id            String         @id @default(cuid())
  inspectionId  String
  inspection    SiteInspection @relation(fields: [inspectionId], references: [id])
  floor         Int            // 1-based: 1 = ground/first floor
  label         String?        // e.g. "Ground Floor", "First Floor", "Third Floor"
  rooms         String[]       // e.g. ["Garage", "Storage", "Hall", "Stairs"]
  photoId       String?        // reference to uploaded floor plan photo (existing Photo model)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@unique([inspectionId, floor])
}
```

**Kai flow for floor plan collection (Step 4, after building info):**
1. *"Do you have a floor plan photo? Send it now or skip."* → uploads via existing photo API, tagged as floor plan
2. *"How many floors?"*
3. For each floor: *"Rooms on floor [N]? (e.g. Garage, Storage, Hall, Stairs)"*

The uploaded photo is stored as a project photo and referenced in `FloorPlan.photoId`. It serves as the base image for the moisture reading location map (Appendix B) and floor level survey (Appendix C).

---

### 4. ChecklistItem — room + severity alignment

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

### 5. InspectionSectionConclusion — new model

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

### 6. SpecialistTest — new model

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
| POST | `/api/site-inspections/:id/floor-plans` | Add floor plan (rooms per floor) |
| GET | `/api/site-inspections/:id/floor-plans` | Get all floor plans |
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

### Confirmed Session Flow

```
1. Inspector gives address
2. Search for existing project → reuse or create new
3. Create site inspection record
4. ★ Collect upfront data (NEW) — store to Property + SiteInspection
5. Walk inspection sections: Site → Exterior → Interior → Services
6. Specialist tests inline / at end
7. Conclude each section
8. Complete inspection
```

### Step 4 — Upfront Data Collection (new phase)

After project and inspection are created, Kai collects:

**Weather:**
> "What's the weather today? Any rainfall in the last 3 days? (mm)"

Stores `weatherConditions` + `rainfallLast3Days` on `SiteInspection`.

**Building info:**
> "Quick building details — new build or existing? How many storeys? Year built? Bedrooms / bathrooms? Parking?"

Stores `buildingType`, `storeys`, `bedrooms`, `bathrooms`, `parking` on `Property`.

**Floor plan:**
> "Do you have a floor plan photo? Send it now or skip."
> "Rooms on floor 1? (e.g. Garage, Storage, Hall)"
> "Rooms on floor 2? ..."

Stores `FloorPlan` records per floor. Photo stored as project photo, referenced in `FloorPlan.photoId`.

Only then does Kai begin the inspection sections.

### Step 5 — Interior: room-by-room (not category-level)

- Kai asks which room the inspector is in
- Each finding tagged with room name
- Moisture readings captured inline → `SpecialistTest(MOISTURE_READING)`

### Step 6 — Specialist tests

- Moisture: captured inline during interior walk
- Floor survey: prompted after interior section
- Thermal imaging: prompted after interior section

### Step 7 — Section conclusions

After each section, Kai prompts:
> *"Conclusion for [Site/Exterior/Interior/Services]? (or say 'no obvious defects')"*

Stores to `InspectionSectionConclusion`.

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

## Decisions

1. **Upfront data collection** is a mandatory phase immediately after project creation, before any inspection sections begin.
2. **Room discovery** — Kai asks for room counts upfront (bedrooms, bathrooms, rooms) and walks through each dynamically as the inspector moves through the building.
3. **Floor level survey and thermal imaging** — treated as standard PPI components; Kai prompts for both after the interior section. Inspector can skip if not conducted (noted as limitation).
