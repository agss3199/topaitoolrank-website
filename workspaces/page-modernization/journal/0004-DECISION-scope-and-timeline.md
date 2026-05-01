# DECISION: Modernization Scope & Timeline

**Date**: 2026-04-30
**Decision Type**: Structural gate decision

## Scope Definition

### Core Modernization (Existing Pages)

**Pages to modernize** (7 actual pages in codebase):

1. **Authentication** (2 pages)
   - `/auth/login` — Modernize dark theme to light, blue accent, form standardization
   - `/auth/signup` — Same as login

2. **Tools** (1 page)
   - `/tools/wa-sender` — Standardize form inputs, modals, status badges, file upload

3. **Content** (4 pages)
   - `/blogs` — Create listing page (card grid, pagination, search)
   - `/privacy-policy` — Modernize typography and navigation
   - `/terms` — Modernize typography and navigation

### Scope Expansion Options (Pending User Approval)

The analysis identified 4 additional todos that CREATE NEW PAGES rather than modernize existing ones:

1. **Forgot Password Flow** (todos 014+015)
   - `/auth/forgot-password` — New page (email entry for reset)
   - `/auth/reset-password` — New page (password reset form)
   - **Status**: NOT in brief, NOT in codebase, NEW page creation
   - **Decision required**: Keep or remove?

2. **Blog Post Template** (todos 032+033)
   - `/blogs/[slug]` — New dynamic route (blog post detail page)
   - **Status**: NOT in brief, NOT in codebase, NEW page creation
   - **Decision required**: Keep or remove? If kept, content source must be defined (hardcoded MDX, CMS, API?)

## Timeline

### Autonomous Execution Model

All work executes in parallel within single sessions (no sequential human-team constraints).

**Sequential dependencies:**
- **Milestone 1** (Component Library): Prerequisite for all page work
  - Must complete before M2/M3/M4 start
  - Duration: 1 session

- **Milestones 2, 3, 4** (Auth, Tool, Content pages): Can run in parallel after M1
  - M2 Auth: 1.5 sessions (3 build + 3 wire todos)
  - M3 Tool: 1 session (5 todos, mostly restyle existing page)
  - M4 Content: 1.5 sessions (6 todos)
  - Can overlap completely after M1 completion

- **Milestone 5** (QA & Verification): Sequential after M2/M3/M4
  - Must run after all pages complete
  - Duration: 1 session (5 sequential todos: accessibility → responsive → performance → visual regression → cross-browser)

**Total timeline**:
- **Without scope expansion** (7 pages): ~4 sessions
  - Session 1: M1 (components)
  - Sessions 2-4: M2/M3/M4 in parallel (1-2 sessions each)
  - Sessions 2-4: M5 runs final (1 session, can start as soon as first M2/M3/M4 completes)
  - Actual: 3 parallel sessions + 1 final verification = 4 sessions total

- **With scope expansion** (add forgot-password + blog post): ~5 sessions
  - Same as above, plus 1 additional session for new pages

## Key Decisions Made

### 1. Build + Wire Separation Enforced

Every page with external data has TWO todos:
- **Build**: Create component structure, styling, local state (safe to review, no API coupling)
- **Wire**: Connect to real APIs, remove mock/placeholder data (final integration)

**Rationale**: Separates visual design from data integration, enabling parallel review and faster iteration.

**Exception**: WA Sender is already built and wired; todos only restyle/component-ify the existing page.

### 2. Component Library as Foundation

Milestone 1 (8 todos) must complete before any page work starts.

**Components required**:
- Button (primary, secondary, danger, ghost, loading variants)
- Input (text, email, password with error states)
- Label
- Form (wrapper component combining label + input + error)
- Card
- Modal (with focus trap, Escape key, body scroll lock)
- Badge (sent, unsent, failed, pending variants)
- Avatar (image + initials fallback)

**Rationale**: One source of truth for form/button/card styling ensures brand consistency across all pages.

**Risk if not enforced**: Pages diverge visually as developers add custom styles, recreating the current mismatch problem.

### 3. QA is Sequential After Content

Milestone 5 runs AFTER M2/M3/M4 complete:
- Accessibility audit (WCAG AAA)
- Responsive testing (320px, 768px, 1024px, 1440px)
- Performance verification (Core Web Vitals)
- Visual regression (against homepage, design-system compliance)
- Cross-browser testing

**Rationale**: Each QA step can surface issues affecting subsequent steps (e.g., accessibility issues found in M5 may require rework in M2/M3/M4). Sequential order ensures issues are addressed in context.

### 4. Legal Pages are Static (No Wire Todos)

Privacy policy and terms pages are hardcoded static content (confirmed by code audit). No backend/API todos needed.

**Rationale**: These pages contain legal text that doesn't change per user/request. Modernization is purely visual/structural.

### 5. Prefers-Reduced-Motion Testing Added

The brief requires motion preference support. Todo 040 (accessibility audit) must include:
- "All scroll-reveal and transition animations respect `prefers-reduced-motion: reduce`"
- "Verify animations are suppressed when OS setting is enabled"

**Rationale**: WCAG AAA requirement; brief explicitly lists this.

---

## Pending User Decisions

**Question 1: Forgot Password Flow (todos 014+015)**

Should the password reset flow be included?
- **Option A: Yes** — Create the pages, enhance user experience
- **Option B: No** — Out of scope for modernization; defer to future sprint

**Impact of Yes**: +0.5 sessions, new functionality beyond original brief

---

**Question 2: Blog Post Template (todos 032+033)**

Should the blog post detail page be created?
- **Option A: Yes** — Full blog feature; requires content source specification
- **Option B: No** — Out of scope; keep listing as placeholder

**If Option A chosen**: Must clarify content source:
- A1: Hardcoded MDX files (static)
- A2: CMS database (dynamic)
- A3: Markdown files in repo (static)

**Impact of Yes**: +0.5 sessions, new functionality

---

**Question 3: Timeline Priority**

Should scope expansion todos be done in same sprint or deferred?
- **Option A: Same sprint** — Add to M4, total becomes 5 sessions
- **Option B: Deferred** — Complete core modernization (7 pages) first, 4 sessions; password reset in next sprint

**Recommendation**: Option B. Core modernization is higher priority (affects user trust on critical paths like login/signup). Password reset and blog posts are nice-to-have enhancements.

---

## Success Criteria (After /todos Approval)

- ✅ All 7 existing pages modernized to design-system spec
- ✅ All new pages (if approved) follow same design-system spec
- ✅ Component library prevents future divergence
- ✅ All pages pass WCAG AAA audit
- ✅ All pages responsive at defined breakpoints
- ✅ Core Web Vitals targets met
- ✅ Visual consistency with homepage confirmed
- ✅ Cross-browser compatibility verified

---

## Next Steps

1. **User answers 3 pending questions** (scope expansion decisions)
2. **User approves final todo list** (structural gate)
3. **Implementation begins** with Milestone 1 (components)
4. **Red team verifies** completed milestones
5. **Production deployment** after Milestone 5 (QA)

