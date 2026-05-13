# BMC Generator — Requirements Breakdown

## Functional Requirements

### R1: Business Idea Input
**Acceptance:** User can input business idea in free-form text (100-500 words)
- Input: textarea with word counter
- Validation: minimum 50 words, maximum 2000 words
- Storage: ephemeral (session-only, not persisted)
- Output: normalized business idea description

### R2: Context Gathering (OrchestratorAgent)
**Acceptance:** System asks 3-5 clarifying questions, collects answers, creates normalized context
- Questions must be:
  - Specific to the business idea provided
  - Non-redundant (no duplicate questions)
  - Answerable in 1-2 sentence responses
  - Progressively narrowing scope
- Output: Structured JSON context object with all fields populated
- Edge case: If user provides extremely detailed idea, may skip some questions
- Edge case: If user provides vague idea, may ask additional questions (up to 7)

### R3: BMC Section Generation (9 Parallel Agents)
**Acceptance:** All 9 BMC agents generate their sections simultaneously
- Each agent receives: user idea + context + any relevant user answers
- Output format: JSON with required fields + reasoning
- Timeout: 30 seconds per agent (if agent exceeds, use partial results)
- Error handling: If agent fails, capture error but continue (error isolation)
- Cost tracking: Record tokens used per agent

### R4: Red Team Critique (3 Parallel Agents)
**Acceptance:** Critique agents validate BMC for feasibility, economics, positioning
- Each agent receives: all BMC sections from Phase 2
- Output: JSON with identified risks, severity levels, recommendations
- Risk categories:
  - HIGH (fatal flaws that break the business model)
  - MEDIUM (significant challenges, viable workarounds)
  - LOW (minor concerns, educational observations)
- Error isolation: If critique agent fails, synthesis continues without that perspective

### R5: BMC Synthesis (SynthesisAgent)
**Acceptance:** Final BMC created, integrating all sections and critique
- Merge 9 BMC sections into cohesive whole
- Resolve contradictions (prefer more conservative estimates)
- Incorporate valid critiques into recommendations
- Format: Markdown table (9x1 BMC format)
- Executive summary: 3-4 sentence overview
- Output sections:
  - Structured BMC (JSON)
  - Markdown rendering
  - Critique summary
  - Strategic recommendations (3-5 recommendations)
  - Next steps

### R6: Transparency & Cost Display
**Acceptance:** Real-time agent status, phase progress, cost accumulation visible to user
- Real-time updates:
  - Active agent name + current task
  - Phase (1/2/3/4) + progress bar
  - Elapsed time (seconds)
  - Token count (accumulating)
  - Cost accumulation (show as $0.00XXX format)
- Update frequency: every agent state change + every 2 seconds
- Cost calculation:
  - Input tokens: $0.000003 per token (Claude 3.5 Haiku)
  - Output tokens: $0.000012 per token
  - Total displayed as running sum
- Target: Entire flow completes in <45 seconds
- Cost target: <$0.02 per generation

## Non-Functional Requirements

### NR1: Complete Isolation
- **No shared components:** No imports from `app/tools/` or `app/components/`
- **No shared hooks:** All utility functions duplicated or self-contained
- **No shared styling:** CSS modules or tailwind classes owned entirely by BMC tool
- **No shared API layer:** If API calls needed, use independent endpoints
- **Verification:** `grep -r "from.*app/" app/tools/bmc-generator/` returns zero matches

### NR2: Performance
- **Target latency:** Phase 1 (1 question + answer): <5 seconds
- **Target latency:** Phase 2 (9 agents parallel): <30 seconds  
- **Target latency:** Phase 3 (3 agents parallel): <10 seconds
- **Target latency:** Phase 4 (synthesis): <5 seconds
- **Total:** <45 seconds wall-clock time
- **Browser responsiveness:** UI never freezes during generation

### NR3: Cost Optimization
- **Model selection:** Haiku 3.5 (cheapest tier, <$0.02 budget per generation)
- **Token reduction:** Use structured JSON prompts (fewer tokens than narrative)
- **Parallel execution:** 9 agents in parallel, not sequential (saves 8x time = lower cost)
- **Truncation:** If user idea >500 words, summarize to <200 words before distribution
- **Caching:** No caching (single-use per session, not worth complexity)

### NR4: Error Isolation
- **Phase 1 failure:** Fallback to minimal context object, skip orchestration
- **Phase 2 failure (single agent):** Capture error, continue with 8 agents, flag section as incomplete
- **Phase 2 failure (multiple agents):** After 3 agents fail, abort and show error (data quality too low)
- **Phase 3 failure:** Critique section shows "critique unavailable" but BMC still rendered
- **Phase 4 failure:** Show raw Phase 2 output as fallback; no synthesis

### NR5: Type Safety
- **TypeScript:** All code in strict mode
- **Interfaces:** Define for:
  - BusinessContext
  - BMCSection (parent type for all 9 sections)
  - CritiqueOutput
  - FinalBMC
  - AgentStatus
  - CostTracker
- **No any types** except in error boundaries
- **Zod or io-ts:** Use for runtime validation of agent outputs

### NR6: Logging & Observability
- **Session logging:** Log all agent calls, outputs, and errors to sessionStorage or IndexedDB
- **Debug mode:** Optional URL param `?debug=true` shows all internal JSON payloads
- **Error reporting:** On error, show user-friendly message + "Report this error" button (copies session log)
- **No PII logging:** Never log user's actual business idea or answers in plain text (ok to log hashes)

### NR7: Deletability
- **Single folder:** Entire tool in `app/tools/bmc-generator/`
- **No config mutations:** Tool doesn't modify:
  - Next.js config
  - Tailwind config
  - ESLint rules
  - TypeScript config
- **No route registration:** Tool uses file-based routing only (`/tools/bmc-generator/page.tsx` → `/tools/bmc-generator`)
- **Cleanup:** Deleting `app/tools/bmc-generator/` fully removes tool (plus route in `app/layout.tsx` if registered)

## Out of Scope (Phase 1)

- Database persistence (results not saved, ephemeral per session)
- User accounts / authentication
- BMC history / comparisons
- Export to PowerPoint, Figma, etc. (markdown table only)
- Collaboration (single-user only)
- Refinement loop ("regenerate this section")
- Custom agent prompt injection
- Language support (English only)
