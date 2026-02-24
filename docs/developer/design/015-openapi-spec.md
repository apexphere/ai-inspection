# Design: OpenAPI Specification

**Status:** Draft  
**Author:** Archer  
**Date:** 2026-02-23  
**Ticket:** #426

---

## Problem

The API has 21 route files but no OpenAPI specification. This creates issues:

1. **No interactive docs** — Developers must read code to understand endpoints
2. **MCP integration friction** — MCP server needs to know API contract
3. **No validation consistency** — Manual effort to keep docs in sync with code
4. **No client SDK path** — Can't auto-generate typed clients

---

## Goals

1. OpenAPI 3.1 spec for all public endpoints
2. Interactive docs (Swagger UI) at `/api/docs`
3. Spec stays in sync with code (generated, not manual)
4. Minimal refactoring of existing routes

---

## Current State

- **Framework:** Express.js
- **Validation:** Zod schemas (already defined per route)
- **Routes:** 21 files, well-structured
- **Patterns:** `router.get/post/put/delete` with Zod validation

Example from `inspections.ts`:
```typescript
const CreateInspectionSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  clientName: z.string().min(1, 'Client name is required'),
  // ...
});

inspectionsRouter.post('/', async (req, res) => {
  const parsed = CreateInspectionSchema.safeParse(req.body);
  // ...
});
```

---

## Decision

### Approach: `@asteasolutions/zod-to-openapi`

Generate OpenAPI spec from existing Zod schemas.

**Why this approach:**

| Option | Effort | Pros | Cons |
|--------|--------|------|------|
| **zod-to-openapi** | Low | Leverages existing Zod schemas, minimal changes | Requires registering schemas |
| tsoa | High | Full framework with validation | Requires rewriting all routes as controllers |
| Manual YAML | Medium | Full control | Drifts from code, maintenance burden |
| express-openapi | Medium | Express-native | Different validation approach |

**zod-to-openapi wins** because we already have Zod schemas. We just need to:
1. Register schemas with OpenAPI metadata
2. Define routes in a registry
3. Generate spec and serve UI

---

## Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        api/src/                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  routes/                    openapi/                         │
│  ├── inspections.ts         ├── registry.ts   ← Schema reg  │
│  ├── projects.ts            ├── schemas.ts    ← Zod → OA    │
│  └── ...                    ├── routes.ts     ← Route defs  │
│                             └── index.ts      ← Generator    │
│                                                              │
│  index.ts                                                    │
│  └── app.use('/api/docs', swaggerUi)                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Schema Registration

Extend existing Zod schemas with OpenAPI metadata:

```typescript
// openapi/schemas.ts
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

// Re-export schemas with OpenAPI extensions
export const CreateInspectionSchema = z.object({
  address: z.string().min(1).openapi({ example: '123 Main St' }),
  clientName: z.string().min(1).openapi({ example: 'John Smith' }),
  inspectorName: z.string().optional(),
  checklistId: z.string().uuid(),
}).openapi('CreateInspectionRequest');

export const InspectionSchema = z.object({
  id: z.string().uuid(),
  address: z.string(),
  clientName: z.string(),
  status: z.enum(['STARTED', 'IN_PROGRESS', 'COMPLETED']),
  createdAt: z.string().datetime(),
  // ...
}).openapi('Inspection');
```

### Route Registration

```typescript
// openapi/routes.ts
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { CreateInspectionSchema, InspectionSchema } from './schemas';

export const registry = new OpenAPIRegistry();

registry.registerPath({
  method: 'post',
  path: '/api/inspections',
  summary: 'Create inspection',
  tags: ['Inspections'],
  request: {
    body: {
      content: {
        'application/json': { schema: CreateInspectionSchema },
      },
    },
  },
  responses: {
    201: {
      description: 'Inspection created',
      content: {
        'application/json': { schema: InspectionSchema },
      },
    },
    400: {
      description: 'Validation error',
    },
  },
});
```

### Spec Generation

```typescript
// openapi/index.ts
import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { registry } from './routes';

export function generateOpenApiSpec() {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  
  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'AI Inspection API',
      version: '1.0.0',
      description: 'Building inspection management API',
    },
    servers: [
      { url: 'https://api-test-ai-inspection.apexphere.co.nz', description: 'Test' },
      { url: 'https://api-ai-inspection.apexphere.co.nz', description: 'Production' },
    ],
  });
}
```

### Swagger UI

```typescript
// index.ts
import swaggerUi from 'swagger-ui-express';
import { generateOpenApiSpec } from './openapi';

const spec = generateOpenApiSpec();

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec));
app.get('/api/openapi.json', (req, res) => res.json(spec));
```

---

## Endpoints to Document

### Priority 1: Core Workflow
- `POST /api/inspections` — Start inspection
- `GET /api/inspections/:id` — Get inspection
- `PUT /api/inspections/:id` — Update inspection
- `POST /api/findings` — Add finding
- `POST /api/photos` — Upload photo
- `GET /api/reports/:inspectionId` — Generate report

### Priority 2: Supporting
- `/api/projects` — Project CRUD
- `/api/clients` — Client management
- `/api/inspectors` — Inspector management
- `/api/checklists` — Checklist templates

### Priority 3: Reference
- `/api/building-code` — NZ building code reference
- `/api/health` — Health check

### Excluded (Internal)
- Auth endpoints (separate auth docs)

---

## File Structure

```
api/src/
├── openapi/
│   ├── index.ts           # Generator + exports
│   ├── registry.ts        # OpenAPI registry setup
│   ├── schemas/           # Zod schemas with OA extensions
│   │   ├── inspection.ts
│   │   ├── finding.ts
│   │   ├── project.ts
│   │   └── ...
│   └── routes/            # Route definitions
│       ├── inspections.ts
│       ├── findings.ts
│       └── ...
├── routes/                # Existing routes (unchanged)
└── index.ts               # Add Swagger UI mount
```

---

## Implementation Plan

### Phase 1: Foundation
1. **Install dependencies** — zod-to-openapi, swagger-ui-express
2. **Setup registry** — Create openapi/ structure
3. **Mount Swagger UI** — /api/docs endpoint

### Phase 2: Core Schemas
4. **Inspection schemas** — Create, Update, Response
5. **Finding schemas** — With photo associations
6. **Report schemas** — Generation request/response

### Phase 3: Route Registration
7. **Register core routes** — Inspections, findings, photos, reports
8. **Register supporting routes** — Projects, clients, inspectors
9. **Register reference routes** — Building code, health

### Phase 4: Polish
10. **Add examples** — Request/response examples
11. **Error schemas** — Standardize error responses
12. **Review and test** — Verify all routes documented

---

## Effort Estimate

| Phase | Effort |
|-------|--------|
| Foundation | 0.5 SP |
| Core Schemas | 1 SP |
| Route Registration | 1 SP |
| Polish | 0.5 SP |
| **Total** | **3 SP** |

---

## Success Criteria

- [ ] `/api/docs` serves Swagger UI
- [ ] `/api/openapi.json` returns valid OpenAPI 3.1 spec
- [ ] All public endpoints documented
- [ ] Request/response schemas match actual behavior
- [ ] Examples provided for key endpoints

---

## Alternatives Considered

### tsoa
Full TypeScript OpenAPI framework with decorators.

**Rejected:** Requires rewriting all 21 route files as decorated controller classes. High effort, invasive refactor.

### Manual OpenAPI YAML
Hand-write `openapi.yaml` specification.

**Rejected:** Will drift from code. No compile-time validation. Higher maintenance.

### express-openapi-validator
Validates requests against OpenAPI spec.

**Deferred:** Can layer on top later. Focus on documentation first.

---

## Open Questions

1. **Auth documentation** — Include auth endpoints or separate doc?
2. **Versioning** — Version in URL (`/api/v1/`) or header?
3. **Rate limits** — Document rate limits in spec?

---

## References

- [zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi)
- [OpenAPI 3.1 Spec](https://spec.openapis.org/oas/v3.1.0)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
