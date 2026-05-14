# [003] Add Stability Progress Indicator to Overlay

**Phase**: 1 -- Visual Feedback  
**Spec**: `specs/palm-reader-capture-ux.md` Feature 5  
**Status**: COMPLETED  
**Effort**: 1.5 hours (estimated) / 0.75 hours (actual)  
**Priority**: HIGH  
**Depends on**: 001, 002

## Overview

Add a progress indicator showing "X/60 frames stable" to provide real-time feedback to users during the stability wait period.

## Verification

### Acceptance Criteria

- [x] Progress tracking implemented in CameraView (stableFrameCount state)
- [x] Status text displays "X/60 frames stable" in PalmOverlay during yellow state
- [x] Progress displays correctly ONLY in YELLOW state (not red, not green)
- [x] Updates every frame without lag (state passed as prop)
- [x] Resets to 0 when stability lost (no-hand-detected branch resets)
- [x] Text is readable (monospace font, white with black stroke for contrast)
- [x] No console errors
- [x] Positioned at bottom-center of overlay for visibility

### Test Results

- Progress indicator tests in `PalmOverlay.test.tsx` (4 tests):
  - Shows progress text when overlayState is yellow
  - Does not show progress text when overlayState is red
  - Does not show progress text when overlayState is green
  - Shows progress at zero when just entering yellow
- Integration tests in `overlay-integration.test.tsx`:
  - Does not show progress text in red state (initial)

### Files Modified

- `app/tools/palm-reader/components/CameraView.tsx` -- added stableFrameCount state, setStableFrameCount on each frame
- `app/tools/palm-reader/components/PalmOverlay.tsx` -- renders SVG text element with "{stableFrames}/{MOVEMENT_STABILITY_FRAMES} frames stable" when overlayState === 'yellow'

### Implementation Notes

- Text-based approach (per spec Phase 1 recommendation) over progress bar
- SVG `<text>` element rendered inside the overlay SVG for clean positioning
- White text with thin black stroke ensures readability over any camera background
- Monospace font for stable width as numbers change
- Only visible during yellow state (the "waiting" state) -- red shows nothing (user needs to fix conditions first), green shows nothing (capture is happening)

---

**Completed**: 2026-05-13  
**Depends on**: 001, 002  
**Blocks**: 004
