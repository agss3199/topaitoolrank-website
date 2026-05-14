# [007] Build Palm Line Visibility Detector

**Phase**: 2 — Hand Shape Validation  
**Spec**: `specs/palm-reader-capture-ux.md` § Feature 4  
**Status**: PENDING  
**Effort**: 3 hours  
**Priority**: HIGH  
**Depends on**: 004, 006

## Overview
Estimate the number of visible palm lines (3, 4, or 5+) based on hand pose angles and landmark visibility. Lines are visible when the palm is facing the camera at a near-perpendicular angle. This feeds into capture readiness feedback.

### Why Depends on 006
Hand orientation (left vs right) is used to calibrate line visibility scoring. The algorithm adjusts expected line positions based on whether it's a left or right hand, improving accuracy of the visibility estimate.

## Requirements

### Line Visibility Scoring
```typescript
interface PalmLineVisibility {
  visibleLines: number;      // 0-5+ scale
  palmAngle: number;         // 0-90 degrees (0 = perpendicular to camera)
  quality: number;           // 0-1 scale (0 = poor visibility, 1 = perfect)
}

function detectPalmLines(
  landmarks: NormalizedLandmark[] | null,
  palmCenterIndex: number = 9,
): PalmLineVisibility
```

### Calculation
1. Estimate palm plane normal from wrist + middle-finger landmarks
2. Calculate angle between palm plane and camera (0° = facing camera, 90° = edge-on)
3. Score visible lines based on angle:
   - < 15°: poor angle, 0-1 lines visible
   - 15-30°: 2-3 lines visible
   - 30-60°: 4+ lines visible (ideal)
   - > 60°: edge-on, 0 lines visible
4. Adjust for hand size (larger hand = more visible lines due to area)

### State Rules
- RED if visibleLines < 3 (user needs to rotate palm)
- YELLOW if 3-4 lines (acceptable)
- GREEN if 4+ lines (ideal for capture)

## Acceptance Criteria
- [ ] File created: `lib/palm-line-detector.ts`
- [ ] Function `detectPalmLines()` exported
- [ ] Palm angle estimated from landmarks
- [ ] Line visibility score correlates with real hand pose
- [ ] Handles null landmarks gracefully
- [ ] Integration with hand orientation working
- [ ] Unit tests covering:
  - [ ] Palm-facing-camera → 4+ lines
  - [ ] Palm edge-on → 0 lines
  - [ ] Palm rotated 45° → 2-3 lines
  - [ ] Small hand → fewer lines (size-adjusted)
  - [ ] Null landmarks → 0 lines
- [ ] No console errors
- [ ] Performance: <2ms per frame

## Implementation Checklist
- [ ] Create palm-line-detector.ts
- [ ] Implement palm angle calculation from landmarks
- [ ] Implement line visibility scoring algorithm
- [ ] Integrate hand orientation for accuracy
- [ ] Create unit tests
- [ ] Test with various hand poses
- [ ] Verify accuracy on real hand data

## Testing
Create `__tests__/palm-line-detector.test.tsx`:
- [ ] Palm facing camera → 4+ lines detected
- [ ] Palm rotated → correct line count
- [ ] Small hand → fewer lines (size-adjusted)
- [ ] Null landmarks → 0 lines
- [ ] Edge cases: partially visible hands

## Files to Create/Modify

**Create**:
- `app/tools/palm-reader/lib/palm-line-detector.ts`
- `app/tools/palm-reader/__tests__/palm-line-detector.test.tsx`

**Modify**:
- `app/tools/palm-reader/lib/camera-constants.ts` (add line thresholds)
- `app/tools/palm-reader/components/PalmOverlay.tsx` (display line count)

## Performance Requirements

- Angle calculation: <1.5ms per frame
- Line visibility scoring: <0.5ms per frame
- Total: <2ms per frame

## Definition of Done

- Palm line detection working correctly
- Line visibility scores correlate with hand angle
- All tests passing
- Ready for integration (todo 008)

---

**Depends on**: 004, 006  
**Blocks**: 008, 009  
**Related**: specs/palm-reader-capture-ux.md § Feature 4 (Palm Line Visibility Detection)
