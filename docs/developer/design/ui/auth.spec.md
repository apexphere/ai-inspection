# Auth Pages Design Spec

**Author:** Alice 🎨  
**Date:** 2026-02-23  
**Ticket:** #370  
**Pages:** Login, Register  
**Reference:** `docs/design/tokens.yaml`, `docs/design/ui-audit.md`

---

## Overview

Login and Register pages share identical layouts — centered card on neutral background. This spec covers both.

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│                        bg-gray-50                           │
│                                                             │
│                    ┌─────────────────┐                      │
│                    │     Logo/Title  │                      │
│                    │    Subtitle     │                      │
│                    └─────────────────┘                      │
│                                                             │
│                    ┌─────────────────┐                      │
│                    │                 │                      │
│                    │   Form Card     │                      │
│                    │                 │                      │
│                    └─────────────────┘                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Container

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Min height | — | 100vh | `min-h-screen` |
| Display | — | flex | `flex` |
| Align | — | center | `items-center justify-center` |
| Background | `colors.neutral.50` | #f9fafb | `bg-gray-50` |
| Padding X | `spacing.4` | 16px | `px-4` |

---

## Header Section

### App Title (H1)

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Font size | `typography.sizes.2xl` | 1.5rem (24px) | `text-2xl` |
| Font weight | `typography.weights.semibold` | 600 | `font-semibold` |
| Color | `colors.neutral.900` | #111827 | `text-gray-900` |
| Margin bottom | `spacing.2` | 8px | `mb-2` |

**Content:** "AI Inspection"

### Subtitle

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Font size | `typography.sizes.base` | 1rem (16px) | `text-base` |
| Color | `colors.neutral.600` | #4b5563 | `text-gray-600` |
| Margin bottom | `spacing.8` | 32px | `mb-8` |

**Content:**
- Login: "Sign in to your account"
- Register: "Create your account"

---

## Form Card

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Background | `colors.aliases.background` | #ffffff | `bg-white` |
| Border radius | `borders.radius.xl` | 12px | `rounded-xl` |
| Shadow | `shadows.levels.sm` | — | `shadow-sm` |
| Padding | `spacing.6` | 24px | `p-6` |
| Max width | — | 448px | `max-w-md` |
| Width | — | 100% | `w-full` |

---

## Form Elements

### Error Alert (when present)

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Background | — | red-50 | `bg-red-50` |
| Border | — | 1px red-200 | `border border-red-200` |
| Border radius | `borders.radius.lg` | 8px | `rounded-lg` |
| Padding | `spacing.3` | 12px | `p-3` |
| Margin bottom | `spacing.4` | 16px | `mb-4` |
| Text color | `colors.semantic.error` | #dc2626 | `text-red-600` |
| Font size | `typography.sizes.sm` | 14px | `text-sm` |

**Accessibility:** `role="alert"`

### Form Field Container

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Spacing between fields | `spacing.4` | 16px | `space-y-4` |
| Last field margin | `spacing.6` | 24px | `mb-6` (before button) |

### Label

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Font size | `typography.sizes.sm` | 14px | `text-sm` |
| Font weight | `typography.weights.medium` | 500 | `font-medium` |
| Color | `colors.neutral.700` | #374151 | `text-gray-700` |
| Margin bottom | `spacing.2` | 8px | `mb-2` |
| Display | — | block | `block` |

### Input

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Height | — | 44px | `h-11` |
| Width | — | 100% | `w-full` |
| Padding X | `spacing.3` | 12px | `px-3` |
| Border | `borders.widths.DEFAULT` | 1px | `border` |
| Border color | `colors.neutral.200` | #e5e7eb | `border-gray-200` |
| Border radius | `borders.radius.lg` | 8px | `rounded-lg` |
| Font size | `typography.sizes.base` | 16px | `text-base` |
| Color | `colors.neutral.900` | #111827 | `text-gray-900` |
| Placeholder color | `colors.neutral.400` | #9ca3af | `placeholder-gray-400` |

#### Input States

**Focus:**
| Property | Value | Class |
|----------|-------|-------|
| Ring width | 2px | `focus:ring-2` |
| Ring color | primary-500 | `focus:ring-blue-500` |
| Border color | primary-500 | `focus:border-blue-500` |
| Outline | none | `focus:outline-none` |

**Disabled:**
| Property | Value | Class |
|----------|-------|-------|
| Opacity | 50% | `disabled:opacity-50` |
| Cursor | not-allowed | `disabled:cursor-not-allowed` |
| Background | gray-50 | `disabled:bg-gray-50` |

**Error:**
| Property | Value | Class |
|----------|-------|-------|
| Border color | red-500 | `border-red-500` |
| Focus ring | red-500 | `focus:ring-red-500` |

### Helper Text (Register - password hint)

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Font size | `typography.sizes.xs` | 12px | `text-xs` |
| Color | `colors.neutral.500` | #6b7280 | `text-gray-500` |
| Margin top | `spacing.1` | 4px | `mt-1` |

---

## Primary Button

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Width | — | 100% | `w-full` |
| Height | — | 44px | `h-11` |
| Padding X | `spacing.4` | 16px | `px-4` |
| Background | `colors.primary.600` | #2563eb | `bg-blue-600` |
| Text color | — | white | `text-white` |
| Font size | `typography.sizes.sm` | 14px | `text-sm` |
| Font weight | `typography.weights.medium` | 500 | `font-medium` |
| Border radius | `borders.radius.lg` | 8px | `rounded-lg` |
| Transition | `transitions.duration.DEFAULT` | 200ms | `transition-colors` |

#### Button States

**Hover:**
| Property | Value | Class |
|----------|-------|-------|
| Background | primary-700 | `hover:bg-blue-700` |

**Focus:**
| Property | Value | Class |
|----------|-------|-------|
| Ring width | 2px | `focus:ring-2` |
| Ring color | primary-500 | `focus:ring-blue-500` |
| Ring offset | 2px | `focus:ring-offset-2` |

**Disabled:**
| Property | Value | Class |
|----------|-------|-------|
| Opacity | 50% | `disabled:opacity-50` |
| Cursor | not-allowed | `disabled:cursor-not-allowed` |

**Loading:**
- Text changes to "Signing in..." / "Creating account..."
- Button disabled during submission

---

## Footer Link

| Property | Token | Value | Class |
|----------|-------|-------|-------|
| Margin top | `spacing.4` | 16px | `mt-4` |
| Text align | — | center | `text-center` |
| Font size | `typography.sizes.sm` | 14px | `text-sm` |
| Text color | `colors.neutral.600` | #4b5563 | `text-gray-600` |

### Link

| Property | Value | Class |
|----------|-------|-------|
| Color | primary-600 | `text-blue-600` |
| Font weight | medium | `font-medium` |
| Hover color | primary-700 | `hover:text-blue-700` |

**Content:**
- Login: "Don't have an account? **Register**"
- Register: "Already have an account? **Sign in**"

---

## Responsive Behavior

No breakpoint-specific changes needed. Layout is mobile-first and works at all sizes.

| Breakpoint | Behavior |
|------------|----------|
| All sizes | Centered card, max-width constrains on larger screens |

---

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Focus visible | Ring styles on all interactive elements |
| Error announcement | `role="alert"` on error messages |
| Form labels | `htmlFor` matching input `id` |
| Required fields | `required` attribute |
| Autocomplete | `email`, `current-password`, `new-password` |
| Keyboard nav | Tab order follows visual order |

---

## Component Checklist for Sam

- [ ] Update card: `rounded-lg` → `rounded-xl`, `shadow` → `shadow-sm`, `p-8` → `p-6`
- [ ] Update H1: `text-3xl font-bold` → `text-2xl font-semibold`
- [ ] Update inputs: `border-gray-300` → `border-gray-200`, add `h-11`
- [ ] Update error alert: use `bg-red-50 border border-red-200`
- [ ] Verify button uses `bg-blue-600` (not CSS variable until fixed)
- [ ] Add focus ring offset to button: `focus:ring-offset-2`

---

## Files to Modify

- `web/app/login/page.tsx`
- `web/app/register/page.tsx`

---

## Visual Reference

Current login page with annotations showing required changes:

```
┌────────────────────────────────────────┐
│           AI Inspection                │ ← text-2xl font-semibold (was 3xl bold)
│      Sign in to your account           │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ ┌──────────────────────────────┐ │  │
│  │ │ Email                        │ │  │
│  │ │ ┌────────────────────────┐   │ │  │ ← border-gray-200 (was 300)
│  │ │ │ you@example.com        │   │ │  │
│  │ │ └────────────────────────┘   │ │  │
│  │ │                              │ │  │
│  │ │ Password                     │ │  │
│  │ │ ┌────────────────────────┐   │ │  │
│  │ │ │ ••••••••               │   │ │  │
│  │ │ └────────────────────────┘   │ │  │
│  │ │                              │ │  │
│  │ │ ┌────────────────────────┐   │ │  │
│  │ │ │       Sign In          │   │ │  │ ← bg-blue-600, rounded-lg
│  │ │ └────────────────────────┘   │ │  │
│  │ │                              │ │  │
│  │ │ Don't have an account?       │ │  │
│  │ │ Register                     │ │  │
│  │ └──────────────────────────────┘ │  │
│  └──────────────────────────────────┘  │ ← rounded-xl, shadow-sm, p-6
│                                        │
└────────────────────────────────────────┘
```
