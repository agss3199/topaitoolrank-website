# [006] Detect Hand Orientation (Left/Right Hand)

**Phase**: 2 — Hand Shape Validation  
**Spec**: `specs/palm-reader-capture-ux.md` § Feature 3  
**Status**: PENDING  
**Effort**: 2 hours  
**Priority**: HIGH  
**Depends on**: 004

## Overview
Use MediaPipe's hand orientation output to identify whether the detected hand is left or right. This information feeds into the overlay display and helps users understand hand positioning feedback.

## Requirements

### Orientation Detection
```typescript
interface HandOrientation {
  handedness: 'Left' | 'Right';
  confidence: number;        // 0-1 scale
  isBackOfHand: boolean;     // true if palm-facing-away
}

function detectHandOrientation(
  landmarks: NormalizedLandmark[] | null,
  mediapikeHandedness?: string,
): HandOrientation
```

### Detection Logic
MediaPipe provides `handedness` ("Left" or "Right") directly. Use it as primary signal:
- If MediaPipe returns handedness with confidence > 0.6: use it
- Otherwise, derive from landmark symmetry (pinky vs thumb x-position)
- Detect palm-facing orientation from landmark depth (z-axis variance)

### Integration Into Overlay
- Display "L" or "R" badge on the overlay (top-right corner)
- Fade out when not detected; show with 100% opacity when stable
- Color matches current state (red/yellow/green)

## Acceptance Criteria
- [ ] File created: `lib/hand-orientation-detector.ts`
- [ ] Function `detectHandOrientation()` exported
- [ ] MediaPipe handedness parsed correctly
- [ ] Fallback to landmark-based detection if MediaPipe output missing
- [ ] Confidence score calculated (0-1 scale)
- [ ] Orientation badge displays in overlay
- [ ] Badge color matches overlay state (red/yellow/green)
- [ ] Unit tests covering:
  - [ ] Left hand detected correctly
  - [ ] Right hand detected correctly
  - [ ] Confidence scores reasonable
  - [ ] Fallback works when MediaPipe absent
- [ ] No console errors
- [ ] Performance: <1ms per frame

## Implementation Checklist
- [ ] Create hand-orientation-detector.ts
- [ ] Implement MediaPipe handedness parsing
- [ ] Implement fallback landmark-based detection
- [ ] Add confidence calculation
- [ ] Create unit tests
- [ ] Test with both left and right hands
- [ ] Verify accuracy on real hand data

## Testing
Create `__tests__/hand-orientation-detector.test.tsx`:
- [ ] Left hand detected correctly
- [ ] Right hand detected correctly
- [ ] Confidence scores in 0-1 range
- [ ] Fallback detection works
- [ ] Edge case: null landmarks → defaults to unknown

## Files to Create/Modify

**Create**:
- `app/tools/palm-reader/lib/hand-orientation-detector.ts`
- `app/tools/palm-reader/__tests__/hand-orientation-detector.test.tsx`

**Modify**:
- `app/tools/palm-reader/components/PalmOverlay.tsx` (add orientation badge)
- `app/tools/palm-reader/styles/camera.module.css` (badge positioning)

## Performance Requirements

- Detection: <1ms per frame
- Fallback calculation: <0.5ms per frame
- Total: <1.5ms per frame

## Definition of Done

- Hand orientation detection working correctly
- Both left and right hands detected
- All tests passing
- Ready for line visibility integration (todo 007)

---

**Depends on**: 004  
**Blocks**: 007, 009  
**Related**: specs/palm-reader-capture-ux.md § Feature 3 (Hand Orientation Detection)
