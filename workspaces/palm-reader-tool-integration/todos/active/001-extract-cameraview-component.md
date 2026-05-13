# 001 — Extract CameraView Component with Hand Detection

**Status**: completed  
**Owner**: react-specialist  
**Phase**: implement  
**Effort**: 45 min (first component, establishes pattern)  
**Depends on**: none  
**Blocks**: 002

---

## Overview

Extract the camera + hand detection + canvas rendering logic from the source app's `app/page.js` (~80 lines) into a reusable `CameraView.tsx` component. This component will handle MediaPipe initialization, real-time hand detection, canvas drawing, and quality meter state management.

**Scope**: ~150 LOC, single responsibility (camera feed + visualization).

---

## Specification References

- **R1: Hand Detection & Auto-Capture** — spec §R1 technical details
- **R3: Camera View UI** — spec §R3 with overlay layout and status messages
- **css-module-safety.md** — all styles must use cls() helper

---

## Acceptance Criteria

### Build Criteria & Package Verification
- [ ] Create `app/tools/palm-reader/components/CameraView.tsx`
- [ ] Verify MediaPipe npm packages installed: `npm list @mediapipe/hands @mediapipe/camera_utils @mediapipe/drawing_utils`
  - [ ] If missing: `npm install @mediapipe/hands @mediapipe/camera_utils @mediapipe/drawing_utils`
- [ ] Import MediaPipe libraries (CDN via script tags, or npm imports based on project setup)
- [ ] Initialize MediaPipe Hands model on mount
- [ ] Set up camera input via Camera class from camera_utils
- [ ] Draw hand landmarks + connections on canvas using drawing_utils
- [ ] Export component as default export
- [ ] No TypeScript errors (`npx tsc --noEmit`)

### Logic Implementation
- [ ] `useEffect` hook manages MediaPipe initialization (runs once on mount)
- [ ] MediaPipe callback updates hand landmarks state in real-time
- [ ] Canvas drawing happens in render loop (30fps via requestAnimationFrame)
- [ ] Quality calculation: `confidence * 100` (stored in component state)
- [ ] Hand centering detection: x ∈ [0.25, 0.75], y ∈ [0.25, 0.75]
- [ ] Stability tracking: hand movement delta < 5px between frames
- [ ] onCapture callback triggered when quality > 75% AND hand centered AND stable
- [ ] Clean up MediaPipe resources on unmount (camera.stop, runningMode = false)

### UI Implementation
- [ ] Render hidden `<video>` element (camera input, 640x480)
- [ ] Render visible `<canvas>` element (640x480, responsive sizing)
- [ ] Canvas overlay (see spec §R3): quality % (top-left), status message (below quality)
- [ ] Home button (bottom-left, via props `onHome` callback)
- [ ] Overlay background: semi-transparent black (60% opacity)
- [ ] Hand visualization: red dots (landmarks) + green lines (connections)
- [ ] All text overlays styled with white color, readable on dark background

### Test Coverage
- [ ] Unit test: MediaPipe initialization mocked, verify state update on hand detected
- [ ] Unit test: Quality calculation logic (input: confidence, expected output: percentage)
- [ ] Unit test: Centering logic (hand at [0.5, 0.5] passes, [0.1, 0.1] fails)
- [ ] Unit test: Canvas rendering doesn't throw (mock canvas context)
- [ ] Integration test: CameraView mounts without crashing (real canvas, mocked MediaPipe)

### Code Quality
- [ ] Use CSS Modules for any inline styles (via `cls()` helper from `lib/css-module-safe.ts`)
- [ ] No hardcoded magic numbers — extract to constants file `lib/camera-constants.ts`
- [ ] Proper TypeScript types for props, state, and MediaPipe results
- [ ] Component props interface: `{ onCapture: (image: string) => Promise<void>, onHome: () => void }`

---

## Files to Create/Modify

```
app/tools/palm-reader/
├── components/
│   └── CameraView.tsx (new, ~150 LOC)
├── lib/
│   └── camera-constants.ts (new, ~20 LOC)
└── styles/ (CSS Module imports added in component)
```

---

## Implementation Notes

### MediaPipe CDN Integration
Use jsdelivr CDN (verified in analysis):
```typescript
// These auto-load from CDN via script tags in layout.tsx
// @mediapipe/hands
// @mediapipe/camera_utils
// @mediapipe/drawing_utils
```

### State Management
Keep component state simple:
- `landmarks` (current hand landmarks from MediaPipe)
- `quality` (confidence * 100)
- `isHandCentered` (boolean)
- `isHandStable` (boolean)
- `captureAttempts` (counter to prevent double-capture)

### Capture Trigger Logic
Do NOT capture here — only call `props.onCapture` callback. Todo 002 will handle view switching and actual image capture.

### Performance Considerations
- Canvas drawing happens at 30fps (MediaPipe rate)
- requestAnimationFrame for smooth rendering
- Cleanup on unmount to prevent memory leaks
- No re-renders on every frame (use useCallback for handlers)

---

## Verification Checklist

- [ ] Component exports correctly: `export default CameraView`
- [ ] Props interface defined and used: `interface CameraViewProps { ... }`
- [ ] No console errors in browser when component mounts
- [ ] Camera prompt appears asking for permission
- [ ] Hand detection fires (quality meter updates when hand visible)
- [ ] Canvas shows hand landmarks/connections in real-time
- [ ] Status messages update correctly based on quality + centering + stability
- [ ] Home button click calls `props.onHome`
- [ ] Cleanup runs on unmount (verify via DevTools memory profiler)
- [ ] Unit tests pass: `npm test -- CameraView`
- [ ] Integration test passes: `npm test -- --testPathPattern=integration`

---

## Related Todos

- **Depends on**: none (can start immediately)
- **Blocks**: 002 (page.tsx needs CameraView)
- **Parallelize with**: 003 (API route can be built independently)

---

## Session Context

- Source component: `AIIndividualProject/workspaces/palm-reader-ai/app/page.js` lines 1-80
- Styling reference: `AIIndividualProject/workspaces/palm-reader-ai/globals.css` canvas-related rules
- Test pattern: Reference existing tool tests at `app/tools/__tests__/`

