# Website Infrastructure & Architecture Brief

**Date:** 2026-05-02  
**Priority:** High  
**Scope:** Design system, tool isolation, auth architecture  

## Problem Statement

The website is growing to include:
- Blog publishing system (articles)
- Multiple tools (WA Sender, and more planned)
- Authentication and login flows
- Shared website branding/navigation

Current state: No unified design system; blog pages have visual inconsistencies (green screen artifact on article pages); tools share auth mechanisms (risk of credential leakage between tools); assets not properly segmented.

**Goal:** Create plug-and-play architecture where tools, articles, and website pages can scale independently without interference.

## Key Requirements

### 1. Branding Kit (Design System)
- Overall website branding guidelines (colors, typography, spacing, components)
- Subdivision for 3 contexts:
  - **Blog articles** — typography-focused, clean prose layout
  - **Tools** — UI-heavy, interactive component library
  - **Website (marketing)** — brand showcase, landing pages, documentation
- Ensure consistency across contexts while allowing specialization

### 2. Fix Existing Issues
- **Green screen artifact** on article pages (top of page) — diagnose and remove
- Ensure articles match the blog design spec exactly (no stray colors, layouts)

### 3. Tool Isolation & Scalability
- Authentication should NOT leak between tools
  - Tool A's login session must not grant access to Tool B
  - Tool A's user data isolated from Tool B's
  - Each tool has its own auth scope/namespace
- Asset segmentation:
  - Shared components (used by all tools) in one place
  - Tool-specific components isolated in tool directory
  - Clear boundaries so new tools can be added without touching shared code
- Think ahead: WA Sender is first; plan for 3-5 more tools

### 4. Plug-and-Play Architecture
- Adding a new tool should NOT require:
  - Changes to core website navigation
  - Modifying shared auth system
  - Refactoring existing tool code
- Adding a new article should NOT require:
  - CSS changes
  - Frontmatter schema changes
  - Branding updates
- Clear interfaces (APIs, data contracts) between domains

### 5. Comprehensive Scalability Plan
- Auth system architecture (isolation, token handling, session management)
- Component library organization (shared vs tool-specific)
- CSS/styling strategy (prevent style leakage)
- Data model (what stays shared, what's per-tool, what's per-article)
- CI/CD implications (can tools deploy independently?)
- Monitoring & observability (can we track tool performance separately?)

## Questions to Explore

1. **Design System:** What's the minimal shared design system that serves all 3 contexts (articles, tools, marketing) without forcing compromise?
2. **Auth:** How do we structure auth so tokens are tool-scoped, not global?
3. **Styling:** CSS architecture — shared variables + context overrides? CSS modules per tool? Tailwind with scoped configs?
4. **Component Library:** What components are truly shared? (nav, footer, buttons) vs tool-specific?
5. **Database:** How do we model "tool user" vs "article reader" vs "website visitor"? Are they the same entity or separate?
6. **Deployment:** Should each tool be independently deployable, or all-or-nothing?

## Success Criteria

- ✅ Unified branding kit (colors, typography, spacing) documented
- ✅ 3 subsections for articles/tools/website with clear specialization rules
- ✅ Green screen artifact on articles removed
- ✅ Auth system allows tool-scoped tokens (Tool A user cannot access Tool B without Tool B's auth)
- ✅ New tool can be added with zero changes to existing tools or core website
- ✅ New article can be published with zero CSS/branding changes
- ✅ Comprehensive architecture document covering auth, styling, components, data, deployment

## Deliverables (from Analysis Phase)

- [ ] Research: Design system best practices (subdomain-aware)
- [ ] Research: Auth isolation patterns (tool-scoped credentials)
- [ ] Research: CSS architecture (isolation, scalability)
- [ ] Analysis: Current state (what needs fixing, what's missing)
- [ ] Plans: Design system structure
- [ ] Plans: Auth architecture
- [ ] Plans: Component library organization
- [ ] Specs: Created (domain-based, not process-based)
- [ ] User flows: For adding a new tool, publishing an article

## Timeline

- Phase 1 (Analysis): Understand current state, identify gaps, research patterns
- Phase 2 (Planning): Design system, auth, components, scalability roadmap
- Phase 3 (Implementation): Build design system, refactor styling, implement auth isolation
- Phase 4 (Validation): Red team architecture, test tool isolation, verify plug-and-play
- Phase 5 (Codification): Document patterns for future teams
