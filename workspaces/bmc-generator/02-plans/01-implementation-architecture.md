# BMC Generator — Implementation Architecture Plan

Strategic decomposition of the analysis into phased implementation work.

## Overview

The BMC Generator implementation follows a 6-phase approach:

1. **Phase 0 — Foundation** (Core infrastructure, no user-facing features)
2. **Phase 1 — Context Gathering** (User input + clarifying questions)
3. **Phase 2 — BMC Generation** (Parallel agent execution)
4. **Phase 3 — Critique & Synthesis** (Red team validation + final output)
5. **Phase 4 — Polish & Optimization** (Error handling, latency tuning)
6. **Phase 5 — Deployment & Monitoring** (Production readiness)

---

## Critical Path

```
Phase 0 (Foundation)
  ↓
Phase 1 (User Input) ← Can build independently
  ↓
Phase 2 (BMC Agents) ← Can parallelize with Phase 1B
  ↓
Phase 3 (Critique + Synthesis)
  ↓
Phase 4 (Polish)
  ↓
Phase 5 (Launch)
```

**Critical dependencies:**
- Phase 0 blocks everything (must define types, cost tracker, validators)
- Phase 1 blocks Phase 2 (context object is Phase 2's input)
- Phase 3 depends on Phase 2 completion (critique operates on BMC sections)
- Phase 4 is optimization-only (can run in parallel with Phase 3)

---

## Key Architectural Decisions

### Decision 1: SSE for Real-Time Status (Not WebSocket)

**Rationale:**
- Simpler server implementation (one-way stream)
- Lower overhead (no bidirectional handshake)
- Sufficient for status updates (no real-time user input needed during generation)
- Browser support excellent, no polyfills needed

**Alternative rejected:** WebSocket (unnecessary complexity, bi-directionality not used)

---

### Decision 2: Promise.allSettled() for Agent Orchestration

**Rationale:**
- Graceful degradation (1 failing agent doesn't kill entire phase)
- Error isolation (each agent's failure tracked independently)
- Performance (all agents run in parallel, not sequential fallback)

**Alternative rejected:** Promise.all() (too strict, would abort on first agent failure)

---

### Decision 3: Client-Side sessionStorage, No Persistent Database

**Rationale:**
- Simpler deployment (no database schema, migrations, or persistence layer)
- Meets brief requirement (tool is deletable without infrastructure debt)
- sessionStorage survives page refresh (sufficient UX)
- Cost predictable (no query costs)

**Trade-off:** User loses history on browser close. Future iteration can add opt-in persistence.

---

### Decision 4: Strict Zod Validation, Reject Bad Agent Output

**Rationale:**
- Prevents downstream hallucinations (phase 3 critique operates on validated data)
- Clear error signals (validates before synthesis, not after)
- Composable (each phase's output is validated before feeding into next phase)

**Alternative rejected:** Lenient parsing + coercion (hides agent errors, makes debugging hard)

---

## Implementation Order (Phase Breakdown)

### Phase 0 — Foundation (2 todos)

**Goal:** Infrastructure. No user-facing features.

**Deliverables:**
1. Folder structure, CSS modules baseline
2. Zod validators (copied from specs/data-model.md)
3. TypeScript types (local copy of specs)
4. CostTracker class implementation
5. API client wrapper for /api/bmc-generator/* endpoints
6. SSE event manager for status streaming

**Dependencies:** None (greenfield work)

**Estimated Effort:** 1 session

---

### Phase 1A — Context Gathering: Questions (2 todos)

**Goal:** User submits business idea, system generates clarifying questions.

**Deliverables:**
1. `/api/bmc-generator/start` endpoint (OrchestratorAgent in generate_questions mode)
2. `<IdeaInputForm />` component (textarea, char counter, submit button)
3. Questions display (read-only, for reference)
4. Client-side integration (form submission → API call → questions display)

**Dependencies:** Phase 0 (types, validators)

**Estimated Effort:** 1 session

---

### Phase 1B — Context Gathering: Normalization (2 todos)

**Goal:** User answers questions, system normalizes into BusinessContext.

**Deliverables:**
1. `<ClarifyingQuestionsForm />` component (dynamic question inputs)
2. `/api/bmc-generator/answers` endpoint (OrchestratorAgent in normalize_answers mode)
3. Input validation (Zod validation against BusinessContext schema)
4. Client-side state management (useGenerationState hook)

**Dependencies:** Phase 0, Phase 1A

**Estimated Effort:** 1 session

---

### Phase 1C — Real-Time Status Stream (1 todo)

**Goal:** Establish SSE stream for real-time progress during phases 2-4.

**Deliverables:**
1. `<GenerationStatusPanel />` component (progress bar, active agent display, cost tracking)
2. `useSSEListener` hook (subscribes to /api/bmc-generator/stream/status)
3. SSE event handler logic (updates phase progress, emits cost)
4. Frontend integration (listen to stream, update UI in real-time)

**Dependencies:** Phase 0, Phase 1A/B (session_id generation)

**Estimated Effort:** 1 session

---

### Phase 2 — BMC Generation (3 todos)

**Goal:** Execute 9 BMC agents in parallel, validate output, collect results.

**Deliverables:**
1. System prompts for all 9 BMC agents (from specs/agents.md)
2. `/api/bmc-generator/generate` endpoint (Phase 2 orchestration)
3. Phase 2 orchestration logic (Promise.allSettled, per-agent timeouts, status broadcasting)
4. `BMCSection` output validation (Zod against schema)
5. Error isolation (failed agents marked, non-blocking phase progression)

**Dependencies:** Phase 0, Phase 1B, Phase 1C

**Estimated Effort:** 2 sessions (1 for endpoint, 1 for 9 agent prompts + orchestration)

---

### Phase 3 — Critique & Synthesis (2 todos)

**Goal:** Run 3 critique agents, merge results, synthesize final BMC.

**Deliverables:**
1. System prompts for 3 critique agents (from specs/agents.md)
2. Phase 3 orchestration in `/api/bmc-generator/generate` (follows Phase 2)
3. `CritiqueOutput` validation (Zod)
4. `SynthesisAgent` system prompt and execution
5. `FinalBMC` output validation (Zod)
6. Merge logic (incorporate critiques into final BMC)

**Dependencies:** Phase 2

**Estimated Effort:** 2 sessions

---

### Phase 4 — Output Display (2 todos)

**Goal:** Render final BMC to user in professional format.

**Deliverables:**
1. `<BMCCanvasDisplay />` component (9x markdown table rendering)
2. `<CritiqueSummary />` component (high/medium/low risk visualization)
3. `<RecommendationsPanel />` component (strategic recommendations + next steps checklist)
4. Copy-to-clipboard feature (canvas as markdown)
5. Responsive layout (mobile, tablet, desktop)

**Dependencies:** Phase 3 (FinalBMC output)

**Estimated Effort:** 1 session

---

### Phase 5 — Error Handling & Polish (2 todos)

**Goal:** Graceful degradation, clear error messaging, user feedback.

**Deliverables:**
1. `<ErrorBoundary />` component (catches crashes, shows fallback UI)
2. Phase-specific error handlers (Phase 1 → 4)
3. Fallback BMC rendering (Phase 2 output if synthesis fails)
4. Session cleanup on error (delete session, allow restart)
5. Error logging & debugging (debug mode, session log download)
6. Loading states & messaging (per-phase loading text)

**Dependencies:** All prior phases

**Estimated Effort:** 1 session

---

### Phase 6 — Optimization & Monitoring (1 todo)

**Goal:** Verify latency targets, cost accuracy, responsive design.

**Deliverables:**
1. Load testing (simulate realistic ideas, measure Phase 2 latency)
2. Cost verification (actual tokens vs estimates, adjust if >10% variance)
3. Responsive design verification (mobile, tablet, desktop)
4. Performance monitoring setup (log metrics for future tuning)
5. UX polish (button states, animations, loading spinners)

**Dependencies:** All prior phases

**Estimated Effort:** 1 session

---

## Todo Decomposition Table

| Phase | Todo ID | Deliverable | Session | Dependencies |
|-------|---------|-------------|---------|--------------|
| 0 | 0001 | Foundation (types, validators, CostTracker) | 1 | None |
| 1A | 1001 | IdeaInputForm + /start endpoint | 1 | 0001 |
| 1B | 1002 | ClarifyingQuestionsForm + /answers endpoint | 1 | 0001, 1001 |
| 1C | 1003 | GenerationStatusPanel + SSE listener | 1 | 0001, 1001 |
| 2 | 2001 | /generate endpoint + Phase 2 orchestration | 1 | 0001, 1002, 1003 |
| 2 | 2002 | 9 BMC agent prompts + validation | 1 | 2001 |
| 3 | 3001 | Phase 3 orchestration + SynthesisAgent | 1 | 2002 |
| 3 | 3002 | FinalBMC validation + merge logic | 1 | 3001 |
| 4 | 4001 | BMC Canvas, Critique, Recommendations displays | 1 | 3002 |
| 5 | 5001 | Error boundaries, fallbacks, logging | 1 | 4001 |
| 6 | 6001 | Load testing, optimization, monitoring | 1 | 5001 |
| **Total** | — | 11 todos across 6 phases | ~10-11 sessions | — |

---

## Session Parallelization Opportunities

**Cannot parallelize:**
- Phase 1B depends on Phase 1A (context comes from questions)
- Phase 2 depends on Phase 1B (needs BusinessContext)
- Phase 3 depends on Phase 2 (needs BMC sections)
- Phase 4 depends on Phase 3 (needs FinalBMC)

**Can parallelize (optional):**
- Phase 0 can run solo (no dependencies)
- Phase 1A/1B can have parallel component polish (though sequential is cleaner)
- Phase 5 (error handling) can run in parallel with Phase 4 (display polish)

**Recommendation:** Sequential flow for clarity. Phases take ~1 session each. Total ~10-11 sessions.

---

## Risk Mitigation

### Risk 1: OrchestratorAgent Hallucination
**Mitigation:** Strict Zod validation on normalize_answers output. Reject malformed context, show error, allow retry.

### Risk 2: Phase 2 Agent Timeouts
**Mitigation:** Per-agent 30s timeout. If <6 agents complete, abort with error. If 6-8 agents complete, proceed with partial BMC.

### Risk 3: Cost Overrun
**Mitigation:** Real-time cost tracking displayed to user. Cap at $0.05 (user approved). If exceeded, log incident, absorb cost.

### Risk 4: SSE Connection Loss
**Mitigation:** Auto-reconnect every 2s. Show "Connection lost, retrying..." User can still see generation complete after reconnect.

### Risk 5: Phase 3 All Agents Fail
**Mitigation:** Non-blocking failure. Skip critique section, render BMC without critique summary, proceed to output.

---

## Success Criteria

Each phase is considered complete when:

**Phase 0:** Validator tests pass, CostTracker arithmetic correct, API client functional
**Phase 1A/B:** User can input idea + answers, context generated, validation passes
**Phase 1C:** SSE stream emits events, frontend receives and displays progress
**Phase 2:** 9 agents execute in parallel, sections collected, <1 failure tolerance
**Phase 3:** Critiques generated, synthesis combines all inputs, FinalBMC validates
**Phase 4:** Canvas renders correctly on desktop/tablet/mobile, responsive design verified
**Phase 5:** Errors caught gracefully, user can retry, no unhandled exceptions
**Phase 6:** Latency <90s verified, cost <$0.05 verified, responsive confirmed

---

## Technology Stack

- **Frontend Framework:** Next.js (App Router)
- **Styling:** CSS Modules (no Tailwind, no shared CSS)
- **Validation:** Zod
- **API Client:** Fetch (built-in)
- **Real-Time:** Server-Sent Events (SSE, built-in)
- **State Management:** React hooks (useState, useContext)
- **Testing:** Jest + React Testing Library
- **Deployment:** Vercel (from main app)

**External Dependencies:** Only Zod (already in project)

---

## Rollout Plan

1. **MVP Ship:** Phases 0-5 complete, cost < $0.05, latency < 90s
2. **Beta:** Share with 10 users, collect feedback on UX/clarity
3. **GA:** Fix critical bugs from beta, deploy to production
4. **Phase 6+:** Monitor usage, optimize, add features (caching, persistence, etc.)
