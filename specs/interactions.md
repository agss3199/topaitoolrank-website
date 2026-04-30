# Interactions & Micro-Motion Specifications

## Hover States (Desktop Only)

### CTA Buttons (Neon Lime Primary)
- **Default:** Background `#d4ff00`, black text, no shadow
- **Hover:** 
  - Background darkens to `#b8e600`
  - Text stays black
  - Add soft shadow: `0 4px 12px rgba(0, 0, 0, 0.08)`
  - Transition: `all 0.3s ease`
  - Cursor: `pointer`
- **Active (pressed):**
  - Background: `#9fd400`
  - Add lift shadow: `0 10px 25px rgba(0, 0, 0, 0.1)`
  - Transform: `scale(0.98)` (slight press effect)

### Secondary Buttons
- **Default:** Gray background, black text, subtle border
- **Hover:**
  - Background: `#e5e7eb`
  - Add soft shadow
  - Transition: `0.3s ease`
- **Active:**
  - Background: `#d1d5db`
  - Add lift shadow

### Text Links / Nav Links
- **Default:** Neon lime text, no underline
- **Hover:**
  - Text: Lime stays same
  - Underline: `1px solid #d4ff00`
  - Transition: `0.3s ease`
- **Active (current page):**
  - Underline: persistent
  - Weight: 600 (bold)

### Cards (Service, Tool, Reason Items)
- **Default:** White background, subtle border, soft shadow
- **Hover:**
  - Shadow: Upgrade to lift shadow
  - Transform: `scale(1.02)` (slight zoom)
  - Transition: `0.3s ease`
  - Cursor: `pointer` (if clickable)

---

## Scroll-Triggered Reveals

### "Reveal" Class Animations

```javascript
// Intersection Observer triggers animation on scroll
// When element enters viewport:
// - Add "visible" class
// - CSS animation plays

.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

.reveal.delay-1 { transition-delay: 0.2s; }
.reveal.delay-2 { transition-delay: 0.4s; }
.reveal.delay-3 { transition-delay: 0.6s; }
```

### Where Applied
- Section headings (fade in + slide up)
- Service cards (staggered reveal, delay-1 / delay-2 / delay-3)
- Tool cards (staggered reveal)
- Form inputs (fade in + slide up)
- Process steps (reveal on scroll)

### Trigger Threshold
- Intersection Observer threshold: `0.12` (trigger when 12% of element is visible)
- Timing: Smooth, not jarring

---

## Form Interactions

### Input Fields
- **Default:** White background, subtle gray border
- **Focus:**
  - Border color: Neon lime `#d4ff00`
  - Outline: None (border provides focus indicator)
  - Shadow: `0 0 0 3px rgba(212, 255, 0, 0.1)` (soft lime glow)
  - Transition: `0.2s ease`
  - Cursor: `text`
- **Filled:** Show value, no change in appearance
- **Error:** Border color red `#ef4444`, add error message below
- **Disabled:** Background `#f3f4f6`, text `#9ca3af`, cursor `not-allowed`

### Textarea (for message)
- Same as input field
- Min-height: 120px
- Allow resize vertically

### Submit Button
- See CTA Button hover states above
- Disabled state: Opacity 50%, cursor `not-allowed`

---

## Navigation Menu (Mobile)

### Hamburger Button
- **Default:** Three horizontal lines, black color
- **Hover:** Opacity change to 0.7
- **Active (menu open):** Transform lines into X (animated)
  ```css
  .hamburger.active span:nth-child(1) {
    transform: rotate(45deg) translate(8px, 8px);
  }
  .hamburger.active span:nth-child(2) {
    opacity: 0;
  }
  .hamburger.active span:nth-child(3) {
    transform: rotate(-45deg) translate(7px, -7px);
  }
  ```

### Mobile Menu (Dropdown)
- **Default:** Hidden (height 0, overflow hidden)
- **Open:** Expand to show menu items
- **Animation:** `max-height 0.3s ease`, smooth expansion
- **Items:** Full width, 44px minimum height (touch-friendly)
- **Hover:** Background highlight (light gray)

---

## Page Load Animations

### Canvas Particle Animation (REMOVED)
- No longer used in Option A
- Saves 50-100ms on LCP

### Hero Section Fade-In
- Hero text and buttons fade in + slide up on page load
- Duration: 0.6s
- Timing: `ease-out`
- Starts immediately (no delay)

---

## No Animation Where It Doesn't Add Value

### Removed from Current Design
- ❌ Particle canvas (commodity, distracting)
- ❌ Glowing orbs
- ❌ Infinite parallax loops
- ❌ Auto-rotating carousels

### Kept (Purpose-Driven)
- ✅ Hover state feedback (indicates interactivity)
- ✅ Scroll reveals (semantic progression through content)
- ✅ Focus states (accessibility + feedback)
- ✅ Button transitions (visual feedback on interaction)

---

## Motion Accessibility

### Prefers Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Effect:** Users with vestibular disorders see instant state changes instead of animations. All functionality preserved.

---

## Cursor Behavior

| Element | Cursor |
|---------|--------|
| Buttons | `pointer` |
| Links | `pointer` |
| Cards (clickable) | `pointer` |
| Text | `text` |
| Disabled elements | `not-allowed` |
| Form inputs | `text` |
| Default | `auto` |

---

## Timing Constants

- **Quick interactions (hover):** `0.2s` - `0.3s`
- **Page transitions (scroll reveals):** `0.6s`
- **Easing function:** `ease` or `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out curve)
- **Delay between staggered items:** `0.1s` - `0.2s`

---

## No Autoplay

- ❌ Videos (explicitly blocked)
- ❌ Audio (explicitly blocked)
- ❌ Carousels (no auto-rotation)
- ❌ Animations on page load (only on user scroll)

---

## Touch Interactions (Mobile)

### Tap
- Buttons: Same effect as hover + click
- Links: Open target
- Cards: Navigate or open detail

### Touch Target Size
- Minimum: 44px × 44px (iOS/Android standard)
- Preferred: 48px × 48px or larger
- Spacing: 8px minimum between touch targets

### No Hover (Mobile)
- Mobile doesn't support true hover
- Use active/focus states instead
- CSS: `@media (hover: none)` for mobile-specific styles
