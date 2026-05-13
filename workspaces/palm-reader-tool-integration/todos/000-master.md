# Palm Reader Tool Integration — Master Todo List

**Project**: palm-reader-tool-integration  
**Phase**: Implementation  
**Target Deployment**: Single session  
**Approved**: Pending human approval

---

## Todo Breakdown (8 todos total)

### Milestone 1: Component Architecture (Todos 001-002)
Extract monolithic page.tsx into reusable components and create page orchestration.

- **[001]** Extract CameraView component with MediaPipe hand detection and canvas rendering
- **[002]** Extract ResultsView component for displaying palm reading results + extract QualityMeter component

### Milestone 2: API Integration (Todo 003)
Create API route handler for Gemini Vision API palm analysis.

- **[003]** Create API route at `/app/api/tools/palm-reader/route.ts` with Gemini Vision integration

### Milestone 3: Styling & Layout (Todos 004-005)
Adapt styling from source app and integrate with website layout.

- **[004]** Convert CSS from Tailwind to CSS Modules using cls() helper pattern
- **[005]** Integrate tool into website layout (Header, Footer, BreadcrumbSchema, attribution)

### Milestone 4: Directory & Testing (Todos 006-007)
Update tools directory and add verification tests.

- **[006]** Add palm reader to tools directory listing and update routing
- **[007]** Add API route tests and integration verification tests

### Milestone 5: Deployment (Todo 008)
Deploy to production and verify.

- **[008]** Deploy to Vercel and verify tool is live at `/tools/palm-reader`

---

## Dependency Graph

```
001 (CameraView)  ──┐
                    ├──> 002 (page.tsx orchestration)
003 (API route)  ──┤
                 ┌──> 004 (CSS Modules) ──> 005 (Layout integration) ──> 006 (Directory)
                 │
                 └──> 007 (Tests) ──> 008 (Deploy)
```

- **001 & 003**: Can be developed in parallel (no dependencies)
- **002**: Requires 001 complete
- **004 & 005**: Require 002 complete (page structure known)
- **006**: Requires 005 complete (layout finalized)
- **007**: Can run once 001, 003, 004 complete (all implementation code exists)
- **008**: Requires all todos complete + 007 tests passing

---

## Implementation Standards

### Acceptance Criteria Template
Every todo MUST include:
- Reference to relevant spec sections (R1-R6, sections)
- Test coverage plan (unit/integration/e2e as applicable)
- Verification checklist before marking complete
- Links to related todos in dependency chain

### Code Quality Gates
1. **No pre-existing failures** — all tests pass before marking todo complete
2. **CSS Module safety** — all dynamic styles use cls() helper
3. **API compliance** — Gemini response parsing matches spec exactly
4. **Attribution** — "made by Abhishek Gupta for MGMT6095" visible on tool

### Deployment Checklist (Todo 008)
- [ ] All 007 tests passing
- [ ] Tool accessible at /tools/palm-reader
- [ ] Camera access works (permissions prompt shown)
- [ ] Hand detection fires (quality meter updates)
- [ ] Auto-capture triggers on good quality (>75% confidence)
- [ ] API call succeeds and returns readable results
- [ ] Attribution visible on results view
- [ ] Mobile responsive (test on mobile viewport)
- [ ] No console errors in browser DevTools
- [ ] Deployment verified via /deploy smoke test

---

## Session Context

- **Start time**: 2026-05-13 (analysis phase complete, validation passed)
- **Workspace**: `workspaces/palm-reader-tool-integration/`
- **Source code**: `C:\Users\MONICA\Desktop\Abhishek_Softwares_All_old\AIIndividualProject\workspaces\palm-reader-ai\`
- **Target location**: `app/tools/palm-reader/` on main website
- **Specs reference**: `specs/micro-saas-tools.md`, `specs/tool-pages-*.md`

---

## Success Criteria

✅ All 8 todos moved from `active/` to `completed/`  
✅ All tests passing (suite + smoke test)  
✅ Tool live at `/tools/palm-reader`  
✅ No breaking changes to other tools  
✅ Attribution visible and correctly credited  
✅ Responsive design verified on mobile/tablet/desktop  

---

## Red Team Validation Results

**Red team audit completed** — 8 gaps identified and resolved:

### Critical Issues (RESOLVED)
- [x] API key exposure: Changed `NEXT_PUBLIC_GEMINI_KEY` → `GEMINI_API_KEY` (server-side only)
- [x] Missing npm dependencies: Added verification steps to todos 001, 003

### High-Priority Security (RESOLVED)
- [x] No payload size limit: Added max 10MB validation to todo 003
- [x] No rate limiting: Added 5 req/min per IP throttling to todo 003
- [x] XSS via response: Added JSX-only rendering requirement to todo 002

### Medium-Priority Items (RESOLVED)
- [x] Missing dependency tracking in module load graph
- [x] Camera permission denial handling: Added to todo 001 scope
- [x] `.env.example` documentation: Added to todo 003 scope

### Status After Red Team
- ✅ All CRITICAL gaps resolved
- ✅ All HIGH-severity gaps resolved
- ✅ All todos updated with security criteria
- ✅ Journal entries created (0003-DECISION, 0004-RISK)

## Status

- [x] Analysis phase complete (04-validate/VALIDATION-COMPLETE.md)
- [x] Planning phase complete (todos created, red-teamed, security verified)
- [ ] Implementation phase (awaiting human approval)
- [ ] Deployment phase (awaiting implementation + tests)

