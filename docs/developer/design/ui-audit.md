# UI Audit: Current Pages vs Design Tokens

**Author:** Alice 🎨  
**Date:** 2026-02-23  
**Ticket:** #364  
**Reference:** `docs/design/tokens.yaml`

---

## Executive Summary

The current UI has **good foundations** but needs refinement to align with design tokens. Most pages use similar patterns — fixing the shared components and establishing consistent utility classes will cascade improvements across the app.

**Recommendation:** Apply tokens to existing layouts. No mockups needed — the layouts work, they just need token compliance.

---

## Global Issues

These issues appear across multiple pages:

### 1. Primary Color Mismatch 🔴 Critical

**Current:** `--primary: oklch(0.205 0 0)` (near-black) in `globals.css`  
**Token:** `primary.600: #2563eb` (blue)

The CSS variable system doesn't match our token colors. Pages bypass this by hardcoding `bg-blue-600`, but the `Button` component uses `bg-primary` which renders dark/black.

**Fix:** Update `globals.css` CSS variables to match `tokens.yaml` values.

### 2. Border Radius Inconsistency 🟡 Medium

| Element | Current | Token | Fix |
|---------|---------|-------|-----|
| Cards | `rounded-lg` (8px) | `rounded-xl` (12px) | Update to `rounded-xl` |
| Buttons | `rounded-md` (6px) | `rounded-lg` (8px) | Update to `rounded-lg` |
| Inputs | `rounded-lg` (8px) | `rounded-lg` (8px) | ✅ Correct |

### 3. Typography Weight 🟡 Medium

| Element | Current | Token | Fix |
|---------|---------|-------|-----|
| Page titles (h1) | `font-bold` (700) | `font-semibold` (600) | Update all h1 |
| Card titles (h3) | `font-medium` (500) | `font-medium` (500) | ✅ Correct |

### 4. Shadow on Cards 🟢 Minor

**Current:** `shadow` or no shadow  
**Token:** `shadow-sm` for cards

Most cards use `shadow` (too strong) or nothing. Should use `shadow-sm`.

### 5. Spacing Patterns 🟡 Medium

Inconsistent spacing values across pages. Should use token patterns:
- Card padding: `p-6` (mostly correct, some use `p-8`)
- Section spacing: `space-y-6`
- Form field spacing: `space-y-2`

---

## Page-by-Page Audit

### Login Page (`web/app/login/page.tsx`)

| Issue | Current | Should Be | Severity |
|-------|---------|-----------|----------|
| Card radius | `rounded-lg` | `rounded-xl` | Medium |
| Card padding | `p-8` | `p-6` | Minor |
| Card shadow | `shadow` | `shadow-sm` | Minor |
| H1 weight | `font-bold` | `font-semibold` | Medium |
| H1 size | `text-3xl` | `text-2xl` | Medium |
| Input border | `border-gray-300` | `border-gray-200` | Minor |
| Label margin | `mb-2` | Use `space-y-2` on container | Minor |
| Button uses | `bg-blue-600` hardcoded | `bg-primary` (after CSS fix) | Medium |

**Good:**
- ✅ Background `bg-gray-50` (matches `surface`)
- ✅ Text colors correct (`text-gray-900`, `text-gray-600`)
- ✅ Focus states use `ring-2 ring-blue-500`
- ✅ Error alert styling appropriate

### Register Page (`web/app/register/page.tsx`)

Same issues as Login (they share the same patterns). Fix Login, copy to Register.

### Project List (`web/app/projects/page.tsx`, `project-list.tsx`)

| Issue | Current | Should Be | Severity |
|-------|---------|-----------|----------|
| H1 weight | `font-bold` | `font-semibold` | Medium |
| Table container | `rounded-lg` | `rounded-xl` | Medium |
| Table container | No shadow | `shadow-sm` | Minor |
| Status badges | Hardcoded colors | Use semantic tokens | Medium |
| Table header | `text-xs uppercase` | Consider `text-sm font-medium` | Minor |

**Status Badge Colors:**
```tsx
// Current (hardcoded)
'bg-gray-100 text-gray-800'    // DRAFT
'bg-blue-100 text-blue-800'    // IN_PROGRESS
'bg-yellow-100 text-yellow-800' // REVIEW
'bg-green-100 text-green-800'   // COMPLETED

// Should use semantic variants or CSS variables
// Or create a StatusBadge component with token-based variants
```

**Good:**
- ✅ Table structure well-organized
- ✅ Hover states (`hover:bg-gray-50`)
- ✅ Empty state has good UX
- ✅ Skeleton loading states

### Project Detail (`web/app/projects/[id]/page.tsx`)

| Issue | Current | Should Be | Severity |
|-------|---------|-----------|----------|
| H1 weight | `font-bold` | `font-semibold` | Medium |
| Status badge | `rounded-full` | ✅ Correct | — |
| Breadcrumb | `text-sm text-gray-600` | ✅ Correct | — |

**Good:**
- ✅ Breadcrumb navigation
- ✅ Responsive layout (`flex-col sm:flex-row`)
- ✅ Status badge using `rounded-full` (correct for pills)

### Inspection Detail (`web/app/inspections/[id]/page.tsx`)

| Issue | Current | Should Be | Severity |
|-------|---------|-----------|----------|
| H1 weight | `font-bold` | `font-semibold` | Medium |
| Sidebar cards | `shadow rounded-lg p-6` | `shadow-sm rounded-xl p-6` | Medium |
| Grid gap | `gap-8` | Consider `gap-6` (token) | Minor |
| Section title | `text-lg font-medium` | ✅ Correct (h3 style) | — |

**Good:**
- ✅ Three-column layout works well
- ✅ Back link with arrow
- ✅ Summary stats organized
- ✅ Uses shared components (`StatusBadge`, `SectionList`)

---

## Component Audit

### Button (`web/components/ui/button.tsx`)

| Issue | Current | Should Be | Severity |
|-------|---------|-----------|----------|
| Border radius | `rounded-md` | `rounded-lg` | Medium |
| Default height | `h-9` (36px) | `h-10` (40px) | Minor |
| Uses `bg-primary` | ✅ Good pattern | Fix CSS variable | — |

**Note:** Button uses CVA and CSS variables — good architecture. Just needs CSS variable alignment.

### Missing Components

These shadcn/ui components should be added for consistency:
- `Card` — wrap card patterns into reusable component
- `Input` — standardize input styling
- `Badge` — for status indicators with token-based variants
- `Table` — standardize table styling

---

## CSS Variables Alignment

### Required Changes to `globals.css`

```css
:root {
  /* Update primary to blue-600 */
  --primary: oklch(0.546 0.214 262.881);  /* ~#2563eb */
  --primary-foreground: oklch(1 0 0);      /* white */
  
  /* Or use hex if oklch conversion is tricky */
  /* Alternative: define in Tailwind config and extend */
}
```

### Semantic Color Mapping

Current CSS has semantic colors but pages don't use them:

| Token | CSS Variable | Hex Value |
|-------|--------------|-----------|
| `success` | `--success` | `#16a34a` |
| `warning` | `--warning` | `#ca8a04` |
| `error` | `--error` | `#dc2626` |
| `info` | `--info` | `#2563eb` |

**Action:** Create utility classes or Badge variants that use these.

---

## Recommendations

### Phase 1: Foundation (Do First)

1. **Fix `globals.css`** — Align CSS variables with `tokens.yaml`
2. **Update Button component** — Change `rounded-md` → `rounded-lg`
3. **Create Card component** — Standardize `rounded-xl shadow-sm p-6`
4. **Create Badge component** — Token-based status variants

### Phase 2: Page Updates

1. **Auth pages** (Login/Register)
   - Update card styling
   - Fix h1 typography
   - Use Input component

2. **List pages** (Projects, Inspections)
   - Update table container styling
   - Use Badge component for status
   - Fix h1 typography

3. **Detail pages** (Project, Inspection)
   - Update sidebar cards
   - Fix h1 typography
   - Consistent spacing

### Phase 3: Polish

1. Add remaining shadcn/ui components as needed
2. Document component usage in DESIGN-TOKENS.md
3. Add Storybook or component preview (optional)

---

## Do We Need Mockups?

**No.** The current layouts are functional and appropriate. The issues are:
- Token alignment (colors, spacing, radius)
- Component standardization

This is a **code refactor**, not a **design overhaul**. Sam can implement directly from this audit + `tokens.yaml`.

---

## Files to Modify

| File | Changes |
|------|---------|
| `web/app/globals.css` | Fix CSS variables |
| `web/components/ui/button.tsx` | Update radius |
| `web/components/ui/card.tsx` | Create new |
| `web/components/ui/badge.tsx` | Create new |
| `web/components/ui/input.tsx` | Create new |
| `web/app/login/page.tsx` | Apply tokens |
| `web/app/register/page.tsx` | Apply tokens |
| `web/app/projects/page.tsx` | Apply tokens |
| `web/app/projects/project-list.tsx` | Apply tokens, use Badge |
| `web/app/projects/[id]/page.tsx` | Apply tokens |
| `web/app/inspections/[id]/page.tsx` | Apply tokens |

---

## Next Steps

1. Alice creates UI specs for each page (`docs/design/ui/*.spec.yaml`)
2. Sam implements based on specs + this audit
3. Alice reviews PRs for design fidelity

**Ticket #363** (Refactor Web UI) can proceed with this audit as the guide.
