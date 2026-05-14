# [009] Integrate All Detectors Into CameraView

**Phase**: 3 — Stability & Readiness  
**Spec**: `specs/palm-reader-capture-ux.md` § Features 3-5  
**Status**: PENDING  
**Effort**: 1.5 hours  
**Priority**: HIGH  
**Depends on**: 004, 006, 007, 008

## Overview
Wire the hand orientation detector, palm line visibility detector, and two-tier stability system into CameraView. Ensure all three feed into the color state system and overlay display.

## Requirements

### Props Flow to Overlay
```typescript
<PalmOverlay
  landmarks={landmarks}
  isHandCentered={centered}
  isHandStable={isStable}
  stableFrames={stableCounter}
  quality={quality}
  status={status}
  handedness={handedness}           // NEW: from detectHandOrientation
  visibleLines={visibleLines}       // NEW: from detectPalmLines
  detectionStable={detectionStable} // NEW: two-tier system
  movementStable={movementStable}   // NEW: two-tier system
/>
```

### State Machine Integration
```
All conditions → determineOverlayState():
  - hasHand, centered, quality ≥ 85%
  - isOpen (hand shape)
  - visibleLines ≥ 3 (line detection)
  - detectionStable AND movementStable (two-tier)
  → RED (any fails) / YELLOW (waiting) / GREEN (all pass)
```

### Order of Operations
1. Call `detectHandOrientation()` with landmarks + mediapikeHandedness
2. Call `detectPalmLines()` with landmarks
3. Update two-tier counters based on detection + movement
4. Recalculate overlay state with ALL conditions
5. Pass everything to PalmOverlay component

## Acceptance Criteria
- [ ] Hand orientation detector called every frame
- [ ] Palm line detector called every frame
- [ ] Two-tier counters updated every frame
- [ ] Orientation badge displays correctly on overlay
- [ ] Line visibility updates in real-time
- [ ] State machine considers all 8+ conditions for RED/YELLOW/GREEN
- [ ] Progress bar shows both detection + movement progress
- [ ] All props passed to PalmOverlay without error
- [ ] Integration tests verify end-to-end wiring:
  - [ ] Orientation changes reflected in overlay
  - [ ] Line count updates with hand rotation
  - [ ] Two-tier progress increments correctly
  - [ ] State transitions on condition changes
  - [ ] No console errors
- [ ] Maintains 30fps performance

## Implementation Checklist
- [ ] Import all detector functions into CameraView
- [ ] Call detectors every frame in onResults
- [ ] Update state with orientation and line data
- [ ] Pass new props to PalmOverlay
- [ ] Verify state machine evaluates all conditions
- [ ] Create integration tests
- [ ] Test with various hand poses
- [ ] Performance profiling

## Testing
Create `__tests__/cameraview-integration.test.tsx`:
- [ ] All detectors called every frame
- [ ] Props passed to overlay correctly
- [ ] State transitions with detector changes
- [ ] No performance regression
- [ ] No console errors

## Files to Create/Modify

**Create**:
- `__tests__/cameraview-integration.test.tsx`

**Modify**:
- `app/tools/palm-reader/components/CameraView.tsx` (integrate all detectors)
- `app/tools/palm-reader/__tests__/components.test.tsx` (add integration tests)

## Performance Requirements

- Per-frame overhead for all detectors: <5ms total
- Maintains 30fps (33ms per frame budget)

## Definition of Done

- All detectors integrated into CameraView
- Props correctly passed to overlay
- State machine working with all conditions
- Integration tests passing
- Ready for final testing (todo 010)

---

**Depends on**: 004, 006, 007, 008  
**Blocks**: 010  
**Related**: specs/palm-reader-capture-ux.md § All Features (Complete Integration)
