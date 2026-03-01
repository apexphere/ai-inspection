# Design: Admin — Service Key Management Page

**Issue:** #606
**Author:** Riley 📐
**Status:** Draft

## Overview

Add an admin-only page at `/admin/service-keys` in the web UI to manage service API keys. Admins can create, view, and deactivate keys without using curl.

## UI Design

### Page: `/admin/service-keys`

```
┌─────────────────────────────────────────────────────┐
│ 🔍 AI Inspection   [Inspections] [Admin ▾] [email]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Service Keys                    [+ Create Key]     │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Name        Actor      Scopes  Last Used  ● │   │
│  │ kai-agent   agent:kai  8       2h ago     ● │   │
│  │ test-key    agent:test 3       Never      ● │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Table columns:**
- **Name** — key name (e.g. `kai-agent`)
- **Actor** — actor identity (e.g. `agent:kai`)
- **Scopes** — count + hover tooltip listing all scopes
- **Last Used** — relative time or "Never"
- **Status** — green dot (active) / grey dot (inactive)
- **Actions** — Deactivate button (active keys only)

### Create Key Modal

Opens on "+ Create Key":

```
┌─────────────────────────────────┐
│  Create Service Key             │
│                                 │
│  Name *                         │
│  [kai-agent              ]      │
│                                 │
│  Actor *                        │
│  [agent:kai              ]      │
│                                 │
│  Scopes *                       │
│  ☑ inspections:*                │
│  ☑ projects:*                   │
│  ☑ properties:*                 │
│  ☑ clients:*                    │
│  ☑ checklist:*                  │
│  ☑ clause-reviews:*             │
│  ☑ building-code:read           │
│  ☑ photos:*                     │
│                                 │
│  [Cancel]         [Create Key]  │
└─────────────────────────────────┘
```

### Key Created Modal (shown once)

```
┌─────────────────────────────────┐
│  ✅ Key Created                  │
│                                 │
│  Copy this key — it won't be   │
│  shown again.                   │
│                                 │
│  sk_abc12345...                 │
│  [📋 Copy to clipboard]         │
│                                 │
│                    [Done]       │
└─────────────────────────────────┘
```

### Deactivate Confirmation

Inline confirmation on row:

```
Deactivate "kai-agent"? [Confirm] [Cancel]
```

## Technical Design

### Route

`web/app/admin/service-keys/page.tsx` — Server Component (data fetched server-side).

```
web/app/admin/
  layout.tsx          ← admin layout + admin guard
  service-keys/
    page.tsx          ← service key list (server component)
    service-keys-client.tsx  ← create/deactivate interactions (client component)
```

### Admin Guard

`web/app/admin/layout.tsx` — checks session for admin role, redirects to `/` if not admin.

The API returns 403 on admin endpoints for non-admins. The layout should also guard client-side to avoid exposing the page.

Admin detection: check session for `isAdmin` flag (needs to be returned from API login response and stored in NextAuth JWT — see Files Changed).

### API Calls

All calls use `credentials: 'include'` (cookie-based JWT auth, same pattern as other pages).

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// List keys
GET /api/admin/service-keys

// Create key
POST /api/admin/service-keys
{ name, actor, scopes }
→ { key: "sk_...", id, name, actor, scopes }

// Deactivate
DELETE /api/admin/service-keys/:id
```

### Components

| Component | Type | Purpose |
|-----------|------|---------|
| `app/admin/layout.tsx` | Server | Admin guard, layout wrapper |
| `app/admin/service-keys/page.tsx` | Server | Fetch + render key list |
| `app/admin/service-keys/service-keys-client.tsx` | Client | Create modal, deactivate, copy-to-clipboard |
| `components/admin-nav.tsx` | Client | Admin nav links (added to AppHeader) |

### AppHeader Changes

Add "Admin" nav link visible to admin users only:

```tsx
{isAdmin && (
  <Link href="/admin/service-keys">Admin</Link>
)}
```

### Admin Detection in Session

The API's `/api/auth/login` response and NextAuth JWT need to include `isAdmin`. 

**API:** Check `ADMIN_USER_IDS` env var (existing mechanism in `requireAdmin` middleware).
**NextAuth:** Extend JWT/session to include `isAdmin: boolean`.

This requires a small backend + NextAuth config change.

## Files Changed

| File | Change |
|------|--------|
| `web/app/admin/layout.tsx` | New — admin guard layout |
| `web/app/admin/service-keys/page.tsx` | New — key list server component |
| `web/app/admin/service-keys/service-keys-client.tsx` | New — interactive client component |
| `web/components/app-header.tsx` | Add Admin nav link (admin users only) |
| `web/lib/auth-config.ts` | Extend JWT/session with `isAdmin` |
| `api/src/routes/auth.ts` | Include `isAdmin` in login response |

## Story Split

| Story | Role | Work |
|-------|------|------|
| Backend: include `isAdmin` in auth response + NextAuth JWT | Alex | Small |
| Frontend: admin layout + service keys page + create/deactivate | Sam | Main page |
