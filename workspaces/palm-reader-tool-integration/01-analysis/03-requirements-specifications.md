# Requirements Specifications — Palm Reader Tool

## Functional Requirements Breakdown

### R1: Hand Detection & Auto-Capture
**Requirement**: Real-time hand detection with automatic image capture when quality is sufficient

**Technical Details**:
- MediaPipe Hands model: 30fps detection rate
- Auto-capture triggers when:
  - Confidence (hand detection score) > 75%
  - Hand centered in frame (x: 0.25-0.75, y: 0.25-0.75)
  - Hand position stable (movement delta < 5 between frames)
  - No previous capture attempt in this cycle
- Capture delay: 500ms after quality threshold met

**Implementation**:
- CameraView.tsx handles MediaPipe initialization
- useEffect monitors hand landmarks
- captureAttempts counter prevents multiple captures
- Canvas.toDataURL() captures image as JPEG

**Verification**:
- [ ] Hand detection fires at 30fps
- [ ] Quality meter updates in real-time
- [ ] Auto-capture triggers only once per hand presentation
- [ ] User sees "✅ Ready! Capturing..." when ready

---

### R2: Palm Analysis via Gemini Vision API
**Requirement**: AI-powered palm reading analyzing hand image and returning structured palm line analysis

**Technical Details**:
- Image format: JPEG, base64-encoded, quality 0.8
- API endpoint: Google Generative Language API v1
- Model: gemini-2.0-flash
- Request structure: multimodal (image + text prompt)
- Prompt constraints:
  - Low temperature (0.2) for consistency
  - Max tokens: 1024
  - JSON-only response
  - Rejection of non-palm images
  - Safety guidelines: NO predictions of death/disease/harm

**Response Format**:
```json
{
  "is_palm": true|false,
  "confidence": 0-100,
  "lines": {
    "life_line": {"present": true|false, "description": "...", "interpretation": "..."},
    "heart_line": {"present": true|false, "description": "...", "interpretation": "..."},
    "head_line": {"present": true|false, "description": "...", "interpretation": "..."},
    "fate_line": {"present": true|false, "description": "...", "interpretation": "..."},
    "sun_line": {"present": true|false, "description": "...", "interpretation": "..."}
  },
  "overall_reading": "1-2 sentence summary",
  "tips": "One practical tip"
}
```

**Implementation**:
- `/app/api/tools/palm-reader/route.ts` handles POST requests
- Extract base64 from data URL
- Call Gemini API with image + prompt
- Parse JSON response
- Return success/error to client

**Verification**:
- [ ] API accepts image POST
- [ ] Gemini API receives image correctly
- [ ] Response parses to valid JSON
- [ ] Non-palm images rejected with appropriate message
- [ ] Response time: 2-3 seconds typical

---

### R3: User Interface — Camera View
**Requirement**: Live camera feed with hand detection overlay and quality indicators

**Technical Details**:
- Video element: 640x480 resolution, hidden
- Canvas element: 640x480 responsive display
- Overlay information:
  - Quality percentage (top-left)
  - Status message (top-left, below quality)
  - Home button (bottom-left)
  - Overlay background: black with 60% opacity
- Hand visualization:
  - Landmarks: Red dots at joint positions
  - Connections: Green lines connecting landmarks
  - Canvas context: 2D (not 3D)

**Status Messages**:
- "Point palm at camera" (no hand detected)
- "Move palm to center" (hand detected, not centered)
- "Better lighting needed" (quality < 60%)
- "Hold steady..." (not stable)
- "✅ Ready! Capturing..." (ready for capture)
- "Analyzing palm..." (capture in progress)

**Implementation**:
- CameraView.tsx imports MediaPipe
- useEffect initializes Hands + Camera
- drawConnectors + drawLandmarks for visualization
- Quality meter: `(confidence * 100)`
- Status logic: nested ternary based on confidence, centering, stability

**Verification**:
- [ ] Video loads and initializes camera
- [ ] Hand detection overlay renders
- [ ] Quality meter updates in real-time
- [ ] Status messages are accurate
- [ ] Home button works

---

### R4: User Interface — Results View
**Requirement**: Display structured palm reading results with line interpretations and overall insight

**Technical Details**:
- Sections for each palm line (life, heart, head, fate, sun)
- Each line shows:
  - Emoji icon (📍, 💓, 🧠, ⭐, etc.)
  - Line name
  - Description (what the line physically looks like)
  - Interpretation (what it means)
  - Color-coded left border (red, pink, blue, yellow)
- Overall reading section:
  - Header: "🌟 Overall Reading"
  - Background: indigo-50 with indigo-600 border
  - Content: 1-2 sentence summary
- Practical tips section:
  - Header: "💡 Tips"
  - Background: green-50 with green-600 border
  - Content: One actionable insight

**Implementation**:
- ResultsView.tsx maps over palm lines
- Conditional rendering: only show lines with `present: true`
- Styling via CSS modules
- Button layout: "🔄 Read Another Palm" + "🏠 Home"

**Verification**:
- [ ] All present lines display
- [ ] Absent lines hidden
- [ ] Overall reading visible
- [ ] Tips visible
- [ ] Colors match specification
- [ ] Buttons functional

---

### R5: Tool Integration with Website
**Requirement**: Palm reader appears as a tool in the website directory with proper branding

**Technical Details**:
- Location: `/tools/palm-reader`
- Tools directory listing: Shows card with:
  - Badge: "Live"
  - Title: "Palm Reader"
  - Description: "AI reads your palm using computer vision"
  - Link: "Try Tool →"
- Page structure:
  - Header component (shared)
  - Breadcrumb for SEO
  - Main container with max-width
  - Footer component (shared)

**Attribution Requirements**:
- Location: Bottom of results view or separate footer section
- Text: "Made by Abhishek Gupta for MGMT6095"
- Font: Smaller, subtle
- Color: Gray-600

**Implementation**:
- page.tsx imports Header, Footer, BreadcrumbSchema
- Wraps content in proper container
- Adds attribution div with className

**Verification**:
- [ ] Tool appears in /tools listing
- [ ] Clicking "Try Tool" navigates to /tools/palm-reader
- [ ] Header/Footer display correctly
- [ ] Attribution visible
- [ ] Styling matches other tools

---

### R6: Responsive Design
**Requirement**: Tool works on desktop browsers (Mac + Windows) with responsive scaling

**Technical Details**:
- Breakpoints:
  - Desktop (1024px+): Full-size canvas
  - Tablet (768px-1023px): Canvas scales to fit
  - Mobile (< 768px): Canvas stacks, buttons stack
- Canvas aspect ratio: 4:3 (640x480)
- Container max-width: 42rem (672px)
- Padding: 1rem on all sides
- Font sizes: Scale with breakpoints

**Implementation**:
- CSS modules with media queries
- Canvas: `width: 100%; height: auto; aspectRatio: 4/3`
- Buttons: `flex-1` for equal width, stack vertically on small screens

**Verification**:
- [ ] Loads on Safari (Mac)
- [ ] Loads on Chrome (Windows)
- [ ] Loads on Firefox (both)
- [ ] Canvas visible and interactive
- [ ] Buttons clickable on all screen sizes

---

## Non-Functional Requirements

### Performance
- **Inference time**: 2-3 seconds (Gemini API)
- **Hand detection latency**: <50ms (30fps = 33ms per frame)
- **Image encoding**: <100ms (canvas.toDataURL)
- **Total user-perceived time**: 3-5 seconds for result

### Reliability
- **API error handling**: Graceful fallback with user message
- **Bad image handling**: Reject with "Try again with clearer palm"
- **Network timeout**: Show error, allow retry
- **Browser compatibility**: Safari, Chrome, Firefox (WebGL required)

### Security
- **No data persistence**: Image discarded after analysis
- **No user authentication**: Anonymous usage
- **API key protection**: Client-side only (free tier key), no secrets
- **Image privacy**: Not stored server-side

### Accessibility
- **Camera permission prompt**: Clear explanation
- **Error messages**: Plain language, actionable
- **Status updates**: aria-live regions for screen readers
- **Focus management**: Tab order correct for keyboard navigation

---

## Success Metrics

| Metric | Target | Verification Method |
|--------|--------|---------------------|
| Hand detection accuracy | >90% | Manual testing with various hands |
| Auto-capture success rate | >75% | 10 test captures |
| API response time | 2-3s | Network tab inspection |
| Result accuracy | Realistic + consistent | Multiple readings of same hand |
| User satisfaction | Entertaining + shareable | Feedback/demos |
| Uptime | 99.9% | Vercel monitoring |
| Browser compatibility | 3+ browsers | Cross-browser testing |

---

## Requirements Traceability

| Requirement | Source | Implementation | Verification |
|-------------|--------|-----------------|--------------|
| Auto-capture | Brief §1.1 | CameraView.tsx, MediaPipe | R1 checklist |
| Gemini API | Brief §1.2 | /api/tools/palm-reader/route.ts | R2 checklist |
| Camera UI | Brief §1.3 | CameraView.tsx + overlay | R3 checklist |
| Results display | Brief §1.3 | ResultsView.tsx | R4 checklist |
| Website integration | Integration brief | page.tsx + directory listing | R5 checklist |
| Responsive | Brief §2.2 | CSS modules + media queries | R6 checklist |

---

## Outstanding Questions

1. **Attribution placement**: Should it be in results view, footer, or separate modal?
   - **Decision**: Footer of results view (subtle but visible)

2. **Palm reading personality**: Should readings be serious, humorous, or balanced?
   - **Decision**: Balanced + positive (entertainment framing)

3. **Mobile support deadline**: Should initial launch support mobile or desktop-first?
   - **Decision**: Desktop-first (Mac + Windows browsers), mobile secondary

4. **Data logging**: Should readings be logged for analytics?
   - **Decision**: No logging (entertainment tool, no persistence)

5. **Rate limiting UI**: How to communicate 50 req/day quota?
   - **Decision**: Document in tool description, show error if exceeded

---

## Completion Definition

The Palm Reader tool is complete when:
1. ✅ All R1-R6 requirements implemented
2. ✅ All success metrics met
3. ✅ Deployed to production at /tools/palm-reader
4. ✅ Listed in tools directory
5. ✅ Attribution visible
6. ✅ Zero pre-existing failures or warnings
