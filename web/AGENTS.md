# UI Development Rules

This document defines rules for UI development in the ai-inspection web app.
AI coding assistants MUST follow these rules when generating or modifying code.

## Components

- **Use shadcn/ui components** — do not create custom versions of existing components
- Import from `@/components/ui/*` (Button, Card, Input, Label, Badge, Table, etc.)
- Use variant props (e.g., `variant="destructive"`) — don't override styles inline
- Check existing components before creating new ones

### Available Components

| Component | Import | Usage |
|-----------|--------|-------|
| Button | `@/components/ui/button` | Actions, links (with `asChild`) |
| Card | `@/components/ui/card` | Content containers |
| Input | `@/components/ui/input` | Text inputs |
| Label | `@/components/ui/label` | Form labels |
| Badge | `@/components/ui/badge` | Status indicators |
| Alert | `@/components/ui/alert` | Messages, errors |
| Table | `@/components/ui/table` | Data display |
| Separator | `@/components/ui/separator` | Visual dividers |

### Layout Components

| Component | Import | Usage |
|-----------|--------|-------|
| PageLayout | `@/components/page-layout` | Page wrapper |
| PageHeader | `@/components/page-layout` | Page title + actions |
| PageContent | `@/components/page-layout` | Page body |

## Spacing

Use the Tailwind spacing scale ONLY: `1`, `1.5`, `2`, `3`, `4`, `6`, `8`, `12` (in rem units)

| Context | Class |
|---------|-------|
| Card padding | `p-6` |
| Card content gap | `gap-4` or `space-y-4` |
| Sections | `space-y-6` |
| Form fields | `space-y-2` |
| Page padding | `px-4 py-6 sm:px-6 sm:py-8` |
| Grid gap | `gap-6` |

**Don't** use arbitrary spacing like `p-[13px]` or `gap-[7px]`.

## Colors

Use semantic color tokens — they automatically support dark mode.

| Usage | Token |
|-------|-------|
| Primary buttons | `bg-primary text-primary-foreground` |
| Body text | `text-foreground` |
| Muted text | `text-muted-foreground` |
| Page background | `bg-background` |
| Card background | `bg-card` |
| Muted background | `bg-muted` |
| Borders | `border-border` |
| Input borders | `border-input` |
| Error/destructive | `text-destructive`, `bg-destructive` |

**Don't** use:
- Arbitrary colors (`text-[#123456]`)
- Raw Tailwind colors (`text-gray-500`) — use tokens instead

## Typography

| Element | Classes |
|---------|---------|
| Page title | `text-2xl font-semibold text-foreground` |
| Section title | `text-xl font-semibold text-foreground` |
| Card title | `text-lg font-medium text-foreground` |
| Body text | `text-base text-foreground` |
| Labels | `text-sm font-medium` |
| Muted/helper | `text-sm text-muted-foreground` |
| Small text | `text-xs text-muted-foreground` |

## Layout

| Element | Classes |
|---------|---------|
| Page max-width | `max-w-7xl mx-auto` |
| Card | `rounded-xl border bg-card shadow-sm` |
| Button | `rounded-md` (via component) |
| Input | `rounded-md` (via component) |

## Forms

```tsx
// ✅ Correct
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>

// ❌ Wrong — custom styles
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
  <input className="block w-full px-4 py-3 border..." />
</div>
```

## Status Badges

Use the Badge component with semantic variants:

```tsx
<Badge variant="success">Completed</Badge>
<Badge variant="warning">In Progress</Badge>
<Badge variant="secondary">Draft</Badge>
<Badge variant="destructive">Urgent</Badge>
```

## Images

**Don't** use `<img>` — use Next.js `<Image>` for optimization:

```tsx
// ✅ Correct
import Image from 'next/image';
<Image src="/photo.jpg" alt="Description" width={200} height={150} />

// ❌ Wrong
<img src="/photo.jpg" alt="Description" />
```

## Don'ts

- ❌ Don't use inline styles (`style={{...}}`)
- ❌ Don't invent color values
- ❌ Don't use arbitrary spacing (`p-[13px]`)
- ❌ Don't create new button/input/card components
- ❌ Don't use `<img>` — use Next.js `<Image>`
- ❌ Don't hardcode colors (`text-gray-500`, `bg-blue-600`)
- ❌ Don't mix design systems (no Bootstrap, Material UI, etc.)

## Checklist for PRs

Before submitting UI changes:

- [ ] Uses shadcn/ui components where available
- [ ] Uses semantic color tokens (not raw colors)
- [ ] Uses standard spacing scale
- [ ] Uses correct typography classes
- [ ] No `<img>` tags (use Next.js `<Image>`)
- [ ] No inline styles
- [ ] Responsive (works on mobile)
