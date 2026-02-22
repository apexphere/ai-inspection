# Inspection Detail Design Spec

**Author:** Alice 🎨  
**Date:** 2026-02-23  
**Ticket:** #373  
**Page:** `/inspections/[id]`  
**Reference:** `docs/design/tokens.yaml`, `docs/design/ui-audit.md`

---

## Overview

Inspection detail page displays inspection information with a two-column layout: findings list (main) and sidebar (actions, summary, details).

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Back Link                                                                  │
│  ← Back to Inspections                                                      │
│                                                                             │
│  Header                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 123 Main Street, Auckland                               [In Progress] │  │
│  │ Client: Acme Inc • Inspector: John Smith                              │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────┐  ┌─────────────────────────────┐   │
│  │                                     │  │ Actions                     │   │
│  │  Findings                           │  │ [Generate Report]           │   │
│  │  ┌─────────────────────────────┐    │  └─────────────────────────────┘   │
│  │  │ Section: Exterior           │    │  ┌─────────────────────────────┐   │
│  │  │   • Finding 1               │    │  │ Summary                     │   │
│  │  │   • Finding 2               │    │  │ Total: 5  Urgent: 1        │   │
│  │  └─────────────────────────────┘    │  └─────────────────────────────┘   │
│  │                                     │  ┌─────────────────────────────┐   │
│  │                                     │  │ Details                     │   │
│  │                                     │  │ Checklist: COA-Standard     │   │
│  │                                     │  │ Created: 15 Feb 2026        │   │
│  │                                     │  └─────────────────────────────┘   │
│  └─────────────────────────────────────┘                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Back Link

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Font size | `typography.sizes.sm` | 14px | `text-sm` |
| Color | `colors.primary.600` | #2563eb | `text-blue-600` |
| Hover color | — | blue-900 | `hover:text-blue-900` |
| Margin bottom | `spacing.2` | 8px | `mb-2` |
| Display | — | inline-block | `inline-block` |

**Content:** "← Back to Inspections"

---

## Page Header

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Margin bottom | `spacing.8` | 32px | `mb-8` |

### Header Layout

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Display | — | flex | `flex` |
| Align | — | start | `items-start` |
| Justify | — | space-between | `justify-between` |

### Title (H1)

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Font size | `typography.sizes.2xl` | 1.5rem (24px) | `text-2xl` |
| Font weight | `typography.weights.semibold` | 600 | `font-semibold` |
| Color | `colors.neutral.900` | #111827 | `text-gray-900` |

**Content:** Inspection address

### Subtitle

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Font size | `typography.sizes.base` | 1rem (16px) | `text-base` |
| Color | `colors.neutral.600` | #4b5563 | `text-gray-600` |
| Margin top | `spacing.1` | 4px | `mt-1` |

**Content:** "Client: {clientName} • Inspector: {inspectorName}"

### Status Badge

Same styling as other pages — see `project-list.spec.md` for Status Badge variants.

---

## Main Grid Layout

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Display | — | grid | `grid` |
| Columns (mobile) | — | 1 | `grid-cols-1` |
| Columns (lg+) | — | 3 | `lg:grid-cols-3` |
| Gap | `spacing.6` | 24px | `gap-6` |

**Note:** Changed from `gap-8` to `gap-6` per tokens.

---

## Findings Section (Main Content)

Spans 2 columns on large screens.

| Property | Value | Class |
|----------|-------|-------|
| Column span | 2 | `lg:col-span-2` |

### Section Title (H2)

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Font size | `typography.sizes.lg` | 18px | `text-lg` |
| Font weight | `typography.weights.medium` | 500 | `font-medium` |
| Color | `colors.neutral.900` | #111827 | `text-gray-900` |
| Margin bottom | `spacing.4` | 16px | `mb-4` |

**Content:** "Findings"

### Findings List

Uses `SectionList` component — displays findings grouped by section.

---

## Sidebar

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Spacing | `spacing.6` | 24px | `space-y-6` |

---

## Sidebar Card (Generic)

Used for Actions, Summary, and Details cards.

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Background | `colors.aliases.background` | #ffffff | `bg-white` |
| Border radius | `borders.radius.xl` | 12px | `rounded-xl` |
| Shadow | `shadows.levels.sm` | — | `shadow-sm` |
| Padding | `spacing.6` | 24px | `p-6` |

**Note:** Changed from `rounded-lg shadow` to `rounded-xl shadow-sm`.

### Card Title (H3)

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Font size | `typography.sizes.lg` | 18px | `text-lg` |
| Font weight | `typography.weights.medium` | 500 | `font-medium` |
| Color | `colors.neutral.900` | #111827 | `text-gray-900` |
| Margin bottom | `spacing.4` | 16px | `mb-4` |

---

## Actions Card

### Generate Report Button

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Width | — | 100% | `w-full` |
| Height | — | 40px | `h-10` |
| Padding X | `spacing.4` | 16px | `px-4` |
| Background | `colors.primary.600` | #2563eb | `bg-blue-600` |
| Text color | — | white | `text-white` |
| Font size | `typography.sizes.sm` | 14px | `text-sm` |
| Font weight | `typography.weights.medium` | 500 | `font-medium` |
| Border radius | `borders.radius.lg` | 8px | `rounded-lg` |

#### Button States

**Hover:**
| Property | Value | Class |
|----------|-------|-------|
| Background | blue-700 | `hover:bg-blue-700` |

**Disabled:**
| Property | Value | Class |
|----------|-------|-------|
| Opacity | 50% | `disabled:opacity-50` |
| Cursor | not-allowed | `disabled:cursor-not-allowed` |

**Loading:**
- Text changes to "Generating..."
- Button disabled during generation

### Helper Text (When Disabled)

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Font size | `typography.sizes.xs` | 12px | `text-xs` |
| Color | `colors.neutral.500` | #6b7280 | `text-gray-500` |
| Text align | — | center | `text-center` |
| Margin top | `spacing.2` | 8px | `mt-2` |

**Content:** "Complete the inspection to generate a report"

---

## Summary Card

### Stats List

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Spacing | `spacing.3` | 12px | `space-y-3` |
| Font size | `typography.sizes.sm` | 14px | `text-sm` |

### Stat Row

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Display | — | flex | `flex` |
| Justify | — | space-between | `justify-between` |

### Stat Label (DT)

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Color | `colors.neutral.500` | #6b7280 | `text-gray-500` |

### Stat Value (DD)

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Font weight | `typography.weights.medium` | 500 | `font-medium` |
| Color | `colors.neutral.900` | #111827 | `text-gray-900` |

### Severity Colors

| Severity | Color | Class |
|----------|-------|-------|
| Urgent | red-600 | `text-red-600` |
| Major | yellow-600 | `text-yellow-600` |
| Minor | gray-900 | `text-gray-900` |

### Divider

| Property | Value | Class |
|----------|-------|-------|
| Padding top | 12px | `pt-3` |
| Border top | 1px gray-200 | `border-t border-gray-200` |

---

## Details Card

Same structure as Summary Card.

### Detail Items

| Field | Format |
|-------|--------|
| Checklist | checklistId |
| Created | Date formatted |
| Updated | Date formatted |
| Completed | Date formatted (if exists) |

---

## Finding Editor Modal

Overlay modal for editing findings.

### Modal Backdrop

| Property | Value | Class |
|----------|-------|-------|
| Position | fixed | `fixed inset-0` |
| Background | black/50 | `bg-black/50` |
| Z-index | `zIndex.modalBackdrop` | `z-40` |

### Modal Container

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Position | fixed | `fixed inset-0` |
| Z-index | `zIndex.modal` | `z-50` |
| Display | — | flex | `flex items-center justify-center` |
| Padding | `spacing.4` | 16px | `p-4` |

### Modal Content

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Background | `colors.aliases.background` | #ffffff | `bg-white` |
| Border radius | `borders.radius.2xl` | 16px | `rounded-2xl` |
| Shadow | `shadows.levels.lg` | — | `shadow-lg` |
| Max width | — | 512px | `max-w-lg` |
| Width | — | 100% | `w-full` |
| Max height | — | 90vh | `max-h-[90vh]` |
| Overflow | — | auto | `overflow-y-auto` |

---

## Loading State

Uses `LoadingPage` component — centered spinner with text.

---

## Error State

Uses `ErrorPage` component — error message with retry button.

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<1024px) | Single column, sidebar below content |
| LG (1024px+) | Three columns, 2 for content + 1 for sidebar |

---

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Focus visible | Ring on all interactive elements |
| Modal focus trap | Focus stays within modal when open |
| Modal close | Escape key closes modal |
| Status colors | Always include text label with color |
| Loading state | `aria-busy="true"` on container |

---

## Component Checklist for Sam

- [ ] Update header margin: `mb-8` (keep as is, appropriate for this layout)
- [ ] Update grid gap: `gap-8` → `gap-6`
- [ ] Update sidebar cards: `shadow rounded-lg` → `shadow-sm rounded-xl`
- [ ] Update H1: `font-bold` → `font-semibold`
- [ ] Update modal: `rounded-2xl shadow-lg` (tokens specify these)
- [ ] Ensure button uses `rounded-lg` (not `rounded-md`)

---

## Files to Modify

- `web/app/inspections/[id]/page.tsx`
- `web/components/status-badge.tsx` (if shared component)
- `web/components/finding-editor.tsx`
- `web/components/section-list.tsx`
