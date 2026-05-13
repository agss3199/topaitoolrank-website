# Tool Architecture Analysis — Palm Reader Integration

## Current Tool Pattern (Top AI Tool Rank)

### Directory Structure
```
app/tools/
├── [tool-name]/
│   ├── page.tsx                 (Main tool component)
│   ├── layout.tsx              (Optional: nested layout)
│   ├── styles.css              (Tool-specific styles)
│   ├── components/             (Optional: sub-components)
│   │   └── [ComponentName].tsx
│   ├── lib/                    (Tool utilities)
│   │   └── [helpers].ts
│   └── __tests__/              (Optional: tests)
```

### Existing Tools for Reference
- **Invoice Generator**: `/app/tools/invoice-generator/`
  - Full CRUD invoice management
  - PDF export
  - localStorage persistence
  - Complex form handling
  
- **SEO Analyzer**: `/app/tools/seo-analyzer/`
  - API integration with server-side processing
  - URL input validation
  - Structured results display
  
- **AI Prompt Generator**: `/app/tools/ai-prompt-generator/`
  - Text input processing
  - Template-based output
  - Copy-to-clipboard functionality

### Common Patterns
1. **Page Structure**:
   - `"use client"` directive for interactivity
   - `export const dynamic = 'force-dynamic'` for real-time features
   - Header component imported
   - Footer component imported
   - Breadcrumb schema for SEO

2. **Styling**:
   - CSS Modules (tool-specific styles)
   - `cls()` helper for safe module access
   - Tailwind utilities for responsive design
   - Consistent spacing/colors with brand

3. **API Integration**:
   - API route at `/app/api/[tool-name]/route.ts`
   - POST endpoint for data processing
   - Error handling with descriptive messages
   - Environment variable for API keys

4. **UI/UX**:
   - Clear title and description
   - Status indicators (loading, error, success)
   - Results displayed in structured format
   - Call-to-action buttons
   - Attribution/credit section

## Palm Reader Adaptation Strategy

### Code Organization
```
app/tools/palm-reader/
├── page.tsx                     (Main camera + results UI)
├── styles.css                   (Palm reader specific styles)
├── lib/
│   ├── palm-reader.ts          (Detection logic, constants)
│   └── handlers.ts             (Event handlers)
├── components/
│   ├── CameraView.tsx          (Video canvas + overlay)
│   ├── ResultsView.tsx         (Palm reading results display)
│   └── QualityMeter.tsx        (Confidence percentage display)
└── api/
    └── route.ts                 (Gemini API handler)
```

### Key Differences from Standalone App
1. **Integration Points**:
   - Import Header component (shared)
   - Import Footer component (shared)
   - Use website's color scheme (indigo/purple primary)
   - Follow tool card styling for tools directory

2. **Navigation**:
   - Add "Home" button linking to `/tools`
   - "Read Another Palm" button for retry flow
   - Breadcrumb for SEO

3. **API Route Location**:
   - Standalone: `/api/analyze`
   - Website: `/app/api/tools/palm-reader/route.ts`

4. **Attribution**:
   - Add footer line: "Made by Abhishek Gupta for MGMT6095"
   - Can be in results view or tool footer

### Dependencies to Port
- **MediaPipe**: Browser-based, no installation needed
  - `@mediapipe/hands`
  - `@mediapipe/camera_utils`
  - `@mediapipe/drawing_utils`
  - CDN-hosted (`cdn.jsdelivr.net`), no npm install needed

- **Environment Variables**:
  - `NEXT_PUBLIC_GEMINI_KEY` for client-side API access
  - Keep same name for consistency

### Styling Adaptation
- Replace indigo/purple gradient with website primary colors (indigo/purple is already used)
- Card design matches website tools
- Keep the magic crystal ball emoji (🔮) for branding
- Responsive design for mobile/desktop
- Dark canvas background for camera feed

## Integration Points with Website

### Tools Directory
- Tool card added to homepage `/app/(marketing)/page.tsx`
- Shows: badge, title, description, link to tool
- Updates to `/tools` page listing

### Tools Page (`/tools`)
- Add palm reader to tools grid
- Show live badge
- Include description: "AI reads your palm using computer vision and LLM analysis"

### API Architecture
- Follows Nexus pattern: single API route handler
- Gemini Vision API called server-side
- Returns JSON with line analysis + overall reading

## Risk Analysis

### Technical Risks
1. **Browser Compatibility**: MediaPipe requires WebGL support
   - Mitigation: Graceful error message on unsupported browsers
   
2. **Camera Permissions**: User must grant camera access
   - Mitigation: Clear permission request UI with explanation
   
3. **API Rate Limiting**: Gemini free tier = 50 req/day
   - Mitigation: User-facing message when limit reached
   - Expected: MVP scale (few requests per session)

4. **Network Latency**: Image encoding + API call + parsing
   - Expected: 2-3 seconds for analysis
   - Acceptable per brief

5. **Mobile Support**: Camera APIs on mobile browsers vary
   - Scope: Desktop-first (Mac + Windows browsers)
   - Mobile support secondary

### UX Risks
1. **Hand Detection Quality**: Requires good lighting, centered hand
   - Mitigation: Real-time quality meter + guidance text
   
2. **Image Upload Speed**: Large canvas → JPEG encoding → base64
   - Mitigation: Use 0.8 quality factor for JPEG compression
   - Expected size: ~50-100KB per image

3. **Reading Consistency**: LLM-based analysis may vary slightly
   - Mitigation: Document that readings are for entertainment, not medical
   - Gemini prompt configured for consistency (low temperature: 0.2)

## Estimate

- **Interface adaptation**: 30-45 min (extract UI, adjust styling)
- **Component composition**: 15-20 min (CameraView, ResultsView, QualityMeter)
- **API route creation**: 15-20 min (copy logic, adjust path)
- **Tool directory integration**: 10-15 min (add card, update listings)
- **Testing + deployment**: 10-15 min (build, verify, push)

**Total autonomous execution**: ~2-3 hours across one session with parallel work.
