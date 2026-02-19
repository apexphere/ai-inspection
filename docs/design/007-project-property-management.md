# 007 — Project & Property Management

**Status:** Draft  
**Requirement:** #154  
**Author:** Archer  
**Created:** 2026-02-19

---

## 1. Context

Projects are the container for all inspection work. Each project:
- Links to a property (building being inspected)
- Has a client (who commissioned the work)
- Contains inspections, findings, photos, documents
- Tracks building history and consent records

---

## 2. Decision

Create three core entities:
- **Project** — the job/assessment container
- **Property** — the physical building with details
- **Client** — the customer (owner or agent)

Projects reference Properties (1:1) and Clients (1:many possible).

---

## 3. Data Model

### Project

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| jobNumber | String | Yes | Unique job number (auto or manual) |
| activity | String | Yes | "Bathroom conversion", "Pre-purchase" |
| reportType | Enum | Yes | COA / CCC_GAP / PPI / SAFE_SANITARY |
| status | Enum | Yes | DRAFT / IN_PROGRESS / REVIEW / COMPLETED |
| propertyId | UUID | Yes | Link to property |
| clientId | UUID | Yes | Primary client |
| createdAt | DateTime | Auto | |
| updatedAt | DateTime | Auto | |

### Property

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| streetAddress | String | Yes | "42 Smith Street" |
| suburb | String | No | "Henderson" |
| city | String | No | "Auckland" |
| postcode | String | No | "0612" |
| lotDp | String | No | "Lot 6 DP 107110" |
| councilPropertyId | String | No | Council reference |
| territorialAuthority | Enum | Yes | AKL, WCC, CCC, etc. |
| bcNumber | String | No | Building consent number |
| yearBuilt | Integer | No | Approximate year |

### PropertySiteData (embedded or separate)

| Field | Type | Options |
|-------|------|---------|
| windZone | Enum | LOW / MEDIUM / HIGH / VERY_HIGH / EXTRA_HIGH |
| earthquakeZone | Enum | ZONE_1 / ZONE_2 / ZONE_3 / ZONE_4 |
| exposureZone | Enum | A / B / C / D / E |
| climateZone | Enum | ZONE_1 / ZONE_2 / ZONE_3 |
| corrosionZone | Enum | B / C / D / E |
| leeZone | Boolean | |
| geothermalZone | Boolean | |
| snowZone | Boolean | |

### PropertyConstruction (embedded or separate)

| Field | Type | Description |
|-------|------|-------------|
| foundationType | Enum | CONCRETE_SLAB / TIMBER_PILES / CONCRETE_PILES |
| floorType | Enum | CONCRETE_SLAB / SUSPENDED_TIMBER / MIXED |
| wallConstruction | String | "Timber framed" |
| wallCladding | Enum | WEATHERBOARD / EIFS / BRICK / BLOCKWORK / MIXED |
| roofStructure | String | "Timber truss" |
| roofCladding | Enum | METAL / CONCRETE_TILE / CLAY_TILE / MEMBRANE |
| roofPitch | String | "≥20°" |
| joineryMaterial | Enum | ALUMINIUM / TIMBER / UPVC |
| glazingType | Enum | SINGLE / DOUBLE / LOW_E |
| interiorLining | String | "Plasterboard" |

### BuildingHistory

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| propertyId | UUID | Yes | Parent property |
| type | Enum | Yes | PERMIT / CONSENT / CCC / COA / AMENDMENT |
| reference | String | Yes | "BA/05236/02" |
| year | Integer | Yes | Year (if exact date unknown) |
| dateGranted | Date | No | When issued |
| description | String | No | "Extension to ground floor" |
| status | Enum | No | GRANTED / REFUSED / PENDING / NOT_ISSUED |
| notes | String | No | |

### Client

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| name | String | Yes | "John & Jane Smith" |
| email | String | No | |
| phone | String | No | |
| mobile | String | No | |
| address | String | No | Mailing address |
| contactPerson | String | No | If different from owner |

### Enums

```typescript
enum ReportType {
  COA = 'COA',
  CCC_GAP = 'CCC_GAP',
  PPI = 'PPI',
  SAFE_SANITARY = 'SAFE_SANITARY',
  TFA = 'TFA',
}

enum ProjectStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  COMPLETED = 'COMPLETED',
}

enum TerritorialAuthority {
  AKL = 'AKL',  // Auckland Council
  WCC = 'WCC',  // Wellington City Council
  CCC = 'CCC',  // Christchurch City Council
  HDC = 'HDC',  // Hamilton City Council
  // ... (full list of NZ councils)
}

enum HistoryType {
  PERMIT = 'PERMIT',
  CONSENT = 'CONSENT',
  CCC = 'CCC',
  COA = 'COA',
  AMENDMENT = 'AMENDMENT',
  UNAUTHORIZED = 'UNAUTHORIZED',
}
```

---

## 4. API Endpoints

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/projects | Create project |
| GET | /api/projects | List projects |
| GET | /api/projects/:id | Get project |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project (soft) |

### Properties

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/properties | Create property |
| GET | /api/properties | List/search properties |
| GET | /api/properties/:id | Get property |
| PUT | /api/properties/:id | Update property |

### Building History

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/properties/:id/history | Add history record |
| GET | /api/properties/:id/history | List history |
| PUT | /api/history/:id | Update record |
| DELETE | /api/history/:id | Delete record |

### Clients

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/clients | Create client |
| GET | /api/clients | List/search clients |
| GET | /api/clients/:id | Get client |
| PUT | /api/clients/:id | Update client |

---

## 5. WhatsApp Project Creation

When inspector starts inspection via WhatsApp:

```
Inspector: "Starting COA at 42 Smith Street Henderson, client John Smith"

OpenClaw parses:
- Address: "42 Smith Street Henderson"
- Client: "John Smith"
- Type: COA

MCP creates:
- Property (minimal: address only)
- Client (minimal: name only)
- Project (links property + client)
- Inspection (linked to project)

Returns: project ID for session
```

### Minimal vs Complete Data

**Phase 1 (WhatsApp):**
- Address (required)
- Client name (required)
- Report type (required)

**Phase 2 (Web):**
- Full property details (zones, construction)
- Building history
- Client contact details
- Additional metadata

---

## 6. Job Number Generation

Auto-generate job numbers:

```
Format: YYMMDD-XXX
Example: 260219-001, 260219-002

Or: sequential per year
Example: 26001, 26002, 26003
```

Allow manual override for existing numbering schemes.

---

## 7. Business Rules

### Project Rules
- Job number must be unique
- Must have exactly one property
- Must have at least one client
- Cannot delete if has inspections

### Property Rules
- Street address required
- Territorial authority required
- Can have multiple projects (re-assessments)

### Client Rules
- Name required
- Can be linked to multiple projects

---

## 8. Search & Filter

### Project Search
- By job number
- By address
- By client name
- By status
- By report type
- By date range

### Property Search
- By address
- By suburb/city
- By territorial authority

### Client Search
- By name
- By email

---

## 9. Acceptance Criteria

### Projects
- [ ] Create project with job number
- [ ] Auto-generate job number
- [ ] Select report type
- [ ] Link to property and client
- [ ] Track project status
- [ ] Search/filter projects

### Properties
- [ ] Create/edit property
- [ ] Record full address
- [ ] Record legal description
- [ ] Set site data (zones)
- [ ] Record construction details
- [ ] Link to multiple projects

### Building History
- [ ] Add consent/permit records
- [ ] Track CCC status
- [ ] Timeline view

### Clients
- [ ] Create/edit clients
- [ ] Link to projects
- [ ] Search clients

### WhatsApp
- [ ] Create project via chat
- [ ] Parse address and client
- [ ] Return project ID

---

## 10. User Stories (after approval)

1. **Project entity and API** — CRUD, job numbers, status
2. **Property entity and API** — CRUD, address, zones
3. **Client entity and API** — CRUD, search
4. **Building history** — consent/permit tracking
5. **Property construction details** — wall, roof, etc.
6. **WhatsApp project creation** — MCP integration
7. **Project search/filter** — dashboard queries

---

## 11. Dependencies

None (foundational entities)

---

## References

- Requirement: #154
- Related: #149, #150, #155
- Domain research: `docs/research/template-analysis.md`
