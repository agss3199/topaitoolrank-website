# BMC Generator — Specs Index

## Domain Specifications

This directory contains the authoritative specifications for the BMC Generator tool. Every implementation decision must be grounded in one of these specs.

### 1. **Agent Specifications** (`agents.md`) ✅
Defines the contract for each of 14 agents:
- Input schema (what each agent receives)
- Output schema (structured JSON)
- System prompt and instructions
- Error handling expectations
- Cost/latency bounds

**Status:** Complete. All 14 agent contracts fully specified with system prompts.

### 2. **Data Model & Validation** (`data-model.md`) ✅
Zod schemas for all I/O types:
- BusinessContext (Phase 1 output)
- BMCSection (parent type for Phase 2 outputs)
- CritiqueOutput (Phase 3 outputs)
- FinalBMC (Phase 4 output)
- AgentStatus / CostTracker
- Runtime validation logic

**Status:** Complete. All schemas with min/max bounds, validation entry points.

### 3. **API & Orchestration** (`api-orchestration.md`) ✅
Server-side flow for executing all 4 phases:
- Route definitions (`/api/bmc-generator/start`, `/answers`, `/generate`, `/stream/status`)
- Request/response contracts
- Phase transitions and state machine
- Error handling per phase
- Real-time status streaming (SSE)
- Inter-agent communication visibility (activeAgent field, phase progress)

**Status:** Complete. All endpoints, error responses, session management specified.

### 4. **UI/UX Flow** (`ui-ux-flow.md`) ✅
Frontend component specification:
- Page structure (`/tools/bmc-generator/`)
- Input form (business idea + context questions)
- Real-time status display (progress bar, active agent, cost)
- BMC rendering (markdown table + structured sections)
- Error states and fallbacks
- Accessibility (WCAG 2.1 AA)
- Mobile-first responsive design

**Status:** Complete. Component hierarchy, interactions, error cases, accessibility.

### 5. **Cost & Performance** (`cost-performance.md`) ✅
Operational constraints and budgeting:
- Token accounting per agent and phase
- Cost calculation and display (Haiku pricing: $0.80/1M input, $4.00/1M output)
- Estimated total cost: $0.033 per generation (user approved $0.05 budget)
- Latency targets: <90s wall-clock with visual feedback
- Performance optimization checkpoints
- Real-time cost tracking

**Status:** Complete. Token budgets per phase, cost reduction strategies, monitoring approach.

### 6. **Isolation & Deployment** (`isolation-deployment.md`) ✅
Guarantees for complete self-containment:
- File structure and import restrictions (no imports from app/components, app/hooks, etc.)
- Styling isolation (CSS Modules only, hardcoded colors, no Tailwind)
- API independence (only /api/bmc-generator/*)
- Deletion safety (removal checklist, grep verification commands)

**Status:** Complete. Isolation constraints, deletion verification protocol, technology stack limits.

### 7. **Authentication** (`authentication.md`) ✅ (NEW — May 12, 2026)
Simple username/password login protecting all BMC generation:
- Login page (`/tools/bmc-generator/login`)
- Session-based auth via HTTP-only cookie
- Protected routes (all /api/bmc-generator/*, main page)
- Logout functionality
- Integration with rate limiting and CSRF protection

**Status:** Complete. Single-user credentials via environment variables, stateless or session-based implementation options.

---

## Traceability Matrix

| Brief Requirement | Spec Coverage | Status |
|---|---|---|
| 13-agent orchestration | agents.md | ✅ |
| 4-phase execution | api-orchestration.md | ✅ |
| <45s latency | cost-performance.md | ✅ |
| <$0.02 cost | cost-performance.md | ⚠️ See note |
| Transparency (real-time updates) | api-orchestration.md + ui-ux-flow.md | ✅ |
| No shared components | isolation-deployment.md | ✅ |
| Cost display | ui-ux-flow.md + cost-performance.md | ✅ |
| Error isolation | agents.md + api-orchestration.md | ✅ |
| JSON-first architecture | data-model.md + agents.md | ✅ |
| Type safety (TypeScript) | data-model.md | ✅ |

**Note on Cost:** Current analysis estimates ~$0.033 per generation (overrun vs $0.02 target). Implementation must either:
1. Reduce agent count (consolidate sections)
2. Truncate inputs more aggressively
3. Accept higher budget and adjust brief

---

## Implementation Order

1. **Phase 0 — Foundation**
   - Create `/app/tools/bmc-generator/` folder structure
   - Implement Zod schemas from `data-model.md`
   - Create utility functions for cost tracking, logging

2. **Phase 1A — Phase 1 Agent + API**
   - Implement OrchestratorAgent system prompt
   - Create `/api/bmc-generator/start` endpoint (accepts user idea)
   - Create `/api/bmc-generator/questions` endpoint (generates questions)
   - Create `/api/bmc-generator/answers` endpoint (normalizes context)
   - Implement UI form for idea input + question answering

3. **Phase 1B — Real-Time Status Stream**
   - Implement `/api/bmc-generator/stream/status` (SSE endpoint)
   - Wire status updates from orchestration layer to frontend
   - Create status UI component (phase progress, active agent, cost)

4. **Phase 2 — BMC Generation Agents**
   - Implement all 9 BMC agent prompts
   - Create `/api/bmc-generator/generate` endpoint (executes Phase 2)
   - Implement `Promise.allSettled()` orchestration with error isolation
   - Test individual agent output validation

5. **Phase 3 — Critique Agents**
   - Implement all 3 critique agent prompts
   - Create critique execution layer (runs after Phase 2)
   - Implement critique output validation
   - Test critique → synthesis integration

6. **Phase 4 — Synthesis & Output**
   - Implement SynthesisAgent prompt
   - Create final BMC rendering (markdown table + structured sections)
   - Implement executive summary, recommendations, next steps
   - Create BMC display component

7. **Phase 5 — Integration & Error Handling**
   - Wire all 4 phases end-to-end
   - Implement error boundaries and fallbacks
   - Test failure scenarios (agent timeouts, malformed output)
   - Implement logging & debug mode

8. **Phase 6 — Polish & Optimization**
   - Verify <45s latency on realistic ideas
   - Verify cost tracking accuracy
   - Implement responsive design (mobile BMC display)
   - Add copy/share functionality for final BMC

---

## Review Checklist (Before Implementation)

- [ ] Cost estimate acceptable? (Currently $0.033, brief targets $0.02)
- [ ] 9 agents necessary or can consolidate to 6-7 agents?
- [ ] Acceptable to store generation results in sessionStorage only (not persistent)?
- [ ] OK to truncate user idea input to 150-200 words before distribution to agents?
- [ ] Confirm Haiku 3.5 is approved model (vs Sonnet/Opus)?
