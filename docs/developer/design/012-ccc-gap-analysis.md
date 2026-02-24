# Design: CCC Gap Analysis Report

**Status:** Draft  
**Sprint:** 4c  
**Author:** Archer  
**Requirement:** #153  
**Date:** 2026-02-19

## Context

CCC Gap Analysis reports identify defects in buildings that have consent but no Code Compliance Certificate. Unlike COA reports (which demonstrate compliance), these reports identify gaps and provide remediation scope with cost estimates.

Common for weathertightness issues where costs can reach $200k-500k+.

## Decision

Extend the inspection/report system with:
1. **Defect entity** — structured defect records with severity/priority
2. **Cost estimate system** — line items with contingency calculation
3. **CCC-specific templates** — defect schedule, executive summary
4. **Moisture reading capture** — structured data for evidence

## Data Model

### Defect

```prisma
model Defect {
  id              String          @id @default(uuid())
  inspectionId    String
  inspection      Inspection      @relation(fields: [inspectionId], references: [id])
  
  defectNumber    String          // "D-001", "D-002"
  location        String          // "North elevation, above window W3"
  buildingElement BuildingElement
  clauseId        String?
  clause          BuildingCodeClause? @relation(fields: [clauseId], references: [id])
  
  description     String          // What's wrong
  cause           String?         // Why it happened
  remedialAction  String          // Required fix
  priority        DefectPriority
  
  // Linked evidence
  photos          Photo[]
  moistureReadings MoistureReading[]
  
  // Cost estimate reference
  costLineItems   CostLineItem[]
  
  sortOrder       Int
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

enum BuildingElement {
  ROOF
  WALL
  WINDOW
  DECK
  SUBFLOOR
  INTERIOR
  SERVICES
  STRUCTURE
  OTHER
}

enum DefectPriority {
  CRITICAL  // Immediate action - structural/safety
  HIGH      // Action within months - durability
  MEDIUM    // Action within year - compliance
  LOW       // As convenient - maintenance
}
```

### MoistureReading

```prisma
model MoistureReading {
  id            String    @id @default(uuid())
  defectId      String?
  defect        Defect?   @relation(fields: [defectId], references: [id])
  inspectionId  String
  inspection    Inspection @relation(fields: [inspectionId], references: [id])
  
  location      String    // "Wall lining, NE bedroom"
  substrate     String    // "Plasterboard", "Timber framing"
  reading       Decimal   // % moisture content
  depth         Int?      // mm depth of reading
  equipmentUsed String    // "Tramex ME5"
  timestamp     DateTime
  
  notes         String?
  photoId       String?   // Evidence photo
  
  createdAt     DateTime  @default(now())
}
```

### CostEstimate

```prisma
model CostEstimate {
  id              String          @id @default(uuid())
  reportId        String          @unique
  report          Report          @relation(fields: [reportId], references: [id])
  
  currency        String          @default("NZD")
  contingencyRate Decimal         @default(0.15) // 15%
  
  lineItems       CostLineItem[]
  
  // Calculated totals (stored for performance)
  subtotal        Decimal?
  contingency     Decimal?
  totalExGst      Decimal?
  gst             Decimal?
  totalIncGst     Decimal?
  
  notes           String?
  validUntil      DateTime?       // Estimate expiry
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

model CostLineItem {
  id              String        @id @default(uuid())
  estimateId      String
  estimate        CostEstimate  @relation(fields: [estimateId], references: [id], onDelete: Cascade)
  
  defectId        String?       // Link to defect if applicable
  defect          Defect?       @relation(fields: [defectId], references: [id])
  
  itemNumber      Int
  description     String
  quantity        Decimal
  unit            String        // "m²", "LM", "LS", "each"
  rate            Decimal
  total           Decimal       // quantity × rate
  
  category        CostCategory?
  notes           String?
  sortOrder       Int
  
  createdAt       DateTime      @default(now())
}

enum CostCategory {
  PRELIMINARIES   // Scaffolding, site setup
  DEMOLITION      // Removal work
  STRUCTURE       // Framing repairs
  CLADDING        // New cladding
  ROOFING         // Roof work
  WINDOWS         // Joinery
  SERVICES        // Plumbing, electrical
  FINISHING       // Paint, plaster
  PROFESSIONAL    // Consent fees, inspections
  OTHER
}
```

## API Endpoints

### Defects

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/inspections/:id/defects` | Create defect |
| GET | `/api/inspections/:id/defects` | List defects |
| GET | `/api/defects/:id` | Get defect |
| PUT | `/api/defects/:id` | Update defect |
| DELETE | `/api/defects/:id` | Delete defect |
| PUT | `/api/inspections/:id/defects/reorder` | Reorder defects |

### Moisture Readings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/inspections/:id/moisture-readings` | Add reading |
| GET | `/api/inspections/:id/moisture-readings` | List readings |
| PUT | `/api/moisture-readings/:id` | Update |
| DELETE | `/api/moisture-readings/:id` | Delete |

### Cost Estimates

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reports/:id/cost-estimate` | Create estimate |
| GET | `/api/reports/:id/cost-estimate` | Get estimate |
| PUT | `/api/cost-estimates/:id` | Update estimate |
| POST | `/api/cost-estimates/:id/line-items` | Add line item |
| PUT | `/api/cost-line-items/:id` | Update line item |
| DELETE | `/api/cost-line-items/:id` | Delete line item |
| POST | `/api/cost-estimates/:id/recalculate` | Recalc totals |

## MCP Tools

### Defect Capture (WhatsApp)

```typescript
// inspection_add_defect
{
  location: "North elevation above window",
  element: "WALL",
  clause: "E2",
  description: "Absence of head flashings at window W3",
  priority: "HIGH",
  photos: [photoId1, photoId2]
}

// inspection_add_moisture
{
  location: "Wall lining, NE bedroom",
  reading: 28.5,
  substrate: "Plasterboard"
}
```

## Report Generation

### CCC Gap Analysis Template Structure

```
templates/
└── ccc-gap/
    ├── base.hbs
    ├── sections/
    │   ├── 00-executive-summary.hbs
    │   ├── 01-introduction.hbs
    │   ├── 02-general-information.hbs
    │   ├── 03-assessment-summary.hbs
    │   ├── 04-defect-schedule.hbs
    │   ├── 05-remedial-scope.hbs
    │   ├── 06-limitations.hbs
    │   └── 07-signatures.hbs
    └── appendices/
        ├── a-cost-estimate.hbs
        ├── b-photos.hbs
        └── c-moisture-data.hbs
```

### Defect Schedule Table

```handlebars
{{!-- Section 4: Defect Schedule --}}
<table class="defect-schedule">
  <thead>
    <tr>
      <th>ID</th>
      <th>Location</th>
      <th>Element</th>
      <th>Clause</th>
      <th>Description</th>
      <th>Photos</th>
      <th>Priority</th>
      <th>Remedial Action</th>
    </tr>
  </thead>
  <tbody>
    {{#each defects}}
    <tr class="priority-{{lowercase priority}}">
      <td>{{defectNumber}}</td>
      <td>{{location}}</td>
      <td>{{element}}</td>
      <td>{{clause.code}}</td>
      <td>{{description}}</td>
      <td>{{photoRef photos}}</td>
      <td><span class="badge">{{priority}}</span></td>
      <td>{{remedialAction}}</td>
    </tr>
    {{/each}}
  </tbody>
</table>
```

### Cost Estimate Table

```handlebars
{{!-- Appendix A: Cost Estimate --}}
<table class="cost-estimate">
  <thead>
    <tr>
      <th>#</th>
      <th>Description</th>
      <th>Qty</th>
      <th>Unit</th>
      <th>Rate</th>
      <th>Total</th>
    </tr>
  </thead>
  <tbody>
    {{#each costEstimate.lineItems}}
    <tr>
      <td>{{itemNumber}}</td>
      <td>{{description}}</td>
      <td>{{quantity}}</td>
      <td>{{unit}}</td>
      <td>${{formatNumber rate}}</td>
      <td>${{formatNumber total}}</td>
    </tr>
    {{/each}}
  </tbody>
  <tfoot>
    <tr>
      <td colspan="5">Subtotal</td>
      <td>${{formatNumber costEstimate.subtotal}}</td>
    </tr>
    <tr>
      <td colspan="5">Contingency ({{percent costEstimate.contingencyRate}})</td>
      <td>${{formatNumber costEstimate.contingency}}</td>
    </tr>
    <tr class="total">
      <td colspan="5"><strong>Total (excl GST)</strong></td>
      <td><strong>${{formatNumber costEstimate.totalExGst}}</strong></td>
    </tr>
  </tfoot>
</table>
```

## Executive Summary Generation

Auto-generate from defect data:

```typescript
function generateExecutiveSummary(defects: Defect[], costEstimate: CostEstimate): string {
  const clausesCited = [...new Set(defects.map(d => d.clause?.code).filter(Boolean))];
  const criticalCount = defects.filter(d => d.priority === 'CRITICAL').length;
  
  return `
## Executive Summary

This assessment identified **${defects.length} defects** affecting compliance with the New Zealand Building Code.

### Building Code Breaches
${clausesCited.map(c => `- ${c}`).join('\n')}

### Priority Summary
- Critical: ${criticalCount}
- High: ${defects.filter(d => d.priority === 'HIGH').length}
- Medium: ${defects.filter(d => d.priority === 'MEDIUM').length}
- Low: ${defects.filter(d => d.priority === 'LOW').length}

### Estimated Remediation Cost
**$${formatNumber(costEstimate.totalExGst)} + GST**

(See Appendix A for detailed cost breakdown)
  `;
}
```

## Validation Rules

### Defects
- [ ] Each defect must have description
- [ ] Each defect must link to Building Code clause
- [ ] Critical/High defects must have remedial action
- [ ] Defects should have at least one photo

### Cost Estimate
- [ ] All defects should have cost line items
- [ ] Line item total = quantity × rate
- [ ] Contingency rate between 0-30%
- [ ] Totals auto-calculated

### Report
- [ ] Cannot finalize with unlinked defects
- [ ] Warn if critical defects have no cost estimate
- [ ] Warn if moisture readings have no photo

## Acceptance Criteria

### Defects
- [ ] Create defect with ID, location, element
- [ ] Link to Building Code clause
- [ ] Attach photos to defects
- [ ] Assign priority (Critical/High/Medium/Low)
- [ ] Record remedial action

### Moisture Readings
- [ ] Record readings with location/substrate
- [ ] Link to defects
- [ ] Include in report appendix

### Cost Estimate
- [ ] Create line items with quantity/rate
- [ ] Auto-calculate totals
- [ ] Apply contingency
- [ ] Show GST

### Report Generation
- [ ] Generate defect schedule table
- [ ] Auto-generate executive summary
- [ ] Include cost estimate appendix
- [ ] PDF and DOCX output

---

## Dependencies

- #150 Inspection entity
- #151 Building Code Reference (clause links)
- #152 Document/Photo (evidence)
- #158 Report Generation (PDF/DOCX)

## User Stories (after approval)

1. **Defect entity and API** — CRUD, linking, reorder
2. **Moisture reading capture** — API and MCP tool
3. **Cost estimate system** — line items, calculations
4. **CCC Gap Analysis templates** — sections, appendices
5. **Executive summary generation** — auto-generate from data
6. **MCP tools for defect capture** — WhatsApp workflow

## References

- Requirement: #153
- Sample: 12 Astelia Place CCC Gap Analysis
- Related: #149, #150, #151, #158
