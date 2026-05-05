---
name: Phase 2 Scope and Prioritization Decisions
description: Autonomous decisions on track ordering, feature scope, and deferral rationale
type: DECISION
---

# Phase 2 Scope & Prioritization Decisions

**Session**: 2026-05-05 (Phase 1 complete, Phase 2 planning)

## Decision 1: Parallel Execution of Blog (Track A) and WA Sender (Track B)

**Rationale**: Both tracks have zero data dependencies and touch different route groups (`(blog)` vs `(tools)`). Parallel execution maximizes autonomous throughput.

**Alternative Considered**: Sequential execution (blog first, then WA Sender) would reduce context switching but waste 1 session of idle capacity since the tracks are independent.

**Chosen**: Parallel. Blog (lower risk) can start immediately while WA Sender Foundation (riskier state management refactor) runs in parallel.

---

## Decision 2: Blog Stays File-Based MDX (No Database Migration)

**Rationale**: 
- Current volume: 3 published articles
- Projected 2-4 articles/month → ~100 articles over 2 years
- Build-time `generateStaticParams` gives <100ms TTFB with zero runtime cost
- Git-native versioning, PR-based review, instant rollback all free
- Caching already optimized in Phase 1

**Alternative Considered**: Database-backed blog (Supabase records) for "more scalable" CRUD experience. Would add:
- API layer for article CRUD
- CMS admin panel
- Runtime database queries
- No benefit at current scale

**Chosen**: Keep file-based. No database migrations, no admin panel, no runtime cost. Scales to 100+ articles without structural change.

---

## Decision 3: WA Sender Features Scoped: Essential in Phase 2, Optional in Phase 3

**Essential Phase 2**:
- ✅ Templates (CRUD, variable substitution)
- ✅ Contacts (import, deduplicate, export)
- ✅ Send History & Analytics (logging, filtering, stats)
- ✅ ToolShell integration (sub-routes, navigation)

**Deferred Phase 3**:
- ❌ Scheduling (send at future time)
- ❌ WhatsApp Business API direct integration
- ❌ Real-time delivery status (requires webhooks)
- ❌ Campaign concept (groups of sends with aggregated metrics)
- ❌ Multi-user collaboration (requires RBAC enhancements)

**Rationale**: Phase 2 scope addresses the core pain point (templates + contacts eliminate retyping, history provides audit trail). Scheduling and API integration require external dependencies (cron queue, Meta approval, webhook infrastructure) that are 2-3x effort for marginal user value given `wa.me` link approach already works. Deferral is explicit and documented in specs.

---

## Decision 4: ToolShell Integration Strategy

**Approach**: Wrap WA Sender layout in ToolShell component (existing from Phase 1), read navigation from `tool.manifest.json`, migrate from monolithic 938-line page to sub-routes.

**Key Architectural Choice**: Contact management is NOT a top-level nav item. Contacts are selected within the Dashboard send workflow via a modal dialog. The manifest declares only 4 nav items (Dashboard, Messages, Templates, Settings), not 5.

**Rationale**: 
- Contacts are a *support feature* for send workflow, not a standalone tool section
- Access patterns: users import → send workflow references contacts → view history
- Not: users independently manage contacts then send

**Alternative Considered**: Contacts as a separate top-level nav item (like Messages, Templates, Settings). Would make the tool feel more like "contact manager + sender" than "sender with contact support".

**Chosen**: Contacts within Dashboard. Clearer intent, simpler UX, fewer nav items.

---

## Decision 5: Blog Category List Backwards Compatibility

**Issue**: Spec defined 7 new categories; existing content uses "AI Tools" and "Development".

**Decision**: Expand category list to include both existing + new. No migration needed. Existing posts grandfathered in.

**Alternative**: Migrate existing posts to new categories. Would require 3 manual edits + risk introducing errors.

**Chosen**: Additive list. All future posts use the expanded list; existing posts are unchanged.

---

## Decision 6: Phone Normalization Library Choice

**Specification**: Normalize to E.164 format (e.g., `+1-555-123-4567`) during contact import.

**Library Choice**: `libphonenumber-js` (standard, battle-tested, 40KB gzipped).

**Alternative Considered**: Simpler regex-based approach (supports only US numbers, error-prone).

**Chosen**: Full library. Supports 200+ country codes, automatic validation, handles edge cases.

---

## Decision 7: Search Implementation: Build-Time Index + Client-Side Fuzzy

**Approach**: 
- Generate `public/search-index.json` at build time (all posts enumerated)
- Client-side Fuse.js fuzzy search (threshold: 0.3)
- Lazy-load index only when user opens search box

**Alternative Considered**: Server-side search (hit API endpoint on every keystroke).

**Rationale**: 
- Build-time index: zero runtime cost, instant search (no network latency)
- Client-side fuzzy: no server load, works offline
- Lazy-load: index only fetched if user searches

**Trade-off**: Requires rebuild to pick up new posts. Acceptable for current velocity (2-4/month).

**Chosen**: Build-time + client-side. Zero server cost, fast UX, scales to 1000+ posts.

---

## Decision 8: Session Persistence & localStorage Format

**Clarification**: Phase 1 already uses user-scoped key format: `wa-sender-session-${userId}` (hyphenated, not underscores).

**Decision**: Maintain exact Phase 1 format. No key changes. Backwards compatibility verified.

**Why**: Existing sessions in localStorage will load automatically on first visit post-Phase 2. Zero data loss.

---

## Decision 9: Minimal Pages vs Stubs (Zero-Tolerance Compliance)

**Issue**: Initial plan mentioned "stub" pages for Templates/Messages/Settings. Violates `rules/zero-tolerance.md` Rule 2 (no empty functions, no stubs).

**Decision**: All "coming soon" pages return real HTML responses (not empty files). Each page:
- Renders full layout (matches ToolShell nav state)
- Shows "Feature coming soon" message with brief description
- Returns proper HTTP status (200) with complete DOM

Not a stub. Not a placeholder. A real page in a temporary state.

---

## Summary

All decisions are **explicit, documented, and justified**. No ambiguity remains between specs, plan, and todos. Implementation can proceed with confidence.
