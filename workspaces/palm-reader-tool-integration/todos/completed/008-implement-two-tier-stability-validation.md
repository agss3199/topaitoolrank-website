# [008] Implement Two-Tier Stability Validation

**Phase**: 3 — Stability & Readiness  
**Spec**: `specs/palm-reader-capture-ux.md` § Feature 5  
**Status**: PENDING  
**Effort**: 2 hours  
**Priority**: HIGH  
**Depends on**: 004, 005, 006, 007

## Overview
Implement two-tier stability validation: detection stability (is hand detected?) + movement stability (is hand still?). Currently, only movement stability is tracked. Two-tier prevents capturing while hand is first being detected.

## Requirements

### Stability Tiers
```typescript
enum StabilityTier {
  DETECTION = 'detection',      // Hand continuously detected (20 frames)
  MOVEMENT = 'movement',         // Hand position/shape stable (60 frames)
}

interface StabilityState {
  detectionStable: boolean;      // 20+ frames continuous detection
  detectionFrames: number;       // Current detection frame count
  movementStable: boolean;       // 60+ frames sub-4px delta
  movementFrames: number;        // Current movement frame count
  readyForCapture: boolean;      // Both tiers stable
}
```

### Validation Logic
1. **Detection Stability** (Tier 1):
   - Hand detected in current frame: increment counter
   - Hand NOT detected: reset counter to 0
   - Stable when counter ≥ 20
   - Purpose: ensures MediaPipe is confident

2. **Movement Stability** (Tier 2):
   - Measure pixel delta of palm center (landmark 9) since last frame
   - If delta < 4px: increment counter
   - If delta ≥ 4px: reset counter to 0
   - Stable when counter ≥ 60
   - Purpose: ensures hand is not moving

3. **Capture Ready**:
   - Only when BOTH tiers are stable
   - Trigger auto-capture

### State Transitions
- **Frame N: hand absent** → both counters reset, "Detecting hand..."
- **Frame N+20: hand detected 20 frames** → detection stable, "Hand detected. Hold steady..."
- **Frame N+80: hand still 60 frames** → movement stable, "Ready! Capturing..."
- **Frame N+81: hand moves > 4px** → movement counter resets to 0, back to "Hold steady..."

## Acceptance Criteria
- [ ] Two-tier structure implemented in CameraView
- [ ] Detection counter (0-20) tracked separately from movement counter (0-60)
- [ ] Counters reset on loss of detection or motion
- [ ] Status message reflects current tier ("Detecting...", "Hold steady...", "Ready!")
- [ ] Progress bar shows both tiers (e.g., "20/20 detection ✓, 45/60 movement")
- [ ] Auto-capture triggers only when both tiers complete
- [ ] Unit tests covering:
  - [ ] Detection tier increments on continuous hand detection
  - [ ] Detection tier resets on hand lost
  - [ ] Movement tier increments on < 4px delta
  - [ ] Movement tier resets on > 4px delta
  - [ ] Both tiers must be complete for readiness
  - [ ] Status message updates correctly per tier
- [ ] No console errors
- [ ] Maintains 30fps performance

## Implementation Checklist
- [ ] Separate detection and movement counter tracking
- [ ] Implement tier 1 detection logic
- [ ] Implement tier 2 movement logic
- [ ] Update status message generation
- [ ] Update progress bar display
- [ ] Create unit tests
- [ ] Test both tiers independently
- [ ] Test state transitions

## Testing
Create `__tests__/two-tier-stability.test.tsx`:
- [ ] Detection tier increments on continuous detection
- [ ] Movement tier increments on < 4px delta
- [ ] Both reset independently when conditions break
- [ ] Capture only triggers when both complete
- [ ] Status messages reflect current tier
- [ ] Progress displays correctly for both tiers

## Files to Create/Modify

**Create**:
- `__tests__/two-tier-stability.test.tsx`

**Modify**:
- `app/tools/palm-reader/components/CameraView.tsx` (two-tier tracking)
- `app/tools/palm-reader/components/PalmOverlay.tsx` (two-tier progress display)
- `app/tools/palm-reader/__tests__/components.test.tsx` (add two-tier tests)

## Performance Requirements

- Tier 1 calculation: <0.5ms per frame
- Tier 2 calculation: <0.5ms per frame
- Total: <1ms per frame overhead

## Definition of Done

- Two-tier stability implemented and working
- Both tiers tracked and reported correctly
- Status messages reflect tier progress
- All tests passing
- Ready for integration (todo 009)

---

**Depends on**: 004, 005, 006, 007  
**Blocks**: 009, 010  
**Related**: specs/palm-reader-capture-ux.md § Feature 5 (Stability Improvements)
