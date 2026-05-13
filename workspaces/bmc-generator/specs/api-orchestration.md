# BMC Generator — API & Orchestration

All server-side HTTP endpoints and the orchestration logic that wires the 4-phase execution model together.

## Route Structure

All endpoints are rooted at `/api/bmc-generator/`.

### POST /api/bmc-generator/start

**Purpose:** User submits initial business idea; server generates clarifying questions.

**Request:**
```typescript
{
  idea: string;  // 50-500 chars, user's one-sentence or paragraph business idea
}
```

**Response:**
```typescript
{
  session_id: string;                    // UUID, unique to this generation run
  questions: string[];                   // 3-5 clarifying questions
  estimated_cost: number;                // $0.02-0.05
  estimated_latency_seconds: number;     // 45-90
}
```

**Orchestration:**
1. Validate `idea` length (50–500 chars)
2. Call OrchestratorAgent(mode='generate_questions', idea)
3. Parse output as string[] (array of questions)
4. Initialize CostTracker, record Phase 1 tokens
5. Start SSE stream for session_id
6. Return questions + metadata

**Authentication & Authorization:**
- REQUIRED: Valid `bmc_session` cookie (HTTP-only)
- If missing or invalid: Return 401 with message "Unauthorized. Please log in."

**Rate Limiting:**
- Per IP: 5 /start calls per minute → 429 "Too many requests"
- Per session: 1 concurrent generation at a time (reject if another is running) → 409 "Generation already in progress"
- Per session per day: Max 20 generations → 429 "Daily limit exceeded (20/day)"
- Global: $500/day cost ceiling (reject if exceeded) → 429 "Service temporarily unavailable"

**CSRF Protection:**
- Generate `generation_token` (32-byte random, expires in 30 min or after first use)
- Return in response: `"generation_token": "abc123..."`
- Token is bound to session_id (encrypted in token payload)

**Error Handling:**
- Unauthenticated (no session): Return 401 `{ "error": "Unauthorized", "redirect": "/tools/bmc-generator/login" }`
- Expired session: Return 401 `{ "error": "Session expired. Please log in again." }`
- If OrchestratorAgent fails: Return 500 with fallback questions ("Describe your target customer", "What's the core problem you solve?", "What's your pricing model?")
- Invalid idea length: Return 400 `{ "error": "Idea must be 50–500 characters" }`
- Rate limit exceeded: Return 429 `{ "error": "Too many requests. Try again in X seconds." }`
- Cost ceiling exceeded: Return 429 `{ "error": "Daily cost limit exceeded. Try again tomorrow." }`

---

### POST /api/bmc-generator/answers

**Purpose:** User answers clarifying questions; server normalizes into BusinessContext.

**Request:**
```typescript
{
  session_id: string;
  generation_token: string;  // CSRF token from /start response
  answers: Record<string, string>;  // { question_index_or_key: answer_text }
}
```

**Response:**
```typescript
{
  session_id: string;
  context: BusinessContext;  // Zod-validated object
  next_action: "start_generation";
}
```

**Authentication & Authorization:**
- REQUIRED: Valid `bmc_session` cookie
- REQUIRED: Valid `generation_token` (must match session_id, must not be expired or used before)
- If generation_token invalid: Mark as "used" (one-time only) and return 403

**Orchestration:**
1. Validate session and generation_token
2. Look up session_id, retrieve stored question list + user idea
3. Call OrchestratorAgent(mode='normalize_answers', idea, questions, answers)
4. Parse output into Zod BusinessContextSchema
5. Validate answers: each non-optional answer must be 10-500 chars
6. Store context in session memory (sessionStorage on client, optional server cache)
7. Record Phase 1 costs
8. Return context + confirmation

**Error Handling:**
- Unauthenticated (no session): Return 401 `{ "error": "Unauthorized. Please log in." }`
- Expired session: Return 401 `{ "error": "Session expired. Please log in again." }`
- Missing generation_token: Return 403 `{ "error": "Invalid or expired generation token" }`
- Invalid/expired generation_token: Return 403 `{ "error": "Invalid or expired generation token" }` (mark as used)
- Invalid session_id: Return 404 `{ "error": "Session not found" }`
- Invalid answers (empty required answer): Return 400 `{ "error": "All answers required" }`
- Answer too long: Return 400 `{ "error": "Answer exceeds 500 characters" }`
- Validation failure: Return 400 `{ "error": "Context validation failed", "details": ZodError }`
- If normalization fails: Return 500 `{ "error": "Failed to process answers. Please try again." }`

---

### POST /api/bmc-generator/generate

**Purpose:** Trigger Phase 2 (parallel BMC agents) + Phase 3 (parallel critique) + Phase 4 (synthesis).

**Request:**
```typescript
{
  session_id: string;
  generation_token: string;  // CSRF token from /start, marked as used after /answers
  context: BusinessContext;
}
```

**Response:**
```typescript
{
  session_id: string;
  status: "in_progress" | "complete" | "partial" | "failed";
  final_bmc: FinalBMC | null;        // null while in_progress, Tier 3 structure if partial/failed
  completion: "full" | "partial" | "agents_only";
  completion_percentage: number;      // 0-100
  cost: number;                        // Actual cost charged
  wallClockMs: number;                 // Wall-clock time
  error: string | null;
}
```

**Authentication & Authorization:**
- REQUIRED: Valid `bmc_session` cookie
- REQUIRED: Fresh `generation_token` (second use after /answers or older than 30 min → 403)
- Check per-session rate limit (1 concurrent generation)
- Check daily rate limit (20 generations/day)
- Check global cost ceiling ($500/day)
- If any limit exceeded: Return 409 or 429 with clear message

**Error Handling (Comprehensive):**
- Unauthenticated: Return 401 `{ "error": "Unauthorized. Please log in." }`
- Expired session: Return 401 `{ "error": "Session expired. Please log in again." }`
- Invalid/expired generation_token: Return 403 `{ "error": "Invalid or expired generation token" }`
- Concurrent generation already running: Return 409 `{ "error": "Generation already in progress. Wait for previous to complete." }`
- Daily limit exceeded (20/day): Return 429 `{ "error": "Daily generation limit exceeded (20/day). Try again tomorrow." }`
- Cost ceiling exceeded ($500/day): Return 429 `{ "error": "Daily cost limit exceeded. Try again tomorrow." }`
- Per-IP rate limit: Return 429 `{ "error": "Too many requests from your IP. Try again in X seconds." }`
- Invalid context: Return 400 `{ "error": "Invalid business context" }`

**Orchestration (Server-Side Workflow with Timeout Guarantees):**

```
SETUP:
├─ startTime = now()
├─ hardTimeoutMs = 120_000 (120 seconds)
├─ sections = []
├─ critiques = []
├─ costTracker = new CostTracker()

Phase 2: Parallel BMC Agents (Soft timeout 45s, skip at 40s if needed)
├─ timeElapsed = now() - startTime
├─ timeRemaining = hardTimeoutMs - timeElapsed
├─ Start 9 parallel agents with abort signal (45s timeout per agent)
├─ On each completion: emit status, update costTracker
├─ At 40s mark: if any agents still pending → skip them, move to Phase 3
├─ At 45s mark: abort remaining agents
├─ Validate: if ≥6 agents completed → sections populated, proceed
│           if <6 agents → abort to Tier 3 fallback
└─ If all agents skipped (time critical) → only show completed sections

Phase 3: Parallel Critique Agents (Soft timeout 25s, skip at 20s if needed)
├─ timeElapsed = now() - startTime
├─ timeRemaining = hardTimeoutMs - timeElapsed
├─ If timeRemaining < 30s → skip Phase 3 entirely, move to Phase 4
├─ Start 3 parallel agents with abort signal (25s timeout per agent)
├─ At 20s mark: if any agents still pending → skip them
├─ At 25s mark: abort remaining agents
├─ If 0 agents completed: set critiques = [] (empty, not error)
└─ Proceed to Phase 4

Phase 4: Synthesis (Hard timeout 15s)
├─ timeElapsed = now() - startTime
├─ timeRemaining = hardTimeoutMs - timeElapsed
├─ If timeRemaining < 20s → use Tier 3 fallback (return raw sections)
├─ Call SynthesisAgent with sections + critiques + context (15s timeout)
├─ If synthesis succeeds → return full FinalBMC (Tier 1)
├─ If synthesis fails or times out → return Tier 3 fallback
└─ Calculate final cost from costTracker, charge user actual cost only

TIMEOUT BOUNDARY CHECKS (every 5 seconds):
├─ if (now() - startTime) > 120s → immediately abort all phases
└─ Return available output at that moment (Tier 3)
```

**Error Handling & Fallback Strategy:**

- **Phase 2 <6 agents**: Return Tier 3 fallback (too few sections for valid BMC)
- **Phase 2+ complete but Phase 3 timeout**: Return partial BMC with no critiques
- **Phase 3 complete but Phase 4 timeout**: Return partial BMC with raw sections (no synthesis)
- **Hard timeout >120s**: Return whatever sections + critiques are available, formatted as markdown

**Tier 3 Fallback Response:**
```typescript
{
  session_id: string;
  status: "partial" | "failed";
  completion: "full" | "partial" | "agents_only";
  final_bmc: {
    sections: {
      [key: string]: {
        content: string;
        source: "agent" | "fallback";
        completed: boolean;
      };
    };
    critiques: CritiqueOutput[];
    message: string; // "Generation timed out at 120s. Showing 6/9 sections."
  };
  cost: number; // Actual cost, not budget
  wallClockMs: number; // How long it actually took
}
```

---

### GET /api/bmc-generator/stream/status

**Purpose:** Server-sent events stream for real-time progress updates.

**Authentication & Authorization:**
- REQUIRED: Valid `bmc_session` cookie (checked on initial connection)
- If missing or invalid: Reject connection with 401 (EventSource will close immediately)
- Session is re-validated every 30 seconds during streaming
- If session expires mid-stream: Emit "session_expired" event, close stream

**Connection Lifecycle:**
1. Client connects: `const es = new EventSource('/api/bmc-generator/stream/status?session_id=...')`
2. Server validates session_id and bmc_session cookie
3. If invalid: Return 401, connection rejected
4. If valid: Server looks up session_id, begins streaming events
5. On each agent start/complete/fail: emit AgentStatus event
6. Heartbeat every 2 seconds: emit keepalive event (prevents connection timeout)
7. Every 30s: validate session still exists and not expired
8. If session expired: emit "session_expired" event, close stream
9. On workflow complete or error: emit final event, close stream

**Event Format (Agent Progress):**
```
event: progress
data: {
  "phase": 2,
  "activeAgent": "CustomerSegmentsAgent",
  "progress": 0.333,
  "elapsedMs": 8000,
  "tokensUsed": { "input": 4000, "output": 2500 },
  "costUSD": 0.0085,
  "timestamp": "2026-05-12T10:30:45.123Z"
}
```

**Event Format (Keepalive/Heartbeat):**
```
event: heartbeat
data: {
  "phase": 2,
  "progress": 0.333,
  "elapsedMs": 12000,
  "costUSD": 0.0087,
  "timestamp": "2026-05-12T10:30:47.123Z"
}
```

**Event Format (Session Expiration):**
```
event: error
data: {
  "error": "session_expired",
  "message": "Your session has expired. Please log in again.",
  "timestamp": "2026-05-12T10:35:00.123Z"
}
```

**Event Format (Agent Error/Timeout):**
```
event: error
data: {
  "phase": 2,
  "activeAgent": "ValuePropositionsAgent",
  "error": "agent_timeout",
  "message": "Agent did not complete within 30s. Skipping this section.",
  "progress": 0.444,
  "elapsedMs": 32000,
  "costUSD": 0.0120,
  "timestamp": "2026-05-12T10:30:50.123Z"
}
```

**Event Format (Generation Complete):**
```
event: complete
data: {
  "phase": 4,
  "completion": "full",
  "totalElapsedMs": 67000,
  "finalCost": 0.0333,
  "timestamp": "2026-05-12T10:31:52.123Z"
}
```

**Debouncing:** Updates emitted at most every 500ms (rapid agent state changes coalesced).

**Heartbeat:** If no agent state change for 2+ seconds, emit keepalive event with current phase/progress/cost.

**Client-Side SSE Recovery:**
- If SSE disconnects unexpectedly, client automatically reconnects with `resumeFrom` parameter
- `resumeFrom`: last received event timestamp
- Server replays last 100 events from `resumeFrom` onward (prevents event loss)
- After replay, resumes streaming new events

---

### POST /api/bmc-generator/logout

**Purpose:** End user session and clear authentication cookie.

**Request:** No body required

**Response:**
```typescript
{
  success: true;
  redirect: "/tools/bmc-generator/login";
}
```

**Behavior:**
1. Validate session exists (return 400 if already logged out)
2. Delete `bmc_session` cookie
3. Invalidate session in server store (if using server-side sessions)
4. Clear any in-progress generation state for this session (generation is abandoned)
5. Return success response with redirect URL

**Error Handling:**
- Already logged out (no valid session): Return 400 `{ "error": "Not logged in" }`
- Other errors: Return 500 `{ "error": "Logout failed. Please try again." }`

---

## Session Management & Rate Limiting

### Session Timeout Enforcement

Every protected endpoint (`/start`, `/answers`, `/generate`, `/stream/status`) MUST validate session on EVERY request:

```
On each request:
  1. Check bmc_session cookie exists
  2. Validate session in store (or verify JWT/signed cookie)
  3. If session >= 24 hours old:
     - Return 401 "Session expired"
     - Do NOT reset TTL (no sliding window for expired sessions)
  4. If session < 24 hours old:
     - Reset TTL to now() + 24h (sliding window — extend on each use)
     - Proceed with request
```

**Session TTL:** 24 hours from creation or last use (whichever is later).  
**Reset Trigger:** Every successful authenticated request (GET or POST).  
**No Reset On:** Failed auth attempts, invalid CSRF tokens, expired sessions.

### Rate Limiting Strategy

Three independent rate limits enforce cost control and prevent abuse:

**Limit 1: Per-IP Global (prevents anonymous hammer attacks)**
```
Resource: /start
Limit: 5 requests per minute per IP
Reject: 429 "Too many requests. Try again in X seconds."
```

**Limit 2: Per-Session Per-Day (prevents single authenticated user quota abuse)**
```
Resource: /start (generation initiation)
Limit: 20 generations per calendar day per session
Reject: 429 "Daily generation limit exceeded (20/day). Try again tomorrow."
State: Persistent (survives page refresh)
Reset: Midnight UTC each day
```

**Limit 3: Per-Session Concurrent (prevents resource exhaustion)**
```
Resource: /generate
Limit: 1 generation at a time per session
Reject: 409 "Generation already in progress. Complete or wait for previous to finish."
State: Clears when generation completes, times out, or session expires
```

**Limit 4: Global Daily Cost (prevents runaway API spending)**
```
Resource: All endpoints that trigger generation
Limit: $500 per calendar day (global, all users combined)
Reject: 429 "Service temporarily unavailable due to cost limits. Try again tomorrow."
State: Shared across all active sessions
Reset: Midnight UTC each day
```

### Generation Token Lifecycle

Generation tokens are CSRF tokens that prevent cross-site request forgery and double-submission attacks:

```
1. /start endpoint generates:
   - 32-byte random token
   - Payload: { session_id, created_at, one_time_use: false }
   - Sign/encrypt with server secret
   - TTL: 30 minutes OR first use (whichever is first)

2. /answers endpoint validates:
   - Token must match session_id (decrypt and verify)
   - Token must not be expired (created_at + 30min)
   - Token marked as "used" (one-time only)
   - Consecutive /answers calls with same token: return 403

3. /generate endpoint validates:
   - Same as /answers (token must exist, be valid, not used before)
   - Mark as used (second use is rejected)

4. Error cases:
   - Missing token: 403 "Missing generation token"
   - Invalid token: 403 "Invalid generation token"
   - Expired token (>30min old): 403 "Generation token expired"
   - Already used: 403 "Generation token already used" (prevent double-submit)
   - Token from different session: 403 "Invalid generation token"
```

---

## Phase State Machine

```
START
  ↓
/start (user submits idea)
  ├─ Generate questions (OrchestratorAgent)
  ├─ Emit Phase 1 status
  └─ Wait for /answers
      ↓
/answers (user answers questions)
  ├─ Normalize context (OrchestratorAgent)
  ├─ Validate BusinessContext
  ├─ Emit Phase 1 complete
  └─ Wait for /generate
      ↓
/generate (user clicks "Analyze")
  ├─ Phase 2: Execute 9 BMC agents in parallel
  ├─ Emit Phase 2 progress (progress += 1/9 per agent complete)
  ├─ Phase 3: Execute 3 critique agents in parallel
  ├─ Emit Phase 3 progress (progress += 1/3 per agent complete)
  ├─ Phase 4: Execute SynthesisAgent
  ├─ Emit Phase 4 complete
  ├─ Validate FinalBMC
  └─ Return final output
      ↓
END (stream closes)
```

**Timeout Boundaries:**
- Phase 1 questions: 5s total
- Phase 1 normalize: 5s total
- Phase 2 per-agent: 30s (9 agents in parallel, ~30s wall-clock)
- Phase 3 per-agent: 15s (3 agents in parallel, ~15s wall-clock)
- Phase 4 synthesis: 10s
- Total budget: 60s (user clarified 60-90s acceptable with visual feedback)

---

## Cost Tracking Architecture

**CostTracker instance:** One per session, instantiated on `/start`, accumulated through all phases.

**Token Recording:**
```typescript
// After each agent completes:
costTracker.record(
  phase,
  agentName,
  agentOutput.metadata.tokens_used.input,
  agentOutput.metadata.tokens_used.output
);
```

**Cost Calculation:**
```
Haiku pricing (May 2026):
  Input: $0.80 per 1M tokens
  Output: $4.00 per 1M tokens

costUSD = (totalInput / 1_000_000) * 0.80 + (totalOutput / 1_000_000) * 4.00
```

**Estimation vs Actual:**
- `/start` response includes estimated_cost (based on Phase 1 only, before other phases)
- `/generate` streaming emits real-time cost updates as tokens accumulate
- Final response includes actual_cost (sum of all 4 phases)

---

## Security: Rate Limiting & Abuse Prevention (CRITICAL)

All endpoints are subject to server-side rate limiting and cost protection:

### Per-IP Rate Limits

- **POST /api/bmc-generator/start:** 5 requests per minute
  - Exceeding: 429 Too Many Requests
  - Reason: Prevent rapid question generation spam

- **Per-Session /api/bmc-generator/generate:** 1 concurrent + 20 per calendar day
  - Exceeding: 429 "Generation already in progress" or "Daily limit reached"
  - Reason: Prevent cost amplification via concurrent or repeated calls

- **Per-IP Daily Cost Ceiling:** Monitor total API spend across all users
  - If daily spend exceeds $500, halt new `/generate` requests
  - Response: 503 "Service temporarily unavailable due to cost limit"
  - Reason: Financial protection against sustained attacks

### Implementation

**MUST enforce rate limiting in route handlers BEFORE any Anthropic API calls.** Use in-memory counters, Redis, or Vercel KV for tracking. All limits are server-validated, never client-only.

---

## Security: Endpoint Hardening (CRITICAL)

### CSRF Protection (POST Endpoints)

- **POST /start:** Validate `Origin` or `Referer` header matches expected domain
  - Reject cross-origin POST with 403 Forbidden
  - `/start` response includes `generation_token: string` (cryptographically random, 32+ bytes)

- **POST /answers:** Require `X-Generation-Token: {token}` header
  - Token must be the one returned from `/start`
  - Reject without valid token: 401 Unauthorized
  - Reason: Prevent flow bypass (direct `/answers` call without Phase 1)

- **POST /generate:** Require `X-Generation-Token: {token}` header
  - Same validation as `/answers`

### Session Validation

- All endpoints MUST validate session_id format (UUIDv4, reject non-UUID)
- SSE stream (`/stream/status`) MUST validate session_id + IP match creating IP
- Reason: Prevent session hijacking and enumeration

### API Key Protection

- Anthropic API key loaded from `process.env.ANTHROPIC_API_KEY` server-side only
- **Never expose API key, auth headers, or raw Anthropic responses to client**
- Error responses use generic messages (never pass `err.message` or `err.stack`)
- Set response headers: `Cache-Control: no-store, no-cache` on all routes

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": {
    "field": "idea",
    "message": "must be 50–500 characters"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or missing generation token"
}
```

### 403 Forbidden
```json
{
  "error": "Cross-origin request rejected"
}
```

### 404 Not Found
```json
{
  "error": "Session not found",
  "session_id": "invalid-uuid"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "retry_after_seconds": 60
}
```

### 500 Internal Server Error
```json
{
  "error": "Generation failed",
  "phase": 2,
  "retry": true
}
```
*(Note: Never include raw agent output, system prompts, or Anthropic API details)*

### 503 Service Unavailable
```json
{
  "error": "Service temporarily unavailable due to cost limit"
}
```

---

## Idempotency & Retry Logic

- `/start` is idempotent (same `idea` input always generates same questions if cached)
- `/answers` creates a new generation if session doesn't exist (no idempotency)
- `/generate` is **NOT** idempotent (each call re-executes all 4 phases)
- On network error, client retries `/generate` (each retry produces a new $0.03-0.05 charge)

**Recommendation:** Client-side debounce on "Analyze" button (disable for 2s after click).

---

## Inter-Agent Communication & Transparency

**Brief Requirement B-08: "Inter-agent communication visible"**

This is fulfilled through the `/stream/status` endpoint's `activeAgent` and `phase` fields:

1. **Visible sequence:** Phase 1 → Phase 2 (9 agents in parallel) → Phase 3 (3 agents in parallel) → Phase 4
2. **Active agent display:** SSE stream emits `activeAgent: "CustomerSegmentsAgent"` when that agent starts
3. **Data flow transparency:** Real-time cost/token display shows cumulative tokens from all agents so far
4. **Critique incorporation:** Phase 4 SynthesisAgent explicitly incorporates Phase 3 critiques into final output; this is visible in the final "Strategic Recommendations" section

**Not visible:** Individual agent reasoning or internal prompts (intentional, to keep UI clean).

---

## Session Storage

**Client-Side (Recommended):**
- Store session_id, user_idea, questions, answers, context, final_bmc in sessionStorage
- Survives page refresh during generation
- Expires on browser close

**Server-Side (Optional):**
- Cache context + generated sections in memory for 24 hours (allows retry without re-running)
- Useful for user re-running same idea later (can fetch previous result without cost)

**Deletion:** Session data deleted on browser close OR explicitly via DELETE /api/bmc-generator/session/{session_id}
