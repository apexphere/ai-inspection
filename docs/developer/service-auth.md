# Service Authentication (Developer Guide)

## Overview

The API supports two authentication methods:

| Method | Used By | Middleware |
|--------|---------|------------|
| JWT | Web UI users | `authMiddleware` |
| API Key | Kai agent / services | `serviceAuthMiddleware` |

See `docs/developer/authentication.md` for the high-level overview.

## Protecting Routes

### JWT-only Routes

Use `authMiddleware` — rejects API keys:

```typescript
app.use('/api/personnel', authMiddleware, personnelRouter);
```

Use this for sensitive routes (personnel, credentials, companies, admin functions).

### Service + JWT Routes

Use `serviceAuthMiddleware` — accepts both JWT and API key — then add `requireScope`:

```typescript
import { serviceAuthMiddleware, requireScope } from './middleware/auth.js';

app.use('/api/projects', serviceAuthMiddleware, requireScope('projects:read'), projectsRouter);
```

Individual write operations within the router should use `requireScope('projects:write')`.

### Wildcard Scopes

The scope check supports `resource:*` wildcards:

```typescript
requireScope('inspections:read')  // matches "inspections:read" or "inspections:*"
requireScope('inspections:write') // matches "inspections:write" or "inspections:*"
```

## Request Context

After authentication, the following fields are set on `req`:

| Field | JWT Auth | API Key Auth |
|-------|----------|--------------|
| `req.userId` | User UUID | `"service:<keyName>"` e.g. `"service:kai-agent"` |
| `req.serviceActor` | `undefined` | `"agent:kai"` |
| `req.serviceScopes` | `undefined` | `["inspections:*", ...]` |
| `req.isServiceAuth` | `false` | `true` |

Use `req.serviceActor` for audit trails and `createdBy`/`updatedBy` attribution:

```typescript
const inspection = await service.create({
  ...data,
  createdBy: req.serviceActor || req.userId,
});
```

## Service Key Repository

```typescript
import { ServiceKeyService } from '../services/service-key.js';

// Create a key (returns plaintext once)
const { key, record } = await serviceKeyService.create({
  name: 'kai-agent',
  actor: 'agent:kai',
  scopes: ['inspections:*', 'projects:*'],
});

// Validate a key (called by middleware)
const record = await serviceKeyService.validateKey(apiKey);

// Deactivate
await serviceKeyService.deactivate(id);
```

## Adding a New Scope

1. Add the scope string to the relevant `requireScope()` call in `api/src/index.ts`
2. Update Kai's key via the admin endpoint to include the new scope
3. Document the scope in `docs/ops/service-keys.md`

## Testing

Use the `ServiceKey` test helpers:

```typescript
import { createTestServiceKey } from '../__tests__/helpers/service-key.js';

const { key } = await createTestServiceKey({
  scopes: ['inspections:read'],
});

const res = await request(app)
  .get('/api/site-inspections')
  .set('X-API-Key', key);

expect(res.status).toBe(200);
```

Test scope rejection:

```typescript
const { key } = await createTestServiceKey({ scopes: ['projects:read'] });

const res = await request(app)
  .get('/api/site-inspections')
  .set('X-API-Key', key);

expect(res.status).toBe(403);
```
