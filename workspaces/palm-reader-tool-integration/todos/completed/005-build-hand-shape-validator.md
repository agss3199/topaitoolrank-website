# [005] Build Hand Shape Validator (Openness Detection)

**Phase**: 2 — Hand Shape Validation  
**Spec**: `specs/palm-reader-capture-ux.md` § Feature 2  
**Status**: PENDING  
**Effort**: 2 hours  
**Priority**: HIGH  
**Depends on**: 004

## Overview

Create a utility function that detects whether a hand is open (palm visible) or closed (fist). Prevent capture when hand is not fully open.

## Requirements

### Hand Shape Analysis

Use MediaPipe hand landmarks (21 points) to calculate "openness" score:

```typescript
interface HandShape {
  isOpen: boolean;           // true if hand is open, false if fist
  openness: number;          // 0-2.0 scale (0 = fist, 1.5+ = open)
  message: string;           // "Open your palm" / "Good, keep steady" / etc.
}

function validateHandShape(
  landmarks: NormalizedLandmark[] | null,
  palmCenterLandmarkIndex: number = 9,
): HandShape
```

### Openness Calculation

For each finger (index, middle, ring, pinky):
1. Get fingertip position (landmarks 8, 12, 16, 20)
2. Get finger base position (landmarks 5, 9, 13, 17)  
3. Calculate distance from palm center (landmark 9)
4. Average extension across 4 fingers

```
extension_score = avg(fingertip_distance) / palm_size

Closed (fist):        extension_score < 1.0
Partially open:       extension_score 1.0-1.5
Fully open (valid):   extension_score ≥ 1.5
```

### Smoothing

Apply 5-frame moving average to avoid flickering:
- Calculate openness score every frame
- Average last 5 values
- Use smoothed value for capture validation

## Acceptance Criteria

- [ ] File created: `lib/hand-shape-validator.ts`
- [ ] Function `validateHandShape()` exported
- [ ] Openness calculated from landmark positions
- [ ] Threshold correctly identifies fists vs open hands
- [ ] Smoothing prevents flickering (5-frame average)
- [ ] Unit tests covering:
  - [ ] Fully closed hand (fist) → isOpen = false
  - [ ] Fully open hand → isOpen = true
  - [ ] Partially open hand → isOpen = false
  - [ ] Edge case: thumb-only visible → isOpen = true (acceptable)
- [ ] No console errors
- [ ] Performance: <2ms per frame

## Implementation Checklist

- [ ] Create hand-shape-validator.ts
- [ ] Implement openness calculation from landmarks
- [ ] Add thresholds (1.0, 1.5)
- [ ] Implement 5-frame smoothing
- [ ] Create unit tests
- [ ] Test with various hand poses
- [ ] Verify accuracy on real hand data

## Testing

Create `__tests__/hand-shape-validator.test.tsx`:
- [ ] Closed hand detected (landmarks forming fist)
- [ ] Open hand detected (fingers extended)
- [ ] Partial hand detected (only 2-3 fingers)
- [ ] Openness score ranges 0-2.0
- [ ] Smoothing works correctly
- [ ] Edge case: null landmarks → defaults to false (not open)

## Files to Create/Modify

**Create**:
- `app/tools/palm-reader/lib/hand-shape-validator.ts`
- `app/tools/palm-reader/__tests__/hand-shape-validator.test.tsx` (unit tests for openness detection)

**Modify**:
- `app/tools/palm-reader/lib/camera-constants.ts` (add hand openness thresholds)
- `app/tools/palm-reader/__tests__/components.test.tsx` (add integration tests)

## Performance Requirements

- Openness calculation: <1ms per frame
- Smoothing calculation: <1ms per frame
- Total: <2ms per frame

## Definition of Done

- Hand shape validation working correctly
- Fists detected and rejected
- All tests passing
- Ready for integration into capture logic (todo 006)

---

**Depends on**: 004  
**Blocks**: 006, 007  
**Related**: specs/palm-reader-capture-ux.md § Feature 2 (Hand Shape Validation)
