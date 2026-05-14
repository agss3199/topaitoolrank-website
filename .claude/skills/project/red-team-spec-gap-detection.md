# Red Team Spec Gap Detection — Verification Protocol

Patterns extracted from palm-reader red team (2026-05-14). Three HIGH gaps found by systematically comparing spec promises against code reality.

## Pattern 1: Spec Promise vs Code — Grep Every Noun

Every noun in a spec that describes a visible behavior (animation, validation, threshold, color) must have a corresponding code artifact. Spec text is a claim; code is the evidence.

**When to use:** Red team phase, after all implementation todos are marked complete.

**Protocol:**
1. Read the spec file line by line
2. Extract every behavioral promise (verb + noun: "pulse when green", "verify palm angle", "reject rotation >5 degrees")
3. Grep the implementation directory for each noun

```bash
# Extract spec promises, then verify each one
# Example: spec says "Subtle pulse when green (indicating ready)"
grep -rn "pulse\|greenPulse\|@keyframes.*pulse" app/tools/<tool>/
# Zero matches = HIGH finding: promised animation not implemented

# Example: spec says "Verify palm angle hasn't changed >5°"
grep -rn "ACCEPTABLE_HAND_ROTATION\|angle.*rotation\|rotation.*valid" app/tools/<tool>/components/
# Found in constants but NOT in components = HIGH: constant defined, never used
```

**Key insight:** Check both definition AND usage. A constant in a constants file that is never imported is dead code, not an implementation.

**Palm-reader example:** `ACCEPTABLE_HAND_ROTATION = 5` existed in `camera-constants.ts` (line 80) but was never imported into `CameraView.tsx`. The spec promised rotation validation (line 269) but the capture path skipped straight to capture without checking.

---

## Pattern 2: Animation Audit — CSS @keyframes vs Spec

Every spec mention of "animation", "pulse", "transition", "glow", "fade" must map to a `@keyframes` rule or CSS `transition` property.

**When to use:** Any tool with visual feedback promises in the spec.

**Verification commands:**
```bash
# 1. Find all animation promises in spec
grep -in "animat\|pulse\|glow\|fade\|transition" specs/<tool>*.md

# 2. Find all @keyframes in tool CSS
grep -rn "@keyframes" app/tools/<tool>/

# 3. Find all animation: declarations
grep -rn "animation:" app/tools/<tool>/

# 4. Cross-reference: every spec animation must have a @keyframes match
# Missing @keyframes for a spec-promised animation = HIGH finding
```

**Palm-reader example:** Spec line 80 promised "Subtle pulse when green (indicating ready)." No `@keyframes greenPulse` existed. Fixed by adding the animation to `camera.module.css` and a conditional `.pulsing` class in the component.

---

## Pattern 3: Exported Constant Usage Audit

Every `export const` in a constants file must be imported somewhere. Unused exports are either dead code or missing implementations.

**When to use:** After implementation, before marking implementation complete.

**Verification commands:**
```bash
# 1. List all exported constants
grep -n "export const" app/tools/<tool>/lib/*-constants.ts

# 2. For each constant, verify it's imported elsewhere
grep -rn "CONSTANT_NAME" app/tools/<tool>/ --include="*.tsx" --include="*.ts" \
  | grep -v "*-constants.ts"
# Zero matches outside the constants file = finding

# Automated full scan:
grep -o "export const [A-Z_]*" app/tools/<tool>/lib/*-constants.ts \
  | sed 's/.*export const //' \
  | while read const; do
      count=$(grep -rn "$const" app/tools/<tool>/ --include="*.tsx" | grep -v constants | wc -l)
      if [ "$count" -eq 0 ]; then
        echo "UNUSED: $const"
      fi
    done
```

**Palm-reader example:** `ACCEPTABLE_HAND_ROTATION` and `FINAL_VALIDATION_MS` were both exported but not imported into the component that needed them. The spec described the validation pipeline (lines 264-272) but the code jumped directly to capture.

---

## Pattern 4: Critical-Action Validation Gate

Any irreversible action (capture, submit, delete, send) that has spec-documented pre-conditions must implement a validation gate — a bounded-time check that re-verifies all conditions immediately before the action fires.

**When to use:** Any feature where spec lists "verify X before doing Y."

**Template:**
```typescript
// Pre-action validation gate pattern
const validationTimeout = setTimeout(() => {
  const condition1Valid = checkCondition1();
  const condition2Valid = checkCondition2();
  const condition3Valid = checkCondition3();
  
  if (condition1Valid && condition2Valid && condition3Valid) {
    performIrreversibleAction();
  } else {
    resetToWaitingState();  // Don't silently skip — revert
  }
}, VALIDATION_DELAY_MS);
```

**Verification:**
```bash
# Find the irreversible action trigger
grep -n "capture\|onCapture\|triggerCapture" app/tools/<tool>/components/*.tsx

# Trace backward: does any validation happen between "ready" and "capture"?
# If the path is: stability check → capture (no intermediate validation) = HIGH
```

**Palm-reader example:** The code path was: 60 stable frames reached, then directly call `onCapture()`. Spec required 4 intermediate checks (centering, finger visibility, rotation, confidence) in a 50ms validation window before capture. Fixed by adding a `setTimeout` validation pipeline between stability detection and capture trigger.

---

## Execution Checklist

Run these in order during `/redteam`:

- [ ] Read spec file, extract every behavioral promise (nouns + verbs)
- [ ] Grep each promise against implementation code
- [ ] Cross-reference `@keyframes` rules against spec animation mentions
- [ ] Scan all exported constants for import usage
- [ ] Trace every irreversible action path for pre-action validation gates
- [ ] Classify each gap: MISSING (no code) vs PARTIAL (constant defined, not wired) vs BROKEN (code exists but doesn't work)

---

## Anti-Patterns This Catches

| Gap Type | Signal | Example |
|----------|--------|---------|
| Spec-promised, never built | Grep returns zero | Green pulse animation missing |
| Constant defined, never used | Export exists, zero imports | `ACCEPTABLE_HAND_ROTATION` |
| Validation described, path skipped | Action fires without checks | Pre-capture validation gate |
| CSS animation missing | No `@keyframes` for spec term | Pulse on ready state |
| Irreversible action unvalidated | No re-check before final action | Capture without final validation |

---

## From the Field: Palm Reader Red Team (2026-05-14)

**Three HIGH findings in ~2 hours using this protocol:**

1. **Missing green pulse animation**
   - Spec line 78: "Animation: Subtle pulse when green"
   - Finding: `grep greenPulse app/tools/palm-reader/` returned zero
   - Fix: Added @keyframes greenPulse + .pulsing class

2. **Pre-capture validation not wired**
   - Spec lines 264-272: Four validation checks required
   - Finding: Grep showed code jumping directly from stability → capture
   - Fix: Implemented 50ms validation pipeline with 4 checks

3. **ACCEPTABLE_HAND_ROTATION unused**
   - Spec line 269: "Verify palm angle hasn't changed >5°"
   - Finding: Constant in camera-constants.ts, zero imports in .tsx files
   - Fix: Imported constant, used in validation check

**Impact:** All three fixes verified by build + test. Code now meets 100% spec compliance.

---

## References

- `rules/zero-tolerance.md` Rule 2 — stub detection
- `rules/testing.md` — new module test coverage audit
- Incident (2026-05-08): Responsive animation safety — animation properties removed by media query overrides
- Journal entry: `0014-RED-TEAM-FINDINGS-AND-FIXES.md` — lessons learned
