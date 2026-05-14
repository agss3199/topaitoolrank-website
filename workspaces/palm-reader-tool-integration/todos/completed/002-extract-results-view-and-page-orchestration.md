# 002 — Extract ResultsView + QualityMeter & Create Page Orchestration

**Status**: completed  
**Owner**: react-specialist  
**Phase**: implement  
**Effort**: 45 min (builds on 001 pattern, 3 components)  
**Depends on**: 001  
**Blocks**: 004, 005

---

## Overview

Extract result display and quality meter components from source app, then create `page.tsx` that orchestrates CameraView ↔ ResultsView transitions, manages capture/analysis state, and handles Gemini API calls. Also configure page exports (`dynamic = 'force-dynamic'`).

**Scope**: ~200 LOC for three components + ~100 LOC for page orchestration.

---

## Specification References

- **R3: Camera View UI** — spec §R3 QualityMeter placement (top-left)
- **R4: Results View UI** — spec §R4 full layout, colors, icons
- **css-module-safety.md** — all styles use cls() helper

---

## Acceptance Criteria

### Component 1: QualityMeter (~30 LOC)
- [ ] Create `app/tools/palm-reader/components/QualityMeter.tsx`
- [ ] Display quality percentage (0-100) as text
- [ ] Show quality bar (visual width proportional to quality %)
- [ ] Position: top-left corner of canvas overlay
- [ ] Color: white text on semi-transparent dark background
- [ ] Props: `{ quality: number }`
- [ ] No external dependencies

### Component 2: ResultsView (~120 LOC)
- [ ] Create `app/tools/palm-reader/components/ResultsView.tsx`
- [ ] Display palm reading results from Gemini API response
- [ ] Render one section per palm line (life, heart, head, fate, sun)
- [ ] Each line shows: emoji, name, description, interpretation
- [ ] Color-coded left borders per spec §R4 (red, pink, blue, yellow)
- [ ] Hide lines where `present: false`
- [ ] Render "🌟 Overall Reading" section with indigo styling (spec §R4)
- [ ] Render "💡 Tips" section with green styling (spec §R4)
- [ ] Two buttons: "🔄 Read Another Palm" + "🏠 Home"
- [ ] Props: `{ results: PalmReadingResponse, onRetry: () => void, onHome: () => void }`
- [ ] TypeScript: `interface PalmReadingResponse` matching API response schema (spec §R2)

### Component 3: Page Orchestration (~100 LOC)
- [ ] Create `app/tools/palm-reader/page.tsx`
- [ ] Export: `export const dynamic = 'force-dynamic'` (required for camera access)
- [ ] State: `view: 'camera' | 'results'`, `results: PalmReadingResponse | null`
- [ ] Handle `onCapture` from CameraView: capture canvas image, call API (todo 003)
- [ ] Show loading state while API call in progress ("Analyzing palm...")
- [ ] On API success: switch to `view: 'results'`
- [ ] On API error: show error message, stay on camera view
- [ ] Handle `onRetry` from ResultsView: reset state, return to camera
- [ ] Handle `onHome` from both views: navigate to `/tools`

### Page Structure & Layout
- [ ] Import Header from website layout
- [ ] Import Footer from website layout
- [ ] BreadcrumbSchema for SEO (path: `/tools/palm-reader`)
- [ ] Container div with proper spacing (margin, padding)
- [ ] CameraView OR ResultsView rendered based on view state (conditional)
- [ ] Loading overlay during API call (centered spinner + "Analyzing palm...")
- [ ] Error display for API failures with retry button

### Test Coverage
- [ ] Unit test: Page state transitions (camera → loading → results → camera)
- [ ] Unit test: Error handling (API error triggers message, not crash)
- [ ] Unit test: `onCapture` extracts image and calls API
- [ ] Unit test: XSS protection — Gemini response with HTML tags rendered as literal text, not executed
- [ ] Integration test: Page mounts, CameraView visible, click triggers analysis
- [ ] Integration test: Results display updates page content
- [ ] Integration test: Malicious response (with `<script>` tags) doesn't execute JavaScript

### Code Quality & Security (CRITICAL)
- [ ] No pre-existing test failures
- [ ] TypeScript strict mode: no `any` types
- [ ] Proper error handling: no unhandled promise rejections
- [ ] API call wrapped in try/catch with user-friendly error messages (generic, no details leaked)
- [ ] Navigation via `useRouter` from next/navigation
- [ ] **XSS Prevention (CRITICAL)**: All Gemini response text rendered via JSX interpolation ONLY
  - [ ] `{results.overall_reading}` ✅ safe
  - [ ] `dangerouslySetInnerHTML` ❌ BLOCKED
  - [ ] `innerHTML` ❌ BLOCKED
  - [ ] No eval, Function constructor, or dynamic code execution

---

## Files to Create/Modify

```
app/tools/palm-reader/
├── components/
│   ├── CameraView.tsx (already done in 001)
│   ├── ResultsView.tsx (new, ~120 LOC)
│   └── QualityMeter.tsx (new, ~30 LOC)
├── page.tsx (new, ~100 LOC)
└── lib/
    └── types.ts (new, ~30 LOC) — PalmReadingResponse type definition
```

---

## API Call in Page

```typescript
// In page.tsx onCapture handler:
const captureAndAnalyze = async (imageDataUrl: string) => {
  setIsLoading(true);
  try {
    const response = await fetch('/api/tools/palm-reader', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageDataUrl })
    });
    
    if (!response.ok) {
      const error = await response.json();
      setError(error.message || 'Analysis failed');
      return;
    }
    
    const results = await response.json();
    setResults(results);
    setView('results');
  } catch (err) {
    setError('Network error: ' + err.message);
  } finally {
    setIsLoading(false);
  }
};
```

---

## Type Definitions (lib/types.ts)

Must match spec §R2 API response:

```typescript
export interface PalmLine {
  present: boolean;
  description: string;
  interpretation: string;
}

export interface PalmReadingResponse {
  is_palm: boolean;
  confidence: number;
  lines: {
    life_line: PalmLine;
    heart_line: PalmLine;
    head_line: PalmLine;
    fate_line: PalmLine;
    sun_line: PalmLine;
  };
  overall_reading: string;
  tips: string;
}
```

---

## Implementation Notes

### Image Capture
Canvas capture happens in CameraView on `onCapture` callback. Page receives base64 data URL ready to send to API.

### Loading State
Show loading spinner while awaiting API response (2-3 seconds typical). Display "Analyzing your palm..." message.

### Error Handling
If API returns `is_palm: false`, show user-friendly message: "That doesn't look like a palm. Try again with your palm centered in the frame."

If network error, show: "Couldn't reach the analysis service. Check your internet and try again."

### Navigation Context
- Link at bottom of ResultsView: "🏠 Home" navigates to `/tools` (or back to camera)
- Verify correct routing behavior

---

## Verification Checklist

- [ ] `page.tsx` exports `dynamic = 'force-dynamic'`
- [ ] Page mounts without TypeScript errors
- [ ] CameraView visible on initial load
- [ ] Quality meter updates in real-time from CameraView
- [ ] Capture button click triggers API call
- [ ] Loading spinner shows during analysis
- [ ] Results display correctly on API success
- [ ] Error message displays on API failure
- [ ] "Read Another Palm" button resets state and shows camera
- [ ] "Home" button navigates to `/tools`
- [ ] All unit tests pass: `npm test -- page`
- [ ] No console errors in DevTools

---

## Related Todos

- **Depends on**: 001 (CameraView) + 003 (API route exists)
- **Blocks**: 004 (styling), 005 (layout integration)
- **Parallelize with**: 003 (API route) — both can be built independently

---

## Session Context

- Source page: `AIIndividualProject/workspaces/palm-reader-ai/app/page.js` (full file)
- Results rendering: lines 150-200 in source
- Type reference: Gemini API response structure from spec §R2

