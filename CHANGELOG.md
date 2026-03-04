# Changelog

All notable changes to this project will be documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: monorepo-level — one version covers API, web, DB, and agent skills.

---

## [Unreleased]
### Planned
- Project page refactor: remove "inspection" terminology, surface findings directly on project page

---

## [0.1.0] - 2026-03-04
Baseline release. First tagged version.

### API
- Express + Prisma API with JWT and scoped service key auth
- Projects, properties, clients, site inspections, checklist items, clause reviews
- Floor plans (moved from SiteInspection to Project)
- Project photos + public file serving (local disk + R2)
- Section conclusions, moisture readings, thermal imaging, floor level surveys
- Report generation (PDF)
- Cost estimates, documents, findings, defects
- Service key admin (scoped API keys with bcrypt)
- Centralised server-side auth helper (`server-api.ts`)
- `API_INTERNAL_URL` for Docker container networking

### Web
- Next.js project page with collapsible sections (project info, client, property, floor plans, BRANZ zone, inspections, clause reviews, documents, photos)
- Photo grid with reorder, caption edit, delete, lightbox
- Floor plan thumbnails rendered via public photo API
- Auth: NextAuth JWT, server-side token forwarding fixed for all RSC pages
- Admin: service key management

### DB (Prisma Migrations)
- Full schema: Project, Property, Client, SiteInspection, ChecklistItem, ClauseReview, FloorPlan, ProjectPhoto, Photo, Document, ServiceKey, Personnel, etc.
- FloorPlan migrated from SiteInspection → Project

### Agent Skills
- Kai building inspection skill v3.5.0
  - Upfront data collection (site, property, client details)
  - Section-by-section guidance: Site & Ground, Exterior, Interior (room by room via floor plan), Services
  - Category-led guidance — inspector picks order per section
  - Full state resume — loads floor plans, existing inspection, upfront data, section progress on pickup
  - Photo capture via WhatsApp
  - R2 + local storage support for uploaded photos

### Infrastructure
- Docker Compose local dev stack (API, web, Postgres, Redis)
- Dockerfiles switched from `casey-api:latest` → `node:20-alpine`
- Tiered CI pipeline (unit → integration → E2E)
- Railway (API) + Vercel (web) deployment

---

## Versioning Convention

| Component | Where tracked |
|-----------|--------------|
| Monorepo release | `git tag vX.Y.Z` on `develop` + this CHANGELOG |
| API | `api/package.json` version (aligned to monorepo) |
| Web | `web/package.json` version (aligned to monorepo) |
| DB | Prisma migration names (referenced in changelog) |
| Kai skill | `version:` field in `SKILL.md` (semantic, independent) |

**When to bump:**
- `PATCH` (0.1.x) — bug fixes, no schema changes
- `MINOR` (0.x.0) — new features, backward-compatible DB migrations
- `MAJOR` (x.0.0) — breaking changes (schema drops, API contract changes, major UX rewrites)

**Process:**
1. Update this CHANGELOG (move Unreleased → new version)
2. Bump version in `api/package.json` and `web/package.json`
3. Commit: `chore: release vX.Y.Z`
4. Tag: `git tag -a vX.Y.Z -m "vX.Y.Z"`
5. Push tag: `git push origin vX.Y.Z`
