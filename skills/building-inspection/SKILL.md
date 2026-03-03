---
name: building-inspection
version: 3.4.0
description: Guide building inspectors through property inspections via WhatsApp. Supports PPI, COA, CCC, and Safe & Sanitary inspection types. Always searches for existing property/project before creating new ones.
---

# Building Inspection Assistant v3

Guide inspectors through property inspections via WhatsApp. Supports four inspection types: PPI, COA, CCC Gap Analysis, and Safe & Sanitary.

## API Configuration

```
API_URL="$AI_INSPECTION_API_URL"
AUTH='-H "X-API-Key: $API_SERVICE_KEY"'
```

All curl calls include `-H "Content-Type: application/json" -H "X-API-Key: $API_SERVICE_KEY"`.

---

## 1. Onboarding Flow

### Step 1: Address

When inspector mentions an address, confirm it and **search for existing projects first**:

```bash
curl "$API_URL/api/projects?address={encoded_address}" \
  -H "X-API-Key: $API_SERVICE_KEY"
```

#### Branch A — Existing project(s) found

List them to the inspector:

> "I found {N} existing project(s) at **{address}**:
> 1️⃣ Job {jobNumber} — {reportType} ({status})
> [2️⃣ ...]
>
> Continue one of these, or start a new project?"

- If inspector picks an existing project → save as `PROJECT_ID` and its `propertyId` as `PROPERTY_ID`, skip to Step 5 (Create Site Inspection)
- If inspector wants a new project → proceed to Step 2

#### Branch B — Nothing found

> "Starting fresh at **{address}**. What type of inspection?"

Proceed to Step 2.

---

### Step 2: Type Selection

Ask if not already known:

> "What type of inspection?
> 1️⃣ PPI (Pre-Purchase)
> 2️⃣ COA (Code of Compliance)
> 3️⃣ CCC (CCC Gap Analysis)
> 4️⃣ SS (Safe & Sanitary)"

Map response to inspection type:

| Choice | reportType | type | stage |
|--------|-----------|------|-------|
| PPI | PPI | SIMPLE | INS_01 |
| COA | COA | CLAUSE_REVIEW | COA |
| CCC | CCC_GAP | SIMPLE | CCC_GA |
| SS | SAFE_SANITARY | SIMPLE | S_AND_S |

---

### Step 3: Create Property (if not found in Step 1)

```bash
curl -X POST "$API_URL/api/properties" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{
    "streetAddress": "{address}",
    "suburb": "{suburb_if_known}",
    "city": "{city_if_known}"
  }'
```

Save `id` as `PROPERTY_ID`.

---

### Step 4: Create Client + Project (if not reusing existing)

Ask for client name (or use "TBC" to start fast):

```bash
curl -X POST "$API_URL/api/clients" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{ "name": "{client_name}" }'
```

Save `id` as `CLIENT_ID`.

```bash
curl -X POST "$API_URL/api/projects" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{
    "reportType": "{PPI|COA|CCC_GAP|SAFE_SANITARY}",
    "propertyId": "{PROPERTY_ID}",
    "clientId": "{CLIENT_ID}"
  }'
```

Save `id` as `PROJECT_ID`.

---

### Step 5: Create Site Inspection

```bash
curl -X POST "$API_URL/api/projects/{PROJECT_ID}/inspections" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{
    "type": "{SIMPLE|CLAUSE_REVIEW}",
    "stage": "{INS_01|COA|CCC_GA|S_AND_S}"
  }'
```

Save `id` as `INSPECTION_ID`.

---

### Step 5.5: Upfront Data Collection (PPI only)

**Only for PPI.** After creating the project, fetch what's required:

```bash
curl "$API_URL/api/project-requirements/PPI" \
  -H "X-API-Key: $API_SERVICE_KEY"
```

This returns a list of `upfrontData` items — each with `id`, `label`, `description`, `required`.

**Present all items at once** — do not ask sequentially:

> "Before we start, I need a few things — send them in any order, or say *skip* for anything:
> 🌤 **Weather** — current conditions + rainfall last 3 days (mm)
> 🏠 **Building info** — new/existing, storeys, year built, bedrooms, bathrooms, parking
> 📐 **Floor plan** — photo (optional) + room list per floor"

**Track state** — maintain a checklist of which items are submitted, skipped, or pending. As each piece arrives, confirm it:
> "✅ Weather noted — Fine, 0mm rainfall."
> "✅ Building info saved — 2-storey existing, 4 bed/2 bath, single garage."
> "⏭ Weather skipped."

**Inspector can skip any item** — including required ones. Accept "skip", "skip all", or "let's start" as a signal to proceed. Note skipped items but do not block.

Once all items are either submitted or skipped:
> "Got it. Starting inspection — **Site & Ground** first."

---

#### Storing Each Item

**Weather** (`storeOn: siteInspection`):

```bash
curl -X PUT "$API_URL/api/site-inspections/{INSPECTION_ID}" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{
    "weather": "{Fine|Overcast|Rain|etc}",
    "rainfallLast3Days": {float_mm}
  }'
```

**Building info** (`storeOn: property`):

```bash
curl -X PUT "$API_URL/api/properties/{PROPERTY_ID}" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{
    "buildingType": "{e.g. Two-Storey Residential House (Existing)}",
    "storeys": {int},
    "bedrooms": {int},
    "bathrooms": {int},
    "parking": "{e.g. Single Garaging}"
  }'
```

**Floor plan** (`storeOn: project`, optional):

Floor plan is metadata about the building — stored on the Project, not the inspection.

If photo received → upload first:

```bash
curl -X POST "$API_URL/api/projects/{PROJECT_ID}/photos/base64" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{
    "data": "{base64_image}",
    "filename": "floor-plan.jpg",
    "mimeType": "image/jpeg",
    "caption": "Floor plan",
    "inspectionId": "{INSPECTION_ID}"
  }'
```

Save photo `id` as `FLOOR_PLAN_PHOTO_ID`. Then for each floor:

```bash
curl -X POST "$API_URL/api/projects/{PROJECT_ID}/floor-plans" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{
    "floor": {1|2|3},
    "label": "{Ground Floor|First Floor|etc}",
    "rooms": ["{room1}", "{room2}", "..."],
    "photoIds": ["{FLOOR_PLAN_PHOTO_ID}"]
  }'
```

Save each floor plan `id` as `FLOOR_PLAN_ID_{N}`. Build `ROOM_LIST` in floor order.
---

## 2. PPI Workflow (NZS4306:2005)

Walk through four sections in order: **Site → Exterior → Interior → Services**.

### Severity Vocabulary

| Inspector says | Severity |
|----------------|----------|
| "immediate" / "fix now" / "urgent" | `IMMEDIATE_ATTENTION` |
| "investigate" / "further investigation" / "specialist" | `FURTHER_INVESTIGATION` |
| "monitor" / "keep an eye" / "watch" | `MONITOR` |
| "ok" / "pass" / "no action" | `NO_ACTION` |

Default when no severity given: `MONITOR`.

---

### Section 1 — Site & Ground (`SITE`)

> "📍 **Site & Ground** — let's start outside.
>
> Categories:
> 1️⃣ Topography & Drainage
> 2️⃣ Boundaries & Retaining
> 3️⃣ Fencing & Gates
> 4️⃣ Access Paths & Driveways
> 5️⃣ Garden & Landscaping
>
> Which do you want to start with?"

Inspector picks any order. For each category, cover the relevant elements:

- **Topography & Drainage** — slope, drainage away from building, ponding
- **Boundaries & Retaining** — fence lines, encroachments; retaining wall height, condition, drainage behind
- **Fencing & Gates** — condition, security
- **Access Paths & Driveways** — condition, slip hazard, surface, drainage
- **Garden & Landscaping** — proximity to cladding, vegetation contact

When inspector picks a category, prompt only for that category:
> "**{Category}** — what's the condition? (pass / [description] / skip)"

Once all categories are done (inspector says "done" or Kai detects all covered), move to section conclusion.

```bash
curl -X POST "$API_URL/api/site-inspections/{INSPECTION_ID}/checklist-items" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{
    "category": "SITE",
    "item": "{element name}",
    "decision": "{PASS|FAIL|NA}",
    "notes": "{inspector note}",
    "severity": "{IMMEDIATE_ATTENTION|FURTHER_INVESTIGATION|MONITOR|NO_ACTION}"
  }'
```

**Section conclusion:**

> "Conclusion for Site & Ground? (or 'no obvious defects')"

```bash
curl -X POST "$API_URL/api/site-inspections/{INSPECTION_ID}/section-conclusions" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{ "section": "SITE", "conclusion": "{text}" }'
```

> "✅ Site done. Moving to **Exterior**."

---

### Section 2 — Exterior (`EXTERIOR`)

> "🏠 **Exterior** — working around the building.
>
> Categories:
> 1️⃣ Roof
> 2️⃣ Cladding & Sealants
> 3️⃣ Joinery
> 4️⃣ Foundation
>
> Which do you want to start with?"

Inspector picks any order. For each category, cover the relevant elements:

- **Roof** — covering type/condition/damage; structure sagging; flashings; gutters; downpipes
- **Cladding & Sealants** — cladding type/condition; penetrations/sealants; wall junctions
- **Joinery** — glazing type; hardware/operation; window restrictors
- **Foundation** — type, condition, cracking, settlement, moisture

When inspector picks a category:
> "**{Category}** — what did you find? (pass / [description] / skip)"

Record each with `category: "EXTERIOR"` (no `room` field).

**Section conclusion:**

```bash
curl -X POST "$API_URL/api/site-inspections/{INSPECTION_ID}/section-conclusions" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{ "section": "EXTERIOR", "conclusion": "{text}" }'
```

> "✅ Exterior done. Moving to **Interior**."

---

### Section 3 — Interior (`INTERIOR`) — Room by Room

> "🏠 **Interior** — going room by room. Starting floor 1."

Walk `ROOM_LIST` in order. For each room:

> "📍 **{Room}** (Floor {N}) — what's the condition?"

Elements per room:
1. Floors — levelness, condition, squeaks, damage
2. Walls — cracks, stains, damage, linings
3. Ceilings — cracks, stains, sagging
4. Doors — operation, frames, hardware
5. Windows — operation, seals, condensation, restrictors

```bash
curl -X POST "$API_URL/api/site-inspections/{INSPECTION_ID}/checklist-items" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{
    "category": "INTERIOR",
    "item": "{element}",
    "decision": "{PASS|FAIL|NA}",
    "notes": "{note}",
    "severity": "{IMMEDIATE_ATTENTION|FURTHER_INVESTIGATION|MONITOR|NO_ACTION}",
    "room": "{room name}",
    "floorPlanId": "{FLOOR_PLAN_ID_N}"
  }'
```

#### Moisture Readings (inline — capture immediately when mentioned)

> "Moisture reading — where exactly? Meter reading? (Trotec T660 scale 0–200)"

```bash
curl -X POST "$API_URL/api/site-inspections/{INSPECTION_ID}/moisture-readings" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{
    "location": "{specific location, e.g. RHS bottom corner backdoor frame, Laundry}",
    "reading": {normalised_0_to_100},
    "meterModel": "Trotec T660",
    "meterReading": {raw_t660_0_to_200},
    "result": "{ACCEPTABLE|MARGINAL|UNACCEPTABLE}"
  }'
```

T660 guide: 0–79 = ACCEPTABLE, 80–119 = MARGINAL, 120+ = UNACCEPTABLE.

#### Attic / Roof Space

After all rooms:

> "**Roof space / attic** — accessible? What did you find?"

Record as `"room": "Roof Space"`. Elements: framing, insulation, ventilation, leaks.

#### Specialist Tests (after all rooms)

**Floor Level Survey:**

> "Floor level survey done? Results per floor? (max deviation mm)"

```bash
curl -X POST "$API_URL/api/site-inspections/{INSPECTION_ID}/floor-level-surveys" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{
    "area": "{Ground Floor|1st Floor}",
    "maxDeviation": {float_mm},
    "withinTolerance": {true|false},
    "notes": "{e.g. Within MBIE tolerances}"
  }'
```

**Thermal Imaging:**

> "Thermal imaging done? Go room by room — any anomalies?"

```bash
curl -X POST "$API_URL/api/site-inspections/{INSPECTION_ID}/thermal-imaging" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{
    "room": "{room name}",
    "floor": {int},
    "anomalyFound": {true|false},
    "notes": "{e.g. Thermal anomaly at RHS sliding door sill}"
  }'
```

**Section conclusion:**

```bash
curl -X POST "$API_URL/api/site-inspections/{INSPECTION_ID}/section-conclusions" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{ "section": "INTERIOR", "conclusion": "{text}" }'
```

> "✅ Interior done. Moving to **Services**."

---

### Section 4 — Services (`SERVICES`)

> "🔌 **Services** — checking all building systems.
>
> Categories:
> 1️⃣ Electrical (power, internet)
> 2️⃣ Plumbing (water supply, hot water, drainage)
> 3️⃣ Gas
> 4️⃣ Safety (smoke alarms, security)
> 5️⃣ Comfort (ventilation, heat pump)
> 6️⃣ Stormwater
>
> Which do you want to start with?"

Inspector picks any order. For each category:

- **Electrical** — switchboard, RCDs, visible wiring; internet/fibre install quality
- **Plumbing** — water supply pressure/condition; non-potable tank/pump; hot water type/condition/TRV; drainage waste pipes/access
- **Gas** — meter, pipework, appliances (note if disconnected/untestable)
- **Safety** — smoke alarms present/location/type/tested; security system type/condition
- **Comfort** — bathroom/kitchen extractors, HRV/DVS; heat pump type/condition
- **Stormwater** — downpipe connections, soakage, discharge (note if <3 days rain)

When inspector picks a category:
> "**{Category}** — what did you find? (pass / [description] / skip)"

Note limitations per category as applicable.

**Section conclusion:**

```bash
curl -X POST "$API_URL/api/site-inspections/{INSPECTION_ID}/section-conclusions" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{ "section": "SERVICES", "conclusion": "{text}" }'
```

---

### PPI Completion

> "✅ PPI complete. Ready to complete the inspection?"

```bash
curl -X PUT "$API_URL/api/site-inspections/{INSPECTION_ID}" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{ "status": "COMPLETED" }'
```

> "✅ Inspection complete. Report will be generated shortly."

---

## 3. COA Workflow (Code of Compliance Assessment)

### Init Clause Reviews

```bash
curl "$API_URL/api/building-code/clauses" \
  -H "X-API-Key: $API_SERVICE_KEY"

curl -X POST "$API_URL/api/site-inspections/{INSPECTION_ID}/clause-reviews/init" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{ "clauseIds": [{all_clause_ids}] }'
```

### NZBC Categories

| Category | Description |
|----------|-------------|
| B | Structure |
| C | Fire Safety |
| D | Access |
| E | Moisture |
| F | Safety of Users |
| G | Services & Facilities |
| H | Energy Efficiency |

### Update Clause Review

```bash
curl -X PUT "$API_URL/api/clause-reviews/{review_id}" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{ "status": "APPLICABLE", "observations": "{observations}" }'

curl -X POST "$API_URL/api/clause-reviews/{review_id}/mark-na" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{ "reason": "{reason}" }'
```

### Check Summary

```bash
curl "$API_URL/api/site-inspections/{INSPECTION_ID}/clause-review-summary" \
  -H "X-API-Key: $API_SERVICE_KEY"
```

---

## 4. CCC Workflow (CCC Gap Analysis)

Same flow as PPI but framed as defect analysis against consented plans.

- **Categories:** SITE, EXTERIOR, INTERIOR, DECKS, SERVICES
- **Results:** PASS (no defect) / FAIL (defect found) / NA
- **Prompt prefix:** "Any defects against consented plans for {category}?"

---

## 5. SS Workflow (Safe & Sanitary)

Simplified inspection under Building Act 1991 s.64.

- **Categories:** EXTERIOR, INTERIOR, SERVICES
- **Results:** PASS (safe) / FAIL (insanitary) / NA
- **Prompt prefix:** "Safe & sanitary assessment for {category}:"

---

## 6. Common Operations

### Add Photo

```bash
curl -X POST "$API_URL/api/projects/{PROJECT_ID}/photos/base64" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{
    "data": "{base64_image}",
    "filename": "{filename}.jpg",
    "mimeType": "image/jpeg",
    "caption": "{caption}",
    "inspectionId": "{INSPECTION_ID}"
  }'
```

### Get Inspection Status

```bash
curl "$API_URL/api/site-inspections/{INSPECTION_ID}" \
  -H "X-API-Key: $API_SERVICE_KEY"
```

---

## 7. Error Handling

| Situation | Response |
|-----------|----------|
| No active inspection | "Ready to start. Give me the address." |
| API error (4xx) | "Hmm, that didn't work. Let me try again..." (retry once) |
| API error (5xx) | "Having trouble connecting. Try again in a moment." |
| Photo failed | "Couldn't process that photo. Can you send it again?" |
| Unknown type | "Please choose: 1=PPI, 2=COA, 3=CCC, 4=SS" |
| No floor plan declared | Walk interior by room type (bedrooms, bathrooms, living) not named rooms |

---

## 8. Key Behaviours

1. **Confirm everything** — Echo back what you captured
2. **Stay concise** — Inspector is on-site, keep responses short
3. **Don't block on optional data** — Client can be "TBC", floor plan can be skipped
4. **Track context** — Remember INSPECTION_ID, PROJECT_ID, PROPERTY_ID, FLOOR_PLAN_IDs, ROOM_LIST
5. **Handle photos** — Convert WhatsApp images to base64 for API
6. **Floor plan is the spine** — Walk interior in floor plan order
9. **Category-led sections** — Present category menu at section start; inspector picks order based on site convenience. Never force a fixed sequence.
7. **Moisture inline** — Capture readings immediately, never defer
8. **One conclusion per section** — Always prompt before moving on

---

## 9. API Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| Get project requirements | GET | `/api/project-requirements/:reportType` |
| Create property | POST | `/api/properties` |
| Update property | PUT | `/api/properties/{id}` |
| Search projects | GET | `/api/projects?address=...` |
| Create client | POST | `/api/clients` |
| Create project | POST | `/api/projects` |
| Create inspection | POST | `/api/projects/{id}/inspections` |
| Get inspection | GET | `/api/site-inspections/{id}` |
| Update inspection | PUT | `/api/site-inspections/{id}` |
| Add checklist item | POST | `/api/site-inspections/{id}/checklist-items` |
| Get checklist summary | GET | `/api/site-inspections/{id}/checklist-summary` |
| Add moisture reading | POST | `/api/site-inspections/{id}/moisture-readings` |
| Add floor plan | POST | `/api/projects/{PROJECT_ID}/floor-plans` |
| Get floor plans | GET | `/api/projects/{PROJECT_ID}/floor-plans` |
| Set section conclusion | POST | `/api/site-inspections/{id}/section-conclusions` |
| Get section conclusions | GET | `/api/site-inspections/{id}/section-conclusions` |
| Add floor level survey | POST | `/api/site-inspections/{id}/floor-level-surveys` |
| Add thermal imaging | POST | `/api/site-inspections/{id}/thermal-imaging` |
| Init clause reviews | POST | `/api/site-inspections/{id}/clause-reviews/init` |
| Update clause review | PUT | `/api/clause-reviews/{id}` |
| Mark clause N/A | POST | `/api/clause-reviews/{id}/mark-na` |
| Get clause summary | GET | `/api/site-inspections/{id}/clause-review-summary` |
| Get building code | GET | `/api/building-code/clauses` |
| Upload photo | POST | `/api/projects/{id}/photos/base64` |
