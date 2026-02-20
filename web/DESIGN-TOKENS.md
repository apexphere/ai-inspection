# Design Tokens

This document defines the design tokens for the AI Inspection web app. All tokens are configured in `app/globals.css` using CSS custom properties (CSS variables) for Tailwind v4.

## Colors

### Core Colors
Use these for primary UI elements:

| Token | Tailwind Class | Usage |
|-------|----------------|-------|
| `--primary` | `bg-primary`, `text-primary` | Primary buttons, links |
| `--secondary` | `bg-secondary`, `text-secondary` | Secondary buttons |
| `--muted` | `bg-muted`, `text-muted` | Muted backgrounds |
| `--accent` | `bg-accent`, `text-accent` | Hover states, highlights |
| `--destructive` | `bg-destructive`, `text-destructive` | Delete actions |

### Semantic Colors
Use these for status indicators and feedback:

| Token | Tailwind Class | Usage |
|-------|----------------|-------|
| `--success` | `bg-success`, `text-success` | Success messages, positive status |
| `--warning` | `bg-warning`, `text-warning` | Warning messages, caution |
| `--error` | `bg-error`, `text-error` | Error messages, validation |
| `--info` | `bg-info`, `text-info` | Informational messages |

### Surface Colors
| Token | Tailwind Class | Usage |
|-------|----------------|-------|
| `--background` | `bg-background` | Page background |
| `--card` | `bg-card` | Card backgrounds |
| `--popover` | `bg-popover` | Dropdown/popover backgrounds |
| `--border` | `border-border` | Borders |
| `--input` | `bg-input` | Input backgrounds |

## Spacing

**Only use these spacing values** to maintain consistency:

| Tailwind Class | Value | Use Case |
|----------------|-------|----------|
| `p-1`, `m-1` | 0.25rem (4px) | Tight spacing |
| `p-1.5`, `m-1.5` | 0.375rem (6px) | Small elements |
| `p-2`, `m-2` | 0.5rem (8px) | Compact spacing |
| `p-3`, `m-3` | 0.75rem (12px) | Standard small |
| `p-4`, `m-4` | 1rem (16px) | Standard medium |
| `p-6`, `m-6` | 1.5rem (24px) | Standard large |
| `p-8`, `m-8` | 2rem (32px) | Section spacing |
| `p-12`, `m-12` | 3rem (48px) | Large sections |

**Do NOT use**: `p-5`, `p-7`, `p-9`, `p-10`, `p-11` (breaks rhythm)

## Typography

### Headings
```tsx
// H1 - Page titles
<h1 className="text-2xl font-semibold text-foreground">Title</h1>

// H2 - Section headings
<h2 className="text-xl font-semibold text-foreground">Section</h2>

// H3 - Subsection headings
<h3 className="text-lg font-medium text-foreground">Subsection</h3>

// H4 - Card headings
<h4 className="text-base font-medium text-foreground">Card Title</h4>
```

### Body Text
```tsx
// Default body
<p className="text-base text-foreground">Body text</p>

// Secondary/muted text
<p className="text-sm text-muted-foreground">Secondary text</p>

// Small/caption text
<p className="text-xs text-muted-foreground">Caption</p>
```

## Border Radius

Use the radius scale for consistent rounding:

| Tailwind Class | CSS Variable | Value |
|----------------|--------------|-------|
| `rounded-sm` | `--radius-sm` | 0.375rem |
| `rounded-md` | `--radius-md` | 0.5rem |
| `rounded-lg` | `--radius-lg` | 0.625rem (default) |
| `rounded-xl` | `--radius-xl` | 1rem |
| `rounded-2xl` | `--radius-2xl` | 1.125rem |

## Shadows

Use Tailwind's default shadow scale:

| Class | Usage |
|-------|-------|
| `shadow-sm` | Subtle elevation (inputs, small cards) |
| `shadow` | Standard elevation (cards) |
| `shadow-md` | Medium elevation (dropdowns) |
| `shadow-lg` | High elevation (modals) |

## Usage Examples

### Status Badge
```tsx
<span className="inline-flex items-center rounded-md bg-success/10 px-2 py-1 text-xs font-medium text-success">
  Passed
</span>
```

### Form Input
```tsx
<input className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" />
```

### Card
```tsx
<div className="rounded-lg border bg-card p-6 shadow-sm">
  <h3 className="text-lg font-medium text-card-foreground">Title</h3>
  <p className="text-sm text-muted-foreground">Description</p>
</div>
```
