# Design: Inspection Checklist System

**Status:** Draft  
**Sprint:** 4a  
**Author:** Archer  
**Requirement:** #150  
**Date:** 2026-02-19

## Context

Building inspectors need a structured system to record observations, compliance status, and evidence against Building Code clauses. The system must support two distinct inspection workflows:

1. **Simple Checklist** — Council-style pass/fail inspections (Pre-line, Post-line, Final)
2. **Clause Review** — Detailed Building Code clause-by-clause analysis (COA, CCC Gap Analysis)

Data is captured on-site via WhatsApp (Phase 1) and refined in a web interface (Phase 2).

## Decision

Extend the existing `api/` backend with inspection entities that support both checklist modes. The MCP layer gains specialized tools for WhatsApp-guided inspection capture.

## Architecture

### Data Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Inspection                                     │
│  ─────────────────────────────────────────────────────────────────────  │
│  id, projectId, type (SIMPLE|CLAUSE_REVIEW), stage, date, weather,      │
│  personsPresent, equipment[], methodology, areasNotAccessed,            │
│  inspectorId, status, lbpVerification{}, outcome                        │
└────────────────────────────────────────────────────────────┬────────────┘
                                                              │
                          ┌───────────────────────────────────┼───────────────────────────────────┐
                          │                                   │                                   │
                          ▼                                   ▼                                   ▼
              ┌───────────────────────┐           ┌───────────────────────┐           ┌───────────────────────┐
              │   ChecklistItem       │           │   ClauseReview        │           │   Measurement         │
              │   (Simple mode)       │           │   (Clause mode)       │           │   (Both modes)        │
              │  ───────────────────  │           │  ───────────────────  │           │  ───────────────────  │
              │  category, item,      │           │  clauseId, applicabil │           │  type, location,      │
              │  decision (P/F/NA),   │           │  ity, observations,   │           │  value, unit, result, │
              │  notes, photoIds[]    │           │  photoIds[], docIds[] │           │  linkedClauseId       │
              └───────────────────────┘           │  docsRequired,        │           └───────────────────────┘
                                                  │  remedialWorks        │
                                                  └───────────────────────┘
```

### Entity Relationships

```
Project (from #154)
    └── Inspection (1:N)
            ├── ChecklistItem (1:N) — for SIMPLE mode
            ├── ClauseReview (1:N) — for CLAUSE_REVIEW mode
            ├── Measurement (1:N) — optional, both modes
            └── Photo/Document refs (via photoIds/docIds → #152)

BuildingCodeClause (from #151)
    └── referenced by ClauseReview.clauseId
```

## Database Schema

### Prisma Models

```prisma
// Inspection modes
enum InspectionType {
  SIMPLE           // Council-style checklist
  CLAUSE_REVIEW    // COA/CCC format
}

enum InspectionStage {
  INS_01    // Excavation/Foundation
  INS_02    // Subfloor/Prefloor
  INS_03    // Block Full
  INS_04    // Pre-wrap
  INS_05    // Pre-line Building
  INS_06    // Post-line
  INS_07    // Cladding
  INS_07A   // Membrane Decks/Roof
  INS_08    // Drainage
  INS_09    // Final General
  INS_10    // Final Commercial
  INS_11    // Final Plumbing
  COA       // Certificate of Acceptance
  CCC_GA    // CCC Gap Analysis
  S_AND_S   // Safe & Sanitary
  TFA       // Timber Framing Assessment
  DMG       // Damage Inspection
}

enum InspectionStatus {
  DRAFT
  IN_PROGRESS
  REVIEW
  COMPLETED
}

enum Decision {
  PASS
  FAIL
  NA
}

enum Applicability {
  APPLICABLE
  NA
}

enum InspectionOutcome {
  PASS
  FAIL
  REPEAT_REQUIRED
}

model Inspection {
  id                String              @id @default(uuid())
  projectId         String
  project           Project             @relation(fields: [projectId], references: [id])
  
  type              InspectionType
  stage             InspectionStage
  date              DateTime
  status            InspectionStatus    @default(DRAFT)
  
  // Context
  weather           String?
  personsPresent    String?
  equipment         String[]            @default([])
  methodology       String?
  areasNotAccessed  String?
  
  // Inspector
  inspectorId       String
  inspector         Personnel           @relation(fields: [inspectorId], references: [id])
  
  // LBP Verification (Simple mode)
  lbpOnSite         Boolean?
  lbpLicenseSighted Boolean?
  lbpLicenseNumber  String?
  lbpExpiryDate     DateTime?
  
  // Outcome (Simple mode)
  outcome           InspectionOutcome?
  signatureData     String?             // Base64 signature
  signatureDate     DateTime?
  
  // Current section (for WhatsApp navigation)
  currentSection    String?
  currentClauseId   String?
  
  // Relations
  checklistItems    ChecklistItem[]
  clauseReviews     ClauseReview[]
  measurements      Measurement[]
  
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
}

model ChecklistItem {
  id            String      @id @default(uuid())
  inspectionId  String
  inspection    Inspection  @relation(fields: [inspectionId], references: [id], onDelete: Cascade)
  
  category      String      // "Exterior", "Interior", "Decks", etc.
  item          String      // "Roof cladding / flashings"
  decision      Decision
  notes         String?
  
  photoIds      String[]    @default([])   // References to Photo entity (#152)
  
  sortOrder     Int         @default(0)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  @@index([inspectionId, category])
}

model ClauseReview {
  id            String        @id @default(uuid())
  inspectionId  String
  inspection    Inspection    @relation(fields: [inspectionId], references: [id], onDelete: Cascade)
  
  clauseId      String
  clause        BuildingCodeClause @relation(fields: [clauseId], references: [id])
  
  applicability Applicability
  observations  String?       // Inspector's on-site notes (editable in web)
  
  photoIds      String[]      @default([])   // Photo references
  docIds        String[]      @default([])   // Document references (#152)
  docsRequired  String?       // What's still needed
  remedialWorks String?       // Required actions
  
  sortOrder     Int           @default(0)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  @@index([inspectionId])
  @@unique([inspectionId, clauseId])
}

model Measurement {
  id              String      @id @default(uuid())
  inspectionId    String
  inspection      Inspection  @relation(fields: [inspectionId], references: [id], onDelete: Cascade)
  
  type            MeasurementType
  location        String      // "Shower base", "Kitchen floor"
  value           Float
  unit            String      // "%", "mm", "°C", "mm/m"
  result          MeasurementResult
  notes           String?
  
  linkedClauseId  String?     // Optional Building Code clause reference
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

enum MeasurementType {
  MOISTURE_CONTENT
  TEMPERATURE
  SLOPE_FALL
  DIMENSION
  CLEARANCE
}

enum MeasurementResult {
  ACCEPTABLE
  MARGINAL
  UNACCEPTABLE
}
```

## API Endpoints

### Inspections

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects/:projectId/inspections` | Create inspection |
| GET | `/api/projects/:projectId/inspections` | List inspections for project |
| GET | `/api/inspections/:id` | Get inspection with items |
| PUT | `/api/inspections/:id` | Update inspection |
| DELETE | `/api/inspections/:id` | Delete inspection |
| POST | `/api/inspections/:id/complete` | Mark complete, validate |

### Checklist Items (Simple mode)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/inspections/:id/checklist-items` | Add item |
| GET | `/api/inspections/:id/checklist-items` | List by category |
| PUT | `/api/checklist-items/:id` | Update item |
| DELETE | `/api/checklist-items/:id` | Delete item |

### Clause Reviews (Clause Review mode)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/inspections/:id/clause-reviews` | Add clause review |
| GET | `/api/inspections/:id/clause-reviews` | List all clauses |
| PUT | `/api/clause-reviews/:id` | Update observations |
| DELETE | `/api/clause-reviews/:id` | Delete clause review |
| POST | `/api/inspections/:id/clause-reviews/init` | Initialize all clauses from template |

### Measurements

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/inspections/:id/measurements` | Add measurement |
| GET | `/api/inspections/:id/measurements` | List measurements |
| PUT | `/api/measurements/:id` | Update measurement |
| DELETE | `/api/measurements/:id` | Delete measurement |

### Navigation (WhatsApp support)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inspections/:id/current` | Get current section/clause |
| POST | `/api/inspections/:id/navigate` | Move to next/prev/specific |
| GET | `/api/inspections/:id/progress` | Get completion status |

## MCP Tools (Phase 1: WhatsApp)

### `inspection_start`

Create new inspection for a project.

```typescript
interface InspectionStartInput {
  projectId: string;
  type: "simple" | "clause_review";
  stage: string;              // "INS_05", "COA", etc.
  inspectorId?: string;       // Default from config
  date?: string;              // Default: today
}

interface InspectionStartOutput {
  inspectionId: string;
  type: string;
  stage: string;
  firstSection: {
    type: "category" | "clause";
    id: string;
    name: string;
    prompt: string;           // What to check
    items?: string[];         // Checklist items (simple mode)
  };
  message: string;
}
```

### `inspection_add_finding`

Record a finding against current section/clause.

```typescript
interface InspectionAddFindingInput {
  inspectionId: string;
  text: string;                       // Inspector's notes
  decision?: "pass" | "fail" | "na";  // Simple mode only
  photos?: PhotoInput[];              // Base64 images
  measurements?: MeasurementInput[];
}

interface InspectionAddFindingOutput {
  findingId: string;
  section: string;
  photosStored: number;
  message: string;
}
```

### `inspection_navigate`

Move between sections/clauses.

```typescript
interface InspectionNavigateInput {
  inspectionId: string;
  action: "next" | "back" | "skip" | string;  // or specific section/clause ID
}

interface InspectionNavigateOutput {
  previousSection: string;
  currentSection: {
    type: "category" | "clause";
    id: string;
    name: string;
    prompt: string;
    items?: string[];
    clauseText?: string;      // For clause review mode
    typicalEvidence?: string[];
  };
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  message: string;
}
```

### `inspection_status`

Get current progress and outstanding items.

```typescript
interface InspectionStatusInput {
  inspectionId: string;
}

interface InspectionStatusOutput {
  inspectionId: string;
  projectAddress: string;
  type: string;
  stage: string;
  currentSection: string;
  progress: {
    sectionsCompleted: number;
    sectionsTotal: number;
    itemsWithFindings: number;
    itemsWithPhotos: number;
    clausesApplicable: number;
    clausesReviewed: number;
  };
  outstanding: string[];      // Sections/clauses without data
  docsToCollect: string[];    // Documents still needed from owner
  canComplete: boolean;
}
```

### `inspection_complete`

Finalize on-site capture.

```typescript
interface InspectionCompleteInput {
  inspectionId: string;
  outcome?: "pass" | "fail" | "repeat_required";  // Simple mode
  weather?: string;
  areasNotAccessed?: string;
}

interface InspectionCompleteOutput {
  inspectionId: string;
  status: "completed";
  summary: {
    sectionsCompleted: number;
    totalFindings: number;
    totalPhotos: number;
    failedItems: number;        // Simple mode
    clausesReviewed: number;    // Clause mode
    docsOutstanding: string[];
  };
  message: string;
}
```

## Checklist Templates

### Simple Mode Categories

Pre-defined categories and items per inspection stage, stored in `config/checklists/`:

```yaml
# config/checklists/ins-05-preline.yaml
stage: INS_05
name: Pre-line Building Inspection
categories:
  - id: exterior
    name: Exterior
    items:
      - Roof cladding / flashings
      - Wall cladding / flashings
      - Cladding cavity: drained / vented
      - Window flashings
      - Window glazing / safety glazing
  - id: interior
    name: Interior
    items:
      - Moisture content reading
      - Ceiling battens: size, spacing
      - Insulation walls / ceiling
      - Roofing / wall underlay
      - Holes and notches in framing
      - Bottom plate / brace fixing
  - id: decks
    name: Decks
    items:
      - Deck level / fall / floor level
      - Deck finish / membrane
      - Barrier heights / handrails
      - Deck / parapet flashings
      - Outlets and overflows
```

### Clause Mode Template

For COA/CCC inspections, initialize ClauseReview entries for all Building Code clauses from #151, allowing inspector to mark applicability and add observations.

## OpenClaw Prompting Behavior

### Clause Review Mode (COA/CCC)

```
OpenClaw: "Starting COA inspection for 123 Main Street.
           First clause: **B1 Structure**
           
           Check: Building shall withstand combination of loads...
           Typical evidence: PS1, PS3, foundations visible
           
           Send photos + observations, or say 'NA' if not applicable."

Inspector: [photo] "Foundations look good, no cracking"

OpenClaw: "Captured for B1. Anything else for Structure, or move to **B2 Durability**?"

Inspector: "Next"

OpenClaw: "**B2 Durability** — Building materials sufficiently durable...
           Check: 50-year elements (structure, cladding), 15-year (linings),
                  5-year (services, seals)
           What do you see?"
```

### Simple Checklist Mode

```
OpenClaw: "Pre-line inspection at 123 Main Street.
           **Exterior** — checking roof, cladding, flashings.
           
           Items:
           • Roof cladding / flashings
           • Wall cladding / flashings
           • Cladding cavity
           • Window flashings
           • Window glazing
           
           Tell me Pass/Fail for each, or send photos of issues."

Inspector: "All pass except window flashings - fail" [photo]

OpenClaw: "Captured: Window flashings FAIL with photo.
           Notes for the failure?"

Inspector: "Missing head flashing on north bedroom"

OpenClaw: "Added. Ready for **Interior** section?"
```

## Validation Rules

### On Save

- Inspection must have at least one inspector assigned
- Date must not be in the future

### On Complete (Warnings)

- LBP verification incomplete (Simple mode)
- No photos attached to inspection
- Applicable clause has no observations (Clause mode)
- FAIL items have no notes (Simple mode)
- Measurements without results

### Auto-Evaluation

Measurements auto-evaluate against acceptable ranges:

| Type | Acceptable | Marginal | Unacceptable |
|------|------------|----------|--------------|
| Moisture Content | < 18% | 18-25% | > 25% |
| Slope/Fall | ≥ 1:100 | 1:150 - 1:100 | < 1:150 |

## Web Editing (Phase 2)

### Observation Editor

- Plain text editing (MVP)
- Auto-save on blur or 2-second pause
- Undo with Ctrl+Z
- Visual indicator: "Saved" / "Saving..."

### Example Edit Flow

**Original (WhatsApp):**
> tanking installed, upstands OK

**Edited (Web):**
> Tanking system (Ardex WPM 300 membrane) installed to shower walls and floor. Upstands at floor junction measured at 150mm — compliant with E3/AS1.

## Dependencies

| Dependency | Relationship |
|------------|--------------|
| #151 Building Code Reference | ClauseReview.clauseId → BuildingCodeClause |
| #152 Document/Photo Attachments | photoIds[], docIds[] reference Photo/Document |
| #154 Project & Property Management | Inspection.projectId → Project |

## Alternatives Considered

### 1. Single Finding Model for Both Modes

**Rejected.** The data requirements are too different — Simple mode needs category/item/decision while Clause mode needs clause reference, applicability, and compliance text. Separate models are cleaner.

### 2. Store Observations as Rich Text

**Deferred.** Plain text for MVP. Rich text (bold, lists) can be added later without schema changes.

### 3. Embed Checklist Items in JSON Column

**Rejected.** Relational model enables querying, filtering, and reporting. Worth the extra tables.

## Implementation Notes

### Checklist Initialization

When creating a Simple inspection, pre-populate ChecklistItem entries from the stage template. Inspector marks Pass/Fail/NA rather than creating items.

When creating a Clause Review inspection, call `/api/inspections/:id/clause-reviews/init` to create ClauseReview entries for all Building Code clauses. Inspector marks Applicability and adds observations.

### Photo Integration

Photos are stored via #152's Photo entity. When inspector sends photo in WhatsApp:
1. MCP tool receives base64 data
2. Calls `/api/findings/:id/photos` (or creates photo directly)
3. Gets back photoId
4. Stores photoId in checklistItem.photoIds[] or clauseReview.photoIds[]

### Export for Reports

Inspection data feeds into report generation (#158 Report Generation). The ClauseReview entries populate the Building Code compliance table with observations, photo references, and document references.

## Acceptance Criteria (from Requirement)

### Simple Checklist Mode
- [x] Create inspection by stage (INS-01, etc.) — design supports
- [x] Record LBP verification — fields on Inspection
- [x] Checklist items grouped by category — ChecklistItem.category
- [x] Mark items Pass/Fail/N/A — ChecklistItem.decision
- [x] Add notes per item — ChecklistItem.notes
- [x] Record overall outcome — Inspection.outcome
- [x] Officer signature capture — Inspection.signatureData

### Clause Review Mode
- [x] List all Building Code clauses — init from #151
- [x] Mark clause as Applicable/N/A — ClauseReview.applicability
- [x] Record observations per clause — ClauseReview.observations
- [x] Link photos to clauses — ClauseReview.photoIds
- [x] Link documents to clauses — ClauseReview.docIds
- [x] Track remedial works per clause — ClauseReview.remedialWorks
- [x] Auto-populate clause text — from BuildingCodeClause via join

### Common
- [x] Create/edit inspections per project — Inspection.projectId
- [x] Attach photos to items/clauses — photoIds arrays
- [x] Export data for reports — API endpoints + relations
- [x] Calculate overall compliance status — derive from ClauseReview data

### Phase 1 (WhatsApp)
- [x] Start inspection via WhatsApp — inspection_start tool
- [x] OpenClaw prompts for each clause/section — navigation + prompts
- [x] Capture photos via WhatsApp — inspection_add_finding
- [x] Capture text observations — inspection_add_finding
- [x] Mark clauses as N/A — decision/applicability
- [x] Navigate between clauses — inspection_navigate
- [x] Show progress summary — inspection_status
- [x] Record areas not accessed — Inspection.areasNotAccessed
- [x] Complete on-site work — inspection_complete
- [x] List outstanding documents — docsToCollect in status

### Phase 2 (Web Editing)
- [x] View observations captured via WhatsApp — GET endpoints
- [x] Edit observation text in place — PUT endpoints
- [x] Plain text editing (MVP) — text fields
- [x] Auto-save on blur — frontend concern
- [x] Undo with Ctrl+Z — frontend concern
- [x] Visual indicator — frontend concern
- [x] Edit persists across sessions — database storage

---

## Next Steps

1. Review with Master for approval
2. Create user stories for implementation
3. Coordinate with #151, #152, #154 designs
