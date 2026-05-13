# User Flow — Palm Reader Tool

## Primary Flow: First-Time User

```
User lands at /tools/palm-reader
│
├─ Browser requests camera permission
│  ├─ User grants: Continue ✓
│  └─ User denies: Show error "Camera required"
│
├─ Page loads: Camera View displays
│  ├─ Title: "🔮 Palm Reader"
│  ├─ Subtitle: "AI reads your future (for fun!)"
│  ├─ Canvas: Live camera feed (640x480)
│  ├─ Overlay:
│  │  ├─ Quality meter (top-left, red progress)
│  │  ├─ Status text (top-left, below quality)
│  │  └─ Home button (bottom-left)
│
├─ Hand detection begins
│  ├─ User points palm at camera
│  ├─ MediaPipe detects hand landmarks
│  ├─ Quality meter updates in real-time
│  ├─ Status messages guide user:
│  │  ├─ "Point palm at camera" (no hand)
│  │  ├─ "Move palm to center" (off-center)
│  │  ├─ "Better lighting needed" (low quality)
│  │  ├─ "Hold steady..." (unstable)
│  │  └─ "✅ Ready! Capturing..." (good quality)
│  │
│  └─ User adjusts hand position until ready
│
├─ Auto-capture triggered
│  ├─ Canvas.toDataURL() captures frame as JPEG
│  ├─ Image converted to base64
│  ├─ Status changes to "Analyzing palm..."
│  ├─ Loading spinner shows (⏳)
│
├─ API request sent
│  ├─ POST /api/tools/palm-reader
│  ├─ Body: {image: "data:image/jpeg;base64,..."}
│  ├─ Endpoint calls Gemini Vision API
│  ├─ Wait 2-3 seconds for analysis
│
├─ Analysis response received
│  ├─ If NOT a palm: Show "Please try again with clearer palm"
│  │  └─ User goes back to Hand Detection step
│  │
│  └─ If IS a palm: Proceed to Results View ✓
│
├─ Results View displays
│  ├─ Title: "✨ Your Reading"
│  ├─ Sections for each palm line:
│  │  ├─ 📍 Life Line
│  │  │  ├─ Description (physical characteristics)
│  │  │  └─ Interpretation (meaning)
│  │  ├─ 💓 Heart Line
│  │  │  ├─ Description
│  │  │  └─ Interpretation
│  │  ├─ 🧠 Head Line
│  │  │  ├─ Description
│  │  │  └─ Interpretation
│  │  ├─ ⭐ Fate Line
│  │  │  ├─ Description
│  │  │  └─ Interpretation
│  │  └─ [Sun Line if present]
│  │
│  ├─ Overall Reading section
│  │  └─ "🌟 Overall Reading: [summary]"
│  │
│  ├─ Practical Tips section
│  │  └─ "💡 [actionable insight]"
│  │
│  ├─ Attribution footer
│  │  └─ "Made by Abhishek Gupta for MGMT6095"
│  │
│  └─ Action buttons:
│     ├─ "🔄 Read Another Palm" → Back to Camera View
│     └─ "🏠 Home" → Back to /tools directory
│
└─ User completes flow
   ├─ Shares results with friends (optional)
   └─ Leaves tool
```

---

## Alternate Flow 1: User Retries

```
Results View → Click "🔄 Read Another Palm"
│
├─ View switches back to Camera View
├─ Camera reinitializes
├─ Quality meter resets to 0
├─ Status resets to "Point palm at camera"
├─ User presents new palm
│
└─ Flows back to Hand Detection
```

---

## Alternate Flow 2: User Leaves Early

```
At Camera View: Click "🏠 Home"
│
├─ Camera stops
├─ Navigation to /tools directory
│
At Results View: Click "🏠 Home"
│
├─ View switches to Camera View
├─ Camera stops
├─ Navigation to /tools directory
│
└─ User can return to /tools/palm-reader anytime
```

---

## Alternate Flow 3: Bad Image

```
Auto-capture sends bad image → Gemini returns is_palm: false
│
├─ API returns error: {success: false, message: "Please try again with clearer palm"}
├─ Status changes to error message
├─ Loading spinner hides
│
├─ Camera View continues
├─ User can retry with clearer hand
│
└─ New auto-capture triggers when quality improves
```

---

## Alternate Flow 4: Network Error

```
API request fails (network timeout, server error)
│
├─ Error caught in catch block
├─ Status shows: "Network error: [message]"
├─ Loading spinner hides
│
├─ Camera View continues
├─ User can retry capture
│
└─ Auto-capture triggers again when hand quality improves
```

---

## Alternate Flow 5: Camera Permission Denied

```
User denies camera permission on initial request
│
├─ initCamera() throws error
├─ useEffect catches error
├─ Status shows: "Camera error: [message]"
│
├─ Canvas shows black screen (no camera feed)
├─ Hand detection doesn't work
│
├─ User must refresh and grant permission
│
└─ Camera reinitializes if permission granted
```

---

## Edge Cases

### Case 1: Multiple Hands in Frame
- **Behavior**: MediaPipe set to detect 1 hand (maxNumHands: 1)
- **Result**: Only first hand detected, analyzed
- **User experience**: Status guides to single hand

### Case 2: Fast Typing / Rapid Refreshes
- **Behavior**: captureAttempts counter prevents multiple captures
- **Result**: Auto-capture fires only once per hand cycle
- **User experience**: No duplicate captures

### Case 3: Hand Leaves Frame Mid-Analysis
- **Behavior**: Detection landmarks become empty
- **Result**: lastLandmarks reset, captureAttempts reset
- **User experience**: "Point palm at camera" status message

### Case 4: Very Low Confidence Hand
- **Behavior**: confidence < 60% → "Better lighting needed"
- **Result**: Auto-capture doesn't trigger
- **User experience**: User adjusts lighting and hand position

### Case 5: Unstable Hand (Movement > Delta 5)
- **Behavior**: isStable check fails
- **Result**: Status shows "Hold steady..."
- **User experience**: User steadies hand, captures when stable

---

## UX Expectations

### Time to First Reading
- **From page load**: 30 seconds (user presentation) + 3 seconds (analysis) = ~33 seconds typical
- **From hand detection to capture**: 5 seconds typical (time for user to stabilize hand)
- **From capture to result**: 3 seconds (API latency)

### Success Criteria (User Perception)
- ✓ Camera loads immediately
- ✓ Hand detection overlay visible and responsive
- ✓ Quality meter provides real-time feedback
- ✓ Status messages clear and actionable
- ✓ Auto-capture feels "magical" (no manual button click)
- ✓ Results feel personalized and credible (not obviously random)
- ✓ Tool is fun and shareable

### Frustration Points (Mitigations)
1. **"Can't get hand centered"** → Quality meter + centered area guide
2. **"Takes too long to analyze"** → Show "Analyzing..." message + spinner
3. **"Results seem random"** → Gemini prompt engineered for consistency + positive framing
4. **"Camera doesn't work"** → Clear error message + permission request UI
5. **"Can't see instructions"** → Status text always visible, no hidden UI

---

## Accessibility Considerations

### Screen Reader
- Status messages use aria-live="polite" (updates announced)
- Buttons have clear labels ("🔄 Read Another Palm")
- Results sections use semantic HTML (headings, paragraphs)

### Keyboard Navigation
- Tab order: Quality info → Status text → Home button → Canvas → Action buttons
- Enter/Space triggers button clicks
- Escape closes result view and returns to camera

### Mobile (Secondary)
- Canvas responsive to viewport width
- Buttons stack vertically on small screens
- Touch-friendly button size (48px minimum)

---

## Metrics Tracked

During analysis flow, observe:
- Time from page load to first hand detection (should be <2s)
- Time from auto-capture to result display (should be 3-5s)
- User success rate (% of attempts that produce valid readings)
- Retry rate (% of users who read another palm)

---

## Next Session Follow-up

After implementation, validate flows:
1. [ ] Manual test: Camera view → auto-capture → results
2. [ ] Manual test: Bad image rejection → retry → success
3. [ ] Manual test: Network error → retry
4. [ ] Manual test: Permission denied → error display
5. [ ] Manual test: Rapid hand movement → status updates
6. [ ] Manual test: Home button navigation
7. [ ] Accessibility: Tab navigation functional
8. [ ] Accessibility: Status updates announced
