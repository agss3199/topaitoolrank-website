# Decision: Codify Responsive Animation Safety Pattern

**Date**: 2026-05-08  
**Type**: DECISION  
**Phase**: 05 (Codify)  
**Scope**: Extract responsive animation safety pattern into project skill and rule

---

## Summary

During the desktop animation fix (commit 17ca20f), we discovered a CSS cascade pattern that causes silent animation loss in media query overrides. This pattern is reusable, preventable, and affects any responsive component with animations. Extracted into institutional knowledge as both a project skill and a mandatory project rule.

---

## What Was Discovered

CSS media queries that override element dimensions (width, height, scale) can **silently remove animations** if animation properties aren't explicitly re-declared. This is a silent failure:

- No console error
- No CSS warning
- No visual indication in dev tools until tested at the affected breakpoint
- Only surfaces when users visit on a specific viewport width

### Example from This Project

```css
/* Base: animations work */
.ring-one {
  width: 260px;
  animation: rotateRing 16s linear infinite;
}

/* Media query: animation silently removed */
@media (min-width: 1024px) {
  .ring-one {
    width: 220px;
    /* animation: MISSING */
  }
}
```

Result: Rings spin on mobile, motionless on desktop.

---

## Root Cause Analysis

CSS cascade treats media query rules as **complete overrides**, not inheritance:

1. Base rule declares `animation: rotateRing 16s`
2. Media query rule is more specific (narrower scope)
3. Media query **replaces entire rule**, not just mentioned properties
4. Properties not mentioned in the override are removed, not inherited
5. **Silent failure**: CSS doesn't warn about removed properties

This affects any CSS property when similar patterns exist (transitions, transforms, filters, etc.).

---

## Codification Artifacts Created

### 1. Project Skill: `responsive-animation-safety/SKILL.md`

- Detailed pattern explanation with real examples
- Root cause analysis (CSS cascade cascade behavior)
- Multiple fix strategies (explicit re-declaration, CSS variables, file separation)
- Detection checklist for code review
- Prevention strategies for future work
- Related silent-failure patterns with other CSS properties
- Testing patterns and verification methods

**Purpose**: Situational awareness for agents working on responsive CSS. Teaches the pattern deeply enough to recognize it and apply prevention strategies in new code.

### 2. Project Rule: `responsive-animation-safety.md`

- Mandatory rule with MUST/MUST NOT structure
- Explicit DO/DO NOT code examples
- Verification checklist for commits
- Grep commands for detection
- Related patterns with same root cause
- Origin story linking back to incident and fix commit

**Purpose**: Enforce the pattern in code review. Flags animations omitted from media query overrides before they ship to production.

### 3. Updated Documentation

- `.claude/skills/project/README.md` — added skill to index, updated count
- `.claude/rules/project/README.md` — added rule to index, updated count

---

## Why Codify Now

### 1. Reusable Pattern

This pattern applies to:
- Any responsive component with animations (hero sections, carousels, spinners)
- Any CSS property in media query overrides (transitions, transforms, filters)
- Any project using CSS media queries

The knowledge will help multiple future agents avoid the same bug.

### 2. Preventable at Design Time

The pattern is detectable:
- Code review checklist catches it
- Grep searches find animated elements without media query coverage
- Browser dev tools show when animations are missing

Prevention is low-cost; remediation is high-cost (requires multi-breakpoint testing).

### 3. Silent Failure Requires Deep Context

Future agents won't encounter a clear error signal. They need to understand:
- CSS cascade rules and specificity
- Why properties don't inherit in overrides
- Why this is silent (no console warning)
- How to test for it (visual verification at all breakpoints)

A skill provides exactly this context depth.

### 4. Common Failure Mode at Scale

As the site grows with more animations (hero sections, interactive elements, AI UI components), this pattern becomes more likely. Codification prevents it from happening again.

---

## Related Institutional Knowledge

This decision was informed by:

- **Journal 0014**: `DISCOVERY-css-animation-override-pattern.md` — detailed finding from validation
- **Validation report**: `04-validate/animation-fix-validation.md` — complete verification

---

## Implementation Notes for Future Sessions

When reviewing CSS with animations:

1. **Check project skill**: `.claude/skills/project/responsive-animation-safety/SKILL.md`
2. **Verify against rule**: `.claude/rules/project/responsive-animation-safety.md`
3. **Use grep command** to find animated elements without media query coverage
4. **Test at all breakpoints** before committing
5. **Use CSS variables** for reused animations to prevent drift

---

## Follow-Up Tasks (Not Blocking)

These are opportunities but not requirements:

1. **CI Integration**: Add lint rule that warns when animated elements appear in media queries without animation declarations
2. **Documentation**: Update CSS guidelines in project docs (if they exist)
3. **Audit Existing CSS**: Grep all CSS files for animated elements without media query coverage
4. **Testing Pattern**: Document visual animation testing procedure for CI/pre-deploy

None of these are blocking. The skill and rule are complete and immediately useful.

---

## For Discussion

**Question 1**: Should we add this as a pre-commit hook that scans CSS files for animated elements without media query coverage? Or is code review sufficient?

- **Trade-off**: Hook would catch it earlier but adds build complexity; code review is already thorough on this team.

**Question 2**: Are there other CSS properties that exhibit the same silent-failure pattern that should get the same treatment?

- **Related**: Transitions, transforms, filters all exhibit the same override behavior. They're documented in the skill but not yet in project rules.

**Question 3**: Should we audit the existing codebase now for violations, or document it as a debt item for future sessions?

- **Option A**: Audit now, find/fix any existing violations → 30 minutes, zero violations expected
- **Option B**: Document in project backlog → zero effort now, addressed reactively

---

**Status**: Complete  
**Artifacts Created**: 1 skill, 1 rule, 2 documentation updates  
**Commits**: None (codification only, no code changes)  
**Ready For**: Future sessions to reference when working with responsive CSS

---

**Authored By**: Claude Haiku 4.5  
**Date**: 2026-05-08 03:55 UTC
