# Palm Reader — Enhanced Auto-Capture UX Specification

**Date**: 2026-05-13  
**Status**: PLANNING  
**Domain**: Palm Reader Tool / Auto-Capture User Experience

---

## Overview

Current auto-capture behavior takes photos based on confidence + stability metrics, but lacks:
1. **Visual feedback** — user doesn't know WHY capture hasn't triggered
2. **Hand validation** — captures fists, blurry photos when hand is moving
3. **Palm structure detection** — doesn't verify palm lines are visible
4. **Hand orientation** — doesn't distinguish left vs right hand

This spec defines the enhanced UX that provides real-time visual feedback and stricter capture validation.

---

## Current Implementation Analysis

### What Works ✅
- Real-time hand detection (30fps, MediaPipe Hands)
- Stability tracking (movement delta across 21 landmarks)
- Centering validation (palm must be in frame center)
- Confidence scoring (MediaPipe confidence 0-1)
- Auto-capture when all conditions met

### Gaps 🔴
- **No visual feedback**: User stares at blank canvas, doesn't understand capture requirements
- **Captures suboptimal images**: No validation that:
  - Hand is OPEN (not fist/closed)
  - Palm lines are visible in current pose
  - Hand is rotated correctly for palm analysis
- **Confusing status messages**: Text-only "Hold steady..." doesn't show WHAT to fix
- **No hand orientation**: Doesn't tell user to adjust hand position for optimal reading
- **Blurry captures**: Still captures when user is adjusting hand position despite stability check

---

## Feature 1: Visual Palm Overlay with Color-Coded Alignment

### Requirement
Display an animated palm outline overlay on camera canvas that:
- **Red state** (default): Hand not properly aligned for palm reading
- **Green state** (ready): Hand is optimally positioned for palm reading
- Changes color smoothly as hand approaches ideal position
- Shows which aspect needs adjustment (e.g., "rotate hand", "center in frame", "open palm")

### Acceptance Criteria

1. **Palm Outline Rendered**
   - Overlay displays a palm shape (outline) on canvas
   - Follows hand position in real-time
   - Updates every 30ms (synchronized with hand detection)
   - Does NOT block camera view (semi-transparent or outline only)

2. **Color-Coded States**
   ```
   Red (Not Ready)          Green (Ready)
   ├─ No hand detected     ├─ Hand detected
   ├─ Hand not centered    ├─ Hand centered
   ├─ Fist/closed hand     ├─ Open palm
   ├─ Low confidence       ├─ High confidence (≥85%)
   ├─ Hand moving          ├─ Hand stable (60 frames)
   └─ Lines not visible    └─ Lines visible
   ```

3. **Color Transition**
   - **Fully Red** (RGB 255, 0, 0): One or more conditions not met
   - **Yellow** (RGB 255, 255, 0): Most conditions met, waiting on one
   - **Fully Green** (RGB 0, 255, 0): All conditions met, capture ready
   - Smooth CSS transition (200-300ms) as state changes

4. **Visual Elements**
   - Palm outline: Draw hand skeleton landmarks + connecting lines
   - Boundary ring: Highlight whether hand is in center zone
   - Status indicator: Icon/badge showing what's preventing green state
   - Animation: Subtle pulse when green (indicating "ready")

### Non-Functional
- Render overhead: <10ms per frame (ensure 30fps maintained)
- Memory: No additional state beyond current hand detection
- Accessibility: Outline AND text status (not color alone)

---

## Feature 2: Hand Shape Validation (Open vs Closed)

### Requirement
Validate that hand is OPEN (palm visible) not CLOSED (fist) before capturing.

### Detection Method

Use MediaPipe hand landmarks to calculate palm "openness":

1. **Finger extension score**:
   - For each finger (index, middle, ring, pinky):
     - Compare fingertip position (landmarks 8, 12, 16, 20)
     - Compare finger base position (landmarks 5, 9, 13, 17)
     - Calculate distance from palm center
   - Average extension across 4 fingers

2. **Openness threshold**:
   ```
   extension_score = avg_finger_tip_distance / palm_size
   
   Closed (fist):        extension_score < 1.0
   Partially open:       extension_score 1.0-1.5
   Fully open (valid):   extension_score ≥ 1.5
   ```

3. **Thumb validation** (optional refinement):
   - Thumb should be visible and extended
   - Excluded from primary score but checked for consistency

### Acceptance Criteria

1. **Closed Hand Detection**
   - When user makes fist: status shows "Open your palm"
   - Overlay highlights finger tips in red
   - Capture blocked when fist detected (even if stable + confident)

2. **Open Hand Recognition**
   - When user opens palm: status shows "Good, keep steady"
   - Overlay shows all fingers in green
   - Allows capture to proceed when all conditions met

3. **Edge Cases**
   - Hand partially open (2-3 fingers): status "Open all fingers"
   - Thumb only visible: considered valid (thumbs-up pose)
   - Fingers curled but not fist: treated as open if extension_score ≥ 1.3

4. **Performance**
   - Calculation: <2ms per frame
   - Smoothing: Use 5-frame moving average to avoid flickering

---

## Feature 3: Hand Orientation (Left vs Right)

### Requirement
Detect which hand is in frame (left or right) and show user appropriate positioning cues.

### Detection Method

MediaPipe already provides `multiHandedness` array with:
- `score`: confidence (0-1)
- `label`: "Left" or "Right"

### Usage

1. **Display to user**
   - Show "Left hand detected" or "Right hand detected" in status
   - Update in real-time as hand is repositioned

2. **Optimize palm reading**
   - Different poses optimal for left vs right
   - Left hand: palm faces camera, fingers up
   - Right hand: palm faces camera, fingers up (same position)
   - Show visual guide if hand is inverted (palm facing away)

3. **Palm line visibility**
   - Ensure all 5 lines visible based on hand orientation
   - If hand is rotated/inverted, status: "Rotate hand to show palm"

### Acceptance Criteria

1. **Orientation Detection**
   - Correctly identifies left vs right hand
   - Updates status message: "Left hand: {status}" vs "Right hand: {status}"
   - Works for both left-handed and right-handed users

2. **Visual Cues**
   - Overlay shows hand skeleton in consistent orientation
   - Arrows or guides indicate optimal hand position relative to camera
   - Color changes if hand is inverted (palm away from camera)

3. **Palm Line Visibility**
   - Detects if all 5 major palm lines are visible:
     - Life line (from thumb side)
     - Head line (middle)
     - Heart line (top)
     - Fate line (center vertical)
     - Sun line (ring finger side)
   - Status: "Position hand to show all palm lines" if lines obscured

---

## Feature 4: Palm Line Visibility Detection

### Requirement
Verify that palm lines are actually visible in current hand pose before capturing.

### Detection Method

1. **Hand pose analysis**:
   - Analyze landmark positions to infer hand rotation in 3D
   - Calculate angle of palm relative to camera (pitch, yaw)
   - Estimate which lines would be visible at current angle

2. **Line visibility scoring** (estimated from pose):
   ```
   visibility_score = how many of 5 lines appear visible based on hand angle
   
   Requirements:
   - Life line: visible when palm faces camera, thumb-side visible
   - Head line: visible when palm faces camera, not rolled sideways
   - Heart line: visible when palm faces camera, top visible
   - Fate line: visible when palm faces camera, center clear
   - Sun line: visible when palm faces camera, pinky-side visible
   ```

3. **Threshold for capture**:
   ```
   lines_visible ≥ 4 out of 5  → Capture OK
   lines_visible < 4 out of 5  → Status "Show more of palm"
   ```

### Acceptance Criteria

1. **Line Detection**
   - Status shows: "5/5 lines visible ✓" or "3/5 lines visible - adjust hand"
   - Updates in real-time as hand rotates
   - Accurate for both left and right hands

2. **Capture Validation**
   - Capture blocked if fewer than 4 lines visible
   - Overlay highlights visible vs obscured areas
   - User gets clear feedback on how to adjust

3. **Edge Cases**
   - Hand at angle (30-45°): shows partial lines, guides user to rotate
   - Hand too close to camera: magnifies features, status "Move hand back"
   - Hand too far: palm lines too small, status "Move hand closer"

---

## Feature 5: Stability Improvement — Stricter Capture Conditions

### Requirement
Ensure capture happens ONLY when hand is truly stable (not in mid-motion) and ready.

### Current State
- STABLE_FRAMES_REQUIRED: 60 frames (2 seconds at 30fps)
- STABILITY_DELTA_THRESHOLD: 4px

### Proposed Improvements

1. **Two-tier stability**:
   ```
   Tier 1: Detection stability (hand detected consistently)
     - 20 consecutive frames with hand visible
     - Prevents capture when hand enters/exits frame
   
   Tier 2: Movement stability (hand stopped moving)
     - 60 consecutive frames with delta < 4px
     - Ensures hand fully still before capture
   
   Both must be satisfied before capture
   ```

2. **Pre-capture validation** (final 500ms before capture):
   ```
   At frame 60 of stable detection:
   - Verify hand still centered (no drift during stability check)
   - Verify all fingers still visible (no curling into fist)
   - Verify palm angle hasn't changed >5° (rotated)
   - Verify confidence still ≥85% (no quality drop)
   - Only then trigger capture
   ```

3. **Capture delay optimization**:
   ```
   Current:   Detect stable → Set status "✅ Ready! Capturing..." 
              → Wait 300ms → Capture
   
   Improved:  Detect stable → Visual pulse animation
              → Final validation checks (50ms)
              → Capture (if all checks pass)
              → Status "✅ Captured!"
   ```

### Acceptance Criteria

1. **No premature captures**
   - When user moves hand into frame: NO capture until stable 60 frames
   - When user adjusts hand: capture resets counter and waits another 60 frames
   - When user curls fingers: capture blocked, status updates

2. **User feedback**
   - Overlay shows stability progress: "30/60 frames stable"
   - Color gradually transitions red → yellow → green
   - Animation shows when ready vs waiting

3. **Performance**
   - No latency increase (validation checks < 50ms)
   - Maintains 30fps processing

---

## User Flow: Complete Enhanced Experience

```
1. User approaches camera with palm
   ↓ Status: "Point palm at camera" (RED overlay)
   
2. Hand detected, but not centered
   ↓ Status: "Center hand in frame" (RED overlay)
   ↓ User moves hand toward center
   
3. Hand centered, but closed (fist)
   ↓ Status: "Open your palm" (RED overlay)
   ↓ User opens hand
   
4. Hand open + centered, but low quality
   ↓ Status: "Better lighting needed" (RED overlay)
   ↓ User adjusts lighting or distance
   
5. Hand open + centered + good quality
   ↓ Status: "Hold steady... 0/60" (YELLOW overlay, animated)
   ↓ Overlay shows stability progress bar
   
6. Hand still for 60 frames
   ↓ Status: "Hold steady... 60/60" (YELLOW → GREEN transition)
   ↓ Overlay pulses green
   
7. Final validation check
   ↓ All conditions verified: centered, open, stable, lines visible
   ↓ Status: "✅ Ready! Capturing..." (GREEN overlay)
   
8. Capture triggered
   ↓ Canvas freezes on captured image
   ↓ Status: "Analyzing palm... please wait"
   ↓ API call to Gemini
   
9. Results displayed
   ↓ Status: "Palm reading complete"
```

---

## Technical Implementation Notes

### Components Affected
1. **CameraView.tsx** (main logic)
   - Add hand shape validation
   - Add hand orientation detection
   - Improve stability tracking with two-tier system
   - Add final validation before capture

2. **PalmOverlay.tsx** (NEW component)
   - Render hand skeleton overlay
   - Color-coded based on capture readiness
   - Show stability progress
   - Animated transitions

3. **camera-constants.ts** (update)
   - Add new thresholds for openness, visibility
   - Define color palette (red, yellow, green)
   - Animation timing constants

4. **styles/camera.module.css** (update)
   - Overlay positioning and transparency
   - Animations for color transitions
   - Progress bar styling

### New Constants Required
```typescript
// Hand shape validation
export const HAND_OPENNESS_THRESHOLD = 1.5;
export const HAND_OPENNESS_PARTIAL = 1.0;
export const OPENNESS_FRAME_SMOOTHING = 5;

// Stability tiers
export const DETECTION_STABILITY_FRAMES = 20;
export const MOVEMENT_STABILITY_FRAMES = 60;
export const FINAL_VALIDATION_MS = 50;

// Palm line visibility
export const MIN_VISIBLE_LINES = 4;
export const MAX_VISIBLE_LINES = 5;

// Overlay colors
export const COLOR_RED = '#FF0000';
export const COLOR_YELLOW = '#FFFF00';
export const COLOR_GREEN = '#00FF00';
export const COLOR_TRANSITION_MS = 300;

// Orientation
export const ACCEPTABLE_HAND_ROTATION = 5; // degrees
```

### Performance Requirements
- Hand shape validation: <2ms per frame
- Line visibility estimation: <3ms per frame
- Overlay rendering: <5ms per frame
- **Total per-frame overhead: <10ms** (ensure 30fps = 33ms per frame)

---

## Acceptance Criteria Summary

| Feature | Criterion | Status |
|---------|-----------|--------|
| Palm Overlay | Renders in real-time on canvas | ❌ PENDING |
| Overlay Colors | Red/Yellow/Green state changes | ❌ PENDING |
| Hand Shape | Detects open vs closed hand | ❌ PENDING |
| Orientation | Identifies left vs right hand | ❌ PENDING |
| Line Visibility | Estimates visible palm lines | ❌ PENDING |
| Stability | Two-tier validation implemented | ❌ PENDING |
| UX Feedback | Clear status messages + visual cues | ❌ PENDING |
| Performance | Maintains 30fps throughput | ❌ PENDING |

---

## Timeline Estimate (Autonomous Execution)

| Phase | Duration | Work |
|-------|----------|------|
| Analysis | ✅ DONE | Spec definition, requirements breakdown |
| Planning (todos) | 30 min | Break into 4-6 implementation tasks |
| Implementation | 3-4 hours | Build overlay, validation, UX feedback |
| Testing | 1 hour | Manual testing, edge cases, performance |
| Deployment | 15 min | Push to production, verify live |
| **Total** | **~5-6 hours** | One session, autonomous |

---

## Files to Update

```
app/tools/palm-reader/
├── components/
│   ├── CameraView.tsx              (MODIFY - add validation + overlay)
│   ├── PalmOverlay.tsx             (CREATE - new overlay component)
│   └── ...
├── lib/
│   ├── camera-constants.ts         (UPDATE - new thresholds + colors)
│   ├── hand-shape-validator.ts    (CREATE - openness detection)
│   ├── palm-line-detector.ts      (CREATE - visibility estimation)
│   └── stability-tracker.ts       (CREATE - two-tier validation)
├── styles/
│   └── camera.module.css          (UPDATE - overlay styles + animations)
└── page.tsx                        (MINOR - ensure dynamic = 'force-dynamic')
```

---

## Dependencies

- No new npm packages required
- Uses existing MediaPipe landmarks
- Pure TypeScript/React (no external canvas libraries)
- CSS animations (no animation library)

---

## Next Steps

1. **Red Team Review** (this document)
   - Validate spec against user requirements ✅
   - Identify any gaps or conflicts
   - Approve or request clarifications

2. **Create Todos** (`/todos` command)
   - Break into 4-6 implementation tasks
   - Define acceptance criteria per task
   - Estimate effort per task

3. **Implement** (`/implement` command)
   - Build components in order of dependencies
   - Test each component independently
   - Integrate into CameraView
   - Manual testing on desktop + mobile

4. **Red Team Validation** (`/redteam` command)
   - Verify all features work as specified
   - Test edge cases and error handling
   - Performance testing (maintain 30fps)
   - User flow validation

5. **Deploy** (`/deploy` command)
   - Push to production
   - Verify live at https://topaitoolrank.com/tools/palm-reader
   - Monitor for errors

---

**Status**: Ready for red team review and planning
