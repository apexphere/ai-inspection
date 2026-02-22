# Project List Design Spec

**Author:** Alice 🎨  
**Date:** 2026-02-23  
**Ticket:** #371  
**Page:** `/projects`  
**Reference:** `docs/design/tokens.yaml`, `docs/design/ui-audit.md`

---

## Overview

Project list page displays all projects in a sortable, filterable table with status badges.

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Page Header                                                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Projects                                          [+ New]     │  │
│  │ View and manage your inspection projects                      │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Filters                                                            │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ [Search...                    ]  [Status ▼]                   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Data Table                                                         │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Job #   Address        Client      Status       Updated       │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │ 001     123 Main St    Acme Inc    [In Progress] 2 hours ago  │  │
│  │ 002     456 Oak Ave    Beta Corp   [Completed]   Yesterday    │  │
│  │ ...                                                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Page Header

### Title (H1)

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Font size | `typography.sizes.2xl` | 1.5rem (24px) | `text-2xl` |
| Font weight | `typography.weights.semibold` | 600 | `font-semibold` |
| Color | `colors.neutral.900` | #111827 | `text-gray-900` |

**Content:** "Projects"

### Description

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Font size | `typography.sizes.base` | 1rem (16px) | `text-base` |
| Color | `colors.neutral.600` | #4b5563 | `text-gray-600` |
| Margin top | `spacing.1` | 4px | `mt-1` |

**Content:** "View and manage your inspection projects"

### Header Container

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Margin bottom | `spacing.6` | 24px | `mb-6` |

---

## Filters Section

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Margin bottom | `spacing.6` | 24px | `mb-6` |
| Display | — | flex | `flex` |
| Direction (mobile) | — | column | `flex-col` |
| Direction (sm+) | — | row | `sm:flex-row` |
| Gap | `spacing.4` | 16px | `gap-4` |

### Search Input

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Flex | — | 1 | `flex-1` |
| Height | — | 40px | `h-10` |
| Padding X | `spacing.3` | 12px | `px-3` |
| Border | `borders.widths.DEFAULT` | 1px | `border` |
| Border color | `colors.neutral.200` | #e5e7eb | `border-gray-200` |
| Border radius | `borders.radius.lg` | 8px | `rounded-lg` |
| Placeholder | — | — | `placeholder-gray-400` |

### Status Filter (Select)

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Width (sm+) | — | 192px | `sm:w-48` |
| Height | — | 40px | `h-10` |
| Padding X | `spacing.3` | 12px | `px-3` |
| Border | `borders.widths.DEFAULT` | 1px | `border` |
| Border color | `colors.neutral.200` | #e5e7eb | `border-gray-200` |
| Border radius | `borders.radius.lg` | 8px | `rounded-lg` |

---

## Data Table

### Table Container

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Background | `colors.aliases.background` | #ffffff | `bg-white` |
| Border | `borders.widths.DEFAULT` | 1px | `border` |
| Border color | `colors.neutral.200` | #e5e7eb | `border-gray-200` |
| Border radius | `borders.radius.xl` | 12px | `rounded-xl` |
| Shadow | `shadows.levels.sm` | — | `shadow-sm` |
| Overflow | — | hidden | `overflow-hidden` |

### Table Header Row

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Background | `colors.neutral.50` | #f9fafb | `bg-gray-50` |

### Table Header Cell (TH)

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Padding X | `spacing.6` | 24px | `px-6` |
| Padding Y | `spacing.3` | 12px | `py-3` |
| Text align | — | left | `text-left` |
| Font size | `typography.sizes.sm` | 14px | `text-sm` |
| Font weight | `typography.weights.medium` | 500 | `font-medium` |
| Color | `colors.neutral.500` | #6b7280 | `text-gray-500` |
| Cursor | — | pointer | `cursor-pointer` |

#### Header Hover State

| Property | Value | Class |
|----------|-------|-------|
| Background | gray-100 | `hover:bg-gray-100` |

#### Sort Indicator

- Show `↑` for ascending, `↓` for descending
- Display next to column name when active

### Table Body Row (TR)

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Border bottom | — | 1px gray-200 | `border-b border-gray-200` |
| Background | — | white | `bg-white` |
| Cursor | — | pointer | `cursor-pointer` |

#### Row Hover State

| Property | Value | Class |
|----------|-------|-------|
| Background | gray-50 | `hover:bg-gray-50` |

### Table Cell (TD)

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Padding X | `spacing.6` | 24px | `px-6` |
| Padding Y | `spacing.4` | 16px | `py-4` |
| Whitespace | — | nowrap | `whitespace-nowrap` |

#### Cell Typography by Column

| Column | Font Size | Font Weight | Color | Classes |
|--------|-----------|-------------|-------|---------|
| Job # | sm | medium | gray-900 | `text-sm font-medium text-gray-900` |
| Address | sm | normal | gray-700 | `text-sm text-gray-700` |
| Client | sm | normal | gray-700 | `text-sm text-gray-700` |
| Status | — | — | — | (see Status Badge) |
| Updated | sm | normal | gray-500 | `text-sm text-gray-500` |

---

## Status Badge

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Display | — | inline-flex | `inline-flex` |
| Padding X | `spacing.2` | 8px | `px-2` |
| Padding Y | `spacing.0.5` | 2px | `py-0.5` |
| Font size | `typography.sizes.xs` | 12px | `text-xs` |
| Font weight | `typography.weights.medium` | 500 | `font-medium` |
| Border radius | `borders.radius.full` | 9999px | `rounded-full` |

### Status Variants

| Status | Background | Text | Classes |
|--------|------------|------|---------|
| Draft | gray-100 | gray-700 | `bg-gray-100 text-gray-700` |
| In Progress | blue-100 | blue-700 | `bg-blue-100 text-blue-700` |
| Review | yellow-100 | yellow-700 | `bg-yellow-100 text-yellow-700` |
| Completed | green-100 | green-700 | `bg-green-100 text-green-700` |

**Note:** Use `text-*-700` instead of `text-*-800` for better contrast.

---

## Empty State

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Background | `colors.aliases.background` | #ffffff | `bg-white` |
| Border | `borders.widths.DEFAULT` | 1px | `border` |
| Border color | `colors.neutral.200` | #e5e7eb | `border-gray-200` |
| Border radius | `borders.radius.xl` | 12px | `rounded-xl` |
| Shadow | `shadows.levels.sm` | — | `shadow-sm` |
| Padding | `spacing.8` | 32px | `p-8` |
| Text align | — | center | `text-center` |

### Empty State Icon

| Property | Value | Class |
|----------|-------|-------|
| Size | 48px | `h-12 w-12` |
| Color | gray-400 | `text-gray-400` |
| Margin | auto, bottom 16px | `mx-auto mb-4` |

### Empty State Title

| Property | Value | Class |
|----------|-------|-------|
| Font size | lg | `text-lg` |
| Font weight | medium | `font-medium` |
| Color | gray-900 | `text-gray-900` |
| Margin bottom | 4px | `mb-1` |

**Content:** "No projects found"

### Empty State Description

| Property | Value | Class |
|----------|-------|-------|
| Font size | base | `text-base` |
| Color | gray-500 | `text-gray-500` |

**Content:**
- With filters: "Try adjusting your filters"
- Without filters: "Create your first project to get started"

---

## Error State

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Background | — | red-50 | `bg-red-50` |
| Border | — | 1px red-200 | `border border-red-200` |
| Border radius | `borders.radius.xl` | 12px | `rounded-xl` |
| Padding | `spacing.4` | 16px | `p-4` |
| Text color | `colors.semantic.error` | #dc2626 | `text-red-600` |

---

## Loading State (Skeleton)

Use `animate-pulse` with gray-200 placeholder blocks matching the table structure.

| Element | Height | Width | Class |
|---------|--------|-------|-------|
| Header cells | 16px | 80px | `h-4 w-20 bg-gray-200 rounded` |
| Body cells | 16px | varies | `h-4 bg-gray-200 rounded` |

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Filters stack vertically, table scrolls horizontally |
| SM (640px+) | Filters side-by-side, table fits |

---

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Table semantics | Use `<table>`, `<thead>`, `<tbody>`, `<th scope="col">` |
| Sortable columns | `aria-sort="ascending"` / `"descending"` / `"none"` |
| Row click | Entire row clickable, focus visible |
| Keyboard nav | Tab to rows, Enter to navigate |
| Status badges | Include status text (not just color) |

---

## Component Checklist for Sam

- [ ] Update table container: `rounded-lg` → `rounded-xl`, add `shadow-sm`
- [ ] Update H1: `font-bold` → `font-semibold`
- [ ] Update header cells: remove `uppercase tracking-wider`, use `text-sm font-medium`
- [ ] Update status badges: `text-*-800` → `text-*-700`
- [ ] Add `border-gray-200` to inputs (not gray-300)
- [ ] Ensure empty/error states use `rounded-xl shadow-sm`

---

## Files to Modify

- `web/app/projects/page.tsx`
- `web/app/projects/project-list.tsx`
- `web/app/projects/project-filters.tsx`
