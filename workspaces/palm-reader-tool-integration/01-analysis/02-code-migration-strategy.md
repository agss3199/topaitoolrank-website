# Code Migration Strategy — Palm Reader to Top AI Tool Rank

## Source Files Analysis

### From Standalone App
1. **`app/page.js`** (Main Component)
   - Size: ~275 lines
   - Contains: UI layout, camera logic, state management, result display
   - Dependencies: React hooks, MediaPipe

2. **`app/api/analyze/route.js`** (API Handler)
   - Size: ~108 lines
   - Contains: Gemini Vision API integration, prompt engineering
   - Dependencies: Google Generative AI (via direct API call)

3. **`globals.css`** (Styling)
   - Size: ~400 lines (inline Tailwind via @apply)
   - Contains: Hero section, card styles, overlay styles, animations

## Migration Approach

### Phase 1: Component Splitting (45 min)
Extract monolithic page.js into reusable components:

#### Option A: Full Reusability (Preferred)
```
components/
├── CameraView.tsx          (video + canvas, overlay info)
├── ResultsView.tsx         (palm reading results, buttons)
├── QualityMeter.tsx        (quality percentage display)
└── CameraOverlay.tsx       (guidance text, status)

Main page.tsx:
- Orchestrates components
- Manages view state (camera vs results)
- Handles capture/reset flow
```

**Benefit**: Testable components, reusable in other contexts

#### Option B: Minimal Splitting (Faster)
```
Main page.tsx:
- All original code
- Styled to match website
- Add Header/Footer imports

lib/helpers.ts:
- Extract constants (debounce, thresholds)
- Extract utilities (image capture logic)
```

**Benefit**: Faster implementation, less surface area for bugs

**Decision**: Use Option A for maintainability + potential future reuse

### Phase 2: API Route Migration (20 min)
From: `app/api/analyze/route.js`
To: `app/api/tools/palm-reader/route.ts`

**Changes**:
1. Copy Gemini API handler logic
2. Keep same endpoint structure (POST with image)
3. Update environment variable name (keep as `NEXT_PUBLIC_GEMINI_KEY`)
4. Keep error handling patterns consistent

**No changes needed to**:
- Prompt engineering
- Response parsing
- Error messages

### Phase 3: Styling Adaptation (20 min)
Source: `globals.css` (Tailwind-based)
Target: `app/tools/palm-reader/styles.css` (CSS Modules)

**Mapping**:
```
Hero gradient (indigo-600 → purple-600) → Keep (matches website)
Card styles → Extract to tool-specific classes
Canvas overlay → Keep as-is
Button styles → Match website button patterns
Text colors → Use website color tokens

New: Add .palm-reader__attribution class for credits
```

**Dependencies**:
- Tailwind already available (app-wide)
- No new CSS framework needed
- Color scheme already chosen (indigo/purple)

### Phase 4: Component Integration (15 min)
1. Add Header component import
2. Add Footer component import
3. Add BreadcrumbSchema for SEO
4. Wrap in container with proper spacing
5. Update layout export
6. Add attribution text

### Phase 5: Directory Listing Updates (10 min)
1. Add tool card to `/app/(marketing)/page.tsx`
2. Update `/app/tools/page.tsx` or tool grid
3. Verify tool routing

## Code Quality Considerations

### Testing Strategy
1. **Unit Tests**: MediaPipe hand detection mock
2. **Integration Tests**: Camera + canvas rendering
3. **API Tests**: Gemini API mocking (don't call real API in tests)
4. **E2E**: Browser test with fake camera feed

**Scope for MVP**: Add API endpoint test only
- Verify response format
- Verify error handling
- Verify non-palm rejection

### Error Handling
Source app has:
- Camera permission errors → Display message
- Bad image rejection → "Try again with clearer palm"
- Network errors → "Server error: [message]"

**Keep all error messages**, integrate with website error styling

### Performance Considerations
1. **Bundle Size**:
   - MediaPipe library: ~2MB (downloaded from CDN, not bundled)
   - No additional dependencies
   - Component code: ~15-20KB

2. **Runtime Performance**:
   - Hand detection: 30fps (browser-based, no latency)
   - Image capture: <100ms (canvas operation)
   - API latency: 2-3s (Gemini inference)
   - Total user perception: 3-5s (loading state shown)

3. **Memory**:
   - Canvas buffer: ~1MB
   - MediaPipe worker threads: Managed by library
   - Single instance per session

## Dependencies Analysis

### External Libraries
```
Required:
- @mediapipe/hands (hand detection)
- @mediapipe/camera_utils (camera capture)
- @mediapipe/drawing_utils (visualization)

All loaded from CDN:
https://cdn.jsdelivr.net/npm/@mediapipe/hands/...
https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/...
https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/...

None require npm install (already in source app)
```

### Environment Variables
```
Existing website:
- NEXT_PUBLIC_GEMINI_KEY (if not set, add)

Required for palm-reader:
- NEXT_PUBLIC_GEMINI_KEY (API key for client-side calls)
- No new env vars needed
```

### Build Dependencies
- Next.js (already installed)
- TypeScript (already configured)
- Tailwind CSS (already configured)
- No additional installs needed

## Integration Checklist

### Before Starting
- [ ] Workspace created
- [ ] Brief documented
- [ ] Architecture decision made
- [ ] Source files reviewed

### During Implementation
- [ ] Page.tsx created with proper imports
- [ ] API route created at correct path
- [ ] CSS modules adapted
- [ ] Components split and tested
- [ ] Header/Footer integrated
- [ ] Attribution added

### After Implementation
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors
- [ ] Tool appears in directory
- [ ] API endpoint works (manual test)
- [ ] Camera access works (manual test)
- [ ] Results display correctly
- [ ] Styling matches website

### Deployment
- [ ] Commit with clear message
- [ ] Push to GitHub
- [ ] Deploy to Vercel
- [ ] Verify live at /tools/palm-reader
- [ ] Test on staging URL

## Risk Mitigation

### Risk: MediaPipe CDN unavailable
**Mitigation**: Cache locally if needed
**Likelihood**: Low (it's a public CDN)
**Impact**: Tool doesn't load
**Fix**: Add fallback error message

### Risk: Gemini API quota exceeded (50 req/day free)
**Mitigation**: User-facing message
**Likelihood**: Very low at MVP scale
**Impact**: Tool returns "Try again later"
**Fix**: Document quota limitation

### Risk: TypeScript type errors
**Mitigation**: Use `any` for MediaPipe if types missing
**Likelihood**: Possible (Mediapipe types may be incomplete)
**Impact**: Build fails
**Fix**: Suppress with comment + issue tracker

### Risk: CSS Module namespace conflicts
**Mitigation**: Use scoped class names (.palm-reader__xxx)
**Likelihood**: Low
**Impact**: Styling breaks
**Fix**: Use `cls()` helper, test carefully

## Migration Path Summary

```
Week 1 (autonomous, 1 session):
  - Extract components from source app
  - Adapt styling to website
  - Create API route
  - Integrate with website structure
  - Deploy to production

Week 2 (if needed):
  - Add test coverage
  - Optimize performance
  - Gather user feedback
```

**MVP deadline**: End of analysis phase
**Full release deadline**: Same session (no deferral)
