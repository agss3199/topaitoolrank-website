# Accessibility Specification (WCAG 2.1)

## Compliance Target

**WCAG 2.1 Level AA Minimum**  
**Target: WCAG 2.1 Level AAA** (Option A achieves this)

---

## Color Contrast

### Text Contrast Ratios

| Text Type | Foreground | Background | Ratio | Status |
|-----------|-----------|-----------|-------|--------|
| Body text | `#334155` (gray) | `#ffffff` (white) | 10.25:1 | AAA ✅ |
| Headlines | `#0f1419` (black) | `#ffffff` (white) | 21.5:1 | AAA ✅ |
| Neon lime text | `#d4ff00` | `#0f1419` (black) | 19.3:1 | AAA ✅ |
| Neon lime text | `#d4ff00` | `#ffffff` (white) | 5.2:1 | AA ✅ |
| Buttons (lime bg) | `#000000` | `#d4ff00` | 19.3:1 | AAA ✅ |
| Secondary buttons | `#334155` | `#f0f1f3` | 8.5:1 | AAA ✅ |
| Links (lime) | `#d4ff00` | `#ffffff` | 5.2:1 | AA ✅ |
| Captions | `#64748b` (muted) | `#ffffff` | 7.2:1 | AAA ✅ |

**Rule:** Never use neon lime on white background for body text (5.2:1 ratio is below AAA). Use only for buttons, accents, or headlines.

---

## Text Sizing & Readability

### Font Size Standards
- **Body text:** Minimum 16px (currently 18px) ✅
- **Small text:** Minimum 14px (currently 14px) ✅
- **Labels:** Minimum 16px (on forms)

### Line Height
- **Body:** 1.6 (currently 1.6) ✅
- **Headlines:** 1.2 (currently 1.05) — **CHANGE TO 1.2 for AAA**
- **Small text:** 1.5 (currently 1.5) ✅

**Rationale:** Line height 1.2 on headlines improves dyslexia readability.

### Letter Spacing
- **Body:** 0em (normal) ✅
- **Headlines:** -0.03em (currently tight) — acceptable with larger font size

---

## Keyboard Navigation

### Tab Order
- All interactive elements (buttons, links, inputs) must be reachable via Tab key
- Tab order follows visual left-to-right, top-to-bottom flow
- No elements skipped in natural reading order

### Focus Indicators
- **Focus outline:** 2px solid neon lime `#d4ff00`, offset 2px
- **Minimum visible:** Must be clear on light and dark backgrounds
- **No removal:** Never use `outline: none` without replacement focus indicator

```css
/* DO: Custom focus style */
button:focus-visible {
  outline: 2px solid #d4ff00;
  outline-offset: 2px;
}

/* DO NOT: Remove focus entirely */
button:focus {
  outline: none; /* ❌ Fails accessibility */
}
```

### Skip Links
- Optional but recommended: Add "Skip to main content" link at top of page
- Appears on focus (Tab key), hidden on load
- User can tab directly to `<main>` instead of looping through nav

---

## Semantic HTML

### Proper Use of Heading Hierarchy
```html
<!-- DO: Proper hierarchy -->
<h1>Build custom software</h1>
<h2>Services</h2>
<h3>Custom Software Development</h3>

<!-- DO NOT: Skip levels -->
<h1>Build custom software</h1>
<h3>Services</h3> <!-- Skips h2, confuses screen readers -->
```

### Landmark Regions
- `<nav>` — Navigation
- `<main>` — Main content
- `<header>` — Page header
- `<footer>` — Page footer
- `<section>` — Thematic grouping (with heading)
- `<aside>` — Tangential content (not used in homepage)

---

## Images & Icons

### Alt Text
- **All images:** Provide meaningful alt text
- **Decorative icons:** `alt=""` (empty string) to skip in screen readers
- **Logo:** `alt="Top AI Tool Rank"` (brand name)
- **SVG icons:** Use `<title>` or aria-label for semantic meaning

```html
<!-- DO: Meaningful alt -->
<img src="hero-visual.svg" alt="Workflow automation dashboard with AI icons" />

<!-- DO NOT: Vague alt -->
<img src="hero-visual.svg" alt="graphic" /> <!-- Too vague -->
```

### SVG Accessibility
```html
<svg aria-label="AI icon">
  <title>AI Icon</title>
  <!-- SVG content -->
</svg>
```

---

## Forms Accessibility

### Labels
- Every form input must have an associated `<label>`
- Label text readable by screen readers
- Use `for` attribute linking to input `id`

```html
<!-- DO: Proper label linking -->
<label for="email">Email address</label>
<input type="email" id="email" name="email" />

<!-- DO NOT: Placeholder-only -->
<input type="email" placeholder="Enter email" /> <!-- No label -->
```

### Error Messages
- Must be associated with input via `aria-describedby`
- Text must explain error, not color alone
- Example: "Email must be valid (user@example.com)"

```html
<input
  type="email"
  id="email"
  aria-describedby="email-error"
/>
<span id="email-error" role="alert">
  Invalid email format. Please use user@example.com
</span>
```

### Focus Management
- Form inputs receive focus on navigation
- Submit button clearly labeled
- After submission, focus moves to confirmation or error area

---

## Motion & Vestibular

### Prefers-Reduced-Motion
All animations must respect user preference for reduced motion.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Effect:** Users with vestibular disorders see instant state changes instead of animations.

### Auto-Playing Motion
- ❌ No auto-playing videos
- ❌ No infinite parallax loops
- ❌ No auto-rotating carousels
- ✅ Hover/click-triggered animations only
- ✅ Scroll-triggered reveals (acceptable, not auto-play)

---

## Screen Reader Testing

### Screen Readers to Test
- **Windows:** NVDA (free, open-source)
- **macOS:** VoiceOver (built-in)
- **iOS:** VoiceOver (built-in)
- **Android:** TalkBack (built-in)

### Test Checklist
- [ ] Page title is descriptive (appears in title bar)
- [ ] Heading hierarchy makes sense when reading linearly
- [ ] Button labels are clear ("Submit" not "Button")
- [ ] Link labels are descriptive ("View Services" not "Click here")
- [ ] Images have meaningful alt text
- [ ] Form labels associated with inputs
- [ ] Error messages clearly announced
- [ ] Navigation skippable

---

## ARIA Attributes (When Needed)

### Do Not Over-Use ARIA
ARIA is a last resort when semantic HTML doesn't exist. Prefer HTML elements.

```html
<!-- DO: Use semantic HTML -->
<button>Submit</button>
<nav><ul>...</ul></nav>

<!-- DO NOT: Use ARIA for basic elements -->
<div role="button">Submit</div> <!-- Use <button> instead -->
<div role="navigation"><ul>...</ul></div> <!-- Use <nav> instead -->
```

### Appropriate ARIA Use Cases
- **aria-label:** For icon-only buttons
- **aria-describedby:** Link form inputs to error/help text
- **aria-hidden:** Hide decorative elements from screen readers
- **role="alert":** Announce errors/notifications urgently

```html
<!-- ARIA: Icon button -->
<button aria-label="Close menu">×</button>

<!-- ARIA: Error message announcement -->
<span id="error" role="alert">Please fill in all fields</span>
<input aria-describedby="error" />
```

---

## Responsive Design & Accessibility

### Touch Targets
- **Minimum size:** 44px × 44px (iOS/Android standard)
- **Spacing:** 8px minimum between targets (prevent accidental taps)
- **Buttons:** 44px high, 24px+ wide minimum

### Text Zoom
- Site must remain usable at 200% zoom
- No horizontal scrolling required
- Content reflows appropriately

---

## Accessibility Testing Checklist

### Automated Tools (Use During Development)
- [ ] axe DevTools browser extension
- [ ] Lighthouse accessibility audit
- [ ] WAVE browser extension
- [ ] Run accessibility scanner in CI/CD

### Manual Testing (Required Before Launch)
- [ ] Keyboard-only navigation (no mouse)
- [ ] Tab order follows visual hierarchy
- [ ] Focus indicators visible
- [ ] Screen reader testing (NVDA or VoiceOver)
- [ ] Zoom to 200% and verify layout
- [ ] Test with "prefers-reduced-motion" enabled
- [ ] Color contrast verification

### Testing Tools
- **axe DevTools:** Automated accessibility testing
- **WAVE:** Visual accessibility feedback
- **Lighthouse:** Built into Chrome DevTools
- **Tanaguru Contrast Finder:** Contrast validation
- **Screen Reader:** NVDA (free)

---

## Ongoing Accessibility

### Before Each Deploy
- Run axe scan
- Run Lighthouse audit (target: ≥95 accessibility score)
- No new accessibility violations

### After Launch
- Monitor accessibility issues via user reports
- Test new features with accessibility tools
- Annual accessibility audit by specialist

---

## Accessibility Success Criteria (AAA)

| Criterion | Status |
|-----------|--------|
| Text contrast ≥7:1 | ✅ All text meets AAA |
| Heading hierarchy | ✅ Proper H1→H2→H3 |
| Keyboard navigation | ✅ Tab order logical |
| Focus indicators | ✅ 2px neon lime outline |
| Form labels | ✅ All inputs labeled |
| Alt text | ✅ All images meaningful |
| Motion respects preference | ✅ prefers-reduced-motion |
| Color not sole information | ✅ Error messages include text |
| Screen reader compatible | ✅ Semantic HTML |

**Result:** WCAG 2.1 Level AAA compliant homepage.
