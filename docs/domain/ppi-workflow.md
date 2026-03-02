# Pre-Purchase Inspection (PPI) Workflow

**Standard:** NZS4306:2005 — Residential Property Inspection  
**Inspection Type:** Visual + non-invasive  
**Purpose:** Independently inspect and report on building condition for a prospective purchaser

---

## 0. Session Flow

This is the sequence Kai follows for every PPI. Steps are sequential — do not skip.

```
1. Inspector gives address
        ↓
2. Search for existing project (GET /api/projects?address=...)
        ↓
3a. Existing project found → confirm with inspector, reuse it
3b. Nothing found → create property → create client → create project
        ↓
4. Collect upfront data (weather, rainfall, building info)
   Store to: Property + SiteInspection
        ↓
5. Create site inspection record
        ↓
6. Walk through inspection sections in order:
   Site & Ground → Exterior → Interior (room-by-room) → Services
        ↓
7. Record specialist tests:
   Moisture readings (inline during interior) → Floor survey → Thermal imaging
        ↓
8. Conclude each section (free text summary)
        ↓
9. Complete inspection
```

---

## 1. Data Collected Upfront

Before the inspection begins, capture:

| Data | Notes |
|------|-------|
| Property address | Full street address |
| Client name | Purchaser |
| Inspector name | Must be qualified building surveyor (NZIBS member) |
| Date of inspection | |
| Weather conditions | e.g. Fine, Overcast, Rain |
| Rainfall last 3 days | mm — affects stormwater and moisture test reliability |
| **BRANZ zone data** | |
| → Climate Zone | |
| → Earthquake Zone | |
| → Exposure Zone | |
| → Lee Zone | |
| → Rainfall Range | |
| → Wind Region | |
| → Wind Zone | |
| **Building info** | |
| → Type | e.g. "Two-Storey Residential House (New 2025)" |
| → Storeys | Number of floors |
| → Year built | |
| → Bedrooms | |
| → Bathrooms | |
| → Parking | e.g. "Single Garaging", "Garage + off street" |
| **Floor plan** | The spatial anchor for the entire inspection |
| → Photo | Inspector uploads floor plan image — base for all appendix maps |
| → Room list per floor | e.g. Floor 1: Garage, Storage, Hall · Floor 2: Bedroom 1, Bathroom... |

> **Why the floor plan matters:** Every finding, photo, moisture reading, and measurement is anchored to a room on the floor plan. The report is generated in floor plan order. The floor plan photo becomes the base image for Appendix A (photos), B (moisture map), C (floor survey), and D (thermal imaging).

---

## 2. Inspection Sections (NZS4306:2005 Order)

### Section 6 — Site & Ground Condition
- Topography and boundaries
- Retaining walls and fencing
- Access paths and driveways
- Garden areas and landscaping

### Section 7 — Exterior of Building
- **Roof** — type, condition, flashings, gutters, downpipes
- **Cladding** — type, condition, penetrations, sealants, junctions
- **Joinery** — glazing type, hardware, restrictors
- **Foundation** — type and condition

### Section 8 — Interior of Building
Inspected **room by room** (using floor plan declared upfront):
- Floors, walls, ceilings
- Doors and windows
- Internal fittings and fixtures
- Moisture readings at risk points (recorded as SpecialistTest inline)
- Attic space

### Section 9 — Service Systems
- Power (distribution board, sockets)
- Internet/fiber
- Potable water supply
- Non-potable water system
- Hot water system
- Gas system
- Drainage
- Security system
- Smoke alarm system
- Ventilation
- Heat pump
- Stormwater system

---

## 3. Per Finding

Every finding records:

| Field | Values |
|-------|--------|
| Element | Specific component (e.g. "Cedar timber weatherboard cladding") |
| Observation | Technical description of what was seen |
| Severity | `immediate-attention` · `further-investigation` · `monitor` · `no-action` |
| Photos | Reference numbers (e.g. "Photograph 24, 25") |

Each section ends with a **conclusion** — a plain-language summary of overall condition and whether any action is required.

---

## 4. Specialist Tests (Appendices)

These are recorded separately from the section findings.

### Appendix B — Non-Invasive Moisture Testing
- Instrument: e.g. Trotec T660 (range 0–200; 0–79 = dry, 80–200 = elevated/wet)
- Each reading records: location, meter reading, result (dry/elevated/wet)
- Mapped to floor plan
- Conclusion: any elevated readings → further investigation required

### Appendix C — Floor Level Laser Survey
- Conducted on ground floor slab (and upper floors for multi-storey)
- Records: area surveyed, max deviation (mm), within tolerance (yes/no)
- Reference: MBIE Guide to Tolerances 2015

### Appendix D — Infrared Thermal Imaging
- Non-destructive — detects surface temperature anomalies
- Conducted room by room
- Records: room, anomaly found (yes/no), notes
- Anomalies corroborated with moisture readings

---

## 5. Report Structure

```
Section 1  — Report Information Summary
Section 2  — Introduction
Section 3  — Building & Site Description
Section 4  — Inspection Methodology
Section 5  — Summary of Inspection
Section 6  — Site and Ground Condition
Section 7  — Exterior of Building
Section 8  — Interior of Building
Section 9  — Service Systems
Section 10 — Limitations
Section 11 — Signatures
Appendix A — Inspection Photographs
Appendix B — Non-Invasive Moisture Testing Record
Appendix C — Floor Level Survey
Appendix D — Infrared Thermal Imaging Inspection
```

---

## 6. Key Rules

- Inspection is **visual and non-invasive only** — no moving of occupier items, no opening of concealed areas
- Inspector does **not** move to destructive testing — elevated moisture → recommend further investigation
- Gas and internet may not be testable on the day — note as limitation
- Stormwater testing impractical if <3 days rainfall — note as limitation
- Report is not a Building Code compliance certificate
- Report does not replace an LIM or council file search

---

*See also: [Design #024 — PPI Data Model Enrichment](../developer/design/024-ppi-data-model-enrichment.md)*
