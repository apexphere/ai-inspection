# Architecture Overview

> High-level system design for AI Inspection.

**Status:** Current  
**Author:** Sage  
**Date:** 2026-02-23  
**Related:** #400

---

## System Overview

AI Inspection is a building inspection assistant that combines an AI agent (via WhatsApp) with a web interface for review and report generation.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              SYSTEM ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   FIELD (Phase 1)                    OFFICE (Phase 2)                   │
│   ┌─────────────────────┐           ┌─────────────────────┐            │
│   │     WhatsApp        │           │     Web UI          │            │
│   │     (Inspector)     │           │     (Browser)       │            │
│   └──────────┬──────────┘           └──────────┬──────────┘            │
│              │                                  │                       │
│              ▼                                  ▼                       │
│   ┌─────────────────────┐           ┌─────────────────────┐            │
│   │   OpenClaw Agent    │           │     Next.js         │            │
│   │   + MCP Server      │           │     Frontend        │            │
│   └──────────┬──────────┘           └──────────┬──────────┘            │
│              │                                  │                       │
│              └──────────────┬───────────────────┘                       │
│                             ▼                                           │
│                  ┌─────────────────────┐                               │
│                  │     Express API     │                               │
│                  │     (Backend)       │                               │
│                  └──────────┬──────────┘                               │
│                             │                                           │
│              ┌──────────────┼──────────────┐                           │
│              ▼              ▼              ▼                           │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│   │  PostgreSQL  │  │  Cloudflare  │  │   Claude     │                │
│   │  (Database)  │  │  R2 (Photos) │  │   (AI)       │                │
│   └──────────────┘  └──────────────┘  └──────────────┘                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Components

### Frontend: Web UI

**Technology:** Next.js 16, React, TypeScript, Tailwind CSS, shadcn/ui

**Purpose:**
- View and manage projects
- Edit inspection findings
- Upload additional photos/documents
- Generate and download reports

**Key features:**
- Server Components for fast data loading
- Auto-save with optimistic updates
- Responsive design (desktop-optimized)

**Location:** `web/`

### Backend: API

**Technology:** Express.js, TypeScript, Prisma ORM

**Purpose:**
- REST API for all data operations
- Authentication (JWT sessions)
- File upload handling
- Report generation (PDF)

**Key endpoints:**
- `/auth/*` — Login, register, session
- `/projects/*` — Project CRUD
- `/inspections/*` — Inspection CRUD
- `/findings/*` — Finding CRUD
- `/photos/*` — Photo upload/retrieval
- `/reports/*` — Report generation

**Location:** `api/`

### AI Agent: Inspector

**Technology:** OpenClaw, Claude (Anthropic), MCP

**Purpose:**
- WhatsApp interface for field inspections
- Guided workflow through inspection sections
- Photo and finding capture
- Natural language understanding

**How it works:**
1. Inspector messages WhatsApp number
2. OpenClaw receives message, invokes Claude
3. Claude uses MCP tools to interact with API
4. Responses sent back via WhatsApp

**Location:** `skill/` (conversation guidance), `server/` (MCP tools)

### Database: PostgreSQL

**Technology:** PostgreSQL 16, Prisma ORM

**Schema highlights:**
- `User` — Accounts and authentication
- `Project` — Inspection projects
- `Property` — Property details
- `Inspection` — Individual inspections
- `Finding` — Issues and observations
- `Photo` — Attached images
- `Report` — Generated reports

**Location:** `api/prisma/schema.prisma`

### Storage: Cloudflare R2

**Purpose:** Photo and document storage

**Why R2:**
- S3-compatible API
- No egress fees
- Global CDN

---

## Data Flow

### Inspection Capture (WhatsApp)

```
Inspector        WhatsApp       OpenClaw        MCP Server       API          Database
    │               │               │               │              │              │
    │──"Start at    │               │               │              │              │
    │  123 Main"───▶│──────────────▶│               │              │              │
    │               │               │──start_       │              │              │
    │               │               │  inspection──▶│──POST /ins──▶│──INSERT─────▶│
    │               │               │               │◀─────────────│◀─────────────│
    │               │               │◀──────────────│              │              │
    │◀──"Started.   │◀──────────────│               │              │              │
    │   Exterior..."│               │               │              │              │
```

### Web Review

```
Browser          Next.js           API            Database
    │               │               │                │
    │──GET /projects│               │                │
    │──────────────▶│──GET /api/    │                │
    │               │  projects────▶│──SELECT───────▶│
    │               │               │◀───────────────│
    │               │◀──────────────│                │
    │◀──────────────│               │                │
    │               │               │                │
    │──Edit finding │               │                │
    │──────────────▶│──PATCH /api/  │                │
    │               │  findings/123─▶│──UPDATE───────▶│
    │               │               │◀───────────────│
    │◀──"Saved"─────│◀──────────────│                │
```

---

## Deployment

### Production

| Component | Platform | URL Pattern |
|-----------|----------|-------------|
| Web UI | Vercel | `app.example.com` |
| API | Railway | `api.example.com` |
| Database | Railway Postgres | Internal |
| Storage | Cloudflare R2 | Internal |
| Agent | Local / Railway | N/A |

### Deployment Flow

```
GitHub (develop) ──▶ Railway (API) ──▶ Automatic deploy
                 ──▶ Vercel (Web)  ──▶ Automatic deploy
                 ──▶ GitHub Actions ──▶ E2E tests
```

See [Deployment Runbook](../ops/deployment.md) for details.

---

## Security

### Authentication
- JWT-based sessions
- HTTP-only cookies
- CSRF protection

### API Security
- Service API key for MCP server
- Rate limiting
- Input validation (Zod)

### Data Protection
- HTTPS everywhere
- Encrypted database connections
- R2 signed URLs for photos

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| WhatsApp for field | Native messaging | No app install, works on any phone |
| MCP for AI tools | Standard protocol | Clean separation, testable tools |
| Next.js for web | React + SSR | Fast, good DX, easy deployment |
| PostgreSQL | Relational DB | Complex queries, ACID compliance |
| R2 for storage | S3-compatible | No egress fees, simple API |
| Railway for API | Container hosting | Easy deploy, good DX, affordable |

---

## Deep Dives

For detailed design documentation:

| Topic | Document |
|-------|----------|
| Inspection workflow | [001-mvp-inspection-workflow.md](design/001-mvp-inspection-workflow.md) |
| Backend architecture | [002-backend-service-architecture.md](design/002-backend-service-architecture.md) |
| CI/CD pipeline | [003-ci-cd-pipeline.md](design/003-ci-cd-pipeline.md) |
| Checklist system | [004-inspection-checklist-system.md](design/004-inspection-checklist-system.md) |
| Web interface | [005-web-interface.md](design/005-web-interface.md) |
| Photo attachments | [006-document-photo-attachments.md](design/006-document-photo-attachments.md) |
| Agent deployment | [013-agent-deployment.md](design/013-agent-deployment.md) |
| Design system | [014-design-system.md](design/014-design-system.md) |

---

## See Also

- [Developer Setup](setup.md) — Local development
- [Deployment Runbook](../ops/deployment.md) — Production deployment
- [Documentation Index](INDEX.md) — All documentation
