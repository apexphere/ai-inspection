# Design: UI Design System

**Status:** Draft  
**Author:** Archer  
**Date:** 2026-02-21  
**Ticket:** #296

---

## Problem

The web UI lacks visual consistency. AI-generated components have:
- Inconsistent spacing (random values)
- No visual hierarchy
- Weak contrast
- No brand identity
- Inconsistent borders and shadows

**Root cause:** No design system = AI improvises every time.

---

## Goals

1. **Consistency** — Every page looks like the same app
2. **Professional** — "Well-funded B2B SaaS" not "AI prototype"
3. **AI Constraints** — Rules so AI stops improvising
4. **Developer Speed** — Reusable components

---

## Decisions

### Visual Direction: Clean SaaS (Stripe-style)

**Why:**
- Professional, trustworthy
- Fits building inspection industry (B2B)
- Clear hierarchy, good readability
- Timeless, not trendy

**Characteristics:**
- White/gray backgrounds
- Blue primary accent
- Generous whitespace
- Subtle shadows
- Clear typography hierarchy

### Component Library: shadcn/ui

**Why:**
- Built on Radix UI (accessible primitives)
- Tailwind-based (matches existing stack)
- Copy-paste ownership (no runtime dependency)
- Highly customizable
- Active community, well-documented

**Alternatives considered:**
- Radix UI raw → Too much work
- Material UI → Wrong aesthetic, heavy
- Chakra UI → Different styling approach
- Custom from scratch → Too slow

---

## Design Tokens

### Colors

```typescript
// tailwind.config.ts
colors: {
  // Brand
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',  // Primary action
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Semantic
  success: '#16a34a',  // green-600
  warning: '#ca8a04',  // yellow-600
  error: '#dc2626',    // red-600
  info: '#2563eb',     // blue-600
  
  // Neutrals (use gray scale)
  background: '#ffffff',
  surface: '#f9fafb',     // gray-50
  border: '#e5e7eb',      // gray-200
  muted: '#6b7280',       // gray-500
  foreground: '#111827',  // gray-900
}
```

### Spacing Scale

**Use ONLY these values:**

| Token | Value | Use for |
|-------|-------|---------|
| `1` | 4px | Tight inline spacing |
| `1.5` | 6px | Icon gaps |
| `2` | 8px | Related elements |
| `3` | 12px | Section padding (small) |
| `4` | 16px | Card padding, gaps |
| `6` | 24px | Section spacing |
| `8` | 32px | Major sections |
| `12` | 48px | Page sections |

### Typography

```typescript
// Font sizes and weights
typography: {
  h1: 'text-2xl font-semibold text-gray-900',    // Page titles
  h2: 'text-xl font-semibold text-gray-900',     // Section titles
  h3: 'text-lg font-medium text-gray-900',       // Card titles
  body: 'text-base text-gray-700',               // Default text
  small: 'text-sm text-gray-600',                // Secondary text
  muted: 'text-sm text-gray-500',                // Helper text
  label: 'text-sm font-medium text-gray-700',    // Form labels
}
```

### Border Radius

| Element | Radius | Class |
|---------|--------|-------|
| Buttons | 8px | `rounded-lg` |
| Inputs | 8px | `rounded-lg` |
| Cards | 12px | `rounded-xl` |
| Modals | 16px | `rounded-2xl` |
| Badges/Pills | Full | `rounded-full` |

### Shadows

| Level | Class | Use for |
|-------|-------|---------|
| None | — | Flat elements |
| Subtle | `shadow-sm` | Cards, containers |
| Medium | `shadow-md` | Dropdowns, popovers |
| Strong | `shadow-lg` | Modals |

---

## Component Specifications

### PageLayout

Standard page structure:

```tsx
<PageLayout>
  <PageHeader 
    title="Inspections"
    description="Manage your property inspections"
    actions={<Button>New Inspection</Button>}
  />
  <PageContent>
    {/* Page content */}
  </PageContent>
</PageLayout>
```

**Specs:**
- Max width: 1280px (7xl)
- Horizontal padding: 24px (6)
- Vertical padding: 32px (8)
- Background: white

### Card

Content container:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Section Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

**Specs:**
- Background: white
- Border: 1px gray-200
- Radius: rounded-xl (12px)
- Shadow: shadow-sm
- Padding: 24px (6)

### Button

Variants:

| Variant | Use for | Style |
|---------|---------|-------|
| `default` | Primary actions | Blue bg, white text |
| `secondary` | Secondary actions | Gray bg, dark text |
| `outline` | Tertiary actions | Border only |
| `ghost` | Subtle actions | No bg, hover state |
| `destructive` | Dangerous actions | Red bg |

**Specs:**
- Height: 40px (default), 36px (sm), 44px (lg)
- Padding: 16px horizontal
- Radius: rounded-lg
- Font: text-sm font-medium

### Input

Form input with label:

```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
  <p className="text-sm text-gray-500">We'll never share your email.</p>
</div>
```

**Specs:**
- Height: 40px
- Padding: 12px horizontal
- Border: 1px gray-300
- Radius: rounded-lg
- Focus: ring-2 ring-blue-500

### DataTable

For lists (inspections, projects):

```tsx
<DataTable
  columns={columns}
  data={inspections}
  searchable
  pagination
/>
```

**Specs:**
- Header: bg-gray-50, font-medium
- Rows: hover:bg-gray-50
- Border: border-b gray-200
- Cell padding: 16px

---

## File Structure

```
web/
├── components/
│   └── ui/                    # shadcn components (auto-generated)
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── ...
├── lib/
│   └── utils.ts               # cn() helper
├── styles/
│   └── globals.css            # Tailwind + CSS variables
└── tailwind.config.ts         # Design tokens
```

---

## AI Constraints

Add to `web/AGENTS.md`:

```markdown
## UI Development Rules

### Components
- Use shadcn/ui components — do not create custom versions
- Import from `@/components/ui/*`
- Use variant props, don't override styles

### Spacing
- Use spacing scale ONLY: 1, 1.5, 2, 3, 4, 6, 8, 12 (Tailwind units)
- Cards: p-6, gap-4
- Sections: space-y-6
- Form fields: space-y-2

### Colors
- Primary actions: `bg-primary` (blue-600)
- Text: `text-foreground` (gray-900), `text-muted-foreground` (gray-500)
- Backgrounds: `bg-background` (white), `bg-muted` (gray-50)
- Do NOT use arbitrary colors

### Typography
- Page titles: h1 — `text-2xl font-semibold`
- Section titles: h2 — `text-xl font-semibold`
- Card titles: h3 — `text-lg font-medium`
- Body: `text-base`
- Labels: `text-sm font-medium`

### Layout
- Page max-width: `max-w-7xl mx-auto`
- Page padding: `px-6 py-8`
- Card radius: `rounded-xl`
- Button radius: `rounded-lg`

### Don't
- Don't use inline styles
- Don't invent color values
- Don't use arbitrary spacing (p-[13px])
- Don't create new button/input components
```

---

## Implementation Plan

### Phase 1: Foundation (Stories #1-3)
1. Install shadcn/ui
2. Configure design tokens in Tailwind
3. Create PageLayout component

### Phase 2: Components (Stories #4-6)
4. Set up core shadcn components (Button, Input, Card, etc.)
5. Create DataTable component
6. Create form components (FormField, Select, etc.)

### Phase 3: Migration (Stories #7-9)
7. Update auth pages (login, register)
8. Update inspection list page
9. Update inspection detail page

### Phase 4: Polish (Story #10)
10. Add AI constraints docs, final review

---

## Success Metrics

- [ ] All pages use design system components
- [ ] No arbitrary Tailwind values in codebase
- [ ] WCAG AA contrast compliance
- [ ] Consistent on mobile and desktop
- [ ] AI-generated code follows constraints

---

## References

- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Stripe Dashboard](https://dashboard.stripe.com/) (visual reference)
