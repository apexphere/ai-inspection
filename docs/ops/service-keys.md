# Service Key Management

## Overview

Service API keys allow external services (e.g. the Kai WhatsApp agent) to authenticate with the API without a JWT. Keys are scoped to specific resources and stored hashed in the database.

## Creating a Service Key

Call the admin endpoint (requires admin JWT):

```bash
curl -X POST https://api-ai-inspection.apexphere.co.nz/api/admin/service-keys \
  -H "Authorization: Bearer <admin-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "kai-agent",
    "actor": "agent:kai",
    "scopes": [
      "inspections:*",
      "projects:*",
      "properties:*",
      "clients:*",
      "checklist:*",
      "clause-reviews:*",
      "building-code:read",
      "photos:*"
    ]
  }'
```

Response (key shown **once only**):

```json
{
  "id": "uuid",
  "name": "kai-agent",
  "key": "sk_abc12345...",
  "actor": "agent:kai",
  "scopes": ["inspections:*", ...]
}
```

Store the key securely — it cannot be retrieved again.

## Available Scopes

| Scope | Access |
|-------|--------|
| `inspections:read` | GET site-inspections |
| `inspections:write` | POST/PUT site-inspections |
| `projects:read` | GET projects |
| `projects:write` | POST/PUT projects |
| `properties:read` | GET properties |
| `properties:write` | POST/PUT properties |
| `clients:read` | GET clients |
| `clients:write` | POST/PUT clients |
| `checklist:read` | GET checklist items/summary |
| `checklist:write` | POST/PUT/DELETE checklist items |
| `clause-reviews:read` | GET clause reviews/summary |
| `clause-reviews:write` | POST/PUT/DELETE clause reviews |
| `building-code:read` | GET building code clauses |
| `photos:read` | GET project photos |
| `photos:write` | POST/PUT/DELETE project photos |

Use `resource:*` as a wildcard for both read and write (e.g. `inspections:*`).

**Never grant service keys access to:** personnel, credentials, companies, report-management (JWT only).

## Listing Keys

```bash
curl https://api-ai-inspection.apexphere.co.nz/api/admin/service-keys \
  -H "Authorization: Bearer <admin-jwt>"
```

Returns all keys with metadata (no keyHash).

## Deactivating a Key

```bash
curl -X DELETE https://api-ai-inspection.apexphere.co.nz/api/admin/service-keys/<id> \
  -H "Authorization: Bearer <admin-jwt>"
```

Key is deactivated (not deleted) — `active: false`. Existing requests using it will immediately return 401.

## Key Rotation (Zero-Downtime)

1. Create a new key with the same scopes
2. Update the consumer (e.g. set `SERVICE_API_KEY` in OpenClaw agent env)
3. Deactivate the old key
4. Both keys work during the transition window

## Kai Agent Configuration

Set the key in the OpenClaw host environment:

```bash
export SERVICE_API_KEY=sk_abc12345...
```

The building-inspection skill sends it automatically as `X-API-Key: $SERVICE_API_KEY` on every API call.
