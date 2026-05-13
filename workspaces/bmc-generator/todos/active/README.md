# BMC Generator Implementation Todos

**Total Todos:** 14 across 7 phases  
**Critical Path:** 0A → 0B → 1 → 2 → 3 → 4 → 5 → 6  
**Parallelization:** Phase 1 and Phase 2 can overlap (1C must complete before 2 starts)

---

## Phase 0A: Authentication (2 todos)

### Todo 0A1: Create Login Page + Endpoint
**Status:** Complete  
**Spec References:** `specs/authentication.md` § Authentication Flow, Login Page, Login Request  

**Purpose:** Implement simple username/password authentication protecting all BMC generation.

**Deliverables:**
1. Create `/tools/bmc-generator/login` page (GET) with login form UI
2. Create `/api/bmc-generator/login` endpoint (POST) that:
   - Validates username/password against env vars (BMC_GENERATOR_USERNAME, BMC_GENERATOR_PASSWORD)
   - Issues HTTP-only, Secure, SameSite=Lax cookie (bmc_session, 24h TTL)
   - Returns success with redirect OR generic "Invalid credentials" error
   - Enforces rate limiting: 5 failed attempts per IP per 10 min → 429
   - Enforces account lockout: 5 failed attempts per username per 24h → lock for 30 min → return 423
3. Error handling (401, 423, 429) with generic messages (no user enumeration)
4. CSS Module styling (isolated to /tools/bmc-generator/)

**Success Criteria:**
- ✅ Login form renders correctly
- ✅ Valid credentials issue bmc_session cookie
- ✅ Invalid credentials return 401 with generic message
- ✅ Rate limiting returns 429 after 5 IP failures per 10 min
- ✅ Account lockout returns 423 after 5 username failures per 24h
- ✅ Session cookie is HTTP-only, Secure, SameSite=Lax
- ✅ Redirect to /tools/bmc-generator/ on success

**Dependencies:** None (greenfield)  
**Estimated Effort:** 1 session  
**Load-Bearing Logic:** ~150 LOC (rate limiting + lockout tracking)

---

### Todo 0A2: Add Session Validation Middleware + Logout
**Status:** Complete  
**Spec References:** `specs/authentication.md` § Session Management, Logout; `specs/api-orchestration.md` § Session Management & Rate Limiting § Session Timeout Enforcement

**Purpose:** Protect all endpoints, enforce session timeout, implement logout.

**Deliverables:**
1. Create middleware that validates bmc_session cookie on ALL protected routes:
   - Check cookie exists and is valid
   - Check session not expired (>24h old)
   - If invalid/expired: return 401 with redirect to login
   - Reset TTL (sliding window: now() + 24h) on valid requests
2. Create `/api/bmc-generator/logout` endpoint (POST) that:
   - Validates session exists
   - Deletes bmc_session cookie
   - Clears server-side session (if using server-side sessions)
   - Invalidates any in-flight generation for that session
   - Returns 200 with redirect to login
3. Wire middleware to all protected endpoints (/start, /answers, /generate, /stream/status)

**Success Criteria:**
- ✅ Middleware blocks unauthenticated requests with 401
- ✅ Session TTL enforced on every request (24h check)
- ✅ TTL reset (sliding window) on successful requests
- ✅ /logout deletes session and redirects to login
- ✅ In-flight generation abandoned on logout (SSE stream receives session_expired event)
- ✅ All 5 protected endpoints validate session before processing

**Dependencies:** Todo 0A1 (session creation)  
**Estimated Effort:** 1 session  
**Load-Bearing Logic:** ~120 LOC (middleware + logout + timeout enforcement)

---

## Phase 0B: Foundation (2 todos)

### Todo 0B1: Create Folder Structure + Zod Validators
**Status:** ✅ Complete  
**Spec References:** `specs/data-model.md` (all schemas); `specs/isolation-deployment.md` § File Structure

**Purpose:** Establish project structure and validate all data types end-to-end.

**Deliverables:**
1. Create folder structure:
   ```
   app/tools/bmc-generator/
   ├── page.tsx              # Main page component
   ├── login/
   │   └── page.tsx          # Login page
   ├── components/           # UI components (IdeaInputForm, ClarifyingQuestionsForm, etc.)
   ├── lib/
   │   ├── validators.ts     # Zod schemas (copy from specs/data-model.md)
   │   ├── types.ts          # TypeScript types (inferred from Zod)
   │   ├── cost-tracker.ts   # Cost tracking logic
   │   ├── api-client.ts     # HTTP client wrapper
   │   ├── sse-manager.ts    # SSE event handling
   │   └── utils.ts          # Utilities
   ├── hooks/                # React hooks (useGenerationState, useSSEListener, etc.)
   ├── __tests__/            # Integration tests
   └── styles/               # CSS Modules (*.module.css only)
   ```
2. Implement Zod validators for all data types:
   - `BusinessContextSchema` (Phase 1 output)
   - `BMCSectionSchema` (Phase 2 outputs, 9 sections)
   - `CritiqueOutputSchema` (Phase 3 outputs, 3 critiques)
   - `FinalBMCSchema` (Phase 4 output)
   - `AgentStatusSchema` (SSE events)
   - `CostTrackerSchema` (cost tracking metadata)
3. Export TypeScript types inferred from schemas
4. Ensure strict validation (rejectUnknownKeys, coerce disabled)

**Success Criteria:**
- ✅ Folder structure created with proper isolation
- ✅ All Zod validators defined and exported
- ✅ TypeScript types inferred from schemas (type-safe)
- ✅ Validators enforce all bounds (min/max, enums, arrays)
- ✅ CSS Modules only (no Tailwind, no global CSS)
- ✅ No imports from app/components, app/hooks, app/styles

**Dependencies:** None (greenfield)  
**Estimated Effort:** 1 session  
**Load-Bearing Logic:** ~200 LOC (folder structure + 6 Zod schemas)

---

### Todo 0B2: Implement CostTracker + API Client + SSE Manager
**Status:** ✅ Complete  
**Spec References:** `specs/cost-performance.md` § Cost Model; `specs/api-orchestration.md` § GET /stream/status; `rules/infrastructure-specialist.md`

**Purpose:** Create utility classes for cost tracking, API communication, and real-time event streaming.

**Deliverables:**
1. **CostTracker class:**
   - Track input/output tokens per phase
   - Calculate cost in real-time (Haiku pricing: $0.80/1M input, $4.00/1M output)
   - Expose getters: totalCost(), totalTokens(), costByPhase()
   - Log token usage with timestamps
2. **API Client wrapper:**
   - POST /api/bmc-generator/start (idea) → session_id, questions
   - POST /api/bmc-generator/answers (session_id, answers, generation_token) → BusinessContext
   - POST /api/bmc-generator/generate (session_id, generation_token, context) → FinalBMC or partial
   - GET /api/bmc-generator/stream/status (session_id) → SSE stream
   - POST /api/bmc-generator/logout → redirect
   - Handle all error cases (401, 403, 404, 409, 429, 500)
3. **SSE Manager class:**
   - Connect to EventSource
   - Parse AgentStatus events
   - Handle heartbeat (keepalive)
   - Detect session_expired event
   - Implement auto-reconnect with lastEventId replay (last 100 events)
   - Emit "progress" | "heartbeat" | "error" | "complete" events to listeners

**Success Criteria:**
- ✅ CostTracker calculates costs correctly (Haiku pricing)
- ✅ API Client wraps all 6 endpoints
- ✅ Error handling returns typed responses (not raw HTTP errors)
- ✅ SSE Manager auto-reconnects with event replay
- ✅ All classes use proper error handling (no throw without context)

**Dependencies:** Todo 0B1 (validators, types)  
**Estimated Effort:** 1 session  
**Load-Bearing Logic:** ~250 LOC (CostTracker + API client + SSE manager)

---

## Phase 1: Context Gathering (3 todos)

### Todo 1A: Implement IdeaInputForm + /start Endpoint
**Status:** Pending  
**Spec References:** `specs/ui-ux-flow.md` § Phase 1A; `specs/api-orchestration.md` § POST /start; `specs/agents.md` § OrchestratorAgent

**Purpose:** Allow user to input business idea and receive clarifying questions.

**Deliverables:**
1. **Frontend: IdeaInputForm component**
   - Textarea input (50-500 chars validation)
   - Character counter (aria-live="polite")
   - Submit button (disabled when <50 or >500 chars)
   - Loading state (spinner on submit)
   - Error display (generic messages)
   - Accessibility: labels, aria-label, proper focus management
2. **Backend: POST /api/bmc-generator/start endpoint**
   - Validate idea length (50-500 chars)
   - Validate session exists (bmc_session cookie)
   - Validate rate limits (5 /start per IP per min, 1 concurrent per session, 20 per day per session)
   - Call OrchestratorAgent(mode='generate_questions', idea)
   - Parse output as string[] (3-5 questions)
   - Initialize CostTracker, record Phase 1A tokens
   - Generate generation_token (CSRF), bind to session_id
   - Start SSE stream for session_id
   - Return { session_id, questions, generation_token, estimated_cost, estimated_latency_seconds }
3. **Error Handling:**
   - 400: Idea length invalid
   - 401: Unauthenticated (no session)
   - 409: Concurrent generation already running for this session
   - 429: Rate limit exceeded (too many /start calls)
   - 500: OrchestratorAgent failed (return fallback questions)

**Success Criteria:**
- ✅ Form renders and validates input
- ✅ POST /start returns questions within 5s
- ✅ CSRF generation_token generated and bound to session_id
- ✅ SSE stream starts on successful /start
- ✅ Rate limits enforced (per-IP, per-session-per-day, concurrent)
- ✅ Error responses generic (no data leakage)

**Dependencies:** Phase 0A (authentication), Phase 0B (validators, API client)  
**Estimated Effort:** 1 session  
**Load-Bearing Logic:** ~180 LOC (endpoint + OrchestratorAgent call + rate limit checks)

---

### Todo 1B: Implement ClarifyingQuestionsForm + /answers Endpoint
**Status:** Pending  
**Spec References:** `specs/ui-ux-flow.md` § Phase 1B; `specs/api-orchestration.md` § POST /answers; `specs/agents.md` § OrchestratorAgent

**Purpose:** User answers questions; system normalizes into BusinessContext for Phase 2.

**Deliverables:**
1. **Frontend: ClarifyingQuestionsForm component**
   - Display questions from /start response
   - Dynamic input fields (required/optional marked)
   - Validation: each answer 10-500 chars (required) or empty (optional)
   - Back button (discard answers, return to Phase 1A)
   - Continue button (submit answers)
   - Error handling (validation feedback per field)
   - Accessibility: labels, aria-required, proper form semantics
2. **Backend: POST /api/bmc-generator/answers endpoint**
   - Validate session exists
   - Validate generation_token (must be fresh, not used before, not expired)
   - Validate answers: required answers must be 10-500 chars, optional can be empty
   - Call OrchestratorAgent(mode='normalize_answers', idea, questions, answers)
   - Parse output into Zod BusinessContext (strict validation, reject on parse error)
   - Record Phase 1B tokens
   - Mark generation_token as "used" (one-time only, now consumed)
   - Store context in session (sessionStorage on client, optional server-side cache)
   - Return { session_id, context, next_action: "start_generation" }
3. **Error Handling:**
   - 400: Invalid answers (required empty, too long, etc.)
   - 401: Unauthenticated
   - 403: Invalid/expired/already-used generation_token
   - 404: Session not found
   - 500: OrchestratorAgent failed

**Success Criteria:**
- ✅ Form displays questions and validates answers
- ✅ POST /answers validates generation_token (fresh, bound to session)
- ✅ Token marked as "used" (second /answers call rejects with 403)
   - ✅ BusinessContext validated with Zod (all 8 fields correct)
- ✅ Context stored in sessionStorage (survives page refresh)
- ✅ Error messages generic (no token/session/user enumeration)

**Dependencies:** Todo 1A (session exists, token generated)  
**Estimated Effort:** 1 session  
**Load-Bearing Logic:** ~170 LOC (endpoint + OrchestratorAgent call + token validation)

---

### Todo 1C: Implement GenerationStatusPanel + SSE Listener Hook
**Status:** Pending  
**Spec References:** `specs/ui-ux-flow.md` § GenerationStatusPanel; `specs/api-orchestration.md` § GET /stream/status; `specs/cost-performance.md` § Latency Goals

**Purpose:** Display real-time progress during Phases 2-4 generation.

**Deliverables:**
1. **Frontend: GenerationStatusPanel component**
   - Display 4 phase progress bars (Phase 1 fixed 100%, Phase 2-4 dynamic)
   - Show active agent name (updated via SSE)
   - Show elapsed time and estimated remaining time
   - Show cost so far (green/yellow/red based on budget)
   - Message "Do not refresh or leave this page" 
   - Error display if generation fails
   - Responsive layout (full-width on mobile)
2. **Frontend: useSSEListener hook**
   - Subscribe to EventSource(/api/bmc-generator/stream/status?session_id=X&resumeFrom=Y)
   - Listen for "progress" | "heartbeat" | "error" | "complete" events
   - Parse AgentStatus JSON
   - Update component state (phase, activeAgent, progress%, cost, elapsed)
   - Handle session_expired event (redirect to login)
   - Auto-reconnect on disconnect (store lastEventId in localStorage, replay from it)
   - Debounce updates (at most every 500ms)
3. **Integration:**
   - Wire into main generation flow
   - Display during /answers response (Phases 2-4)
   - Hide when complete or error

**Success Criteria:**
- ✅ Progress bars update in real-time from SSE stream
- ✅ Active agent displayed (updated every agent completion)
- ✅ Cost updated in real-time (green/yellow/red threshold)
- ✅ Elapsed time and estimated remaining shown
- ✅ SSE auto-reconnects on disconnect (no user action needed)
- ✅ Event replay prevents missed updates on reconnect
- ✅ session_expired event handled (redirect to login)
- ✅ Debounce prevents excessive re-renders (≤500ms updates)

**Dependencies:** Todo 1A/1B (generation_token, session started)  
**Estimated Effort:** 1 session  
**Load-Bearing Logic:** ~180 LOC (SSE hook + component + auto-reconnect)

---

## Phase 2: BMC Generation (2 todos)

### Todo 2A: Implement 9 BMC Agent Prompts + /generate Orchestration (Phase 2)
**Status:** Pending  
**Spec References:** `specs/agents.md` § Phase 2 Agents (all 9); `specs/api-orchestration.md` § Phase 2 orchestration; `specs/cost-performance.md` § Phase 2 budgets

**Purpose:** Execute 9 BMC agents in parallel, validate sections, collect results.

**Deliverables:**
1. **Implement 9 system prompts** (copy from specs/agents.md):
   - CustomerSegmentsAgent
   - ValuePropositionsAgent
   - ChannelsAgent
   - CustomerRelationshipsAgent
   - RevenueStreamsAgent
   - KeyResourcesAgent
   - KeyActivitiesAgent
   - KeyPartnersAgent
   - CostStructureAgent
   - Each includes: delimeter-based prompt injection prevention, expected output format (JSON with points[], reasoning, assumptions[], confidence_level)
2. **POST /api/bmc-generator/generate endpoint — Phase 2 section**
   - Extract from /generate request: session_id, generation_token (fresh, not used), BusinessContext
   - Validate generation_token (must be unused, not expired)
   - Validate per-session rate limits (1 concurrent, 20 per day)
   - Initialize timeout tracking (startTime = now(), hardTimeout = 120s)
   - Start SSE events (mark Phase 2 as in_progress)
   - Execute Phase 2: Promise.allSettled() for all 9 agents (parallel)
     - Each agent gets 30s timeout
     - At 40s mark: skip any pending agents
     - At 45s mark: abort any remaining agents
     - On each completion: emit SSE AgentStatus event
     - Validate output as BMCSection[] (Zod strict)
   - Check ≥6 agents succeeded; if <6: abort to Tier 3 fallback (return partial response)
   - Record Phase 2 tokens and cost
   - Mark generation_token as "consumed" (second /generate rejects with 403)
   - Continue to Phase 3 (if time remains)

**Success Criteria:**
- ✅ All 9 agent prompts specced with delimiter protection
- ✅ Phase 2 orchestration executes agents in parallel
- ✅ Per-agent 30s timeout enforced
- ✅ Skip logic at 40s mark (if running out of time)
- ✅ Validation rejects malformed JSON
- ✅ <6 agents → abort to Tier 3 fallback
- ✅ ≥6 agents → sections passed to Phase 3
- ✅ SSE events emitted per agent completion
- ✅ Cost tracked per agent

**Dependencies:** Todo 1B (BusinessContext ready), Todo 1C (SSE stream active)  
**Estimated Effort:** 2 sessions (1 for 9 prompts, 1 for orchestration + validation)  
**Load-Bearing Logic:** ~300 LOC (orchestration + Promise.allSettled + timeout skip logic + Zod validation)

---

### Todo 2B: Wire BMC Agents to Generate Endpoint (Test Phase 2 End-to-End)
**Status:** Pending  
**Spec References:** `specs/agents.md` § Phase 2; `specs/data-model.md` § BMCSection validation

**Purpose:** Integration test for Phase 2 — verify agents produce valid BMCSections.

**Deliverables:**
1. **Create integration test:**
   - POST /generate with valid BusinessContext
   - Verify all 9 agents execute
   - Verify BMCSection[] outputs match Zod schema
   - Verify timeout boundary behavior (simulate slow agents)
   - Verify <6 agents triggers Tier 3 fallback
2. **Manual test:**
   - Generate BMC for sample business idea
   - Verify 9 sections produced
   - Verify each section has points[], reasoning, assumptions, confidence_level

**Success Criteria:**
- ✅ Integration test passes (9 agents produce valid sections)
- ✅ Timeout boundary test passes (<6 agents → fallback)
- ✅ Manual test produces reasonable BMC sections
- ✅ All sections validate against Zod schema

**Dependencies:** Todo 2A (Phase 2 endpoint complete)  
**Estimated Effort:** 1 session (test writing + execution)  
**Load-Bearing Logic:** ~80 LOC (test fixtures + assertions)

---

## Phase 3: Critique & Synthesis (2 todos)

### Todo 3A: Implement 3 Critique + Synthesis Agent Prompts + /generate Orchestration (Phase 3-4)
**Status:** Pending  
**Spec References:** `specs/agents.md` § Phase 3 Agents + SynthesisAgent; `specs/api-orchestration.md` § Phase 3-4 orchestration

**Purpose:** Run critique agents, merge results, synthesize final BMC.

**Deliverables:**
1. **Implement 3 critique agent prompts** (from specs/agents.md):
   - MarketFeasibilityAgent (validates market opportunity)
   - BusinessModelAgent (critiques financial viability)
   - CompetitivePositioningAgent (challenges differentiation)
   - Each outputs: findings[], overall_assessment
2. **Implement SynthesisAgent prompt** (from specs/agents.md):
   - Takes 9 BMCSections + 3 CritiqueOutputs + BusinessContext
   - Outputs: executive_summary, canvas (9 fields), critique_summary, strategic_recommendations, next_steps
   - Merges critiques into final output
3. **POST /api/bmc-generator/generate endpoint — Phase 3-4 section**
   - Validate time remaining (if <30s: skip Phase 3, go to Phase 4)
   - Phase 3: Execute 3 critique agents in parallel
     - Each gets 15s timeout
     - At 20s mark: skip pending agents
     - Validate CritiqueOutput[] (Zod strict)
   - Phase 4: Execute SynthesisAgent
     - Gets 15s timeout (but if timeRemaining <20s: use Tier 3 fallback instead)
     - Validates FinalBMC output
     - Returns full FinalBMC or Tier 3 fallback (partial)
   - Record Phase 3-4 tokens and cost
   - Return { status: "complete"/"partial"/"failed", final_bmc, cost, wallClockMs }

**Success Criteria:**
- ✅ Critique agents produce valid CritiqueOutput[]
- ✅ SynthesisAgent merges sections + critiques → FinalBMC
- ✅ Phase 3 skipped if <30s time remaining
- ✅ Phase 4 uses Tier 3 fallback if <20s time remaining
- ✅ FinalBMC validates all 9 canvas fields + critique + recommendations + next steps
- ✅ Partial response structure matches spec (completion, sections with source/"fallback" status)

**Dependencies:** Todo 2A/2B (Phase 2 sections ready)  
**Estimated Effort:** 2 sessions (1 for 4 prompts, 1 for orchestration + synthesis)  
**Load-Bearing Logic:** ~280 LOC (orchestration + timeout boundary logic + Tier 3 fallback)

---

### Todo 3B: Wire Critique & Synthesis to Generate Endpoint (Test Phase 3-4 End-to-End)
**Status:** Pending  
**Spec References:** `specs/data-model.md` § CritiqueOutput, FinalBMC; `specs/api-orchestration.md` § Tier 3 fallback

**Purpose:** Integration test for Phases 3-4 — verify critique & synthesis work correctly.

**Deliverables:**
1. **Integration test:**
   - POST /generate with Phase 2 sections ready
   - Verify 3 critique agents execute
   - Verify SynthesisAgent produces FinalBMC
   - Verify FinalBMC validates (all 9 canvas fields, critique_summary, recommendations, next_steps)
   - Verify Tier 3 fallback triggered if <6 sections OR synthesis timeout
2. **Manual test:**
   - Generate full BMC end-to-end
   - Verify critique + synthesis produce reasonable output
   - Verify timeout handling shows partial results

**Success Criteria:**
- ✅ Integration test passes (critique + synthesis work end-to-end)
- ✅ Tier 3 fallback test passes (partial output on timeout)
- ✅ Manual test produces complete BMC with critiques + recommendations
- ✅ FinalBMC schema validates correctly

**Dependencies:** Todo 3A (Phase 3-4 endpoint complete)  
**Estimated Effort:** 1 session (test writing + execution)  
**Load-Bearing Logic:** ~80 LOC (test fixtures + assertions)

---

## Phase 4: Output Display (1 todo)

### Todo 4A: Implement BMC Canvas + Critique + Recommendations Display
**Status:** Pending  
**Spec References:** `specs/ui-ux-flow.md` § Phase 4 Display Components; `specs/data-model.md` § FinalBMC

**Purpose:** Render final BMC, critique summary, and recommendations to user.

**Deliverables:**
1. **BMCCanvasDisplay component:**
   - Render 9-section canvas as markdown table (3x3 grid)
   - Handle full completion (all sections green)
   - Handle partial completion (skipped sections gray with diagonal stripes + "[Section unavailable]" message)
   - Handle agent-only fallback (raw markdown blocks instead of table)
   - Copy button → copy canvas as markdown
   - Download button → save as PDF (client-side html2pdf.js)
   - Share button → copy shareable URL or shareable text
   - Responsive: desktop (side-by-side with critique), tablet (stacked), mobile (single column)
   - Accessibility: semantic HTML, ARIA labels
2. **CritiqueSummary component:**
   - Display critiques grouped by severity (HIGH/MEDIUM/STRENGTH)
   - Icons: 🔴 (HIGH), 🟡 (MEDIUM), ✅ (STRENGTH)
   - Max 5 items per category
   - Accessibility: aria-labels for icons
3. **RecommendationsPanel component:**
   - Display strategic_recommendations[] (array of strings)
   - Display next_steps[] (checklist of actions)
   - Checkboxes for next steps (client-side state, not persisted)
   - Accessibility: labels, proper list semantics
4. **Main page integration:**
   - Show/hide canvas during generation (show GenerationStatusPanel while in progress)
   - Show BMC + Critique + Recommendations when complete
   - Show error message and retry button on failure
   - Show partial results and "Retry" button on timeout

**Success Criteria:**
- ✅ Full BMC displays correctly (9 sections in 3x3 table)
- ✅ Partial BMC displays (skipped sections marked, gray background)
- ✅ Agent-only fallback displays (markdown blocks)
- ✅ Copy to clipboard copies full canvas markdown
- ✅ PDF download works (client-side html2pdf.js)
- ✅ Critique grouped by severity with correct icons
- ✅ Recommendations show next steps as checklist
- ✅ Responsive layout works on mobile/tablet/desktop
- ✅ Accessibility: ARIA labels, semantic HTML

**Dependencies:** Todo 3A/3B (FinalBMC output ready)  
**Estimated Effort:** 2 sessions (1 for components, 1 for styling + responsive layout + accessibility)  
**Load-Bearing Logic:** ~250 LOC (3 components + responsive + accessibility)

---

## Phase 5: Error Handling (1 todo)

### Todo 5A: Implement Error Boundaries + Fallbacks + Logging
**Status:** Pending  
**Spec References:** `specs/api-orchestration.md` § Error Handling (all endpoints); `rules/zero-tolerance.md`

**Purpose:** Graceful error handling, user-friendly messages, logging for debugging.

**Deliverables:**
1. **Frontend error boundary:**
   - Catch React component errors during rendering
   - Display fallback UI (error message + retry button)
   - Log error details for debugging
2. **API error handling:**
   - Wrap all API calls with try/catch
   - Convert HTTP errors to typed responses (statusCode, error, message)
   - Generic messages (no internal state exposed)
   - Specific handling per status code (401 → redirect to login, 429 → show rate limit message, 500 → show generic error)
3. **Timeout handling:**
   - Tier 3 fallback for generation timeouts (show partial BMC)
   - SSE timeout → show "Generation taking longer..." message
   - Agent timeout → show "[Section unavailable]" message
4. **Logging:**
   - Server-side: log all errors with timestamp, session_id (no sensitive data)
   - Client-side: log to console (development only)
   - Structured logging format (JSON)

**Success Criteria:**
- ✅ Component errors don't crash the page (fallback UI shown)
- ✅ API errors caught and displayed with generic messages
- ✅ 401 errors redirect to login
- ✅ 429 errors show rate limit message
- ✅ 500 errors show generic "Something went wrong" message
- ✅ Timeout handling shows Tier 3 fallback (partial BMC)
- ✅ Logging captures errors with session_id (no user data)
- ✅ No sensitive data exposed in error messages

**Dependencies:** All prior phases (error handling added to all endpoints)  
**Estimated Effort:** 1 session  
**Load-Bearing Logic:** ~120 LOC (error boundary + try/catch wrapper + logging)

---

## Phase 6: Optimization (1 todo)

### Todo 6A: Load Testing + Cost Verification + Responsive Polish
**Status:** Pending  
**Spec References:** `specs/cost-performance.md` § Performance Targets, Cost Verification; `specs/ui-ux-flow.md` § Responsive Behavior

**Purpose:** Verify latency targets, cost tracking accuracy, responsive design on all devices.

**Deliverables:**
1. **Load testing:**
   - Test generation with sample business ideas
   - Measure wall-clock latency (target: <120s with graceful fallback)
   - Measure per-phase latencies (Phase 1: <10s, Phase 2: <45s, Phase 3: <25s, Phase 4: <15s)
   - Verify timeout boundaries (skip agents at 40s in Phase 2, at 20s in Phase 3)
2. **Cost verification:**
   - Generate BMC and verify actual cost matches Zod CostTracker calculation
   - Verify cost displayed to user matches actual cost
   - Verify Tier 3 partial completions charge only actual cost (not budget)
3. **Responsive design testing:**
   - Test on mobile (<600px): single column layout, readable text
   - Test on tablet (600-1200px): 2-column layout
   - Test on desktop (>1200px): 3-column layout with sidebar
   - Verify no horizontal scroll, no text overflow
   - Verify touch targets ≥44px on mobile
4. **Browser compatibility:**
   - Test on Chrome, Firefox, Safari
   - Test SSE support (auto-reconnect works on all browsers)

**Success Criteria:**
- ✅ Generation completes in <120s (or returns partial at 120s)
- ✅ Per-phase latencies within targets (Phase 1 <10s, Phase 2 <45s, etc.)
- ✅ Cost calculation matches expected (Haiku pricing)
- ✅ Partial generation costs match actual tokens used
- ✅ Responsive layout works on mobile/tablet/desktop (no horizontal scroll)
- ✅ Touch targets sufficient on mobile (≥44px)
- ✅ SSE works on Chrome/Firefox/Safari

**Dependencies:** All prior phases complete  
**Estimated Effort:** 1 session (manual testing + measurement + adjustments)

---

## Summary Table

| Todo | Phase | Title | Effort | LOC | Spec Refs |
|------|-------|-------|--------|-----|-----------|
| 0A1 | 0A | Login Page + Endpoint | 1 sess | 150 | auth.md |
| 0A2 | 0A | Session Validation Middleware | 1 sess | 120 | auth.md, api-orch.md |
| 0B1 | 0B | Folder Structure + Validators | 1 sess | 200 | data-model.md, isolation.md |
| 0B2 | 0B | CostTracker + API Client + SSE | 1 sess | 250 | cost-perf.md, api-orch.md |
| 1A | 1 | IdeaInputForm + /start | 1 sess | 180 | ui-ux.md, api-orch.md |
| 1B | 1 | ClarifyingQuestionsForm + /answers | 1 sess | 170 | ui-ux.md, api-orch.md |
| 1C | 1 | GenerationStatusPanel + SSE Hook | 1 sess | 180 | ui-ux.md, api-orch.md |
| 2A | 2 | 9 BMC Agents + /generate Phase 2 | 2 sess | 300 | agents.md, cost-perf.md |
| 2B | 2 | Test Phase 2 | 1 sess | 80 | data-model.md |
| 3A | 3 | 3 Critique + Synthesis + /generate Phase 3-4 | 2 sess | 280 | agents.md, api-orch.md |
| 3B | 3 | Test Phase 3-4 | 1 sess | 80 | data-model.md |
| 4A | 4 | BMC Canvas + Critique + Recommendations | 2 sess | 250 | ui-ux.md, data-model.md |
| 5A | 5 | Error Boundaries + Logging | 1 sess | 120 | api-orch.md |
| 6A | 6 | Load Testing + Cost Verification | 1 sess | — | cost-perf.md |

**Total:** 18 sessions (≈3.6 weeks autonomous execution), ~2,080 LOC load-bearing logic

---

## Capacity Budget Verification

Each todo fits within per-session limits:

| Metric | Limit | Usage | Status |
|--------|-------|-------|--------|
| Load-bearing LOC | ≤500 | 300 max (2A) | ✅ OK |
| Invariants | ≤10 | 8 max (api orchestration) | ✅ OK |
| Call-graph hops | ≤4 | 3 max (OrchestratorAgent → Zod → CostTracker) | ✅ OK |
| Describable in 3 sentences | Yes | All todos | ✅ OK |

---

## Critical Dependencies

```
0A (Auth) ↓
0B (Foundation) ↓
1A (Questions) ↓
1B (Answers) ↓
1C (SSE) ↓
2A/2B (Generation) ↓
3A/3B (Critique) ↓
4A (Display) ↓
5A (Error Handling) ↓
6A (Testing)
```

**No parallelization possible** — each phase depends on prior phase.

---

**Status:** Ready for human approval before proceeding to `/implement`.
