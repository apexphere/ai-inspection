# Design: Backend Service Architecture

**Status:** Draft  
**Sprint:** 2  
**Author:** Megan  
**Date:** 2026-02-16

## Overview

Restructure ai-inspection from a standalone MCP server to a proper backend service with REST API, persistent storage, and web UI support.

## Motivation

Sprint 1 (MVP) validated the concept with a stateless MCP server. For production use:
- Inspector collects data on-site via WhatsApp
- Later edits and generates reports via web UI
- Data must persist across sessions/days

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ai-inspection                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │   mcp/   │    │   api/   │    │   web/   │    │ shared/  │  │
│  │          │───▶│          │◀───│          │    │          │  │
│  │ OpenClaw │    │ REST API │    │ Next.js  │    │  Types   │  │
│  │ adapter  │    │ Express  │    │   UI     │    │ Schemas  │  │
│  └──────────┘    └────┬─────┘    └──────────┘    └──────────┘  │
│                       │                                         │
│                       ▼                                         │
│                 ┌──────────┐                                    │
│                 │ Postgres │                                    │
│                 │  + S3    │                                    │
│                 └──────────┘                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### On-Site (WhatsApp)
```
Inspector → WhatsApp → OpenClaw → MCP → POST /api/findings → DB
                                      → POST /api/photos → S3
```

### At Home (Web UI)
```
Inspector → Web UI → GET /api/inspections/:id → DB
                   → PUT /api/findings/:id → DB
                   → POST /api/reports/generate → PDF
```

## Directory Structure

```
ai-inspection/
├── api/                    # Backend REST service
│   ├── src/
│   │   ├── routes/         # Express routes
│   │   ├── services/       # Business logic
│   │   ├── models/         # Prisma models
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   └── Dockerfile
│
├── mcp/                    # MCP server (thin adapter)
│   ├── src/
│   │   ├── tools/          # Tool definitions
│   │   ├── client.ts       # HTTP client to API
│   │   └── index.ts
│   ├── package.json
│   └── mcp.json
│
├── web/                    # Web UI
│   ├── src/
│   │   ├── app/            # Next.js app router
│   │   ├── components/
│   │   └── lib/
│   ├── package.json
│   └── Dockerfile
│
├── shared/                 # Shared types/schemas
│   ├── src/
│   │   ├── types.ts
│   │   └── schemas.ts
│   └── package.json
│
├── config/                 # Checklists, comments (unchanged)
├── templates/              # PDF templates (unchanged)
├── docs/                   # Design docs
├── docker-compose.yml      # Full stack
└── README.md
```

## API Endpoints

### Inspections
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/inspections` | Create inspection |
| GET | `/api/inspections` | List inspections |
| GET | `/api/inspections/:id` | Get inspection details |
| PUT | `/api/inspections/:id` | Update inspection |
| DELETE | `/api/inspections/:id` | Delete inspection |

### Findings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/inspections/:id/findings` | Add finding |
| GET | `/api/inspections/:id/findings` | List findings |
| PUT | `/api/findings/:id` | Update finding |
| DELETE | `/api/findings/:id` | Delete finding |

### Photos
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/findings/:id/photos` | Upload photo |
| GET | `/api/photos/:id` | Get photo |
| DELETE | `/api/photos/:id` | Delete photo |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/inspections/:id/report` | Generate PDF |
| GET | `/api/inspections/:id/report` | Get latest PDF |

### Navigation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/inspections/:id/navigate` | Move to section |
| GET | `/api/inspections/:id/status` | Get current status |
| GET | `/api/inspections/:id/suggest` | Get next suggestion |

## Database Schema

```prisma
model Inspection {
  id            String    @id @default(uuid())
  address       String
  clientName    String
  inspectorName String?
  checklistId   String
  status        Status    @default(STARTED)
  currentSection String
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  completedAt   DateTime?
  
  findings      Finding[]
  reports       Report[]
}

model Finding {
  id            String    @id @default(uuid())
  inspectionId  String
  inspection    Inspection @relation(fields: [inspectionId], references: [id])
  section       String
  text          String
  severity      Severity  @default(INFO)
  matchedComment String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  photos        Photo[]
}

model Photo {
  id          String   @id @default(uuid())
  findingId   String
  finding     Finding  @relation(fields: [findingId], references: [id])
  filename    String
  path        String
  mimeType    String
  createdAt   DateTime @default(now())
}

model Report {
  id            String    @id @default(uuid())
  inspectionId  String
  inspection    Inspection @relation(fields: [inspectionId], references: [id])
  format        String    @default("pdf")
  path          String
  createdAt     DateTime  @default(now())
}

enum Status {
  STARTED
  IN_PROGRESS
  COMPLETED
}

enum Severity {
  INFO
  MINOR
  MAJOR
  URGENT
}
```

## MCP Tools → API Mapping

| MCP Tool | HTTP Call |
|----------|-----------|
| `inspection_start` | `POST /api/inspections` |
| `inspection_status` | `GET /api/inspections/:id/status` |
| `inspection_add_finding` | `POST /api/inspections/:id/findings` |
| `inspection_navigate` | `POST /api/inspections/:id/navigate` |
| `inspection_suggest_next` | `GET /api/inspections/:id/suggest` |
| `inspection_complete` | `PUT /api/inspections/:id` (status=COMPLETED) |
| `inspection_get_report` | `GET /api/inspections/:id/report` |

## Tech Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| API | Express + TypeScript | Fast, familiar, good ecosystem |
| Database | PostgreSQL | Reliable, good for relational data |
| ORM | Prisma | Type-safe, great DX |
| Photo Storage | Local (MVP) / S3 (prod) | Start simple, scale later |
| Web UI | Next.js 14 | React + SSR + API routes |
| MCP | TypeScript | Matches existing code |

## Migration Plan

1. **Create API service** with Prisma + Express
2. **Migrate business logic** from `server/` to `api/`
3. **Refactor MCP** to be thin HTTP client
4. **Update skill** to point to new MCP location
5. **Create Web UI** scaffold
6. **Update docker-compose** for full stack
7. **Remove old `server/`** directory

## Sprint 2 Issues

1. Set up API project structure with Express + Prisma
2. Implement database schema and migrations
3. Implement inspection CRUD endpoints
4. Implement findings + photos endpoints
5. Implement report generation endpoint
6. Refactor MCP to HTTP client
7. Set up Web UI project structure
8. Implement inspection list/detail views
9. Implement finding editor
10. Update docker-compose for full stack
11. Update CI/CD pipeline
12. End-to-end testing

## Open Questions

1. **Auth:** Simple password? OAuth? Skip for MVP?
2. **Multi-tenant:** Single inspector or multiple users?
3. **Photo storage:** Local disk vs S3 from start?
4. **Hosting:** Where will this run? (Docker on VPS?)

## References

- [Sprint 1 MVP Design](001-mvp-inspection-workflow.md)
- [MCP Specification](https://modelcontextprotocol.io)
- [Prisma Docs](https://www.prisma.io/docs)

---

## See Also

- [CI/CD Pipeline](003-ci-cd-pipeline.md) — Build and deploy
- [Web Interface](005-web-interface.md) — Frontend architecture
- [API Reference](../api/README.md) — Endpoint documentation *(coming soon)*
- [Developer Setup](../setup.md) — Local development
