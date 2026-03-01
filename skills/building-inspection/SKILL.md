---
name: building-inspection
description: Guide building inspectors through property inspections via WhatsApp. Use when user mentions inspection, property check, building survey, or arrives at an address. Captures findings and photos section-by-section, generates PDF reports.
---

# Building Inspection Assistant

Guide inspectors through NZS4306-style residential property inspections via WhatsApp.

## API Configuration

**Base URL:** `$AI_INSPECTION_API_URL`

All API calls use `curl` with JSON. Include API key if set in environment:

```bash
API_URL="$AI_INSPECTION_API_URL"
API_KEY="$SERVICE_API_KEY"
```

## Workflow

### 1. Start Inspection

When inspector mentions an address:

```bash
curl -X POST "$API_URL/api/inspections" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $SERVICE_API_KEY" \
  -d '{
    "address": "45 Oak Avenue",
    "client_name": "Smith",
    "inspector_name": "John",
    "checklist": "nz-ppi"
  }'
```

**Response:** `{ "id": "uuid", "address": "...", "status": "IN_PROGRESS", ... }`

Save the `id` for subsequent calls.

### 2. Get Inspection Status

```bash
curl "$API_URL/api/inspections/{id}" \
  -H "X-API-Key: $SERVICE_API_KEY"
```

### 3. Add Finding

```bash
curl -X POST "$API_URL/api/inspections/{id}/findings" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $SERVICE_API_KEY" \
  -d '{
    "section": "exterior",
    "text": "Gutters rusted on north side",
    "severity": "minor"
  }'
```

**Severity options:** `info`, `minor`, `major`, `urgent`

### 4. Add Photo to Finding

```bash
curl -X POST "$API_URL/api/findings/{finding_id}/photos" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $SERVICE_API_KEY" \
  -d '{
    "data": "<base64>",
    "filename": "gutters.jpg",
    "mime_type": "image/jpeg"
  }'
```

### 5. Navigate Sections

```bash
curl -X POST "$API_URL/api/inspections/{id}/navigate" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $SERVICE_API_KEY" \
  -d '{ "section": "interior" }'
```

**Section order:** exterior → subfloor → interior → kitchen → bathroom → electrical → plumbing → roof_space

### 6. Complete Inspection

```bash
curl -X POST "$API_URL/api/inspections/{id}/complete" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $SERVICE_API_KEY" \
  -d '{
    "summary_notes": "Overall good condition",
    "weather": "Fine"
  }'
```

### 7. Get Report

```bash
curl "$API_URL/api/inspections/{id}/report?format=pdf" \
  -H "X-API-Key: $SERVICE_API_KEY"
```

## Key Behaviors

1. **Confirm everything** — Echo back what you captured
2. **Stay concise** — Inspector is on-site, keep responses short
3. **Infer section** — Use current section if not specified
4. **Handle photos** — Convert WhatsApp images to base64 for API

## Section Prompts

| Section | Prompt |
|---------|--------|
| Exterior | "Check roof, gutters, cladding, external walls, decks" |
| Subfloor | "Check moisture, ventilation, piles, insulation" |
| Interior | "Check walls, ceilings, floors, doors, windows" |
| Kitchen | "Check under sink, rangehood, cabinetry, benchtops" |
| Bathroom | "Check shower/bath, toilet, vanity, ventilation, tiles" |
| Electrical | "Check switchboard, outlets, switches, wiring, smoke alarms" |
| Plumbing | "Check hot water, pipes, water pressure, drainage" |
| Roof Space | "Check framing, insulation, ventilation, signs of leaks" |

## Conversation Boundaries

### During Active Inspection

Stay focused. Redirect to inspection.

### No Active Inspection

> "Hi! Ready to start an inspection? Give me the address."

## Error Handling

| Situation | Response |
|-----------|----------|
| No active inspection | "No inspection in progress. Tell me the address to start." |
| API error | "Trouble saving that. Trying again..." (retry once) |
| Photo failed | "Couldn't process that photo. Can you send it again?" |

## API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/inspections` | POST | Create inspection |
| `/api/inspections/{id}` | GET | Get inspection status |
| `/api/inspections/{id}` | PUT | Update inspection |
| `/api/inspections/{id}/findings` | POST | Add finding |
| `/api/inspections/{id}/navigate` | POST | Navigate sections |
| `/api/inspections/{id}/complete` | POST | Complete inspection |
| `/api/inspections/{id}/report` | GET | Get report |
| `/api/findings/{id}/photos` | POST | Add photo to finding |
