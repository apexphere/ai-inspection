# API Reference

> REST API documentation for AI Inspection.

**Status:** Current  
**Author:** Sage  
**Date:** 2026-02-23  
**Related:** #399, #426

---

## Interactive Docs (Swagger UI)

The API serves interactive documentation via Swagger UI:

| Environment | URL |
|-------------|-----|
| **Test** | `https://api-test-ai-inspection.apexphere.co.nz/docs` |
| **Production** | `https://api-ai-inspection.apexphere.co.nz/docs` |
| **Local** | `http://localhost:3000/docs` |

### OpenAPI Spec

Raw JSON spec available at:
```
GET /openapi.json
```

---

## Authentication

### User Auth (JWT)

Most endpoints require a JWT token:

```bash
# Login
POST /auth/login
Content-Type: application/json
{"email": "user@example.com", "password": "..."}

# Response includes token
{"token": "eyJ...", "user": {...}}

# Use in subsequent requests
Authorization: Bearer eyJ...
```

### Service Auth (API Key)

MCP server uses a service API key:

```bash
Authorization: Bearer sk-...
```

Set via `SERVICE_API_KEY` environment variable.

---

## Endpoints Overview

| Resource | Base Path | Description |
|----------|-----------|-------------|
| **Auth** | `/auth` | Login, register, session |
| **Projects** | `/projects` | Project CRUD |
| **Inspections** | `/inspections` | Inspection management |
| **Findings** | `/findings` | Inspection findings |
| **Photos** | `/photos` | Photo upload/management |
| **Reports** | `/reports` | Report generation |
| **Clients** | `/clients` | Client management |
| **Inspectors** | `/inspectors` | Inspector profiles |
| **Building Code** | `/building-code` | NZ Building Code data |
| **Health** | `/health` | Service health check |

> See Swagger UI for complete endpoint details, request/response schemas, and examples.

---

## Implementation

The API uses **code-first OpenAPI** with `zod-to-openapi`:

- Schemas defined in `api/src/openapi/schemas/`
- Routes registered in `api/src/openapi/routes/`
- Spec auto-generated from code — always in sync

---

## See Also

- [Architecture Overview](../architecture.md) — System design
- [Developer Setup](../setup/developer.md) — Local development
- [Deployment Runbook](../runbooks/deployment.md) — Environment variables
