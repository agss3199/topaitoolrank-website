# Layout System & Responsive Design Specification

**Date**: 2026-05-09  
**Domain**: Layout, Typography, Responsive Design  
**Status**: DRAFT (based on analysis of current state and issues)

## Overview

The website uses a fixed header with `position: fixed; top: 18px` and needs a responsive layout system that:
- Compensates for fixed header height (72px + padding)
- Applies consistent max-width containers across all pages
- Maintains proper spacing at all viewport sizes
- Ensures animations work across all breakpoints

## Fixed Header Specification

### Header Positioning

- **Position**: `position: fixed`
- **Top offset**: `18px` (from design)
- **Height**: 72px (min-height in .navContainer)
- **Effective height**: 72px + 18px top + padding = ~108px visual offset
- **Z-index**: 1000
- **Styling**: Frosted glass effect (backdrop-filter: blur(18px), rgba bg)

**Location**: `app/components/Header.module.css` lines 9-30

### Content Compensation Required

All pages with the Header must compensate for the fixed header offset. Options:

#### Option A: Scroll Padding (Recommended)
```css
html {
  scroll-padding-top: 108px; /* header height + top offset + buffer */
}
```

**Pros**: Works with anchor navigation (#home, #services), smooth scroll
**Cons**: Requires measurement of actual header height
**Impact**: Applied to `app/globals.css`

#### Option B: Main Content Margin
```css
main {
  margin-top: 108px;
}
```

**Pros**: Direct and simple
**Cons**: Doesn't help with anchor navigation, not semantic for all page structures
**Impact**: Requires changes to multiple page layouts

#### Option C: Header Wrapper
```tsx
<HeaderWrapper>
  <Header />
</HeaderWrapper>
<main style={{ marginTop: "108px" }}>
  {/* content */}
</main>
```

**Pros**: Encapsulated component
**Cons**: Requires refactoring all page layouts
**Impact**: Changes to every page using Header

### Recommendation

**Use Option A (scroll-padding-top)** because:
1. Doesn't require markup changes
2. Works automatically with anchor links (#sections)
3. Semantic — doesn't change layout semantics
4. Single point of definition in globals.css

## Container System

### Definition

All content that is not full-width MUST be wrapped in a `.container` element that applies max-width and responsive padding.

**Current definition** (from `app/globals.css`):
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);  /* 16px on all sides */
}
```

### Responsive Behavior

#### Viewport Widths & Breakpoints

| Breakpoint | Name    | Width     | Content Max | Side Padding |
| ---------- | ------- | --------- | ----------- | ------------ |
| Mobile     | `sm`    | ≤640px    | 100% - 32px | 16px each    |
| Tablet     | `md`    | 641-1024  | 100% - 32px | 16px each    |
| Desktop    | `lg`    | 1024-1440 | 1000px      | auto         |
| Wide       | `xl`    | 1440+     | 1200px      | auto         |

#### Responsive Padding Rules

```css
/* Base — all screens */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);  /* 16px */
}

/* Mobile optimizations */
@media (max-width: 640px) {
  .container {
    padding: 0 var(--spacing-sm);  /* 8px for small screens */
  }
}

/* Large screens */
@media (min-width: 1440px) {
  .container {
    max-width: 1200px;  /* maintain max-width, don't grow */
  }
}
```

**Rationale**: 
- Mobile needs less padding to maximize reading space
- Desktop screens get consistent max-width for readability
- Never grow beyond 1200px (line length exceeds readability limits)

## Header Visibility Across Pages

### Pages Using Header

1. **Homepage** (`app/(marketing)/page.tsx`) — ✓ Currently imports Header
2. **Tool pages** (`app/tools/*/page.tsx`) — ✗ Import but may not be in layout
3. **Blog pages** (`app/blogs/*`) — ✗ Missing Header entirely

### Keyboard Accessibility

Fixed headers create a keyboard navigation issue: elements behind the header are still reachable via Tab but visually obscured.

**Required**: Add "Skip to main content" link as the first focusable element:

```tsx
// app/layout.tsx
<body>
  <a href="#main" className="skip-to-content">Skip to main content</a>
  {children}
</body>

// app/globals.css
.skip-to-content {
  position: absolute;
  left: -9999px;
  z-index: 999;
}

.skip-to-content:focus {
  position: fixed;
  left: 0;
  top: 100px; /* below fixed header */
  background: var(--color-accent);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
}

html {
  scroll-padding-top: 120px; /* header height + offset + buffer */
}
```

This ensures:
- Keyboard users can skip form/navigation with first Tab
- Focus trap doesn't occur behind fixed header
- Anchor navigation (#sections) scrolls content below header

### Required Structure

Every page that needs navigation MUST:

```tsx
// app/tools/my-tool/page.tsx
import Header from "@/app/components/Header";
import Footer from "../lib/Footer";

export default function MyToolPage() {
  return (
    <>
      <Header />
      <main>
        <div className="container">
          {/* page content */}
        </div>
      </main>
      <Footer />
    </>
  );
}
```

### Blog Section Structure

Blog layout must include Header:

```tsx
// app/blogs/layout.tsx
import Header from "@/app/components/Header";
import Footer from "@/app/lib/Footer";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="blog-context">
        {children}
      </div>
      <Footer />
    </>
  );
}
```

## Content Width Rules

### Maximum Line Length

For readability, lines of text should not exceed 70-80 characters. This applies to:

1. **Body text in articles** — max 70 chars
2. **Tool descriptions** — max 80 chars
3. **Form labels and help text** — max 70 chars

### Container Application

All content pages MUST wrap their main content in `.container`:

```tsx
<main>
  <div className="container">
    {/* all content here */}
  </div>
</main>
```

**Exception**: Full-width sections (hero, colored backgrounds) can extend beyond container:

```tsx
<section className="hero">
  {/* full-width background */}
  <div className="container">
    {/* content centered inside full-width section */}
  </div>
</section>
```

## Tool Page Specific Rules

### Tool Page Layout Structure

```tsx
// app/tools/[tool]/page.tsx
import { cls } from "../lib/css-module-safe";
import Header from "@/app/components/Header";
import Footer from "../lib/Footer";
import styles from "./styles.css";

export default function ToolPage() {
  return (
    <>
      <Header />
      <main className={cls(styles, "tool-main")}>
        <div className={cls(styles, "tool-container")}>
          {/* tool form, input, output */}
        </div>
      </main>
      <Footer />
    </>
  );
}
```

### Tool Styles Responsive Baseline

```css
.tool-main {
  padding: var(--spacing-2xl) 0;  /* 60px top/bottom */
  margin-top: 0;  /* Header compensation via scroll-padding-top */
}

@media (max-width: 768px) {
  .tool-main {
    padding: var(--spacing-xl) 0;  /* 40px on mobile */
  }
}

.tool-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);  /* 16px sides */
}

@media (max-width: 640px) {
  .tool-container {
    padding: 0 var(--spacing-sm);  /* 8px sides on mobile */
  }
}
```

## Animation Responsive Behavior

### CSS Cascade Rule

Any `@media` query that overrides properties MUST explicitly re-declare animation properties:

```css
/* Base — mobile first */
.animated-element {
  width: 260px;
  animation: rotateRing 16s linear infinite;
}

/* Desktop override — animation must be re-declared */
@media (min-width: 1024px) {
  .animated-element {
    width: 220px;
    animation: rotateRing 16s linear infinite;  /* ← REQUIRED */
  }
}

/* DO NOT — animation will be removed by cascade */
@media (min-width: 1024px) {
  .animated-element {
    width: 220px;
    /* animation: MISSING — silently removed by CSS cascade */
  }
}
```

### Animation Reuse Pattern

Use CSS variables for animations used in multiple rules:

```css
:root {
  --animation-ring-rotate: rotateRing 16s linear infinite;
}

.ring-one {
  animation: var(--animation-ring-rotate);
}

.ring-two {
  animation: var(--animation-ring-rotate);
}

@media (min-width: 1024px) {
  .ring-one {
    width: 220px;
    animation: var(--animation-ring-rotate);  /* consistent */
  }
}
```

## Responsive Typography

### Current System

Typography uses `clamp()` for automatic scaling:

```css
--font-size-h1: clamp(48px, 11.25vw, 180px);
--font-size-h2: clamp(32px, 5vw, 56px);
--font-size-body: clamp(16px, 1.125vw, 18px);
```

**Behavior**: Font sizes scale smoothly between min and max based on viewport width.

### Mobile Overrides

Mobile should not exceed visual hierarchy:

```css
@media (max-width: 640px) {
  --font-size-h1: clamp(32px, 8vw, 56px);  /* smaller max */
  --font-size-h2: clamp(24px, 4vw, 40px);
}
```

## Testing Protocol

### Responsive Validation

Before deployment, test all layouts at:

| Viewport | Device              | Width | Height |
| -------- | ------------------- | ----- | ------ |
| Mobile   | iPhone 12 mini      | 375   | 667    |
| Mobile   | Pixel 4             | 412   | 869    |
| Tablet   | iPad (10.2")        | 810   | 1080   |
| Desktop  | 1440p Monitor       | 1440  | 900    |
| Desktop  | 1920p Monitor (4K)  | 1920  | 1080   |
| Phone    | Landscape           | 812   | 375    |

### Checklist

- [ ] Header visible on all pages (marketing, tools, blogs)
- [ ] No content hidden behind header
- [ ] Content stays within container max-width
- [ ] Line lengths don't exceed 80 characters on desktop
- [ ] Padding adjusts on mobile (smaller margins)
- [ ] All animations play on desktop (no cascade issues)
- [ ] Forms stack vertically on mobile
- [ ] Images scale responsively
- [ ] No horizontal scroll at any viewport
- [ ] Touch targets are 44px minimum on mobile

## Files to Modify

**CSS Files**:
- `app/globals.css` — add scroll-padding-top, update .container rules
- `app/(marketing)/styles.css` — fix animation media queries
- `app/tools/*/styles.css` — apply container pattern, responsive padding
- `app/blogs/styles.css` — ensure content uses container

**Component Files**:
- `app/blogs/layout.tsx` — add Header
- `app/tools/*/layout.tsx` — add Header if missing
- `app/tools/*/page.tsx` — wrap content in .container if missing

## Related Specifications

- `specs/typography-guidelines.md` — text sizing and hierarchy
- `specs/tool-pages-layout.md` — tool-specific layout patterns
- `specs/animation-performance.md` — animation best practices

## Appendix: Common Breakpoints

```css
/* Small devices (phones) */
@media (max-width: 640px) { }

/* Medium devices (tablets) */
@media (min-width: 641px) and (max-width: 1024px) { }

/* Large devices (desktops) */
@media (min-width: 1025px) { }

/* Extra large (wide monitors) */
@media (min-width: 1440px) { }

/* Landscape orientation */
@media (orientation: landscape) { }

/* Touch devices */
@media (hover: none) { }
```

---

**Status**: SPECIFICATION — Ready for implementation planning
