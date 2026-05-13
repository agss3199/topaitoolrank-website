# Palm Reader Tool Integration Brief

## Objective
Integrate the Palm Reader AI application as a standalone tool on the Top AI Tool Rank website, following existing tool architecture and branding patterns.

## Source Project
- **Location**: `C:\Users\MONICA\Desktop\Abhishek_Softwares_All_old\AIIndividualProject\workspaces\palm-reader-ai`
- **Status**: Production-ready Next.js application
- **Type**: AI-powered entertainment/divination tool using computer vision and LLM

## Integration Requirements

### Functional Requirements
1. **Feature Parity**: Maintain all palm reader functionality
   - Real-time hand detection via MediaPipe
   - Auto-capture when hand quality is good (>75% confidence)
   - Gemini Vision API integration for palm analysis
   - Line-based palm reading (life, heart, head, fate, sun)
   - Overall reading + practical tips

2. **Tool Branding**: Follow website tool standards
   - Standalone component in `/app/tools/palm-reader/`
   - Consistent header/footer with other tools
   - Tool-specific styling with CSS Modules
   - Attribution: "made by Abhishek Gupta for MGMT6095"
   - Live badge and "Try Tool" button in tools directory

3. **Technical Requirements**
   - Use `dynamic = 'force-dynamic'` for real-time camera access
   - CSS Module safety via `cls()` helper (per css-module-safety.md)
   - API route at `/app/api/tools/palm-reader/route.ts`
   - Environment variable for Gemini API key

### Non-Functional Requirements
- Cross-browser compatibility (Mac + Windows)
- Mobile-responsive design
- Fast inference (2-3 seconds for analysis)
- No data storage/persistence
- Free tier compatible (Vercel + Gemini free API)

## Success Criteria
✅ Tool accessible at `/tools/palm-reader`
✅ Camera access works with auto-capture
✅ Gemini API analysis provides realistic palm readings
✅ Tool appears in `/tools` directory listing
✅ Attribution visible in tool interface
✅ No breaking changes to existing tools
✅ Deployment successful to production

## Scope
- Extract core components from palm-reader-ai project
- Adapt to match Top_AI_Tool_Rank tool architecture
- Create tool-specific files (page.tsx, api/route.ts, styles.css)
- Update tools directory listing
- Deploy and verify

## Out of Scope
- Custom palm reading algorithm (use Gemini API)
- Backend storage/persistence
- User authentication
- Data analytics/tracking

## Timeline Estimate
Autonomous execution: 1 session (analysis + implementation + deployment)
- Analysis: Understand integration points, tool protocol
- Implementation: Create tool structure, adapt code
- Deployment: Push to production, verify live

## Attribution
All credits to: Abhishek Gupta for MGMT6095 assignment
