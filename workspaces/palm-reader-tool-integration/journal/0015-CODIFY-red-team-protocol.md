# Journal Entry: Codification — Red Team Spec Gap Detection Protocol

**Date**: 2026-05-14  
**Type**: DECISION (institutional knowledge)  
**Workspace**: palm-reader-tool-integration  
**Phase**: 05 (Codification)

---

## Summary

Extracted four reusable patterns from the palm-reader red team session into a project skill: `red-team-spec-gap-detection.md`. These patterns systematically catch the types of gaps that shipped undetected during earlier phases.

---

## Patterns Codified

### 1. Spec Promise vs Code — Grep Every Noun
**Why:** Features documented in requirements often don't make it into implementation. Grepping for every behavioral noun catches what "does the test pass?" cannot detect.

**Evidence:** `ACCEPTABLE_HAND_ROTATION` constant was defined but never imported into CameraView.tsx. Spec promised rotation validation; code skipped it.

**Application:** Mechanical grep audit covering all nouns that appear in spec promises.

---

### 2. Animation Audit — CSS @keyframes vs Spec
**Why:** CSS animations are easy to defer as "polish" but spec-required features cannot be deferred. Cross-referencing spec animation language with actual @keyframes catches visual completeness gaps.

**Evidence:** Spec line 80 promised "Subtle pulse when green" but zero animation implementations existed.

**Application:** For any tool with visual feedback promises, grep spec for animation terms and verify each has a @keyframes rule.

---

### 3. Exported Constant Usage Audit
**Why:** A constant in a constants file that is never imported is dead code signaling a missing implementation. Unlike test-existence checks, this is mechanical and catches true gaps.

**Evidence:** Both `ACCEPTABLE_HAND_ROTATION` and `FINAL_VALIDATION_MS` were exported but not imported anywhere.

**Application:** Simple bash loop: list all exports, verify each is imported outside the constants file.

---

### 4. Critical-Action Validation Gate
**Why:** Irreversible actions (capture, submit, delete) that have spec-documented preconditions must have an explicit validation gate wired into the code path. Documenting the requirements is not sufficient.

**Evidence:** Spec required four validation checks (centered, fingers visible, angle < 5°, confidence ≥ 85%) before capture in a 50ms window. Code was skipping directly to capture.

**Application:** For each irreversible action, trace the code path backward from the action to the trigger. If no intermediate validation exists, wire it in.

---

## Impact on Future Work

These patterns will accelerate red team cycles for future tool development:

1. **Faster detection:** Mechanical grep patterns replace manual code reading
2. **No false negatives:** Systematic coverage of all spec promises
3. **Early signal:** Unused constants immediately show which features were skipped
4. **Structured remediation:** Template for validation gates makes fixes predictable

---

## Lessons for Autonomous Execution

**Key insight:** "Spec says X" is NOT proof that X is implemented. The execution model was:

1. Spec written
2. Implementation todos created from spec
3. Implementation completed (todos marked done)
4. Red team audit — gaps discovered

The three HIGH findings suggest that earlier phases (analysis, planning, implementation) were not validating that spec promises actually made it into code. The grep audit bridges this gap.

**Recommendation:** For future projects, add a "spec-to-code mapping verification" step in the red team protocol:
- Extract every spec section
- Verify each section has a corresponding code artifact
- Use mechanical checks (grep, AST parsing) not human reading

---

## File Location

`.claude/skills/project/red-team-spec-gap-detection.md` (local, stays in this project)

---

## Status

✅ **CODIFIED AND READY FOR REUSE**

This skill can be referenced in future red team phases via:

```markdown
See `.claude/skills/project/red-team-spec-gap-detection.md` for the verification protocol
used to detect missing features, unused constants, and unvalidated critical actions.
```

---

**Codification Complete**  
**Phase 05 Status**: ✅ COMPLETE (ready for human review)
