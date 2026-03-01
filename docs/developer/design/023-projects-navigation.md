# Design: Replace /inspections with /projects Navigation

**Issue:** #622
**Author:** Riley 📐
**Status:** Draft

## Overview

Replace `/inspections` as the primary navigation entry point with `/projects`. The project detail page already exists and shows site inspections inline — this is primarily a navigation change plus minor UX additions.

## Current State

| Route | What it does |
|-------|-------------|
| `/inspections` | Lists legacy inspections via old `api.inspections.list()` — no project context |
| `/inspections/new` | Creates a legacy inspection |
| `/inspections/:id` | Shows legacy inspection detail with findings |
| `/projects` | Lists projects — exists and works ✅ |
| `/projects/:id` | Project detail with property, client, site inspections inline ✅ |

## Target State

| Route | What it does |
|-------|-------------|
| `/projects` | Primary entry point — lists projects |
| `/projects/:id` | Project detail (unchanged) |
| `/projects/:id/inspections/:iid` | Site inspection detail (new — checklist/clause review drill-in) |
| `/inspections` | Redirect → `/projects` |
| `/inspections/new` | Remove (Kai creates projects/inspections via API) |
| `/inspections/:id` | Keep temporarily, or redirect |

## Changes Required

### 1. Header Navigation

`web/components/app-header.tsx` — update nav link:

```tsx
// Before
<Link href="/inspections">Inspections</Link>

// After
<Link href="/projects">Projects</Link>
```

### 2. Root redirect

`web/app/page.tsx` — redirect `/` to `/projects` (currently redirects to `/inspections`).

### 3. `/inspections` redirect

`web/app/inspections/page.tsx` — replace with redirect to `/projects`:

```tsx
import { redirect } from 'next/navigation';
export default function InspectionsPage() {
  redirect('/projects');
}
```

### 4. Site Inspection Detail Page (new)

`web/app/projects/[id]/inspections/[iid]/page.tsx`

Drill into a specific site inspection from the project detail. Shows:
- Inspection metadata (stage, type, date, inspector, status)
- For SIMPLE type: checklist items grouped by category (SITE, EXTERIOR, INTERIOR, etc.)
- For CLAUSE_REVIEW type: clause reviews grouped by NZBC category (B, C, D, E, F, G, H)
- Breadcrumb: Projects → Project → Inspection

### 5. Project detail — link site inspections

`web/app/projects/[id]/project-sections.tsx` — make inspection rows in the table clickable:

```tsx
// Inspection row becomes a link
<Link href={`/projects/${project.id}/inspections/${inspection.id}`}>
  <tr>...</tr>
</Link>
```

### 6. Remove legacy pages

- `web/app/inspections/new/page.tsx` — remove (Kai creates via API)
- `web/app/inspections/layout.tsx` — remove or simplify
- `web/app/inspections/[id]/page.tsx` — keep for now (may have existing links), add deprecation notice pointing to project

## Site Inspection Detail Page Design

```
┌────────────────────────────────────────────────┐
│ Projects / 45 Oak Avenue / PPI — 2 Mar 2026    │  ← breadcrumb
├────────────────────────────────────────────────┤
│                                                │
│  PPI Site Inspection          ● In Progress    │
│  Inspector: John Smith · 2 Mar 2026            │
│                                                │
│  ▾ Site (3 items)                              │
│    ✓ Drainage          PASS                    │
│    ✗ Fencing           FAIL  Note: rusted      │
│    — Paths             N/A                     │
│                                                │
│  ▾ Exterior (5 items)                          │
│    ✓ Roof              PASS                    │
│    ...                                         │
│                                                │
└────────────────────────────────────────────────┘
```

For COA (CLAUSE_REVIEW), grouped by NZBC clause category (B1, B2, C, D, E, F, G, H).

### API Calls

```typescript
// Fetch site inspection
GET /api/site-inspections/:id

// Fetch checklist items (SIMPLE type)
GET /api/site-inspections/:id/checklist-items

// Fetch clause reviews grouped (CLAUSE_REVIEW type)
GET /api/site-inspections/:id/clause-reviews?grouped=true
```

## Files Changed

| File | Change |
|------|--------|
| `web/components/app-header.tsx` | Nav: "Inspections" → "Projects" |
| `web/app/page.tsx` | Root redirect → `/projects` |
| `web/app/inspections/page.tsx` | Redirect → `/projects` |
| `web/app/inspections/new/page.tsx` | Remove |
| `web/app/projects/[id]/project-sections.tsx` | Make inspection rows clickable |
| `web/app/projects/[id]/inspections/[iid]/page.tsx` | New — inspection detail |

## Story Split

| Story | Work |
|-------|------|
| Nav + redirects (header, root, /inspections) | Small — Sam |
| Site inspection detail page | Medium — Sam |
| Make inspection rows clickable in project detail | Small — Sam |
