# AI Inspection — Project Overview

**Last Updated:** 2026-03-03  
**Audience:** Everyone — engineers, inspectors, stakeholders

---

## 1. What Is This Project?

AI Inspection is a building inspection platform that combines an AI agent with a web interface to streamline the end-to-end inspection workflow.

**The problem it solves:** Building inspections are paperwork-heavy and slow. Inspectors carry clipboards, take photos, then manually write reports back at the office.

**What we built instead:**
- An AI agent (Kai) that conducts inspections via WhatsApp in the field — asking questions, recording findings, capturing photos
- A web app for reviewing, editing, and managing inspection projects
- An API that ties everything together and generates structured reports

**Who uses it:**
- **Inspectors** — conduct inspections via WhatsApp with Kai
- **Office staff / clients** — review projects and reports via the web UI
- **Developers** — build and extend the platform

---

## 2. How It Works

```
[Inspector on phone]          [Office / Client]
       │                             │
  WhatsApp + Kai              Web UI (browser)
       │                             │
       └──────────┬──────────────────┘
                  │
            Express API
                  │
          ┌───────┴────────┐
       Postgres           Redis
       (data)             (job queue)
```

**Two phases per inspection:**

**Phase 1 — Field (Kai via WhatsApp)**
1. Inspector messages Kai to start an inspection
2. Kai walks through the property section by section — exterior, interior, roof, services
3. Inspector describes what they see; Kai records findings, defects, measurements, photos
4. Kai generates a checklist and structured data via the API

**Phase 2 — Office (Web UI)**
1. Office staff opens the project in the web app
2. Reviews findings, edits if needed, attaches documents
3. Generates the final inspection report (PDF/DOCX)

---

## 3. Development Process

### Stack
| Layer | Technology |
|-------|-----------|
| AI Agent | OpenClaw + custom skill (`skills/building-inspection/`) |
| Frontend | Next.js 16 (App Router, TypeScript) |
| Backend | Node.js + Express + Prisma + PostgreSQL |
| Queue | BullMQ + Redis |
| Storage | Cloudflare R2 (photos) / local disk (dev) |
| CI/CD | GitHub Actions → Railway (API) + Vercel (Web) |

### Local Dev
```bash
docker compose up          # starts postgres, redis, api (:3000), web (:3001)
docker compose down -v     # wipe and start fresh
```
Test user: `test@example.com` / `test123` (auto-seeded, admin)

Switch Kai between environments:
```bash
bash scripts/kai-env-switch.sh local    # point Kai at local stack
bash scripts/kai-env-switch.sh railway  # point Kai at Railway test env
```

### Branching & PRs
- `develop` — integration branch, all feature work merges here
- `main` — production releases only
- Feature branches: `feat/`, `fix/`, `chore/` off `develop`
- Every PR requires CI to pass before merge
- CD auto-deploys `develop` → Railway + Vercel on merge

### Workflow
1. Pick up or create a GitHub Issue
2. Branch off `develop`
3. Implement + write/update tests
4. Open PR → CI must pass
5. Code review — at least one approval required
6. Merge → auto-deploy to staging
7. Close issue when DoD is met

---

## 4. Definition of Done

A piece of work is **done** when all of the following are true:

- [ ] **Code complete** — feature works as described in the issue
- [ ] **Tests written** — unit tests for new logic; E2E test for new user-facing flows; coverage must not decrease
- [ ] **CI green** — lint, typecheck, build, and all tests pass
- [ ] **PR reviewed** — at least one reviewer approved
- [ ] **Deployed** — merged to `develop`, Railway + Vercel deploy succeeded
- [ ] **Tested in staging** — Casey confirmed `tested-pass` on the issue
- [ ] **Issue closed** — ticket closed with a reference to the merged PR
- [ ] **Docs updated** — if the change affects how the system works, docs are updated

> **Not done** = merged but not tested. Not done = tests skipped. Not done = issue left open.

---

## 5. Key Links

| Resource | Link |
|----------|------|
| GitHub Repo | `apexphere/ai-inspection` |
| Project Board | https://github.com/users/apexphere/projects/3 |
| Web App (staging) | https://app-test-ai-inspection.apexphere.co.nz |
| API (staging) | https://api-test-ai-inspection.apexphere.co.nz |
| Local Web | http://localhost:3001 |
| Local API | http://localhost:3000 |
| Full Docs | `docs/INDEX.md` |
