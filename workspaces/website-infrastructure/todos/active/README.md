# Website Infrastructure Implementation Todos

**Total Todos:** 11  
**Total Estimated Capacity:** ~13-15 autonomous execution sessions  
**Recommended Parallelization:** Items can be grouped and run in parallel based on dependencies  

## Dependency Graph

```
01. Auth System (JWT + Middleware)
    ↓ (required by all tool-scoped work)
    ├→ 06. Build WA Sender Components
    │       ↓
    │       └→ 07. Wire WA Sender to Real Data
    │            ↓
    │            └→ 08. Create WA Sender Manifest
    │                 ↓
    │                 └→ 05. Wire Dynamic Navigation & Sitemap
    │                      ↓
    │                      └→ 10. Integration Tests
    │                           ↓
    │                           └→ 11. Deploy to Production
    │
    └→ 03. Build ToolShell & Components
        ↓
        ├→ 06. Build WA Sender Components (parallel with 02)
        ├→ 09. Build Tool B (parallel with 07)
        └→ 04. Build Tool Registry (independent, can start anytime)

02. CSS Architecture (Route Groups)
    ↓ (independent of auth)
    └→ All projects benefit, but not blocking
```

## Execution Phases

### Phase 1: Foundation (Items 01-04) — Parallel Execution Recommended
- **Item 01:** Auth System Middleware & JWT
- **Item 02:** CSS Architecture (Route Groups)
- **Item 03:** Shared ToolShell Component
- **Item 04:** Tool Registry & Auto-Discovery

These can run in parallel; all are independent and provide foundation for later items.

**Estimated:** 4 sessions running in parallel ≈ 1 session of wall-clock time

### Phase 2: Integration (Items 05-08) — Sequential After Phase 1
- **Item 05:** Dynamic Navigation & Updated Sitemap (requires Item 04)
- **Item 06:** Build WA Sender Components (requires Items 01, 03)
- **Item 07:** Wire WA Sender to Real Data (requires Item 06, Item 01)
- **Item 08:** Create WA Sender Manifest (requires Item 07)

These depend on Phase 1 being complete, but can run in parallel with each other once started.

**Estimated:** 4 sessions running in parallel ≈ 1 session of wall-clock time

### Phase 3: Proof-of-Concept (Item 09) — After Phase 2
- **Item 09:** Build Tool B (requires Items 03, 04, 05)

Demonstrates the plug-and-play pattern works.

**Estimated:** 1 session

### Phase 4: Validation (Items 10-11) — After Phase 3
- **Item 10:** Integration Tests (requires Items 07, 09)
- **Item 11:** Deploy to Production (requires Item 10)

Final validation and deployment.

**Estimated:** 2 sessions

## Total Timeline (Autonomous Execution)

| Phase | Items | Parallelization | Wall-Clock Time |
|---|---|---|---|
| Phase 1 | 01-04 | 4 parallel | ~1 session |
| Phase 2 | 05-08 | 4 parallel | ~1 session |
| Phase 3 | 09 | Sequential | ~1 session |
| Phase 4 | 10-11 | 2 serial | ~2 sessions |
| **TOTAL** | **11** | **Yes** | **~5 sessions** |

**Human equivalent (10x multiplier):** ~50 hours of human time over 2-3 weeks

## What Each Todo Delivers

| # | Todo | Spec(s) | Deliverable | Lines |
|---|---|---|---|---|
| 01 | Auth System | authentication.md | JWT + middleware + login/logout endpoints | 400 |
| 02 | CSS Architecture | styling-architecture.md | Route group layouts, remove global CSS leakage | 300 |
| 03 | ToolShell Component | component-library.md | Shared wrapper pattern for all tools | 300 |
| 04 | Tool Registry | tool-architecture.md | Auto-discovery system (no hardcoded registry) | 250 |
| 05 | Dynamic Navigation | tool-architecture.md | Navigation + sitemap (reads from registry) | 250 |
| 06 | WA Sender Components | component-library.md | Decompose monolith into smaller components | 400 |
| 07 | WA Sender Data | tool-architecture.md | API routes, database, zero mock data | 350 |
| 08 | WA Sender Manifest | tool-architecture.md | Tool metadata (auto-discovered) | <50 |
| 09 | Tool B PoC | tool-architecture.md | Proof that plug-and-play pattern works | 300 |
| 10 | Integration Tests | authentication.md | Verify auth isolation + tool scoping | 350 |
| 11 | Deployment | All specs | Production deploy + verification | 200 |

## Key Principles Embedded in Todos

1. **Separation of Concerns:** Each todo has a clear, focused scope
2. **Build vs Wire:** Components/systems are built THEN wired to data (separate todos)
3. **No Mocks in Production:** Item 07 explicitly removes all mock data
4. **Isolation Verified:** Item 10 tests that auth and tool scoping work
5. **Zero Changes to Existing:** Tool B (Item 09) proves you can add a tool without touching WA Sender or homepage

## Acceptance Criteria Summary

Every todo must pass:
- ✅ Local `npm run build` succeeds
- ✅ Local `npm run test` passes
- ✅ No TypeScript errors
- ✅ No hardcoded mock data or secrets
- ✅ Code follows spec contracts
- ✅ Isolation/security guarantees are verified

## How to Run Implementation

```bash
# Phase 1 (parallel)
# Start 4 agents on items 01, 02, 03, 04 simultaneously
# All can run in parallel — no dependencies between them

# Phase 2 (parallel, after Phase 1)
# Start 4 agents on items 05, 06, 07, 08 simultaneously
# All can run in parallel once Phase 1 is done

# Phase 3 (sequential, after Phase 2)
# Start agent on item 09
# Waits for Phase 2 completion

# Phase 4 (sequential, after Phase 3)
# Start agent on item 10, then item 11 after 10 completes
```

## Notes

- **Database migrations:** Item 07 includes schema changes; must be idempotent (safe to run multiple times)
- **Environment variables:** Items assume `.env` has `JWT_SECRET`, `WHATSAPP_API_KEY`, etc.
- **Testing:** Integration tests (Item 10) require real test database (not mocked)
- **Deployment:** Item 11 assumes Vercel + GitHub integration (auto-deploy on push)

