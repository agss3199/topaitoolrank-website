# Decision: Todo Sharding Strategy — 11 Focused Todos Over 5 Sessions

**Date:** 2026-05-02  
**Type:** DECISION  
**Impact:** Determines execution timeline and parallelization  

## Decision Made

Break the entire infrastructure project into **11 focused todos** organized into **4 phases** with heavy parallelization in Phases 1 and 2. This keeps each todo under the capacity budget (≤500 LOC logic, ≤5-10 invariants) while enabling significant parallelization.

## Rationale

The project spans 5 domains (auth, CSS, components, tool registry, WA Sender refactor). Naive approach would create either:
1. **One mega-todo:** 3000+ LOC, 15+ simultaneous invariants → exceeds capacity budget → likely failure
2. **Many tiny todos:** 50 todos × 50 LOC → excessive fragmentation → coordination overhead

**Chosen approach:** 11 todos organized by **logical layers** (foundation, integration, proof-of-concept, validation) with **explicit dependencies** documented.

## Todo Organization

| Phase | Items | Dependencies | Parallelization |
|---|---|---|---|
| **1. Foundation** | 01-04 | None (all independent) | 4 parallel agents |
| **2. Integration** | 05-08 | Requires Phase 1 | 4 parallel agents (after P1) |
| **3. Proof-of-Concept** | 09 | Requires Phase 2 | 1 agent |
| **4. Validation** | 10-11 | Requires Phase 3 | 2 agents (serial) |

## Capacity Analysis

Each todo fits within the autonomous execution budget:

| Todo | LOC | Invariants | Call-Hops | Describable in 3 Sentences |
|---|---|---|---|---|
| 01. Auth System | 400 | 6 (token format, middleware, routes, session, expiry, claims) | 3 (create → verify → refresh) | ✅ |
| 02. CSS Architecture | 300 | 5 (route groups, context overrides, modules, global reset, cascade) | 2 (layout → styles import) | ✅ |
| 03. ToolShell Component | 300 | 4 (auth gating, chrome, props, responsive) | 2 (import → render) | ✅ |
| 04. Tool Registry | 250 | 3 (discovery, validation, API) | 2 (scan → return) | ✅ |
| 05. Dynamic Nav & Sitemap | 250 | 4 (tool discovery, nav fetch, sitemap generation, caching) | 2 (fetch → render) | ✅ |
| 06. WA Sender Components | 400 | 5 (decomposition, props, CSS modules, tokens, responsive) | 3 (parent → child → render) | ✅ |
| 07. WA Sender Data | 350 | 5 (API routes, database schema, queries, auth validation, isolation) | 3 (middleware → route → query) | ✅ |
| 08. WA Sender Manifest | <50 | 1 (JSON structure) | 1 (file creation) | ✅ |
| 09. Tool B PoC | 300 | 5 (components, API, database, manifest, tests) | 3 (similar to WA Sender) | ✅ |
| 10. Integration Tests | 350 | 4 (auth isolation, tool scoping, data isolation, token lifecycle) | 2 (test → verify) | ✅ |
| 11. Deployment | 200 | 3 (build, deploy, verification) | 1 (deploy → verify) | ✅ |

**All todos fit within budget.** No todo exceeds 400 LOC or 6 simultaneous invariants.

## Build vs Wire Separation

The project enforces **separation of build and wire:**
- **Item 06:** Builds WA Sender components (structure, logic, props)
- **Item 07:** Wires components to real data (API routes, database, remove mocks)

This ensures components are testable before database wiring, and mocks are explicitly removed in a separate step.

Same pattern for Tool B (Items 09 combines both since it's a PoC, but could be split if needed).

## Parallelization Benefit

**Timeline with parallelization:**
- Phase 1: 4 todos × 1 session each = 4 sessions of work, runs in parallel = 1 session of wall-clock time
- Phase 2: 4 todos × 1 session each = 4 sessions of work, runs in parallel = 1 session of wall-clock time
- Phase 3: 1 todo × 1 session = 1 session
- Phase 4: 2 todos × 1 session each = 2 sessions (serial) = 2 sessions
- **Total wall-clock:** ~5 sessions (vs 13 if fully sequential)

**Human equivalent (10x multiplier):** ~50 hours over 2-3 weeks (vs 130 hours if sequential)

## Key Decisions Embedded in Todos

1. **JWT server-side** (Item 01): Not OAuth, not sessions. Token claim includes `tool_id` for scoping.
2. **Route group isolation** (Item 02): Not CSS Modules globally, but specifically to prevent global leakage.
3. **Shared ToolShell pattern** (Item 03): Every tool wraps in ToolShell; new tools get chrome for free.
4. **Manifest-driven discovery** (Item 04): No hardcoded registry; tools declare themselves via manifests.
5. **Real data from day one** (Item 07): No mock data persistence into production (explicit removal todo).
6. **Tool B as proof** (Item 09): Validates plug-and-play works before claiming architecture is sound.
7. **Integration tests first** (Item 10): Tests verify invariants (auth isolation, data isolation) not just happy paths.

## Risks Mitigated by This Approach

| Risk | Mitigation |
|---|---|
| **Mega-todo becomes unmaintainable** | Sharded into 11 focused todos |
| **Lost synchronization (one todo blocks all)** | Dependency graph documented, parallelization enabled |
| **Mocks leak into production** | Item 07 explicitly removes mocks (separate build/wire) |
| **Tool B breaks WA Sender** | Item 09 validates isolation; Item 10 tests this |
| **Auth isolation silently broken** | Item 10 tests both positive (access granted) and negative (access denied) cases |
| **Deployment fails due to missing piece** | Item 11 has comprehensive pre-deploy checklist |

## Next Steps (User Approval Required)

Once user approves the todo list:
1. **Phase 1** (Items 01-04) can begin immediately (all parallel, no dependencies)
2. **Phase 2** begins after Phase 1 completes
3. **Phase 3** begins after Phase 2 completes
4. **Phase 4** (testing + deployment) is final validation

