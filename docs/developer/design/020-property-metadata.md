# Design: Property Metadata — Building History & Zone Data

**Status:** Approved
**Author:** Riley
**Requirement:** #542, #543
**Date:** 2026-02-28

## Context

Real reports across all types include two standard property metadata sections we don't capture:

1. **Building History** (#542) — consent history table showing what work was done and when
2. **BRANZ Zone Data** (#543) — climate, earthquake, wind, exposure zones from BRANZ Maps

Both appear in the Building & Site Description section of every report type.

Analysis: `docs/domain/report-analysis.md` — Cross-Type Patterns section.

## Decision

Extend the Property entity with zone data fields and add a new BuildingHistory entity. Both are simple schema additions with CRUD API and template rendering.

## Architecture

### Data Model Changes

```prisma
// Extend existing Property model
model Property {
  // ... existing fields ...

  // BRANZ Zone Data (#543)
  climateZone       String?    // "1", "2", "3"
  earthquakeZone    String?    // "Zone 1", "Zone 2"
  exposureZone      String?    // "Zone A", "Zone B", "Zone C", "Zone D"
  leeZone           String?    // "Yes", "No"
  rainfallRange     String?    // "80-90", "90-100"
  windRegion        String?    // "A", "W"
  windZone          String?    // "Low", "Medium", "High", "Very High", "Extra High"

  // Relations
  buildingHistory   BuildingHistory[]
}

// New entity (#542)
model BuildingHistory {
  id              String    @id @default(uuid())
  propertyId      String
  property        Property  @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  description     String    // "Multi unit dwelling", "Extension", "Garage conversion"
  consentType     String?   // "Building Permit", "Building Consent"
  consentNumber   String?   // "E15938", "BA/05236/02"
  dateGranted     DateTime?
  notes           String?

  sortOrder       Int       @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([propertyId])
}
```

### API Endpoints

#### Zone Data (on Property)

Existing property CRUD handles this — just new fields on `PUT /api/properties/:id`.

#### Building History

```
POST   /api/properties/:id/building-history     # Add entry
GET    /api/properties/:id/building-history     # List entries (sorted)
PUT    /api/building-history/:id               # Update entry
DELETE /api/building-history/:id               # Remove entry
```

Request body:
```json
{
  "description": "Extension",
  "consentType": "Building Consent",
  "consentNumber": "BA/05236/02",
  "dateGranted": "2002-04-05",
  "notes": "Ground floor extension + exterior decks"
}
```

### Template Rendering

#### Zone Data Table (all report types)

```handlebars
<table>
  <tr><td>Climate Zone</td><td>{{property.climateZone}}</td></tr>
  <tr><td>Earthquake Zone</td><td>{{property.earthquakeZone}}</td></tr>
  <tr><td>Exposure Zone</td><td>{{property.exposureZone}}</td></tr>
  <tr><td>Lee Zone</td><td>{{property.leeZone}}</td></tr>
  <tr><td>Rainfall Range</td><td>{{property.rainfallRange}}</td></tr>
  <tr><td>Wind Region</td><td>{{property.windRegion}}</td></tr>
  <tr><td>Wind Zone</td><td>{{property.windZone}}</td></tr>
</table>
```

#### Building History Table (COA, CCC)

```handlebars
<table>
  <tr>
    <th>Building Works</th>
    <th>Consent</th>
    <th>Date Granted</th>
  </tr>
  {{#each buildingHistory}}
  <tr>
    <td>{{this.description}}</td>
    <td>{{this.consentType}} # {{this.consentNumber}}</td>
    <td>{{formatDate this.dateGranted}}</td>
  </tr>
  {{/each}}
</table>
```

### Frontend Changes

#### Property Form — Zone Data Fields

Add 7 new fields to the property edit form:
- Climate Zone (dropdown: 1, 2, 3)
- Earthquake Zone (dropdown: Zone 1, Zone 2)
- Exposure Zone (dropdown: Zone A, B, C, D)
- Lee Zone (dropdown: Yes, No)
- Rainfall Range (text input)
- Wind Region (dropdown: A, W)
- Wind Zone (dropdown: Low, Medium, High, Very High, Extra High)

Group under a "Site Data (BRANZ Maps)" section.

#### Property Page — Building History Table

Add an editable table on the property page:
- Add row button
- Inline editing for description, consent type, consent number, date
- Delete row button
- Drag to reorder (sortOrder)

### Nice to Have (Future)

**BRANZ Maps Auto-Lookup:** If BRANZ provides a geocoding API, auto-populate zone data from the property address. Out of scope for now — manual entry first.

## Dependencies

- Existing Property model
- Template rendering for all report types

## Stories Breakdown

_(To be created after design approval)_

Estimated stories:
1. Add zone data fields to Property schema + migration
2. Add BuildingHistory entity + CRUD API
3. Update property form with zone data fields (frontend)
4. Add building history table to property page (frontend)
5. Add zone data + building history to report templates (all types)
6. Register new endpoints in OpenAPI

## Alternatives Considered

**Separate ZoneData entity** — Rejected. Zone data is 1:1 with Property. Flat fields are simpler than a separate table.

**Building history as JSON column** — Rejected. Separate entity allows proper CRUD, validation, and ordering. Worth the extra table.
