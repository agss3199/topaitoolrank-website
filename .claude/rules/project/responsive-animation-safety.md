---
paths:
  - "app/**/*.css"
  - "**/*.module.css"
---

# Responsive Animation Safety

**Status**: Mandatory (2026-05-08)  
**Applies to**: CSS media queries that change dimensions of animated elements  
**Prevention**: Ensure animation properties are explicitly re-declared in media query overrides

---

## Rule

Media query CSS rules that override dimensions (width, height, scale) MUST also re-declare animation properties if the base styles define animations. Omitting animation properties from a media query override causes animations to be implicitly removed by the CSS cascade, creating silent failures.

---

## MUST Rules

### 1. Animation Properties Explicit in Media Queries

When a base CSS rule declares an animation AND a media query overrides other properties of that element, the media query MUST explicitly re-declare the animation property:

```css
/* DO — animation explicitly re-declared in media query */
.ring-one {
  width: 260px;
  animation: rotateRing 16s linear infinite;
}

@media (min-width: 1024px) {
  .ring-one {
    width: 220px;
    animation: rotateRing 16s linear infinite;  /* ← required */
  }
}

/* DO NOT — animation omitted from media query (implicitly removed) */
.ring-one {
  width: 260px;
  animation: rotateRing 16s linear infinite;
}

@media (min-width: 1024px) {
  .ring-one {
    width: 220px;
    /* animation: MISSING — CSS cascade removes it */
  }
}
```

**Why:** CSS cascade treats media query overrides as complete replacements. Properties not mentioned in the override are removed, not inherited from the base rule.

### 2. Use CSS Variables for Reused Animations

When animation properties are identical across multiple breakpoints, define them as CSS variables and reuse them:

```css
/* DO — single source of truth for animation */
.animated-ring {
  --ring-animation: rotateRing 16s linear infinite;
  animation: var(--ring-animation);
}

@media (min-width: 1024px) {
  .animated-ring {
    width: 220px;
    animation: var(--ring-animation);  /* Same declaration */
  }
}

/* DO NOT — duplicate animation values across rules */
@media (min-width: 1024px) {
  .animated-ring {
    animation: rotateRing 16s linear infinite;  /* duplicated */
  }
}
```

**Why:** CSS variables prevent drift when animation duration or easing changes — a single update propagates everywhere.

### 3. Animation Coverage Review Checklist

Before committing media query CSS:

- [ ] Every animated element in base styles is checked for media query overrides
- [ ] Every media query override that changes dimensions includes animation properties
- [ ] Animation duration/easing are identical across all breakpoints (unless documented as intentional)
- [ ] Animations tested visually at all breakpoints (mobile, tablet, desktop)

**Why:** Checklist ensures that animations aren't silently lost to the CSS cascade.

---

## MUST NOT

- **Omit animation properties from media query overrides** — causes implicit removal by CSS cascade

**Why:** Silent failure — no error, no warning, just stops animating. User-facing regression.

- **Use different animation durations across breakpoints without documentation** — leads to confusing behavior

**Why:** Users expect smooth, consistent animations. Changing speed at breakpoints confuses the experience.

- **Hide animations using `display: none`, `visibility: hidden`, or `opacity: 0` without explanation** — use CSS variables to show/hide intentionally

**Why:** Hidden animations should be intentional and documented, not an accident of media query override.

---

## Verification

### Grep Check (Before Commit)

```bash
# Find all animated elements
grep -n "animation:" app/**/*.css

# For each animated element, verify media query includes animation:
# Manually check @media rules that reference that element
```

### Browser DevTools

At each viewport width (mobile, tablet, desktop):

1. Inspect animated element
2. Check "Computed" tab for `animation-*` properties
3. Verify animation is present and correct

---

## Origin

**Incident**: 2026-05-08 — Homepage neural core rings animated on mobile but not on desktop. Media query at line 1176 of `app/(marketing)/styles.css` resized rings but didn't re-declare animations.

**Discovery**: CSS cascade treats media query rules as complete overrides. Properties not explicitly re-declared are removed, not inherited.

**Fix**: Commit 17ca20f — re-declared animation properties in desktop media query.

**Impact**: Pattern affects any responsive component with animations. Critical for hero sections, spinners, carousels.

---

## Related Patterns

Similar silent-failure bugs with other CSS properties:

- **Transition property overrides**: Changing `display` without re-declaring `transition`
- **Transform overrides**: Changing `scale` without re-declaring `perspective` or `transform-origin`
- **Filter overrides**: Changing visibility without re-declaring `filter`

All follow the same pattern: explicit property in base, implicit removal in media query.

---

**Enforcement**: Commits that omit animation properties from media query overrides will be flagged in code review.

**Status**: MANDATORY  
**Applies To**: All CSS media queries with animated elements  
**Last Updated**: 2026-05-08
