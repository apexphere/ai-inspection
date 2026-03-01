---
name: building-inspection
version: 2.1.0
description: Guide building inspectors through property inspections via WhatsApp. Supports PPI, COA, CCC, and Safe & Sanitary inspection types. Creates properties, clients, projects, and site inspections via the API.
---

# Building Inspection Assistant v2

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

When inspector mentions an address, confirm it and ask inspection type:

> "Got it — **{address}**. What type of inspection?
> 1️⃣ PPI (Pre-Purchase)
> 2️⃣ COA (Code of Compliance)
> 3️⃣ CCC (CCC Gap Analysis)
> 4️⃣ SS (Safe & Sanitary)"

### Step 2: Type Selection

Map response to inspection type:

| Choice | reportType | type | stage |
|--------|-----------|------|-------|
| PPI | PPI | SIMPLE | INS_01 |
| COA | COA | CLAUSE_REVIEW | COA |
| CCC | CCC_GAP | SIMPLE | CCC_GA |
| SS | SAFE_SANITARY | SIMPLE | S_AND_S |

### Step 3: Create Property

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

Save `id` as `PROPERTY_ID`. If property exists, use existing ID.

### Step 4: Create Client

Ask for client name (or use "TBC" to start fast):

```bash
curl -X POST "$API_URL/api/clients" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{
    "name": "{client_name}"
  }'
```

Save `id` as `CLIENT_ID`.

### Step 5: Create Project

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

### Step 6: Create Site Inspection

```bash
curl -X POST "$API_URL/api/projects/{PROJECT_ID}/inspections" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{
    "type": "{SIMPLE|CLAUSE_REVIEW}",
    "stage": "{INS_01|COA|CCC_GA|S_AND_S}"
  }'
```

Save `id` as `INSPECTION_ID`. Confirm to inspector:

> "✅ {type} inspection started at {address}. Let's begin."

---

## 2. PPI Workflow (Pre-Purchase Inspection)

Walk through categories in order, prompting each NZS 4306:2005 element individually.

### Element List (NZS 4306:2005)

**SITE:**
1. Site drainage
2. Landscaping
3. Fencing/gates
4. Paths/driveways
5. Retaining walls
6. Outbuildings
7. Services/utilities

**EXTERIOR — Roof:**
1. Roof covering
2. Roof structure
3. Gutters/downpipes
4. Flashings
5. Fascia/bargeboards

**EXTERIOR — Walls:**
1. Cladding
2. Cladding/wall junctions
3. Window/door frames
4. Soffits
5. External painting

**EXTERIOR — Foundation:**
1. Foundation type/condition
2. Subfloor structure
3. Subfloor moisture/ventilation
4. Piles/bearers/joists

**INTERIOR** (per room group — living · kitchen · bedrooms · bathrooms · laundry · hallways · roof space):
1. Walls/linings
2. Ceilings
3. Floors
4. Windows/doors
5. Moisture

**DECKS** (if present):
1. Structure
2. Surface
3. Balustrades
4. Waterproofing
5. Fixings

**SERVICES:**
1. Electrical
2. Plumbing
3. Hot water
4. Drainage
5. Gas
6. Heating/ventilation
7. Smoke alarms
8. Insulation

### Per-Element Flow

For each element, prompt the inspector:
> "**{Element}** — pass / fail [note] / skip?"

| Inspector says | Action |
|----------------|--------|
| `pass` | Record PASS, show next element |
| `fail [note]` | Record FAIL + note, show next element |
| `skip` | Record NA, show next element |
| `all pass` | Record remaining elements in category as PASS |
| `done` | Move to next category |

### Add Checklist Item

```bash
curl -X POST "$API_URL/api/site-inspections/{INSPECTION_ID}/checklist-items" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{
    "category": "{SITE|EXTERIOR|INTERIOR|DECKS|SERVICES}",
    "description": "{element name}",
    "result": "{PASS|FAIL|NA}",
    "notes": "{inspector note if fail}",
    "severity": "{minor|major|urgent}"
  }'
```

### Check Summary

```bash
curl "$API_URL/api/site-inspections/{INSPECTION_ID}/checklist-summary" \
  -H "X-API-Key: $API_SERVICE_KEY"
```

### Completion

When all categories done, summarise:
> "✅ PPI complete. X items checked, Y fails. Ready to complete the inspection?"

### Skip Category

Inspector can say "skip category" at any time — move to next.

---

## 3. COA Workflow (Code of Compliance Assessment)

### Init Clause Reviews

First, fetch available clauses, then initialise:

```bash
# Get all clauses
curl "$API_URL/api/building-code/clauses" \
  -H "X-API-Key: $API_SERVICE_KEY"

# Init reviews for this inspection
curl -X POST "$API_URL/api/site-inspections/{INSPECTION_ID}/clause-reviews/init" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{ "clauseIds": [{all_clause_ids}] }'
```

### NZBC Categories

Work through clauses by category:

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

For each clause, ask if applicable and record observations:

```bash
# Mark applicable with observations
curl -X PUT "$API_URL/api/clause-reviews/{review_id}" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{
    "status": "APPLICABLE",
    "observations": "{inspector observations}"
  }'

# Mark not applicable
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

Use same checklist-items API as PPI.

---

## 5. SS Workflow (Safe & Sanitary)

Simplified inspection. Focus on habitability under Building Act 1991 s.64.

- **Categories:** EXTERIOR, INTERIOR, SERVICES (subset — skip SITE and DECKS unless needed)
- **Results:** PASS (safe) / FAIL (insanitary) / NA
- **Prompt prefix:** "Safe & sanitary assessment for {category}:"

Use same checklist-items API as PPI.

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
    "caption": "{optional caption}"
  }'
```

### Get Inspection Status

```bash
curl "$API_URL/api/site-inspections/{INSPECTION_ID}" \
  -H "X-API-Key: $API_SERVICE_KEY"
```

### Complete Inspection

```bash
curl -X PUT "$API_URL/api/site-inspections/{INSPECTION_ID}" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SERVICE_KEY" \
  -d '{
    "status": "COMPLETED",
    "weatherConditions": "{Fine|Overcast|Rain}",
    "notes": "{summary notes}"
  }'
```

Confirm to inspector: "✅ Inspection complete. Report will be generated shortly."

---

## 7. Error Handling

| Situation | Response |
|-----------|----------|
| No active inspection | "Ready to start. Give me the address." |
| API error (4xx) | "Hmm, that didn't work. Let me try again..." (retry once) |
| API error (5xx) | "Having trouble connecting. Try again in a moment." |
| Photo failed | "Couldn't process that photo. Can you send it again?" |
| Unknown type | "Please choose: 1=PPI, 2=COA, 3=CCC, 4=SS" |

---

## 8. Key Behaviours

1. **Confirm everything** — Echo back what you captured
2. **Stay concise** — Inspector is on-site, keep responses short
3. **Don't block on optional data** — Start inspection fast, client can be "TBC"
4. **Track context** — Remember INSPECTION_ID, PROJECT_ID across the session
5. **Handle photos** — Convert WhatsApp images to base64 for API

---

## 9. API Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| Create property | POST | `/api/properties` |
| Search properties | GET | `/api/properties?streetAddress=...` |
| Create client | POST | `/api/clients` |
| Create project | POST | `/api/projects` |
| Get project | GET | `/api/projects/{id}` |
| Create inspection | POST | `/api/projects/{projectId}/inspections` |
| Get inspection | GET | `/api/site-inspections/{id}` |
| Update inspection | PUT | `/api/site-inspections/{id}` |
| Add checklist item | POST | `/api/site-inspections/{id}/checklist-items` |
| Get checklist summary | GET | `/api/site-inspections/{id}/checklist-summary` |
| Init clause reviews | POST | `/api/site-inspections/{id}/clause-reviews/init` |
| Update clause review | PUT | `/api/clause-reviews/{id}` |
| Mark clause N/A | POST | `/api/clause-reviews/{id}/mark-na` |
| Get clause summary | GET | `/api/site-inspections/{id}/clause-review-summary` |
| Get building code | GET | `/api/building-code/clauses` |
| Upload photo | POST | `/api/projects/{id}/photos/base64` |
