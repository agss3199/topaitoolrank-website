# Homepage Redesign Specification

**Phase**: /todos (Design Planning)  
**Date**: 2026-05-13  
**Status**: Implementation-ready specs

---

## New Information Architecture

```
1. HEADER & NAVIGATION (fixed)
   └─ Keep current structure, add shrink + backdrop blur on scroll >60px

2. HERO SECTION (refine)
   ├─ Eyebrow: Keep pulsing green dot + "Custom AI software for ambitious businesses"
   ├─ H1: Keep current ("Build the software your business actually needs")
   ├─ Subtitle: CHANGE to outcome-focused
   │  Old: "I help founders, operators, and growing teams turn messy workflows..."
   │  New: "I turn your messy workflows into software that runs without you."
   ├─ CTA Area: CHANGE (remove "View Services" secondary button)
   │  Primary: "Discuss Your Project" (filled blue gradient)
   │  Anchor text below: "See how it works ↓" (no button, subtle)
   ├─ Visual: REPLACE neural-core animation with dashboard mockup
   │  Dashboard shows: 3 data panels, simple charts, status badges
   │  Parallax effect: content rises 0.5x scroll rate, visual sinks 1x
   │  Floating chips around it (AI Agents, Dashboards, Automation) with parallax
   └─ Spacing: Increase to 260px top, 120px bottom (more breathing room)

3. PROBLEM FRAME (NEW SECTION — critical for premium positioning)
   ├─ Background: white (no gradients, confident)
   ├─ Section kicker: "The real problem"
   ├─ Headline: "You don't need more software. You need software that fits."
   │  Font-size: clamp(28px, 4vw, 44px) — larger than other h2s
   │  Weight: 800, tight letter-spacing
   ├─ 3 Pain-Point Cards (text-heavy, no icons):
   │  ├─ Card 1: "Your team uses 6 tools that don't talk to each other"
   │  ├─ Card 2: "Your ops workflow lives in spreadsheets and WhatsApp"
   │  └─ Card 3: "You tried off-the-shelf and it's close, but not quite"
   ├─ Card Design:
   │  └─ Left border accent: 4px solid #3b82f6
   │  └─ No background color (white)
   │  └─ Body text left-aligned, generous padding (32px)
   │  └─ No animations (this section demands careful reading)
   ├─ Spacing: 80px top, 120px bottom (major visual pause)
   └─ Scroll behavior: NONE (static, confident text)

4. SERVICES SECTION (restructure + elevate)
   ├─ Heading: "What I can build for you"
   ├─ Layout: 2-column primary row + 2-column secondary row
   ├─ PRIMARY ROW (larger, more detail):
   │  ├─ Service 01: Custom Software Development
   │  │  └─ Icon #01 (blue circle, white text)
   │  │  └─ Headline: "Custom Software Development"
   │  │  └─ Description: 2 lines of what it is + 2 lines of business outcome
   │  │  └─ Example: "A logistics company replaced 4 spreadsheets with one automated dashboard. Onboarding now takes 4 minutes instead of 40."
   │  └─ Service 02: AI Automation Systems
   │     └─ [Same structure, different example]
   ├─ SECONDARY ROW (smaller, entry-level):
   │  ├─ Service 03: MVP & Product Builds [same structure]
   │  └─ Service 04: Dashboards & Internal Tools [same structure]
   ├─ Card Design:
   │  ├─ Background: linear-gradient(135deg, #f7fbff 0%, #ffffff 100%)
   │  ├─ Border: 1px solid rgba(59, 130, 246, 0.15)
   │  ├─ Border-radius: 16px
   │  ├─ Padding: 32px
   │  ├─ Shadow: var(--shadow-soft) on default, var(--shadow-card) on hover
   │  └─ Hover: translateY(-8px), border opacity 0.15 → 0.25
   ├─ Animation: reveal-tilt class
   │  └─ Enter: opacity 0→1 + translateY(40px→0) + rotate(-2deg→0deg) + scale(0.95→1)
   │  └─ Duration: 0.6s ease-out, staggered 100ms per card
   └─ Spacing: 80px top, 100px bottom

5. PROOF OF WORK SECTION (tools reframed + reduced)
   ├─ Heading: CHANGE to "I ship working software. Here are some you can try."
   ├─ Tools shown: 4 cards (curated by business relevance)
   │  ├─ Invoice Generator (business critical)
   │  ├─ SEO Analyzer (business critical)
   │  ├─ AI Prompt Generator (AI-first positioning)
   │  └─ WA Sender (automation positioning)
   ├─ Grid layout: 2-column on desktop, 1-column mobile
   ├─ Card design (same as current, minimal changes):
   │  ├─ Badge: "Live" in blue, top-right
   │  ├─ Background: white
   │  ├─ Border: 1px solid #e2e8f0
   │  ├─ On hover: lift -6px, shadow-lift, border → rgba(59,130,246,0.3)
   │  └─ Link arrow slides right on hover (+4px gap)
   ├─ Below cards: "See all tools →" link (gray, underlined on hover)
   ├─ Animation: reveal class (standard fade-up)
   │  └─ Stagger pattern per row: row 1 at 0ms, row 2 at 200ms
   └─ Spacing: 80px top, 100px bottom

6. PROCESS SECTION (structure kept, visual upgrade)
   ├─ Heading: "From idea to working system"
   ├─ Layout: Vertical timeline (not grid) or stacked with connecting line
   ├─ 4 Steps (each gets a connecting arrow/line):
   │  ├─ Step 1: Understand — "Map your workflow, users, pain points. 3-5 days."
   │  ├─ Step 2: Design — "I structure the product, screens, database. 3-5 days."
   │  ├─ Step 3: Build — "Working software developed with clean interfaces. 1-2 weeks."
   │  └─ Step 4: Improve — "Test, refine, optimize for real users. 1 week."
   ├─ Card design:
   │  ├─ Number: Large, bold, blue (#3b82f6)
   │  ├─ Title: Bold, dark
   │  ├─ Description: 1-2 lines, muted gray
   │  ├─ Timeline added: "Est. 1-2 weeks" (right-aligned, smaller)
   ├─ Animation: reveal class
   │  └─ Stagger 100ms per step
   └─ Spacing: 80px top, 100px bottom

7. WHY-US SECTION (reframed as objection handling)
   ├─ Heading: "Why work with me"
   ├─ 4 items: Left/right alternating slides
   ├─ Item 1 (left): "Won't this take 6 months?"
   │  └─ Answer: "Fast execution. MVPs in weeks, not quarters. Typical project: 4-6 weeks."
   ├─ Item 2 (right): "How do I know it'll actually work for my team?"
   │  └─ Answer: "Business-first. I map your workflow before writing a line of code."
   ├─ Item 3 (left): "Will it look professional?"
   │  └─ Answer: "Premium interfaces. Your product feels credible from day one."
   ├─ Item 4 (right): "What about after launch?"
   │  └─ Answer: "Built for real use and scale. Not a one-off MVP that dies."
   ├─ Card design:
   │  ├─ Background: white
   │  ├─ Border: 1px solid #e2e8f0
   │  ├─ No shadow on default, soft shadow on hover
   │  ├─ Left border accent: 4px #3b82f6 only on hover
   ├─ Animation: 
   │  ├─ Items 1, 3: reveal-left (translateX(-40px) → 0)
   │  ├─ Items 2, 4: reveal-right (translateX(40px) → 0)
   │  └─ Stagger 100ms per item
   ├─ Spacing: 80px top, 100px bottom
   └─ Scroll behavior: PAUSE section (let the objections sink in, read slowly)

8. CONTACT SECTION (minor refinements)
   ├─ Heading: CHANGE to "Tell me what you're working on." (warmer)
   ├─ Subheading: Add expectation: "I'll reply within 24 hours with initial thoughts."
   ├─ 2-column layout (text left, form right):
   │  ├─ Left copy: [current, refined]
   │  └─ Right form: [enhanced with qualification fields below standard fields]
   ├─ Form fields:
   │  ├─ Name (current)
   │  ├─ Email (current)
   │  ├─ Message (current)
   │  ├─ Budget range (NEW) — dropdown: Under $5K / $5-10K / $10-25K / $25K+
   │  ├─ Timeline (NEW) — dropdown: ASAP / 1-2 months / 3-4 months / Flexible
   │  └─ Project type (NEW) — dropdown: Custom Software / AI Automation / MVP / Dashboard
   ├─ Form input styling:
   │  ├─ On focus: border #3b82f6 + background tint #f8fbff + lift -1px
   │  ├─ Box-shadow on focus: ring (0 0 0 3px rgba(59,130,246,0.1))
   │  └─ Transition: 0.2s ease
   ├─ Button: "Send Message"
   │  ├─ Style: filled blue gradient, white text
   │  ├─ Hover: lift -2px + shadow increase + shine sweep
   │  ├─ Active: scale 0.98 + press feedback
   ├─ Animation:
   │  ├─ Contact copy: reveal-left
   │  ├─ Contact form: reveal-scale delay-1
   └─ Spacing: 80px top, 60px bottom

9. FOOTER (minimal changes)
   ├─ Keep current structure
   ├─ Animation: reveal class on content blocks with stagger
   └─ Spacing: 40px top, 20px bottom (footer is quiet)
```

---

## Design Specifications (Visual Details)

### Color System (Unchanged)

```css
:root {
  --primary: #3b82f6;           /* Blue accent */
  --primary-hover: #1e40af;     /* Darker blue */
  --black: #0f1419;             /* Headlines */
  --gray-body: #334155;         /* Body text */
  --gray-muted: #64748b;        /* Muted text */
  --gray-light: #f1f5f9;        /* Light backgrounds */
  --success: #22c55e;           /* Green (pulse dot) */
  --error: #ef4444;             /* Red */
}
```

### Typography Hierarchy (Refined)

| Element | Size | Weight | Color | Line-Height |
|---------|------|--------|-------|-------------|
| Hero H1 | clamp(3rem, 6.4vw, 6.5rem) | 800 | --black | 1.1 |
| Problem H2 | clamp(28px, 4vw, 44px) | 800 | --black | 1.15 |
| Section H2 | clamp(32px, 5vw, 56px) | 700 | --black | 1.2 |
| Card H3 | 20px | 600 | --black | 1.3 |
| Body | 16px | 400 | --gray-body | 1.6 |
| Muted | 14px | 400 | --gray-muted | 1.5 |
| Button | 15px | 700 | white (primary) | 1.4 |

### Spacing System (Unchanged, Usage)

| Section Padding | Top | Bottom | Rationale |
|-----------------|-----|--------|-----------|
| Hero | 260px | 120px | Generous breathing room |
| Problem Frame | 80px | 120px | Major visual pause before content |
| Services | 80px | 100px | Standard section spacing |
| Tools | 80px | 100px | Standard |
| Process | 80px | 100px | Standard |
| Why-Us | 80px | 100px | Standard |
| Contact | 80px | 60px | Standard top, less bottom (CTA close) |
| Footer | 40px | 20px | Minimal spacing (footer is quiet) |

### Shadows & Borders

```css
/* Cards on default */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);      /* soft */
border: 1px solid rgba(59, 130, 246, 0.15);      /* subtle blue */
border-radius: 16px;

/* Cards on hover */
box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);      /* card */
border: 1px solid rgba(59, 130, 246, 0.25);      /* more visible blue */
transform: translateY(-8px);                      /* lift */
transition: all 0.3s ease;
```

---

## Animation Specifications

### 1. Hero Parallax (Scroll-Linked)

```css
/* Hero content: rises slower than scroll */
@media (prefers-reduced-motion: no-preference) {
  .hero-content {
    animation: heroRise linear forwards;
    animation-timeline: scroll();
    animation-range: 0px 500px;
  }

  @keyframes heroRise {
    from { opacity: 1; transform: translateY(0) scale(1); }
    to { opacity: 0.3; transform: translateY(-60px) scale(0.96); }
  }
}

/* Hero visual: sinks faster than scroll */
@media (prefers-reduced-motion: no-preference) {
  .hero-visual {
    animation: visualSink linear forwards;
    animation-timeline: scroll();
    animation-range: 0px 500px;
  }

  @keyframes visualSink {
    from { transform: translateY(0); }
    to { transform: translateY(40px); }
  }
}
```

### 2. Reveal Variants (Entrance Animations)

```css
/* Base reveal (fade + slide up) */
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Tilt reveal (for service cards) */
.reveal-tilt {
  opacity: 0;
  transform: translateY(40px) rotate(-2deg) scale(0.95);
  transition: opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.reveal-tilt.visible {
  opacity: 1;
  transform: translateY(0) rotate(0deg) scale(1);
}

/* Slide from left */
.reveal-left {
  opacity: 0;
  transform: translateX(-40px);
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}
.reveal-left.visible {
  opacity: 1;
  transform: translateX(0);
}

/* Slide from right */
.reveal-right {
  opacity: 0;
  transform: translateX(40px);
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}
.reveal-right.visible {
  opacity: 1;
  transform: translateX(0);
}

/* Scale up (for contact section) */
.reveal-scale {
  opacity: 0;
  transform: scale(0.97);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}
.reveal-scale.visible {
  opacity: 1;
  transform: scale(1);
}
```

### 3. Stagger Delays

```css
.delay-1 { transition-delay: 80ms; }
.delay-2 { transition-delay: 160ms; }
.delay-3 { transition-delay: 240ms; }
.delay-4 { transition-delay: 320ms; }
```

### 4. Hover States

```css
/* Service cards */
.service-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}
.service-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border-color: rgba(59, 130, 246, 0.25);
}

/* Tool cards */
.tool-card {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
}
.tool-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

/* Tool link arrow slides */
.tool-link {
  transition: gap 0.2s ease, color 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.tool-card:hover .tool-link {
  gap: 8px;
  color: var(--primary);
}

/* Buttons */
.cta-button.primary {
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
}
.cta-button.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.25);
}
.cta-button.primary:active {
  transform: translateY(0) scale(0.98);
  transition-duration: 0.08s;
}

/* Form inputs */
input:focus, textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 4px 12px rgba(0, 0, 0, 0.04);
  outline: none;
  transform: translateY(-1px);
  transition: border-color 0.2s ease, box-shadow 0.25s ease, transform 0.2s ease;
}
```

### 5. Mobile Adjustments

```css
@media (max-width: 768px) {
  /* Reduce motion distances */
  .reveal { transform: translateY(20px); }
  .reveal-tilt { transform: translateY(24px) scale(0.97); }
  .reveal-left { transform: translateX(-24px); }
  .reveal-right { transform: translateX(24px); }

  /* Disable parallax on mobile */
  .hero-content, .hero-visual {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }

  /* Reduce service card lift on mobile */
  .service-card:hover { transform: translateY(-4px); }

  /* Reduce button lift */
  .cta-button.primary:hover { transform: translateY(-1px); }

  /* Responsive typography */
  section h2 { font-size: 32px; }
  .hero h1 { font-size: 36px; }
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .reveal, .reveal-tilt, .reveal-left, .reveal-right, .reveal-scale {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

---

## Implementation Files & Changes

### Files to Create

1. **`app/(marketing)/sections/ProblemFrame.tsx`** (new component)
   - 3 pain-point cards with left blue border
   - Static layout, no animations

### Files to Modify

1. **`app/(marketing)/page.tsx`**
   - Add ProblemFrame section after hero
   - Update Services section layout (2-column primary + 2-column secondary)
   - Reduce tools grid to 4 cards only
   - Update Why-Us to alternating left/right cards
   - Update Contact form with 3 new dropdown fields
   - Update copy per spec

2. **`app/(marketing)/styles.css`**
   - Add `.reveal-tilt`, `.reveal-left`, `.reveal-right`, `.reveal-scale` classes
   - Add hero parallax animations (CSS scroll-timeline)
   - Add button shine animation (@keyframes btnShine)
   - Add stagger delay classes (.delay-1 through .delay-4)
   - Add mobile adjustments
   - Add prefers-reduced-motion rules
   - Update spacing variables per spec

3. **`app/(marketing)/elements/ScrollReveal.tsx`**
   - Enhance to support new reveal classes (currently only supports `.reveal`)
   - Add `unobserve()` after trigger to save memory
   - Update threshold to 0.12

4. **`app/globals.css`**
   - No changes (design tokens already in place)

5. **`app/components/Header.tsx`**
   - Add shrink + backdrop blur on scroll >60px (if not already present)

### No Changes Needed

- Header/navigation structure (keep current)
- Footer structure (keep current)
- Color system (use existing tokens)
- Typography scale (refine usage, not tokens)

---

## Acceptance Criteria

✅ **Visual**
- [ ] Problem Frame section added with 3 pain-point cards
- [ ] Services grid restructured to 2+2 layout
- [ ] Tools grid reduced to 4 curated cards
- [ ] Why-Us section shows alternating left/right layout
- [ ] Contact form has 3 new qualification fields
- [ ] All copy updates applied per spec
- [ ] Hero visual replaced with dashboard mockup (no broken animation)
- [ ] All cards have gradient backgrounds + blue accent borders (where specified)

✅ **Animation**
- [ ] Hero parallax works (content rises, visual sinks as you scroll)
- [ ] Service cards reveal with tilt animation (rotate -2°, scale 0.95→1)
- [ ] Tool cards reveal with standard fade-up, staggered per row
- [ ] Why-Us items slide in alternating left/right
- [ ] Button hovers lift + shadow escalates + shine sweeps
- [ ] Form input focus shows blue border + background tint + lift
- [ ] Card hovers lift + border color shifts
- [ ] All animations 60fps (verified in DevTools)
- [ ] prefers-reduced-motion respected (animations disabled)

✅ **Performance**
- [ ] Lighthouse Performance >90
- [ ] LCP <2.5s
- [ ] CLS <0.1 (no layout shifts during reveals)
- [ ] 60fps scroll verified with 4x CPU throttle
- [ ] Mobile parallax disabled (native scroll feel)
- [ ] Motion distances reduced 50% on mobile (<768px)
- [ ] Zero additional bundle cost (no new libraries)

✅ **Responsive**
- [ ] Services grid: 2x2 desktop, 1-column mobile
- [ ] Tools grid: 2x2 desktop, 1-column mobile
- [ ] Hero visual: full-width, scales appropriately
- [ ] Problem Frame cards: stack to 1-column mobile
- [ ] Typography scales with clamp() (no hard breakpoints)
- [ ] Touch targets minimum 44x44px
- [ ] Form inputs full-width mobile

✅ **Accessibility**
- [ ] Form labels present (sr-only if needed)
- [ ] Focus states visible (blue border on inputs)
- [ ] Color contrast >4.5:1 everywhere
- [ ] Buttons keyboard-accessible
- [ ] ARIA labels where needed

---

## Estimated Effort (Autonomous Execution)

| Task | Duration | Dependencies |
|------|----------|--------------|
| Create ProblemFrame component | 30 min | — |
| Update page.tsx structure | 1 hour | ProblemFrame done |
| Update styles.css (animations + spacing) | 1.5 hours | — (parallel) |
| Update ScrollReveal component | 30 min | — |
| Update copy (all sections) | 45 min | — |
| Design hero dashboard mockup | 1 hour | — |
| Test mobile responsive | 45 min | All above done |
| Performance audit (Lighthouse) | 30 min | All above done |
| Build verification + small fixes | 1 hour | Testing done |

**Total: 7-8 hours of focused implementation** (typically 1-2 sessions of autonomous work)

---

## Next Gate: `/todos` Approval

This specification is implementation-ready. It includes:

✅ Detailed section layout specs  
✅ All animation timings and easing  
✅ Component design specs (borders, shadows, hover states)  
✅ Mobile adjustments and accessibility rules  
✅ Performance targets  
✅ File-by-file change list  
✅ Acceptance criteria  

Once you confirm this spec is locked, I'll move to `/implement` and build it in one focused session.

**Status: Awaiting approval to proceed to `/implement` phase.**
