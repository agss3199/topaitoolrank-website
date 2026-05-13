---
name: Confidence Threshold Wiring Issue
description: Critical bug found and fixed during red team validation
type: RISK
date: 2026-05-13
---

# RISK: Confidence Threshold Wiring Issue

## Finding

During red team validation, spec compliance audit discovered that `CONFIDENCE_THRESHOLD = 0.75` (75%) was defined in `camera-constants.ts` but **never used** in the capture gate logic.

**Actual behavior**: Auto-capture triggered at `qScore >= 60` (QUALITY_THRESHOLD)  
**Specified behavior**: Auto-capture should trigger at confidence > 75%

This meant hand detection would auto-capture at 60% confidence when the specification explicitly required 75%, silently degrading feature quality.

## Root Cause

Constants were extracted to `camera-constants.ts` for maintainability, but the capture gate in `CameraView.tsx:150` continued using `QUALITY_THRESHOLD` (a display-level threshold for "Better lighting needed" message) instead of the capture-level threshold `CONFIDENCE_THRESHOLD`.

## Impact

- **Severity**: CRITICAL
- **User Impact**: Auto-capture at lower-confidence detections than intended, potentially capturing poor-quality palm images
- **Detection**: Caught by spec compliance audit, not by tests (test qScore was 80, both thresholds pass)

## Resolution

**Commit**: (current session)  
**Changed**: `CameraView.tsx:150` gate from `qScore < QUALITY_THRESHOLD` to `qScore < CONFIDENCE_THRESHOLD * 100`  
**Test Updated**: `components.test.tsx:175` assertion updated to expect 75% threshold  
**Verification**: All 56 tests pass

## Lesson

Constants defined for a purpose must be verified as actually used in that purpose. The presence of `CONFIDENCE_THRESHOLD` in the constants file created a false sense of completeness. A grep-based audit (used during red team) caught this; unit tests did not, because the test qScore exceeded both thresholds.

---

**Status**: FIXED  
**Validation**: Red team audit + full test suite pass
