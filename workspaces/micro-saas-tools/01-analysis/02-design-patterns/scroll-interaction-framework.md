# Scroll Interaction Framework

**Purpose**: Define what "feeling the website" means through scroll responsiveness  
**Status**: Preliminary (will refine after agent findings)

---

## Core Principle: Progressive Engagement

As users scroll, visual feedback increases engagement without distraction:

1. **Entry** — Element fades in and slides up when entering viewport
2. **Momentum** — Parallax or depth cues during scroll-through
3. **Rest** — Section settles into position with breathing room
4. **Exit** — Graceful fade as section leaves viewport (optional, subtle)

---

## Section-by-Section Interaction Map

### HERO (First View)

**Current State**: Broken neural-core animation (3 rotating rings) — **REMOVE**

**Redesign Direction:**

```
┌─────────────────────────────────────────────┐
│  HERO SECTION                               │
├─────────────────────────────────────────────┤
│                                             │
│  Left Content (Hero Text):                  │
│  • Eyebrow: fade-in on load                 │
│  • Headline: scale slightly smaller as user │
│    scrolls past 200px; fade 25%             │
│  • Subtitle: opacity fade                   │
│  • CTAs: lift on hover, smooth color trans  │
│  • Proof points: stagger-reveal on load     │
│                                             │
│  Right Visual (Hero Visual):                │
│  • Remove neural-core animation             │
│  • Replace with: premium AI/tech visual     │
│    Option A: Minimalist gradient + icons   │
│    Option B: Animated tech illustration    │
│    Option C: Interactive dashboard visual  │
│  • Floating chips: parallax depth (slower  │
│    scroll rate than background)            │
│                                             │
└─────────────────────────────────────────────┘

Scroll Behavior:
- 0-200px scrolled: Hero content steady
- 200-400px: Hero title scales 1.0 → 0.85, fades 1.0 → 0.75
- Exit viewport: Background gradient opacity fades slightly
```

**Code Pattern:**
```css
.hero h1 {
  transform-origin: left top;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

@media (prefers-reduced-motion: no-preference) {
  .hero.scrolled-200px h1 {
    transform: scale(0.85);
    opacity: 0.75;
  }
}
```

### CREDIBILITY STRIP (2nd Section)

**Current**: Basic 4-point proof strip  
**Redesign**: Elevate visual weight, add subtle animations

```
Scroll Entry (when reaching this section):
- 4 proof points: stagger-reveal on entry
- Timing: each item fades in + slides up, 100ms apart
- On hover: background color shift, slight scale (1.0 → 1.02)

Scroll Momentum:
- Subtle parallax: text moves slightly slower than background
  (creates depth perception)
```

### SERVICES (3rd Section)

**Current**: Basic 4-card grid  
**Redesign**: Premium card elevation, staggered reveals

```
Scroll Entry:
- 4 service cards: reveal on viewport entry
- Stagger: 80ms between each card
- Animation: opacity 0→1 + translateY(24px→0) over 0.6s ease-out
- Easing: ease-out (fast start, slow end = natural feel)

On Hover (all breakpoints including touch):
- Card: lift up (translateY -8px)
- Shadow: increase from soft to card-level
- Background: subtle color shift (e.g., #f1f5f9 → #dbeafe)
- Duration: 0.3s ease

Visual Hierarchy:
- Service #3 (MVP): offset slightly lower (visual interest)
- Icon area: numbered (01, 02, 03, 04) in primary color
```

### TOOLS SHOWCASE (4th Section)

**Current**: 10-card grid, flat  
**Redesign**: Staggered reveals, category highlight

```
Scroll Entry:
- 10 tool cards: grid layout
- Stagger: reveal in wave pattern (left-to-right, top-to-bottom)
  - Card (1,1): 0ms
  - Card (1,2): 50ms
  - Card (1,3): 100ms
  - Card (2,1): 50ms (offset, creates diagonal wave)
  - etc.
- Animation: opacity + scale (0.95→1.0)

On Hover:
- Card elevation: lift + shadow increase
- Tool badge: color shift (green → darker green)
- Title: color → primary blue
- Link arrow: slide right (→ becomes ➜)

Visual Rhythm:
- Consistent 24px spacing between cards
- Category grouping (optional): tools grouped by type
  - Communication (WhatsApp tools)
  - Productivity (Word Counter, JSON, etc)
  - Business (Invoice, SEO, UTM)
```

### WHY-US (5th Section)

**Current**: 4-reason grid  
**Redesign**: Strengthen narrative, add visual indicators

```
Scroll Entry:
- 4 reason items: stagger-reveal (same pattern as services)
- Animation: scale + opacity (0.95, opacity 0) → (1.0, opacity 1)

Visual Enhancement:
- Add icon or number badge to each reason (e.g., ✓ or numbered)
- Left accent border (4px, primary color) on hover
- Subtle background shift on hover

Narrative Structure:
- Reason 1: Business understanding (clarifies process focus)
- Reason 2: Design quality (visual credibility)
- Reason 3: Speed (execution capability)
- Reason 4: Real use (not theory)
→ Combined: "We understand your business, design beautifully, move fast, build real systems"
```

### PROCESS (6th Section)

**Current**: 4-step sequence  
**Redesign**: Visual timeline elevation

```
Scroll Entry:
- 4 process steps: reveal on entry with stagger
- Animation: icon scales in (0.5→1.0) + text fades in
- Timing: 100ms between each step

Visual Enhancement:
- Timeline connector line between steps (subtle, 2px, gray)
- Step number (1, 2, 3, 4): large, primary color
- Step title: bold, darker text
- Step description: body text, standard

On Hover:
- Step number: +4px font-size
- Connector line (if present): color shift to primary
```

### CONTACT (7th Section)

**Current**: Standard form inputs  
**Redesign**: Premium form design, field-level interactions

```
Scroll Entry:
- Form copy (left): fade in + slide from left
- Form (right): fade in + slide from right
- Timing: staggered entry

Form Interactions:
- Input focus: 
  - Border color: gray → primary blue
  - Placeholder text: fade slightly
  - Background: subtle tint (#f8fbff)
  - Bottom border accent: 2px primary blue (appears on focus)
- Submit button:
  - Hover: lift + shadow increase
  - Active (pressed): scale down slightly (0.98)
  - Disabled: opacity 0.5, cursor not-allowed

Validation:
- Error state: border → red, helper text appears (animate in)
- Success state: border → green, checkmark appears
```

---

## Animation Easing Constants

Use these easing functions consistently across all interactions:

```css
/* Page-wide easing */
:root {
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);      /* standard */
  --ease-out: cubic-bezier(0.0, 0, 0.2, 1);         /* quick exit */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);            /* slow start */
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* playful */
}

/* Standard durations */
.short { --duration: 0.2s; }   /* hover feedback */
.medium { --duration: 0.3s; }  /* form focus, card lift */
.long { --duration: 0.6s; }    /* scroll reveals */
```

---

## GPU-Safe Animation Checklist

✅ Use: `transform` (translate, scale, rotate), `opacity`  
❌ Avoid: width, height, margin, padding, top, left, position changes

**Before implementing any animation:**

1. Can it be done with `transform` or `opacity`? → Yes = safe ✅
2. Will it trigger layout changes? → No = safe ✅
3. Mobile test: Smooth at 4x CPU throttle? → Yes = safe ✅

---

## Progressive Enhancement Hierarchy

1. **Base (no JS needed)**: All content visible, readable, functional
2. **With CSS transitions**: Hovers, button feedback, color changes
3. **With Intersection Observer**: Scroll reveals, staggered enters
4. **With JavaScript interactivity**: Form validation, advanced interactions

Users without JS (or with slow connections) see static but complete site. Animations are progressive enhancement.

---

## Mobile Interaction Adjustments

On touch devices:
- Remove `:hover` states where not applicable
- Use `@media (hover: hover)` to query capability
- `@media (pointer: coarse)` for touch-specific sizing (larger targets)
- Reduce animation durations on mobile (faster feel)
- Disable parallax on mobile (potential jank)

```css
@media (hover: hover) {
  .card:hover {
    transform: translateY(-8px);
  }
}

@media (hover: none) {
  .card:active {
    /* active state for touch */
    background: var(--color-accent-subtle);
  }
}
```

---

## Key Interaction Principles

1. **Feedback is Instant** — User action → immediate visual response (no delay)
2. **Easing is Natural** — Ease-out for entrances (feels organic), ease-in-out for changes
3. **Duration is Short** — Hover feedback: 0.2s, reveals: 0.6s (keeps momentum)
4. **Scale is Subtle** — Hovers: 1.02x, not 1.1x (professional, not cartoonish)
5. **Color Shifts are Complementary** — Blue primary → lighter blue tint, not clashing color

---

## Testing Checklist

- [ ] All animations 60fps at 4x CPU throttle (Chrome DevTools)
- [ ] No layout shifts during reveals (CLS <0.1)
- [ ] Touch devices: no jank, no hidden interactivity
- [ ] `prefers-reduced-motion: reduce` removes all animations
- [ ] Fallback: everything functional without JS/CSS animations
- [ ] Mobile: animations feel fast (reduced durations acceptable)
- [ ] Accessibility: color changes also use other indicators (e.g., borders, icons)
