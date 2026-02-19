# 005 — Building Code Reference Data

**Status:** Draft  
**Requirement:** #151  
**Author:** Archer  
**Created:** 2026-02-19

---

## 1. Context

The inspection system needs reference data for NZ Building Code clauses. This provides:
- Clause text for COA/CCC reports
- Durability requirements (50/15/5 years)
- Typical evidence types per clause
- N/A reason templates

This is foundational data that other features depend on (#150 Checklist, #149 COA Reports).

---

## 2. Decision

Create a `BuildingCodeClause` entity with seed data covering all clauses B through H. Data is read-only for inspectors but updateable by admins when the Building Code changes.

---

## 3. Data Model

### BuildingCodeClause

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| code | String | Yes | e.g., "B1", "B1.2", "E2.3.2" |
| title | String | Yes | e.g., "Structure", "External Moisture" |
| category | Enum | Yes | B/C/D/E/F/G/H |
| objective | Text | No | What the clause aims to achieve |
| functionalRequirement | Text | No | How objective is met |
| performanceText | Text | Yes | Actual code text for reports |
| durabilityPeriod | Enum | No | 50_YEARS / 15_YEARS / 5_YEARS / NA |
| parentClauseId | UUID | No | For sub-clauses hierarchy |
| typicalEvidence | String[] | No | Common supporting documents |
| sortOrder | Integer | Yes | Display ordering |

### Enums

```typescript
enum ClauseCategory {
  B = 'B', // Stability
  C = 'C', // Fire
  D = 'D', // Access
  E = 'E', // Moisture
  F = 'F', // Safety
  G = 'G', // Services
  H = 'H', // Energy
}

enum DurabilityPeriod {
  FIFTY_YEARS = '50_YEARS',
  FIFTEEN_YEARS = '15_YEARS',
  FIVE_YEARS = '5_YEARS',
  NA = 'NA',
}
```

### NAReasonTemplate

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| template | String | Yes | Template text with placeholders |
| usage | String | No | When to use this template |

---

## 4. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/building-code/clauses | List all clauses |
| GET | /api/building-code/clauses/:code | Get clause by code |
| GET | /api/building-code/clauses?category=E | Filter by category |
| GET | /api/building-code/na-templates | List N/A templates |

Read-only API for inspectors. Admin endpoints (POST/PUT/DELETE) deferred until needed.

---

## 5. Seed Data

### Clause Categories

| Category | Title | Clause Count |
|----------|-------|--------------|
| B | Stability | ~5 |
| C | Fire | ~5 |
| D | Access | ~2 |
| E | Moisture | ~3 |
| F | Safety | ~9 |
| G | Services | ~15 |
| H | Energy | ~1 |

### Key Clauses (from requirement)

#### B - Stability
| Code | Title | Durability | Typical Evidence |
|------|-------|------------|------------------|
| B1 | Structure | 50 years | PS3 Structural |
| B2 | Durability | varies | Warranties, data sheets |

#### E - Moisture
| Code | Title | Durability | Typical Evidence |
|------|-------|------------|------------------|
| E1 | Surface Water | 15 years | Photos |
| E2 | External Moisture | 15 years | Photos, window test |
| E3 | Internal Moisture | 15 years | PS3 Waterproofing, flood test |

#### G - Services
| Code | Title | Durability | Typical Evidence |
|------|-------|------------|------------------|
| G9 | Electricity | 15/5 years | CoC, ESC |
| G12 | Water Supplies | 15 years | PS3 Plumbing |
| G13 | Foul Water | 15 years | PS3 Plumbing |

### N/A Templates

| Template | Usage |
|----------|-------|
| "The CoA works do not affect {element}. As such, this Clause is not applicable." | General |
| "This Clause does not apply to {space_type}." | Room-specific |
| "The CoA works do not involve {system}." | Scope exclusion |
| "There are no {items} on this property." | Not present |

---

## 6. Implementation

### Database Schema (Prisma)

```prisma
model BuildingCodeClause {
  id                String              @id @default(uuid())
  code              String              @unique
  title             String
  category          ClauseCategory
  objective         String?
  functionalReq     String?             @map("functional_requirement")
  performanceText   String              @map("performance_text")
  durabilityPeriod  DurabilityPeriod?   @map("durability_period")
  typicalEvidence   String[]            @map("typical_evidence")
  sortOrder         Int                 @map("sort_order")
  parentId          String?             @map("parent_id")
  parent            BuildingCodeClause? @relation("ClauseHierarchy", fields: [parentId], references: [id])
  children          BuildingCodeClause[] @relation("ClauseHierarchy")
  createdAt         DateTime            @default(now()) @map("created_at")
  updatedAt         DateTime            @updatedAt @map("updated_at")

  @@map("building_code_clauses")
}

model NAReasonTemplate {
  id        String   @id @default(uuid())
  template  String
  usage     String?
  sortOrder Int      @map("sort_order")
  createdAt DateTime @default(now()) @map("created_at")

  @@map("na_reason_templates")
}
```

### Seeding

Seed script loads data from JSON/YAML files:

```
prisma/seed/
├── building-code-clauses.json
└── na-reason-templates.json
```

Run with: `npx prisma db seed`

---

## 7. Integration Points

### With #150 Inspection Checklist

ClauseReview entity references BuildingCodeClause:
- Auto-populate clause text in observations
- Link evidence requirements
- Provide N/A templates

### With #149 COA Reports

Report generation pulls:
- Clause text for compliance table
- Typical evidence for validation
- Durability periods for code references

---

## 8. Acceptance Criteria

- [ ] Store all Building Code clauses (B through H)
- [ ] Support clause hierarchy (B1 → B1.2)
- [ ] Store performance text for reports
- [ ] Track durability period per clause
- [ ] List typical evidence documents
- [ ] Search clauses by code or keyword
- [ ] Provide N/A reason templates
- [ ] Seed with initial data (~40 clauses)

---

## 9. User Stories (after approval)

1. **Create BuildingCodeClause entity** — schema, model, API
2. **Create NAReasonTemplate entity** — schema, model, API
3. **Seed Building Code data** — all clauses B-H
4. **Add clause search/filter** — by category, keyword

---

## 10. Data Source

- NZ Building Code: https://www.building.govt.nz/building-code-compliance/
- Extracted from actual COA reports in `docs/research/`
- B2.3.1 durability requirements

---

## References

- Requirement: #151
- Related: #149, #150, #153
- Domain research: `docs/research/template-analysis.md`
