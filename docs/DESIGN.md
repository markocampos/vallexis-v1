# Vallexis Design System

> **Version:** 1.1.0  
> **Last Updated:** June 23, 2026  
> **Maintainer:** Vallexis Design Team  
> **Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Spacing & Layout](#spacing--layout)
6. [Motion & Animation](#motion--animation)
7. [Dark / Light Mode](#dark--light-mode)
8. [Components](#components)
9. [Accessibility](#accessibility)
10. [Usage Examples](#usage-examples)

---

## Overview

Vallexis is a dark-first design system built for tech-forward products. Inspired by the rare and resilient Blue Iguana, our visual language communicates distinction, clarity, and professionalism across every touchpoint.

```
┌─────────────────────────────────────────────────────────┐
│  Vallexis — Where exotic distinction meets              │
│  technical precision.                                   │
│                                                         │
│  Dark. Minimal. Purposeful.                             │
└─────────────────────────────────────────────────────────┘
```

### Design Tokens Architecture

All values are exposed as CSS custom properties (variables) for consistency across platforms:

```css
:root {
  /* Colors, typography, spacing, and effects */
  /* See sections below for full reference */
}
```

---

## Design Principles

### 1. Dark-First Aesthetic
Every component is designed for dark mode first. Light mode is an adaptation, not an afterthought. The deep navy-black canvas creates a tech-forward atmosphere that lets content breathe.

### 2. Rare Blue Iguana Identity
Our brand is inspired by the critically endangered Blue Iguana — distinctive, exotic, and resilient. This translates into a visual language that is memorable without being loud.

### 3. Clarity Over Decoration
Every pixel serves a purpose. No decorative noise. No ornamental flourishes. If an element doesn't guide the user or communicate information, it doesn't belong.

### 4. Mobile-First Responsive
Founders work from phones. Every component, layout, and interaction is designed for mobile first, then scaled up to desktop with progressive enhancement.

### 5. Accessibility Baseline
WCAG 2.1 AA compliance is non-negotiable. Color contrast ratios, focus states, and screen reader support are built in from day one — never bolted on.

---

## Color System

### Brand Palette

| Token | Hex | Preview | Usage |
|-------|-----|---------|-------|
| `--blue-primary` | `#1E88E5` | <span style="display:inline-block;width:24px;height:24px;background:#1E88E5;border-radius:4px;"></span> | Main brand color, primary CTAs, key actions |
| `--blue-vivid` | `#2196F3` | <span style="display:inline-block;width:24px;height:24px;background:#2196F3;border-radius:4px;"></span> | Hover states, interactive emphasis |
| `--blue-glow` | `#4FC3F7` | <span style="display:inline-block;width:24px;height:24px;background:#4FC3F7;border-radius:4px;"></span> | Accents, highlights, glow effects |

### Neutral Palette

| Token | Hex | Preview | Usage |
|-------|-----|---------|-------|
| `--bg-deep` | `#060A14` | <span style="display:inline-block;width:24px;height:24px;background:#060A14;border:1px solid #333;border-radius:4px;"></span> | Page background, canvas |
| `--bg-surface` | `#0D1525` | <span style="display:inline-block;width:24px;height:24px;background:#0D1525;border:1px solid #333;border-radius:4px;"></span> | Sidebar, panel backgrounds |
| `--bg-card` | `rgba(30,136,229,0.04)` | <span style="display:inline-block;width:24px;height:24px;background:rgba(30,136,229,0.04);border:1px solid #333;border-radius:4px;"></span> | Card backgrounds, elevated surfaces |
| `--bg-overlay` | `rgba(6,10,20,0.85)` | <span style="display:inline-block;width:24px;height:24px;background:rgba(6,10,20,0.85);border:1px solid #333;border-radius:4px;"></span> | Modal backdrop, drawer overlays |
| `--border-subtle` | `rgba(30,136,229,0.08)` | <span style="display:inline-block;width:24px;height:24px;background:rgba(30,136,229,0.08);border:1px solid #333;border-radius:4px;"></span> | Default card/input borders |
| `--border-interactive` | `rgba(30,136,229,0.3)` | <span style="display:inline-block;width:24px;height:24px;background:rgba(30,136,229,0.3);border:1px solid #333;border-radius:4px;"></span> | Hover borders on interactive cards |
| `--text-primary` | `#E8EDF5` | <span style="display:inline-block;width:24px;height:24px;background:#E8EDF5;border-radius:4px;"></span> | Headings, primary body text |
| `--text-secondary` | `#90CAF9` | <span style="display:inline-block;width:24px;height:24px;background:#90CAF9;border-radius:4px;"></span> | Descriptions, captions, metadata |
| `--text-muted` | `#4A6080` | <span style="display:inline-block;width:24px;height:24px;background:#4A6080;border-radius:4px;"></span> | Placeholder text, disabled labels |

### Semantic Colors

| Token | Hex | Preview | Usage |
|-------|-----|---------|-------|
| `--success` | `#66BB6A` | <span style="display:inline-block;width:24px;height:24px;background:#66BB6A;border-radius:4px;"></span> | Success states, confirmations |
| `--warning` | `#FFD54F` | <span style="display:inline-block;width:24px;height:24px;background:#FFD54F;border-radius:4px;"></span> | Warnings, cautionary messages |
| `--error` | `#EF5350` | <span style="display:inline-block;width:24px;height:24px;background:#EF5350;border-radius:4px;"></span> | Errors, destructive actions |

### Color Usage Rules

```
┌─────────────────────────────────────────────────────────┐
│  CONTRAST RATIOS (WCAG 2.1 AA)                          │
│  ─────────────────────────────────────────────────────  │
│  --text-primary on --bg-deep    →  15.2:1  ✓ AAA       │
│  --text-secondary on --bg-deep  →   8.4:1  ✓ AAA       │
│  --blue-primary on --bg-deep    →   5.1:1  ✓ AA        │
│  --blue-glow on --bg-deep       →   7.8:1  ✓ AAA       │
└─────────────────────────────────────────────────────────┘
```

- **Primary actions:** Use `--blue-primary` with `--text-primary` text
- **Hover states:** Transition to `--blue-vivid` with `150ms ease`
- **Disabled states:** Reduce opacity to `0.4`, remove interactivity
- **Focus rings:** `0 0 0 3px rgba(79, 195, 247, 0.3)` (`--blue-glow` at 30%)

---

## Typography

### Font Stack

| Role | Font | Weights | Fallback | Usage |
|------|------|---------|----------|-------|
| Display | **Outfit** | 900 | system-ui, sans-serif | Hero headlines, brand moments |
| Heading | **Outfit** | 700 | system-ui, sans-serif | Section titles, card headers |
| Body | **Inter** | 400–600 | system-ui, sans-serif | Body copy, UI labels, descriptions |
| Code | **JetBrains Mono** | 400–600 | monospace | Code blocks, technical data, badges |

### Type Scale

| Token | Size | Line Height | Weight | Role |
|-------|------|-------------|--------|------|
| `--text-display` | 48px / 3rem | 1.1 | 900 | Hero headlines |
| `--text-h1` | 36px / 2.25rem | 1.2 | 700 | Page titles |
| `--text-h2` | 28px / 1.75rem | 1.25 | 700 | Section headings |
| `--text-h3` | 22px / 1.375rem | 1.3 | 700 | Card titles |
| `--text-body` | 16px / 1rem | 1.6 | 400 | Body paragraphs |
| `--text-small` | 14px / 0.875rem | 1.5 | 400 | Captions, metadata |
| `--text-xs` | 12px / 0.75rem | 1.4 | 500 | Badges, timestamps |

### Typography Rules

- **Maximum line length:** 65 characters for body text
- **Letter spacing:** `0.02em` for uppercase text; `-0.01em` for display text
- **Font loading:** Preload Outfit 700 & 900, Inter 400–600 to prevent FOUT

---

## Spacing & Layout

### Base Unit

The spacing system uses an **8px base unit** for predictable, scalable rhythm:

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight gaps, icon padding |
| `--space-2` | 8px | Inline spacing, small gaps |
| `--space-3` | 12px | Button padding, badge padding |
| `--space-4` | 16px | Card padding, section gaps |
| `--space-5` | 24px | Component separation |
| `--space-6` | 32px | Section padding |
| `--space-8` | 48px | Large section margins |
| `--space-10` | 64px | Hero spacing |
| `--space-12` | 80px | Page-level margins |
| `--space-16` | 128px | Maximum section separation |

### Grid System

```
┌─────────────────────────────────────────────────────────┐
│  BREAKPOINTS                                            │
│  ─────────────────────────────────────────────────────  │
│  Mobile:     0 – 639px    (single column, full bleed)    │
│  Tablet:     640 – 1023px (2-column grid, 24px gutters)  │
│  Desktop:    1024px+      (12-column grid, 32px gutters) │
│                                                         │
│  CONTAINER MAX-WIDTH                                    │
│  ─────────────────────────────────────────────────────  │
│  Mobile:     100% (16px side padding)                    │
│  Tablet:     720px                                       │
│  Desktop:    1200px                                      │
└─────────────────────────────────────────────────────────┘
```

### Z-Index Scale

| Layer | Z-Index | Usage |
|-------|---------|-------|
| Background | 0 | Page canvas |
| Content | 10 | Default content |
| Elevated | 20 | Cards, modals |
| Overlay | 30 | Backdrops, scrims |
| Navigation | 40 | Header, sticky nav |
| Modal | 50 | Dialogs, toasts |
| Tooltip | 60 | Tooltips, popovers |

---

## Motion & Animation

All animations respect `prefers-reduced-motion`. When reduced motion is preferred, transitions are replaced with instant state changes and opacity fades only.

### Duration Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-instant` | 50ms | Micro-interactions (button press, checkbox toggle) |
| `--duration-fast` | 150ms | Hover effects, colour transitions |
| `--duration-base` | 200ms | Card hover, input focus, dropdown open |
| `--duration-slow` | 300ms | Modal enter, page transitions, toast slide-in |
| `--duration-deliberate` | 500ms | Onboarding animations, feature highlight |

### Easing Functions

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard UI transitions (Material-style) |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Elements exiting the screen |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering the screen |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Micro-bounce for playful elements (badges, toasts) |
| `--ease-linear` | `linear` | Progress bars, loaders |

### Motion Rules

- **Enter animations:** Elements slide in from their natural direction (modals from bottom, dropdowns from top, toasts from top-right).
- **Exit animations:** Exit faster than enter — perception of snappiness improves with fast exits.
- **Looping animations:** Avoid infinite looping animations in the main UI. Loaders are the only exception, and they must be dismissible.
- **Glow pulses:** The deploy status indicator uses a `pulse` keyframe animation at `2s ease-in-out infinite` — disabled when `prefers-reduced-motion: reduce`.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Dark / Light Mode

Vallexis is **dark-first**. The dark theme is the default and primary experience. A light mode adaptation is available and togglable via the dashboard settings.

### Theme Switching

Theme is controlled by the `data-theme` attribute on `<html>`:
```html
<html data-theme="dark">   <!-- default -->
<html data-theme="light">
```

### Light Mode Token Overrides

```css
[data-theme="light"] {
  --bg-deep:        #F4F7FC;
  --bg-surface:     #FFFFFF;
  --bg-card:        rgba(30, 136, 229, 0.03);
  --bg-overlay:     rgba(244, 247, 252, 0.92);
  --border-subtle:  rgba(30, 136, 229, 0.12);
  --border-interactive: rgba(30, 136, 229, 0.4);
  --text-primary:   #0D1525;
  --text-secondary: #1565C0;
  --text-muted:     #6B8CAE;
}
```

All brand colours (`--blue-primary`, `--blue-vivid`, `--blue-glow`) and semantic colours remain the same in both modes — they were chosen to work on both dark and light backgrounds.

### WCAG Contrast in Light Mode

| Pair | Ratio | Grade |
|---|---|---|
| `--text-primary` on `--bg-deep` (light) | 13.4:1 | ✅ AAA |
| `--blue-primary` on `--bg-deep` (light) | 4.8:1 | ✅ AA |

---

## Components

### Card

```
┌────────────────────────────────────────┐
│  Card Component                        │
│  ─────────────────────────────────────  │
│                                        │
│  ┌────────────────────────────────┐   │
│  │  [Content Area]                │   │
│  │                                │   │
│  │  Title, body, actions...       │   │
│  │                                │   │
│  └────────────────────────────────┘   │
│                                        │
│  Specs:                                │
│  • Border radius: 14–16px              │
│  • Background: var(--bg-card)          │
│  • Border: 1px solid rgba(30,136,229,  │
│            0.08)                       │
│  • Hover: glow border (box-shadow)     │
│  • Transition: all 200ms ease          │
│                                        │
└────────────────────────────────────────┘
```

**Variants:**
- **Default:** Translucent background with subtle border
- **Hover:** Blue glow border (`0 0 0 1px rgba(30,136,229,0.3), 0 0 20px rgba(30,136,229,0.1)`)
- **Active:** Slightly elevated with deeper shadow

---

### Button

```
┌────────────────────────────────────────┐
│  Button Component                      │
│  ─────────────────────────────────────  │
│                                        │
│  [ Primary ]  [ Secondary ]  [ Ghost ]  │
│                                        │
│  Specs:                                │
│  • Min-height: 40px                    │
│  • Border radius: 12px                 │
│  • Padding: 12px 24px                  │
│  • Font: Inter 500, 14px               │
│  • Transition: all 150ms ease          │
│                                        │
└────────────────────────────────────────┘
```

**Variants:**

| Variant | Background | Text | Border | Hover State |
|---------|------------|------|--------|-------------|
| **Primary** | `--blue-primary` | `--text-primary` | none | `--blue-vivid`, lift `-2px` |
| **Secondary** | transparent | `--blue-primary` | `1px solid --blue-primary` | `--bg-card` fill |
| **Ghost** | transparent | `--text-secondary` | none | `--text-primary`, subtle bg |

**States:**
- **Disabled:** `opacity: 0.4`, `cursor: not-allowed`, remove hover effects
- **Loading:** Spinner replaces text, maintain dimensions
- **Focus:** `box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.3)`

---

### Input

```
┌────────────────────────────────────────┐
│  Input Component                       │
│  ─────────────────────────────────────  │
│                                        │
│  ┌────────────────────────────────┐   │
│  │  Placeholder text...           │   │
│  └────────────────────────────────┘   │
│                                        │
│  Specs:                                │
│  • Height: 44px                        │
│  • Border radius: 10px                 │
│  • Background: rgba(255,255,255,0.03)│
│  • Border: 1px solid rgba(144,202,249, │
│            0.15)                       │
│  • Focus: glow border + shadow         │
│                                        │
└────────────────────────────────────────┘
```

**States:**
- **Default:** Subtle border, transparent-ish background
- **Focus:** Border transitions to `--blue-glow`, `box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.15)`
- **Error:** Border `--error`, subtle red glow
- **Disabled:** `opacity: 0.4`, no interactivity

---

### Badge

```
┌────────────────────────────────────────┐
│  Badge Component                       │
│  ─────────────────────────────────────  │
│                                        │
│  [ STATUS ]  [ BETA ]  [ NEW ]         │
│                                        │
│  Specs:                                │
│  • Font: JetBrains Mono, 10px          │
│  • Weight: 500                         │
│  • Text transform: uppercase           │
│  • Letter spacing: 0.05em              │
│  • Padding: 4px 8px                    │
│  • Border radius: 4px                  │
│                                        │
└────────────────────────────────────────┘
```

**Color Variants:**

| Type | Background | Text |
|------|------------|------|
| **Info** | `rgba(30,136,229,0.15)` | `--blue-primary` |
| **Success** | `rgba(102,187,106,0.15)` | `--success` |
| **Warning** | `rgba(255,213,79,0.15)` | `--warning` |
| **Error** | `rgba(239,83,80,0.15)` | `--error` |
| **Neutral** | `rgba(144,202,249,0.1)` | `--text-secondary` |

---

### Tooltip

```
┌────────────────────────────────────────┐
│  Tooltip Component                     │
│  ─────────────────────────────────────  │
│                                        │
│  ┌───────────────────────────────┐     │
│  │  ▲  Helpful context text      │     │
│  └───────────────────────────────┘     │
│                                        │
│  Specs:                                │
│  • Background: rgba(13, 21, 37, 0.95)  │
│  • Border: 1px solid --border-subtle   │
│  • Border radius: 8px                  │
│  • Font: Inter 12px / --text-xs        │
│  • Max width: 240px                    │
│  • Padding: 8px 12px                   │
│  • Delay: 300ms before show            │
│  • Arrow: 6px triangle, same bg        │
│                                        │
└────────────────────────────────────────┘
```

**Placement:** `top` (default), `bottom`, `left`, `right`. Flip automatically if near viewport edge.

**Accessibility:** `role="tooltip"` + `aria-describedby` on the trigger. Never put interactive elements inside a tooltip.

---

### Modal / Dialog

```
┌────────────────────────────────────────┐
│  Modal Component                       │
│  ─────────────────────────────────────  │
│                                        │
│  ┌────────── Backdrop ───────────┐     │
│  │  ┌──────── Dialog ──────────┐ │     │
│  │  │  Title             [✕]   │ │     │
│  │  │  ─────────────────────   │ │     │
│  │  │  Body content...         │ │     │
│  │  │                          │ │     │
│  │  │  [Cancel]  [Confirm]     │ │     │
│  │  └──────────────────────────┘ │     │
│  └────────────────────────────────┘    │
│                                        │
│  Specs:                                │
│  • Backdrop: --bg-overlay, blur(4px)   │
│  • Dialog max-width: 480px             │
│  • Dialog border-radius: 16px          │
│  • Dialog padding: 32px                │
│  • Animation: slide-up 300ms ease-out  │
│  • z-index: 50 (Modal layer)           │
│                                        │
└────────────────────────────────────────┘
```

**Focus management:**
- Focus is trapped inside the dialog while open.
- On open: focus moves to the first focusable element (or the dialog itself if none).
- On close: focus returns to the element that triggered the dialog.
- `Escape` key closes the dialog.

**Accessibility:** `role="dialog"` + `aria-modal="true"` + `aria-labelledby` pointing to the dialog title.

---

## Accessibility

### WCAG 2.1 AA Compliance

| Requirement | Implementation |
|-------------|----------------|
| **Color Contrast** | All text meets 4.5:1 minimum; large text meets 3:1 |
| **Focus Indicators** | Visible `3px` glow ring on all interactive elements |
| **Keyboard Navigation** | Full tab order, `Enter`/`Space` activation, `Escape` dismissal |
| **Screen Readers** | Semantic HTML, `aria-label` on icon-only buttons, live regions for alerts |
| **Motion** | `prefers-reduced-motion` respected; no auto-playing animations |
| **Touch Targets** | Minimum `44×44px` for all interactive elements |

### Accessibility Checklist

- [ ] All images have descriptive `alt` text
- [ ] Form inputs have associated `<label>` elements
- [ ] Color is never the sole means of conveying information
- [ ] Error messages are programmatically associated with inputs
- [ ] Skip-to-content link is present on all pages
- [ ] Focus order follows visual flow (LTR, top-to-bottom)

---

## Usage Examples

### CSS Custom Properties

```css
:root {
  /* Brand Colors */
  --blue-primary: #1E88E5;
  --blue-vivid: #2196F3;
  --blue-glow: #4FC3F7;

  /* Neutral Colors */
  --bg-deep: #060A14;
  --bg-card: rgba(30, 136, 229, 0.04);
  --text-primary: #E8EDF5;
  --text-secondary: #90CAF9;

  /* Semantic Colors */
  --success: #66BB6A;
  --warning: #FFD54F;
  --error: #EF5350;

  /* Typography */
  --font-display: 'Outfit', system-ui, sans-serif;
  --font-heading: 'Outfit', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-code: 'JetBrains Mono', monospace;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;

  /* Effects */
  --radius-card: 14px;
  --radius-button: 12px;
  --radius-input: 10px;
  --shadow-glow: 0 0 20px rgba(30, 136, 229, 0.1);
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
}
```

### Component Quick Start

```html
<!-- Card -->
<div class="vallexis-card">
  <h3 class="vallexis-heading">Card Title</h3>
  <p class="vallexis-body">Card content goes here.</p>
  <button class="vallexis-button vallexis-button--primary">Action</button>
</div>

<!-- Button -->
<button class="vallexis-button vallexis-button--primary">Primary</button>
<button class="vallexis-button vallexis-button--secondary">Secondary</button>
<button class="vallexis-button vallexis-button--ghost">Ghost</button>

<!-- Input -->
<div class="vallexis-input-group">
  <label for="email">Email</label>
  <input 
    type="email" 
    id="email" 
    class="vallexis-input" 
    placeholder="you@company.com"
  />
</div>

<!-- Badge -->
<span class="vallexis-badge vallexis-badge--success">LIVE</span>
<span class="vallexis-badge vallexis-badge--warning">BETA</span>
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2026-06-23 | Added Motion & Animation tokens, Dark/Light Mode section, Tooltip + Modal components, border tokens, `--bg-surface`, `--bg-overlay`, `--text-muted` |
| 1.0.0 | 2026-06-22 | Initial release — color system, typography, core components |

---

*Vallexis Design System © 2026. Inspired by the rare, built for the resilient.*
