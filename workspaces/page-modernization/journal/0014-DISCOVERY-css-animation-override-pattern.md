# Discovery: CSS Animation Property Override Pattern — Silent Animation Loss

**Date**: 2026-05-08  
**Type**: DISCOVERY  
**Phase**: 04 (Red Team)  
**Key Finding**: Media query overrides that change dimensions silently remove animations if animation properties are not explicitly re-declared.

---

## The Pattern

When using CSS media queries to change element dimensions (width, height, scale), if animation properties are not re-declared in the media query rule, the animations from the base styles are **implicitly removed** by the CSS cascade:

```css
/* Base styles — has animation */
.ring-one {
  width: 260px;
  height: 260px;
  animation: rotateRing 16s linear infinite;
}

/* Media query override — missing animation! */
@media (min-width: 1024px) {
  .ring-one {
    width: 220px;  /* Changed */
    height: 220px;  /* Changed */
    /* animation: MISSING — implicitly removes the animation */
  }
}
```

Result: ring spins on mobile, sits still on desktop.

---

## Root Cause

CSS cascade rules + override pattern:

1. **Base rule** declares `animation: rotateRing 16s ...`
2. **Media query rule** overrides width/height but **does not mention animation**
3. **CSS cascade**: the media query rule is more specific (1024px is narrower scope)
4. **Explicit is better than implicit**: animation property is NOT inherited from base rule; it's replaced by "nothing" in the override

This is a **silent failure** because:
- The element still displays (width/height work)
- No console error or warning
- No visual indication that animation was lost
- Bug only appears when someone views the site on a wider screen (after base styles are applied)

---

## Affected Pattern

This pattern occurs anywhere both conditions are true:

1. Base styles define animations (keyframes, duration, easing)
2. Media queries override other properties without re-declaring animations

**Common cases**:
- Responsive sizing with animation (hero sections, carousel rings, spinners)
- Responsive transforms with animation
- Responsive opacity changes with animation

---

## The Fix

**Explicit property re-declaration** in media queries:

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
--ring-one-animation: rotateRing 16s linear infinite;

.ring-one {
  animation: var(--ring-one-animation);
}

@media (min-width: 1024px) {
  .ring-one {
    width: 220px;
    height: 220px;
    animation: var(--ring-one-animation);
  }
}
```

---

## Actionable Insights for Future Work

### 1. Code Review Checklist

When reviewing CSS media queries:
- [ ] All responsive overrides include animation properties if base style has them
- [ ] Animation duration/easing are the same across breakpoints (unless intentional change)
- [ ] Element animations are verified visually at all breakpoints (mobile, tablet, desktop)

### 2. Testing Pattern

Add to lint/test suite:

```bash
# Check that animated elements in base styles also have animations in media queries
grep -r "@media" app/**/*.css | while read line; do
  element=$(echo $line | grep -o '\.[a-z-]*' | head -1)
  if grep -q "$element.*animation:" app/**/*.css; then
    # Verify media query override includes animation
    grep "animation:" "$media_rule" || echo "WARN: $element has animation in base but not in media query"
  fi
done
```

### 3. Prevention

**Principle**: Animation-aware responsive design

- Treat animations as essential properties, same as width/height
- If responsive override changes size, assume it also needs animation verification
- Use CSS variables for animation properties when they're reused across breakpoints

### 4. Documentation

Add to project CSS guidelines:

```markdown
## Responsive Animations

When a base style defines an animation, all media query overrides that change 
dimensions MUST also declare the animation property. The CSS cascade does not 
inherit animation declarations from lower-specificity rules.

✅ DO:
  @media (...) {
    .element {
      width: new;
      animation: preserved 16s linear infinite;
    }
  }

❌ DO NOT:
  @media (...) {
    .element {
      width: new;
      /* animation implicitly removed */
    }
  }
```

---

## Related Patterns

Similar silent-failure patterns in CSS:

- **Transition property overrides**: changing display without re-declaring transition
- **Transform overrides**: changing scale without re-declaring 3D perspective
- **Filter overrides**: responsive filter changes without reapplying blur/brightness
- **Variable override scope**: --color-accent set globally but overridden in media query to undefined

All follow the same pattern: explicit property in base, implicit removal in override.

---

## Impact on This Project

- **File**: `app/(marketing)/styles.css`
- **Lines**: 881-891 (base animations), 1180-1196 (media query override)
- **Affected elements**: `.ring-one`, `.ring-two`, `.ring-three`
- **Impact**: Neural core rings non-functional on desktop (primary visual feature of homepage)
- **Fix**: Commit 17ca20f — re-declared animations in media query
- **Status**: RESOLVED

---

## Tooling Opportunity

A PostCSS plugin could detect this pattern automatically:

```js
// postcss-animation-override-safety.js
// Warns when a CSS rule overrides properties of an animated element without re-declaring animation
```

---

**Status**: Documented  
**Action Taken**: Added to journal, updated CSS project guidelines pending  
**Future Sessions**: Reference this entry when reviewing responsive CSS with animations
