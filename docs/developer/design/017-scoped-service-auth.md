# Design: Scoped Service Authentication & Actor Context

**Issue:** #577
**Author:** Riley 📐
**Status:** Draft

## Overview

Replace the current all-or-nothing service API key with scoped keys that carry permissions and actor identity. This ensures least-privilege access for service consumers and meaningful audit trails.

## Current State

```typescript
// api/src/middleware/auth.ts
if (apiKey && expectedApiKey && apiKey === expectedApiKey) {
  req.userId = 'service';  // No identity, no scoping
  next();
}
```

Problems:
1. Single shared key → full access to every `serviceAuthMiddleware` route
2. `req.userId = 'service'` → no audit trail of who/what made the call
3. No way to restrict what a service consumer can do
4. No key rotation without downtime

## Design

### 1. Service Key Model

Store service keys in the database with scopes and metadata.

```prisma
model ServiceKey {
  id          String    @id @default(uuid())
  name        String    @unique          // e.g. "kai-agent"
  keyHash     String    @unique          // bcrypt hash of the key
  keyPrefix   String                     // first 8 chars for identification
  scopes      String[]                   // e.g. ["inspections:read", "inspections:write"]
  actor       String                     // e.g. "agent:kai"
  active      Boolean   @default(true)
  expiresAt   DateTime?
  lastUsedAt  DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([keyPrefix])
}
```

Keys are stored hashed. The `keyPrefix` (first 8 chars) is used for fast lookup before doing the bcrypt compare.

### 2. Scope Definitions

Scopes follow `resource:action` pattern:

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
| `health:read` | GET /health (implicit, always allowed) |

**Kai's key would have:** `inspections:*`, `projects:*`, `properties:*`, `clients:*`, `checklist:*`, `clause-reviews:*`, `building-code:read`, `photos:*`

**Excluded from any service scope:** `personnel`, `credentials`, `companies`, `report-management`, `report-transitions`, `admin`.

### 3. Middleware Changes

#### Extended AuthRequest

```typescript
export interface AuthRequest extends Request {
  userId?: string;
  serviceActor?: string;    // e.g. "agent:kai"
  serviceScopes?: string[]; // e.g. ["inspections:read", "inspections:write"]
  isServiceAuth?: boolean;
}
```

#### Updated serviceAuthMiddleware

```typescript
export async function serviceAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = req.headers['x-api-key'] as string | undefined;

  if (apiKey) {
    const prefix = apiKey.slice(0, 8);
    const serviceKey = await findServiceKeyByPrefix(prefix);

    if (serviceKey && serviceKey.active && await bcrypt.compare(apiKey, serviceKey.keyHash)) {
      if (serviceKey.expiresAt && serviceKey.expiresAt < new Date()) {
        res.status(401).json({ error: 'API key expired' });
        return;
      }

      req.userId = `service:${serviceKey.name}`;
      req.serviceActor = serviceKey.actor;
      req.serviceScopes = serviceKey.scopes;
      req.isServiceAuth = true;

      // Update last used (fire-and-forget)
      updateLastUsed(serviceKey.id);

      next();
      return;
    }
  }

  // Fall back to JWT auth
  // ... existing JWT logic
}
```

#### Scope Checking Middleware

```typescript
export function requireScope(...scopes: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // JWT users bypass scope checks
    if (!req.isServiceAuth) {
      next();
      return;
    }

    const hasScope = scopes.some(scope => {
      const [resource, action] = scope.split(':');
      return req.serviceScopes?.includes(scope)
        || req.serviceScopes?.includes(`${resource}:*`);
    });

    if (!hasScope) {
      res.status(403).json({ error: 'Insufficient scope', required: scopes });
      return;
    }

    next();
  };
}
```

### 4. Route Wiring

```typescript
// Agent-accessible routes (serviceAuthMiddleware + scope check)
app.use('/api/projects', serviceAuthMiddleware, requireScope('projects:read', 'projects:write'), projectsRouter);
app.use('/api/properties', serviceAuthMiddleware, requireScope('properties:read', 'properties:write'), propertiesRouter);
app.use('/api', serviceAuthMiddleware, requireScope('inspections:read', 'inspections:write'), siteInspectionsRouter);
app.use('/api', serviceAuthMiddleware, requireScope('checklist:read', 'checklist:write'), checklistItemsRouter);
app.use('/api', serviceAuthMiddleware, requireScope('clause-reviews:read', 'clause-reviews:write'), clauseReviewsRouter);
app.use('/api/building-code', serviceAuthMiddleware, requireScope('building-code:read'), buildingCodeRouter);

// JWT-only routes (never service-accessible)
app.use('/api/personnel', authMiddleware, personnelRouter);
app.use('/api/credentials', authMiddleware, credentialsRouter);
app.use('/api/companies', authMiddleware, companiesRouter);
```

### 5. Actor Context in Audit Trail

Downstream code uses `req.serviceActor` for attribution:

```typescript
const item = await service.create({
  ...parsed.data,
  inspectionId,
  createdBy: req.serviceActor || req.userId,  // "agent:kai" or "user-uuid"
});
```

### 6. Key Management

#### Admin Endpoint (requireAdmin)

```
POST /api/admin/service-keys
{
  "name": "kai-agent",
  "actor": "agent:kai",
  "scopes": ["inspections:*", "projects:*", ...],
  "expiresAt": "2027-01-01T00:00:00Z"
}
→ { "key": "sk_abc12345...", "id": "uuid" }
```

Key is shown once at creation, then only the hash is stored.

#### Rotation
1. Create new key with same scopes
2. Update agent env with new key
3. Deactivate old key
4. Zero-downtime: both keys work during transition

### 7. Migration Path

1. Add `ServiceKey` model to Prisma schema + migrate
2. Seed a key for Kai with current `SERVICE_API_KEY` value (hashed)
3. Update middleware to check DB keys first, fall back to env var (backward compat)
4. Once verified, remove `SERVICE_API_KEY` env var fallback
5. Update skill to use new key format

## Files Changed

| File | Change |
|------|--------|
| `api/prisma/schema.prisma` | Add `ServiceKey` model |
| `api/src/middleware/auth.ts` | Scoped middleware + `requireScope` |
| `api/src/index.ts` | Route wiring with scope checks |
| `api/src/routes/admin.ts` | New — key management endpoints |
| `api/src/repositories/prisma/service-key.ts` | New — key repository |
| `api/src/services/service-key.ts` | New — key service |

## Out of Scope

- Per-endpoint rate limiting for service keys (future)
- OAuth2 client credentials flow (over-engineered for current needs)
- Multi-tenant key isolation (single deployment)
