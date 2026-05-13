# Comprehensive Spec Audit — 20 Gaps Identified (2026-05-12)

**Status:** Audit in progress — identifying and fixing all gaps autonomously

---

## Gap Categories

### Category A: Incomplete Feature Specs (7 gaps)

**A1: Structured Context Object Mismatch**
- Brief specifies 8 fields: industry, customer_type, target_market, business_model, problem, pricing_direction, geography, competitive_landscape, key_assumptions
- Current spec: `api-orchestration.md` doesn't verify this list against what OrchestratorAgent actually collects
- **Fix Required:** Add section to `api-orchestration.md` mapping Orchestrator questions → context fields (1-to-1 mapping)

**A2: Executive Summary Generation**
- Brief requires: "Executive Summary" in output
- Current spec: Not explicitly assigned to any agent
- **Fix Required:** Add to `agents.md` that SynthesisAgent generates executive_summary field in FinalBMC
- **Status:** Check if FinalBMC has executive_summary field in `data-model.md`

**A3: Next Steps Checklist**
- Brief requires: "Suggested Next Steps" in output
- Current spec: Mentioned in `ui-ux-flow.md` but not in `agents.md` (who generates it?)
- **Fix Required:** Add to `agents.md` that SynthesisAgent generates suggested_next_steps (array of actionable items)

**A4: Clarifying Questions Count**
- `api-orchestration.md` says 3-5 questions
- `data-model.md` doesn't have Zod schema for question count validation
- Current spec: No constraint that limits questions to 3-5
- **Fix Required:** Add Zod validation in `data-model.md` for BusinessContext.questions: 3-5 items, each 50-300 chars

**A5: PDF Download Implementation Detail**
- `ui-ux-flow.md` mentions "Download button: Save as PDF"
- Current spec: No implementation guidance (which library? client-side or server-side?)
- **Fix Required:** Add section to `ui-ux-flow.md` specifying PDF generation approach (recommend: client-side html2pdf.js)

**A6: Copy to Clipboard Format**
- `ui-ux-flow.md` mentions copy button but doesn't specify exact format
- **Fix Required:** Add to `ui-ux-flow.md` what gets copied (full markdown table? with critique? with recommendations?)

**A7: Logout Behavior on In-Flight Generation**
- Brief implies auth controls cost
- Current spec: No guidance on what happens if user logs out mid-generation
- **Fix Required:** Add to `api-orchestration.md` that /logout invalidates current session immediately (generation stops if still running)

---

### Category B: Missing Error Handling Specs (4 gaps)

**B1: Unauthenticated Access to Protected Routes**
- Should return 401 but spec doesn't explicitly say what response body contains
- **Fix Required:** Add to `api-orchestration.md` error handling for 401:
  ```json
  { "error": "Unauthorized", "redirect": "/tools/bmc-generator/login" }
  ```

**B2: Expired Session Mid-Generation**
- If user's session expires while generation is running, what happens?
- **Fix Required:** Add to `api-orchestration.md` that SSE stream emits "session_expired" event, client redirects to login, generation is abandoned

**B3: Invalid Generation Token**
- If CSRF token is missing or invalid on `/answers` or `/generate`, what's the response?
- **Fix Required:** Add to `api-orchestration.md` that invalid/missing generation_token returns 403 with message "Invalid or expired generation token"

**B4: Multi-Tab Safety**
- If user opens same generation in 2 tabs, both try to POST /answers with same questions, what happens?
- **Fix Required:** Add to `api-orchestration.md` that session_id is unique per session; concurrent /answers calls from different tabs are rejected (409 Conflict)

---

### Category C: Missing Operational Specs (3 gaps)

**C1: Generation Token Validity Duration**
- CSRF tokens are mentioned but TTL not specified
- **Fix Required:** Add to `specs/api-orchestration.md` that generation_token expires after:
  - 30 minutes OR
  - After successful /generate call (one-time use)
  - Whichever is first

**C2: Session Timeout Enforcement**
- Brief mentions 24h TTL but doesn't specify how it's enforced
- **Fix Required:** Add to `specs/authentication.md` that session TTL is checked on EVERY /api/bmc-generator/* request
  - If session is >24h old: return 401, client redirects to login
  - TTL is reset on each successful request (sliding window)

**C3: Rate Limiting Per Authenticated User**
- Current spec: 5 /start per IP per min (per-IP limit)
- Problem: Authenticated users can exceed this legitimately
- **Fix Required:** Add to `specs/api-orchestration.md`:
  - Per-IP limits still apply (prevents abuse from single IP)
  - Per-session limits: 1 concurrent generation, 20 per day (prevents quota abuse by single user)
  - Global cost ceiling: $500/day (prevents runaway cost)

---

### Category D: Missing Field Specifications (3 gaps)

**D1: BusinessContext Field Mapping**
- Brief defines 8 context fields
- Current spec: `data-model.md` defines BusinessContext but fields might not match brief
- **Fix Required:** Verify all 8 brief fields in BusinessContext Zod schema; add any missing

**D2: FinalBMC Output Fields**
- Brief specifies output should include: Executive Summary, Canvas, Risks, Recommendations, Next Steps
- **Fix Required:** Verify `data-model.md` FinalBMC has all these fields

**D3: CritiqueSummary Structure**
- `ui-ux-flow.md` shows HIGH/MEDIUM/STRENGTH grouping
- **Fix Required:** Add to `data-model.md` that CritiqueOutput[] is grouped by severity level in UI

---

### Category E: Security & Integrity Gaps (3 gaps)

**E1: Brute Force Protection on Login**
- Brief says "prevent anonymous access" but doesn't mention brute force
- Spec mentions "5 failed attempts per IP per 10 min → 429"
- **Problem:** Account lockout not specified (user locked out after 5 failures for how long?)
- **Fix Required:** Add to `specs/authentication.md`:
  - After 5 failed attempts: account locked for 30 minutes
  - Lockout is per-username (not per-IP), to prevent username enumeration via IP lock

**E2: Generation Token Binding to Session**
- Spec says generation_token issued by /start but doesn't say it's bound to session
- **Problem:** If token is stolen, attacker could use it on another account
- **Fix Required:** Add to `api-orchestration.md` that generation_token includes:
  - session_id (encrypted in token)
  - Checked on /answers and /generate to match current session

**E3: Sensitive Data in Logs**
- **Problem:** Error responses might leak agent internal state or token info
- **Fix Required:** Add to `api-orchestration.md` that all error responses use generic messages:
  - "Invalid request" (not "Missing generation_token field")
  - "Unauthorized" (not "Session expired at 2026-05-12T14:32:00Z")
  - "Generation failed" (not "OpenAI API timeout")

---

### Category F: User Experience Gaps (2 gaps)

**F1: Browser Back Button During Generation**
- User clicks Back during Phase 2 (mid-generation)
- Current spec: No guidance on what happens
- **Fix Required:** Add to `ui-ux-flow.md`:
  - JavaScript prevents back button during generation
  - If user navigates away: generation continues server-side (can be resumed)
  - Session persists even if user closes tab (can be resumed within 24h)

**F2: SSE Reconnection Logic**
- `ui-ux-flow.md` says "auto-reconnect every 2s"
- **Problem:** Does it resume from last update or restart from beginning?
- **Fix Required:** Add to `api-orchestration.md`:
  - SSE stream stores `lastEventId` in localStorage
  - On reconnect, client sends `?session_id=X&resumeFrom=lastEventId`
  - Server replays all events from resumeFrom onward (last 100 events)

---

## Summary Table

| Gap ID | Category | Severity | Fix Status |
|--------|----------|----------|------------|
| A1 | Feature | HIGH | Pending |
| A2 | Feature | HIGH | Pending |
| A3 | Feature | HIGH | Pending |
| A4 | Feature | MEDIUM | Pending |
| A5 | Feature | MEDIUM | Pending |
| A6 | Feature | LOW | Pending |
| A7 | Feature | HIGH | Pending |
| B1 | Error | CRITICAL | Pending |
| B2 | Error | CRITICAL | Pending |
| B3 | Error | CRITICAL | Pending |
| B4 | Error | HIGH | Pending |
| C1 | Operational | HIGH | Pending |
| C2 | Operational | HIGH | Pending |
| C3 | Operational | MEDIUM | Pending |
| D1 | Field | MEDIUM | Pending |
| D2 | Field | MEDIUM | Pending |
| D3 | Field | LOW | Pending |
| E1 | Security | HIGH | Pending |
| E2 | Security | CRITICAL | Pending |
| E3 | Security | CRITICAL | Pending |
| F1 | UX | MEDIUM | Pending |
| F2 | UX | MEDIUM | Pending |

---

## Execution Order

1. **CRITICAL fixes first** (B1, B2, B3, E2, E3) — security boundaries
2. **HIGH fixes** (A1, A2, A3, A7, C1, C2, E1) — feature completeness
3. **MEDIUM/LOW fixes** (A4, A5, A6, B4, C3, D1, D2, D3, F1, F2) — refinement

---

## Files to Update

- `specs/data-model.md` — BusinessContext, FinalBMC, CritiqueSummary structures
- `specs/api-orchestration.md` — Error handling, generation tokens, session management, rate limits
- `specs/agents.md` — Executive summary, next steps generation
- `specs/authentication.md` — Account lockout, session timeout enforcement
- `specs/ui-ux-flow.md` — PDF download, copy format, back button, SSE recovery

Total estimated scope: ~500 lines of additional spec detail across 5 files.
