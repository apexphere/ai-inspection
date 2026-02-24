# Project Page Design Spec

**Author:** Alice 🎨  
**Date:** 2026-02-23  
**Ticket:** #372  
**Page:** `/projects/[id]`  
**Reference:** `docs/design/tokens.yaml`, `docs/design/ui-audit.md`

---

## Overview

Project detail page displays comprehensive project information in collapsible sections: Project Info, Client, Property, Inspections, Clause Reviews, Documents, and Photos.

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Breadcrumb                                                         │
│  Projects / PRJ-001                                                 │
│                                                                     │
│  Header                                                             │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ 123 Main Street, Auckland                    [In Progress]    │  │
│  │ Job: PRJ-001 • Certificate of Acceptance                      │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Collapsible Sections                                               │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ ▼ Project Info                                                │  │
│  │   Job Number: PRJ-001                                         │  │
│  │   Activity: COA Assessment                                    │  │
│  │   ...                                                         │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ ▶ Client                                                      │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ ▶ Property                                                    │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ...                                                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Breadcrumb

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Margin bottom | `spacing.4` | 16px | `mb-4` |

### Breadcrumb List

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Display | — | flex | `flex` |
| Align | — | center | `items-center` |
| Gap | `spacing.2` | 8px | `gap-2` |
| Font size | `typography.sizes.sm` | 14px | `text-sm` |
| Color | `colors.neutral.600` | #4b5563 | `text-gray-600` |

### Breadcrumb Link

| Property | Value | Class |
|----------|-------|-------|
| Color | gray-600 | `text-gray-600` |
| Hover color | gray-900 | `hover:text-gray-900` |

### Current Page (Last Item)

| Property | Value | Class |
|----------|-------|-------|
| Color | gray-900 | `text-gray-900` |
| Font weight | medium | `font-medium` |

### Separator

**Content:** "/"

---

## Page Header

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Margin bottom | `spacing.6` | 24px | `mb-6` |
| Display | — | flex | `flex` |
| Direction (mobile) | — | column | `flex-col` |
| Direction (sm+) | — | row | `sm:flex-row` |
| Align (sm+) | — | center | `sm:items-center` |
| Justify | — | space-between | `sm:justify-between` |
| Gap | `spacing.4` | 16px | `gap-4` |

### Title (H1)

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Font size | `typography.sizes.2xl` | 1.5rem (24px) | `text-2xl` |
| Font weight | `typography.weights.semibold` | 600 | `font-semibold` |
| Color | `colors.neutral.900` | #111827 | `text-gray-900` |

**Content:** Property street address

### Subtitle

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Font size | `typography.sizes.base` | 1rem (16px) | `text-base` |
| Color | `colors.neutral.600` | #4b5563 | `text-gray-600` |
| Margin top | `spacing.1` | 4px | `mt-1` |

**Content:** "Job: {jobNumber} • {reportType}"

### Status Badge

Same as Project List spec — see `project-list.spec.md` for Status Badge styling.

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Padding X | `spacing.3` | 12px | `px-3` |
| Padding Y | `spacing.1` | 4px | `py-1` |
| Font size | `typography.sizes.sm` | 14px | `text-sm` |
| Font weight | `typography.weights.medium` | 500 | `font-medium` |
| Border radius | `borders.radius.full` | 9999px | `rounded-full` |

---

## Collapsible Section Component

### Section Container

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Background | `colors.aliases.background` | #ffffff | `bg-white` |
| Border | `borders.widths.DEFAULT` | 1px | `border` |
| Border color | `colors.neutral.200` | #e5e7eb | `border-gray-200` |
| Border radius | `borders.radius.xl` | 12px | `rounded-xl` |
| Shadow | `shadows.levels.sm` | — | `shadow-sm` |
| Overflow | — | hidden | `overflow-hidden` |

### Section Header (Clickable)

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Display | — | flex | `flex` |
| Align | — | center | `items-center` |
| Justify | — | space-between | `justify-between` |
| Padding | `spacing.4` | 16px | `p-4` |
| Cursor | — | pointer | `cursor-pointer` |
| Background (hover) | — | gray-50 | `hover:bg-gray-50` |

### Section Title

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Font size | `typography.sizes.base` | 16px | `text-base` |
| Font weight | `typography.weights.medium` | 500 | `font-medium` |
| Color | `colors.neutral.900` | #111827 | `text-gray-900` |

### Chevron Icon

| Property | Value | Class |
|----------|-------|-------|
| Size | 20px | `h-5 w-5` |
| Color | gray-500 | `text-gray-500` |
| Rotation (closed) | 0deg | — |
| Rotation (open) | 180deg | `rotate-180` |
| Transition | 200ms | `transition-transform duration-200` |

### Completion Status (Optional)

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Font size | `typography.sizes.sm` | 14px | `text-sm` |
| Color | `colors.neutral.500` | #6b7280 | `text-gray-500` |

**Example:** "3/5 complete", "12 photos"

### Section Content (Expanded)

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Padding X | `spacing.4` | 16px | `px-4` |
| Padding bottom | `spacing.4` | 16px | `pb-4` |
| Border top | — | 1px gray-100 | `border-t border-gray-100` |

---

## Info Row (Definition List)

Used in Project Info, Client, Property sections.

### Row Container

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Display | — | flex | `flex` |
| Direction (mobile) | — | column | `flex-col` |
| Direction (sm+) | — | row | `sm:flex-row` |
| Gap (sm+) | `spacing.4` | 16px | `sm:gap-4` |
| Padding Y | `spacing.2` | 8px | `py-2` |
| Border bottom | — | 1px gray-100 | `border-b border-gray-100` |
| Last row border | — | none | `last:border-0` |

### Label (DT)

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Font size | `typography.sizes.sm` | 14px | `text-sm` |
| Font weight | `typography.weights.medium` | 500 | `font-medium` |
| Color | `colors.neutral.500` | #6b7280 | `text-gray-500` |
| Width (sm+) | — | 160px | `sm:w-40` |
| Shrink | — | 0 | `shrink-0` |

### Value (DD)

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Font size | `typography.sizes.sm` | 14px | `text-sm` |
| Color | `colors.neutral.900` | #111827 | `text-gray-900` |

---

## Inspections Table

Nested table within Inspections section.

### Table Container

| Property | Value | Class |
|----------|-------|-------|
| Overflow | auto | `overflow-x-auto` |

### Table

| Property | Value | Class |
|----------|-------|-------|
| Width | 100% | `min-w-full` |
| Border collapse | — | `divide-y divide-gray-200` |

### Table Header Cell

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Padding Y | `spacing.2` | 8px | `py-2` |
| Padding right | `spacing.4` | 16px | `pr-4` |
| Text align | — | left | `text-left` |
| Font size | `typography.sizes.xs` | 12px | `text-xs` |
| Font weight | `typography.weights.medium` | 500 | `font-medium` |
| Color | `colors.neutral.500` | #6b7280 | `text-gray-500` |

**Note:** Consider removing `uppercase tracking-wider` for cleaner look.

### Table Body Row

| Property | Value | Class |
|----------|-------|-------|
| Border | 1px gray-100 | `divide-y divide-gray-100` |

### Table Body Cell

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Padding Y | `spacing.2` | 8px | `py-2` |
| Padding right | `spacing.4` | 16px | `pr-4` |
| Font size | `typography.sizes.sm` | 14px | `text-sm` |

### Inspection Status Badge

Same variants as Project Status Badge.

---

## Empty States

When a section has no content:

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Font size | `typography.sizes.sm` | 14px | `text-sm` |
| Color | `colors.neutral.500` | #6b7280 | `text-gray-500` |
| Style | — | italic | `italic` |

**Example:** "No inspections recorded"

---

## Sections Container

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Spacing between sections | `spacing.4` | 16px | `space-y-4` |

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Header stacks, info rows stack, tables scroll |
| SM (640px+) | Header side-by-side, info rows inline |

---

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Expandable sections | `aria-expanded`, `aria-controls` |
| Section buttons | `role="button"` or `<button>` |
| Focus visible | Ring on section headers |
| Keyboard nav | Enter/Space to toggle, Tab to navigate |
| Screen reader | Announce completion status |

---

## Component Checklist for Sam

- [ ] Update all section containers: `rounded-xl shadow-sm`
- [ ] Update H1: `font-bold` → `font-semibold`
- [ ] Update status badge: `text-*-800` → `text-*-700`
- [ ] Consider removing `uppercase tracking-wider` from table headers
- [ ] Ensure CollapsibleSection has proper ARIA attributes
- [ ] Update spacing between sections to `space-y-4`

---

## Files to Modify

- `web/app/projects/[id]/page.tsx`
- `web/app/projects/[id]/project-sections.tsx`
- `web/components/collapsible-section.tsx` (if exists)
