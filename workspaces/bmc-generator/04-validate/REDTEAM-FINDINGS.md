---
name: BMC Generator Red Team Findings
description: Comprehensive validation results from spec compliance, UX flow, security, and accessibility audits
---

# BMC Generator Red Team Findings

**Date:** 2026-05-13  
**Status:** CRITICAL GAPS FOUND — Implementation blocked pending fixes

---

## Executive Summary

The BMC Generator has well-architected components, strong security patterns (HMAC-SHA256 tokens, rate limiting, Zod validation), and comprehensive test coverage (685 passing tests). However, **the tool does not work end-to-end**. Five critical gaps prevent any user from accessing or using the tool:

1. **Missing entry point** — `/tools/bmc-generator/page.tsx` does not exist
2. **Missing SSE endpoint** — `/api/bmc-generator/stream/status` route handler missing
3. **Broken token lifecycle** — No way to call `/generate` after `/answers` consumes token
4. **All agents stubbed** — OrchestratorAgent and all 14 phase agents return hardcoded fallback data
5. **Security issues** — Error messages leak field names, token binding incomplete, $500/day cap vs $0.50/day spec

## Convergence Criteria Status

| Criterion | Status | Evidence |
|-----------|--------|----------|
| 0 CRITICAL findings | ❌ FAIL | 5 critical gaps (no page, no SSE, broken token, stubbed agents, security issues) |
| 0 HIGH findings | ❌ FAIL | 14 HIGH security/UX issues documented |
| 100% spec compliance | ❌ FAIL | 7 HIGH divergences in spec-coverage-v2.md |
| New code has new tests | ✅ PASS | 685 tests, all modules importing correctly |
| 0 mock data in frontend | ❌ FAIL | Fallback hardcoded data in endpoints, fake agent responses |
| 2 consecutive clean rounds | ❌ FAIL | First round, multiple findings |

**Result:** BLOCKED — Does not meet convergence criteria. Must fix critical gaps before proceeding.

---

## Critical Gaps (Blocking)

### Gap 1: Missing Main Entry Page

**Severity:** CRITICAL  
**Scope:** All users  
**Impact:** Tool completely inaccessible

The `/tools/bmc-generator/page.tsx` file does not exist. There is no React page that:
- Renders the 3-step wizard (IdeaInputForm → ClarifyingQuestionsForm → GenerationStatusPanel → Results)
- Manages local state across the flow (sessionId, generationToken, businessContext)
- Handles navigation between steps
- Catches errors and displays fallbacks

**Evidence:**
```bash
ls -la app/tools/bmc-generator/page.tsx  # File not found
# Only login/page.tsx exists at app/tools/bmc-generator/login/page.tsx
```

**Fix Required:**
- Create `app/tools/bmc-generator/page.tsx` (~250 LOC)
- Wire all 7 components into a multi-step wizard
- Manage state transitions and error recovery
- Integrate login redirect on 401/session_expired

---

### Gap 2: Missing SSE Stream Endpoint

**Severity:** CRITICAL  
**Scope:** Generation progress display  
**Impact:** Real-time progress cannot be displayed

The `/api/bmc-generator/stream/status` endpoint is referenced by `useSSEListener` hook and called by `GenerationStatusPanel`, but the route handler does not exist.

**Evidence:**
```bash
ls -la app/api/bmc-generator/stream/status/  # Directory not found
# Expected: app/api/bmc-generator/stream/status/route.ts
```

The client code tries to connect:
```typescript
// app/tools/bmc-generator/hooks/useSSEListener.ts
const url = new URL('/api/bmc-generator/stream/status', window.location.origin);
this.eventSource = new EventSource(url.toString());
```

But no server-side handler exists to service the request.

**Fix Required:**
- Create `app/api/bmc-generator/stream/status/route.ts` (~200 LOC)
- Implement GET handler that returns EventSource stream
- Emit SSE events for: progress (agent updates), heartbeat (keepalive), error, complete
- Store event state in memory with lastEventId support for replay

---

### Gap 3: Broken Token Lifecycle (Token Cannot Be Reused for /generate)

**Severity:** CRITICAL  
**Scope:** Generation phase  
**Impact:** No user can proceed from /answers to /generate

The token is consumed by `/answers` but no fresh token is issued for `/generate`. The client cannot call `/generate` with a valid token.

**Flow:**
1. User calls `/start` → receives `generation_token`
2. User calls `/answers` with token → token marked as "used"
3. User tries to call `/generate` with same token → rejected with 403

**Evidence:**
- `app/api/bmc-generator/answers/route.ts:342` — `markTokenUsed()` sets `usedTokens[generationTokenString] = true`
- `app/api/bmc-generator/generate/route.ts:412` — `isTokenUsed()` checks if token is in `usedTokens` map, returns 403 if used
- No endpoint re-issues a token for `/generate`

**Fix Required:**
- After `/answers` succeeds, return a fresh `generation_token` for `/generate`
- OR: Change the flow so `/answers` does NOT consume the token; only `/generate` does
- OR: Issue a separate "generation_start_token" distinct from the initial "generation_token"

Recommend option 1: `/answers` response includes new token for `/generate`.

---

### Gap 4: All AI Agents Return Hardcoded Fallback Data

**Severity:** CRITICAL  
**Scope:** Context generation, BMC generation, critique  
**Impact:** User always gets same generic output regardless of input

All agent calls return placeholder/fallback responses:

**OrchestratorAgent (generate_questions):**
```typescript
// app/api/bmc-generator/start/route.ts:185-189
return {
  type: 'text',
  text: JSON.stringify([
    "What is the primary problem your business solves?",
    "Who is your ideal customer?",
    "What makes your solution unique?"
  ]),
};
```
Always returns the same 3 questions.

**OrchestratorAgent (normalize_answers):**
```typescript
// app/api/bmc-generator/answers/route.ts:180-193
return {
  user_idea_summary: "A tech platform...",
  industry: "Technology",
  customer_type: "B2B",
  // ... all hardcoded fields
};
```
Always returns same generic context regardless of user's answers.

**All 14 Phase 2-4 agents:**
```typescript
// app/api/bmc-generator/generate/route.ts:204-234
return {
  section_name: agentName,
  points: ['Point 1 for this section', 'Point 2', 'Point 3'],
  reasoning: 'A'.repeat(50),
  // ... all placeholder data
};
```
All agents return identical placeholder strings.

**Fix Required:**
- Integrate real LLM calls via OrchestratorAgent
- Replace fallback data with actual agent execution
- Implement proper error handling and timeouts

---

### Gap 5: Security Issues

**Severity:** HIGH  
**Scope:** Multiple endpoints  
**Impact:** Information leakage, insufficient rate limiting, memory leaks

#### S5.1: Error messages leak field names and validation rules

```typescript
// app/api/bmc-generator/start/route.ts:302
error: `Idea must be 50-500 characters. Current length: ${trimmedIdea.length}.`
```
Reveals validation rule (length bounds) and current input length. Spec requires generic "Invalid input" only.

**Other instances:**
- Line 289: `Missing or invalid "idea" field. Must be a string.`
- `answers/route.ts:365`: `Answer for "${key}" must be a string.` (reflects user input)
- `generate/route.ts:396`: Lists all required field names

**Fix:** Use error-messages.ts utility for all 4xx/5xx responses. No validation details in responses.

#### S5.2: generation_token not bound to authenticated user

Token is bound to `generationSessionId` (client-supplied random UUID), not to the authenticated username. An attacker can intercept a token and use it from a different user's session by sending the correct `session_id` in the request body.

**Evidence:**
- `/start` creates token bound to `generationSessionId` (new random UUID)
- `/answers` checks `payload.sid !== expectedSessionId` where `expectedSessionId` comes from request body
- Token should be bound to authenticated user's `sessionResult.username`

**Fix:** Bind token to authenticated username, not client-supplied session_id.

#### S5.3: Global cost ceiling is 1000x too high

```typescript
// app/api/bmc-generator/start/route.ts:38
const GLOBAL_DAILY_COST_CEILING_USD = 500;
```
Spec requires $0.50/day, but implementation allows $500/day.

**Fix:** Change to `0.50` with clear comment on budget rationale.

#### S5.4: Memory leaks in token/session state maps

- `consumedTokens` map in `generate/route.ts` has no eviction
- `sseSessionState` map in `start/route.ts` has no eviction
- Both grow unbounded under sustained load

**Fix:** Add periodic eviction (every 100th call) or use Map with TTL eviction.

---

## High-Priority Issues (Not Blocking But Significant)

| ID | Severity | Category | Issue | File |
|----|----------|----------|-------|------|
| CSS-1 | HIGH | CSS Module Safety | IdeaInputForm uses direct `styles.` access instead of `cls()` helper | IdeaInputForm.tsx |
| CSS-2 | HIGH | CSS Module Safety | GenerationStatusPanel uses direct `styles.` access instead of `cls()` helper | GenerationStatusPanel.tsx |
| A1 | MEDIUM | Accessibility | Login page inputs lack `:focus-visible` CSS rules | login.module.css |
| A2 | MEDIUM | Accessibility | Login page lacks reduced-motion support | login.module.css |
| T1 | MEDIUM | Logging | Console.log used instead of structured logger | All endpoints |

---

## Passing Validations

✅ **Test Coverage:** 685 tests passing (27 test files), all new modules imported correctly  
✅ **CSRF Protection:** HMAC-SHA256 token signing with timing-safe comparison  
✅ **Session Management:** 24h TTL with sliding window, validated on all protected routes  
✅ **Rate Limiting:** 4 tiers (IP, concurrent, daily, global) with bounded state eviction  
✅ **Input Validation:** Zod schemas with strict mode on all endpoints  
✅ **Responsive Design:** Mobile/tablet/desktop verified with 44px+ touch targets  
✅ **Core Accessibility:** WCAG 2.1 AA compliance (aria-labels, semantic HTML, keyboard nav)  
✅ **Prompt Injection Prevention:** All agent prompts use delimiter boundaries  
✅ **Cookie Security:** HttpOnly, Secure, SameSite=Lax attributes set correctly  

---

## Audit Output Files

- **Spec Compliance:** `workspaces/bmc-generator/.spec-coverage-v2.md` (112 assertions, 7 HIGH divergences)
- **This Report:** `workspaces/bmc-generator/04-validate/REDTEAM-FINDINGS.md`

---

## Next Steps

1. **Fix Critical Gaps** (all must be completed):
   - [ ] Create main `page.tsx` (wizard orchestration)
   - [ ] Create SSE `/stream/status` endpoint
   - [ ] Fix token lifecycle (issue new token from `/answers` for `/generate`)
   - [ ] Integrate real OrchestratorAgent and phase agents
   - [ ] Fix error messages to use generic format

2. **Fix High Issues**:
   - [ ] Add `cls()` helper to IdeaInputForm and GenerationStatusPanel
   - [ ] Add `:focus-visible` and reduced-motion to Login page
   - [ ] Replace console.log with structured logger

3. **Fix Security Issues**:
   - [ ] Bind generation_token to authenticated user, not client session_id
   - [ ] Adjust global cost ceiling to $0.50/day
   - [ ] Add eviction to state maps

4. **Re-validate**:
   - [ ] Run `/redteam` again after fixes
   - [ ] Verify all 5 convergence criteria met before shipping

---

**Recommendation:** Return to `/implement` phase to address critical gaps. The architecture is sound; the execution is incomplete. Estimated effort: 2-3 sessions to wire main page, SSE endpoint, fix token lifecycle, and integrate real agents.
