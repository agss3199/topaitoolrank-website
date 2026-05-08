# Responsive Animation Safety Pattern

**Status**: Production (validated 2026-05-08)  
**Applies to**: CSS media queries with animated elements  
**Pattern**: Prevent silent animation loss when media queries override responsive dimensions

---

## The Problem

CSS media queries that change element dimensions (width, height, scale) can **silently remove animations** if animation properties are not explicitly re-declared in the media query rule. The CSS cascade treats the media query as a complete override — any property not mentioned is removed, not inherited.

### Real Example

```css
/* Base styles — animation works on mobile */
.ring-one {
  width: 260px;
  height: 260px;
  animation: rotateRing 16s linear infinite;
}

/* Desktop media query — animation is GONE */
@media (min-width: 1024px) {
  .ring-one {
    width: 220px;  /* Changed */
    height: 220px;  /* Changed */
    /* animation: MISSING ← implicitly removed by override */
  }
}
```

**Result**: Rings spin on mobile, sit motionless on desktop. No error, no warning — completely silent.

---

## Root Cause

CSS cascade + specificity rules:

1. **Base rule** declares `animation: rotateRing 16s ...`
2. **Media query rule** is more specific (narrower breakpoint scope)
3. **CSS override pattern**: media query rule completely replaces the base rule
4. **Explicit property only**: animation from base is NOT inherited into the override
5. **Silent failure**: No console error, no visual indication in dev tools until tested on desktop

---

## The Fix

**Explicit property re-declaration** in media query:

```css
@media (min-width: 1024px) {
  .ring-one {
    width: 220px;
    height: 220px;
    animation: rotateRing 16s linear infinite;  /* ← explicitly re-declare */
  }
}
```

Or use CSS variables for DRY:

```css
/* Define animation once */
--ring-one-animation: rotateRing 16s linear infinite;

/* Use in both base and media query */
.ring-one {
  animation: var(--ring-one-animation);
}

@media (min-width: 1024px) {
  .ring-one {
    width: 220px;
    height: 220px;
    animation: var(--ring-one-animation);  /* Same declaration */
  }
}
```

---

## When This Pattern Occurs

Anywhere both conditions are true:

1. **Base styles** define animations (keyframes, duration, easing, iteration count)
2. **Media queries** override other properties without re-declaring the animation

**Common cases**:
- Responsive sizing with animation (hero sections, carousel rings, spinners)
- Responsive transforms with animation
- Responsive opacity/visibility changes with animation

---

## Detection Checklist

Before committing responsive CSS:

- [ ] Every animated element in base styles is checked for media query overrides
- [ ] Every media query override that changes dimensions also re-declares the animation
- [ ] Animation duration/easing are identical across all breakpoints (unless intentionally changed)
- [ ] Element animations are visually tested at ALL breakpoints (mobile, tablet, desktop)
- [ ] Browser dev tools "Computed" tab shows `animation-*` properties at all viewport widths

### Grep Command

```bash
# Find animated elements that might have responsive overrides
grep -n "animation:" app/**/*.css | while read line; do
  element=$(echo "$line" | grep -o '\.[a-z-]*' | head -1)
  echo "Checking $element for media query coverage..."
  # Manually verify that all @media rules for this element include animation
done
```

---

## Prevention Strategies

### Strategy 1: CSS Variables (Recommended)

Define all animation properties as variables, then reuse them in both base and media query:

```css
.custom-ring {
  --ring-animation: rotateRing 16s linear infinite;
  animation: var(--ring-animation);
}

@media (min-width: 1024px) {
  .custom-ring {
    width: 220px;
    animation: var(--ring-animation);  /* Reuse, no drift */
  }
}
```

**Why**: Single source of truth; if animation duration changes, it changes everywhere.

### Strategy 2: Separate Animation File

Keep animations in a separate, non-overridden CSS file:

```css
/* animations.css — never overridden */
.ring-one {
  animation: rotateRing 16s linear infinite;
}

/* responsive.css — only dimensions */
@media (min-width: 1024px) {
  .ring-one {
    width: 220px;
    height: 220px;
  }
}
```

**Why**: Clear separation of concerns; animation file is untouched by responsive rules.

### Strategy 3: Reminder Comments

Add explicit comments in media queries that have animated elements:

```css
@media (min-width: 1024px) {
  .ring-one {
    width: 220px;
    height: 220px;
    /* ANIMATION PRESERVED: see base .ring-one { animation: ... } */
    animation: rotateRing 16s linear infinite;
  }
}
```

**Why**: Signals to future developers that animation preservation is intentional, not forgotten.

---

## Related Silent-Failure Patterns

Similar bugs exist with other CSS properties:

| Property | Pattern | Fix |
|----------|---------|-----|
| **transition** | Media query changes display; transition removed | Re-declare transition in media query |
| **transform** | Media query changes scale; perspective lost | Re-declare transform origin and 3D context |
| **filter** | Media query hides element; filters lost | Re-declare filter properties |
| **CSS variables** | Variable set globally, overridden in media query to `var(--undefined)` | Use consistent variable names |

All follow the same pattern: explicit property in base, implicit removal in override.

---

## Code Review Checklist

When reviewing CSS with animations:

- [ ] All responsive overrides include animation properties if base style has them
- [ ] Animation durations match across breakpoints (unless documented otherwise)
- [ ] No `@media` rule removes an animation without replacing it explicitly
- [ ] CSS variables used consistently for reused animation values
- [ ] Animations tested visually at all breakpoints

---

## Testing Pattern

Add to CI/linting:

```bash
# Check that animated elements in base styles also have animations in media queries
check_animation_coverage() {
  # Find all classes with animation
  animated_classes=$(grep -o '\.[a-z-]*.*{' app/**/*.css | grep -B1 'animation:' | grep '\.' | sort -u)
  
  for class in $animated_classes; do
    # Check if this class appears in a media query
    if grep -q "@media.*$class" app/**/*.css; then
      # Verify the media query also has animation
      if ! grep -A10 "@media.*$class" app/**/*.css | grep -q "animation:"; then
        echo "WARNING: $class appears in @media but animation not re-declared"
      fi
    fi
  done
}
```

---

## Success Criteria

✅ **Animations work at all breakpoints** — rings spin smoothly from mobile to desktop  
✅ **Animation speeds consistent** — same duration at all viewport widths  
✅ **No silent failures** — CSS override patterns are explicit about animation re-declaration  
✅ **Maintainable** — CSS variables or comments make intention clear  

---

## Examples from This Project

### Fixed Bug

**File**: `app/(marketing)/styles.css` (commit 17ca20f)

```css
/* Before — animations silently removed on desktop */
@media (min-width: 1024px) {
  .ring-one { width: 220px; height: 220px; }
  .ring-two { width: 160px; height: 160px; }
  .ring-three { width: 105px; height: 105px; }
}

/* After — animations explicitly re-declared */
@media (min-width: 1024px) {
  .ring-one { width: 220px; animation: rotateRing 16s linear infinite; }
  .ring-two { width: 160px; animation: rotateRingReverse 13s linear infinite; }
  .ring-three { width: 105px; animation: rotateRing 10s linear infinite; }
}
```

**Impact**: Neural core rings now animate smoothly on desktop (primary visual feature of homepage).

---

## Delegation

- Delegate to **uiux-designer** when deciding animation strategy for responsive components
- Delegate to **responsive-layout-expert** when refactoring media queries with animations

---

## Related Skills

- `.claude/skills/project/next-design-system-patterns/SKILL.md` — responsive design patterns
- `.claude/skills/project/web-perf-budget/SKILL.md` — animation performance impact

---

**First Discovered**: 2026-05-08  
**Status**: Validated, production-ready  
**Sessions Using This**: Current +
