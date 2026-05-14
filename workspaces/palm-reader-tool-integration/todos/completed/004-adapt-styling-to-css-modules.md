# 004 — Adapt Styling from Tailwind to CSS Modules via cls() Helper

**Status**: completed  
**Owner**: react-specialist  
**Phase**: implement  
**Effort**: 20 min (straightforward mapping)  
**Depends on**: 002 (page structure defined)  
**Blocks**: 005 (integration into layout)

---

## Overview

Convert the source app's Tailwind-based styling from `globals.css` to CSS Modules following the website's `cls()` helper pattern. Create tool-specific CSS Modules for CameraView, ResultsView, and page layout, with proper color schemes matching the website design.

**Scope**: ~300 LOC of CSS, organized into 3 CSS Module files, all accessed via cls() helper.

---

## Specification References

- **R3 & R4 UI Specs** — color codes, layout dimensions
- **css-module-safety.md** — all CSS access must use cls() helper, no direct styles[...] access

---

## Acceptance Criteria

### CSS Module Files Created
- [ ] Create `app/tools/palm-reader/styles/camera.module.css` (~100 LOC)
- [ ] Create `app/tools/palm-reader/styles/results.module.css` (~100 LOC)
- [ ] Create `app/tools/palm-reader/styles/page.module.css` (~80 LOC)

### Camera View Styles (camera.module.css)
- [ ] `.container` — responsive wrapper, max-width matches tool standard
- [ ] `.video` — hidden video element (display: none)
- [ ] `.canvas` — visible canvas, 640x480 at desktop, responsive mobile
- [ ] `.overlay` — absolute positioned, black background 60% opacity
- [ ] `.quality` — top-left positioned, white text, 14px font
- [ ] `.status` — below quality meter, white text, 16px font, bold
- [ ] `.landmarks` — red dots for hand landmarks (drawn via canvas context)
- [ ] `.connections` — green lines for hand connections (drawn via canvas context)
- [ ] `.home-button` — bottom-left button styling, click handler

### Results View Styles (results.module.css)
- [ ] `.container` — full page wrapper, proper spacing
- [ ] `.line-section` — one per palm line (life, heart, head, fate, sun)
- [ ] `.line-icon` — left side emoji icon
- [ ] `.line-name` — line title (e.g., "Life Line")
- [ ] `.line-description` — physical appearance of line
- [ ] `.line-interpretation` — meaning/divination
- [ ] `.line-border-left` — colored left border per spec §R4:
  - Life: red (#ef4444)
  - Heart: pink (#ec4899)
  - Head: blue (#3b82f6)
  - Fate: yellow (#eab308)
  - Sun: orange (#f97316)
- [ ] `.overall-reading` — indigo styling (background indigo-50, border indigo-600)
- [ ] `.tips` — green styling (background green-50, border green-600)
- [ ] `.buttons` — wrapper for action buttons
- [ ] `.button-primary` — "Read Another Palm" styling
- [ ] `.button-secondary` — "Home" styling

### Page Layout Styles (page.module.css)
- [ ] `.page` — root container with proper spacing
- [ ] `.loading-overlay` — centered spinner during API call
- [ ] `.loading-text` — "Analyzing palm..." message
- [ ] `.error-message` — error display with red color
- [ ] `.error-retry` — retry button styling

### Color Scheme & Responsive Design
- [ ] Desktop layout: 640px canvas, full results width
- [ ] Tablet (768px breakpoint): canvas scaled to 90vw max, results adjusted
- [ ] Mobile (375px breakpoint): canvas 100vw with padding, stack layouts vertically
- [ ] Color palette: matches website theme (indigo/purple accent colors)
- [ ] Typography: consistent with website (font family, sizes, weights)

### cls() Helper Integration
- [ ] All components import `cls` from `lib/css-module-safe.ts`
- [ ] All dynamic styles use pattern: `cls(styles, "className")`
- [ ] Example: `<div className={cls(styles, 'quality')}>`
- [ ] No direct access: `styles['quality']` is BLOCKED
- [ ] Helper exists in codebase (if not, use existing website helper)

### Responsive Design Testing
- [ ] Desktop (1920px): layouts render correctly
- [ ] Tablet (768px): canvas and results responsive
- [ ] Mobile (375px): single column, touch-friendly buttons
- [ ] Mobile landscape (667px): camera view fits screen

### Code Quality
- [ ] No hardcoded colors outside of spec-defined values
- [ ] Consistent spacing (use 4px grid: 4px, 8px, 12px, 16px, 24px, 32px)
- [ ] No vendor prefixes needed (modern CSS support)
- [ ] BEM naming convention: `.block__element--modifier`
- [ ] Comments explain non-obvious styling choices

---

## Files to Create/Modify

```
app/tools/palm-reader/
├── styles/
│   ├── camera.module.css (new, ~100 LOC)
│   ├── results.module.css (new, ~100 LOC)
│   └── page.module.css (new, ~80 LOC)
├── components/
│   ├── CameraView.tsx (modify: import camera.module.css)
│   ├── ResultsView.tsx (modify: import results.module.css)
│   └── QualityMeter.tsx (modify: import camera.module.css)
└── page.tsx (modify: import page.module.css)
```

---

## Example CSS Module Structure

```css
/* camera.module.css */

.container {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  padding: 16px;
}

.video {
  display: none;
}

.canvas {
  width: 100%;
  height: auto;
  max-width: 640px;
  border-radius: 8px;
  background: #000;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 8px;
}

.quality {
  position: absolute;
  top: 16px;
  left: 16px;
  color: #fff;
  font-size: 14px;
  font-weight: bold;
}

/* Mobile breakpoint */
@media (max-width: 768px) {
  .container {
    padding: 12px;
  }

  .canvas {
    border-radius: 4px;
  }
}
```

---

## Styling Mapping from Source App

Map from source app's Tailwind `@apply` rules to CSS Module classes:

| Source Tailwind | Target CSS Module Class | Purpose |
| --- | --- | --- |
| `flex flex-col items-center justify-center` | `.container` + flexbox | Center layout |
| `bg-gradient-to-br from-indigo-600 to-purple-600` | `.hero` | Hero section (page wrapper) |
| `rounded-lg shadow-lg` | `.line-section` | Card styling |
| `text-white` | `.quality`, `.status` | Text color |
| `text-center` | `.overall-reading` | Center align |
| `border-l-4 border-red-500` | `.line-border-left` (with color) | Line accent |
| `bg-indigo-50` | `.overall-reading` (background) | Section background |

---

## Verification Checklist

- [ ] All three CSS Module files created in `styles/` directory
- [ ] Components import CSS modules: `import styles from '../styles/camera.module.css'`
- [ ] All className attributes use cls() helper pattern
- [ ] No direct `styles['className']` access anywhere
- [ ] CameraView renders with correct overlay styling
- [ ] Quality meter displays in correct position
- [ ] ResultsView renders with color-coded line borders
- [ ] Overall reading section has indigo background + border
- [ ] Tips section has green background + border
- [ ] Buttons styled and clickable
- [ ] Page layout responsive at 375px (mobile)
- [ ] Page layout responsive at 768px (tablet)
- [ ] Page layout responsive at 1920px (desktop)
- [ ] CSS parsed without errors: `npm run build`
- [ ] Visual inspection: matches spec §R3-R4 layouts
- [ ] No console CSS warnings in DevTools

---

## Related Todos

- **Depends on**: 002 (page and components exist)
- **Blocks**: 005 (layout integration requires final CSS)
- **Parallelize with**: none (sequential work)

---

## Implementation Notes

### Responsive Canvas
Canvas element maintains 4:3 aspect ratio (640x480). Use CSS to scale responsively:
```css
.canvas {
  width: 100%;
  height: auto;
  max-width: 640px;
}
```

### Color Constants
Define color variables at top of each module for consistency:
```css
:root {
  --color-life: #ef4444;
  --color-heart: #ec4899;
  --color-head: #3b82f6;
  --color-fate: #eab308;
  --color-sun: #f97316;
}
```

### Flexbox Layouts
Results view uses flexbox for sections:
```css
.line-section {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-left: 4px solid var(--color);
}
```

---

## Session Context

- Source styling: `AIIndividualProject/workspaces/palm-reader-ai/globals.css`
- Website CSS helper: `app/tools/lib/css-module-safe.ts`
- Tool design system: Reference existing tools in `app/tools/*/styles/`

