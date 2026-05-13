# Real-Time Status UI Specification

## Overview

The real-time status display is **critical to user experience**. Users are willing to wait 60-90 seconds for BMC generation as long as they can SEE activity happening in real-time.

This spec defines the status UI component and the SSE data stream that powers it.

---

## UI Component: StatusDisplay

### Visual Layout

```
┌─────────────────────────────────────────────────────────┐
│  BMC Generator — Generation in Progress                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Currently Analyzing: ValuePropositionsAgent             │
│  (Identifying why customers would buy this idea...)      │
│                                                           │
│  Phase 1: Gathering Context                      ✅ 100% │
│           ⚫ OrchestratorAgent                             │
│                                                           │
│  Phase 2: Generating BMC Sections              📊  67%   │
│           ✅ CustomerSegmentsAgent                        │
│           ✅ ValuePropositionsAgent                       │
│           ⚫ ChannelsAgent                                │
│           ⚫ CustomerRelationshipsAgent                   │
│           ⚪ RevenueStreamsAgent                          │
│           ⚪ KeyResourcesAgent                            │
│           ⚪ KeyActivitiesAgent                           │
│           ⚪ KeyPartnersAgent                             │
│           ⚪ CostStructureAgent                           │
│                                                           │
│  Phase 3: Critiquing Business Model              ⏳  0%   │
│           ⚪ MarketFeasibilityAgent                       │
│           ⚪ BusinessModelAgent                           │
│           ⚪ CompetitivePositioningAgent                  │
│                                                           │
│  Phase 4: Creating Final BMC                    ⏳  0%   │
│           ⚪ SynthesisAgent                                │
│                                                           │
│  ─────────────────────────────────────────────────────   │
│  Elapsed: 23 seconds                                      │
│  Cost so far: $0.015 / Est. total: ~$0.032               │
│  ─────────────────────────────────────────────────────   │
│                                                           │
│                    [Cancel Generation]                    │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Legend

- **✅** — Agent completed successfully
- **⚫** — Agent currently executing (pulse animation)
- **⚬** — Agent waiting to start (not yet active)
- **⚪** — Agent queued but not started
- **❌** — Agent failed (optional: show error)

### Color Scheme

- **✅ Green** — Complete
- **⚫ Blue** — Active/Running
- **⚬ Gray** — Waiting
- **❌ Red** — Failed (if applicable)

### Animations

- **Pulsing circles** for active agents (opacity 1.0 → 0.5 → 1.0, 1s cycle)
- **Smooth transitions** when agent status changes
- **No flashing or jarring changes**

---

## Component Props

```typescript
interface StatusDisplayProps {
  currentPhase: 1 | 2 | 3 | 4;
  phases: {
    [phaseNum]: {
      name: string;
      agents: {
        [agentName]: {
          name: string;
          status: "pending" | "active" | "complete" | "failed";
          description?: string;
          tokensUsed?: { input: number; output: number };
          latencyMs?: number;
          error?: string;
        };
      };
      percentComplete: number; // 0-100
    };
  };
  activeAgent?: {
    name: string;
    description: string;
  };
  elapsedSeconds: number;
  costSoFar: number; // USD
  estimatedTotalCost: number; // USD
  onCancel?: () => void;
  debugMode?: boolean;
}
```

---

## SSE Stream Specification

### Endpoint

```
GET /api/bmc-generator/stream/status
```

### Query Parameters

```
?request_id=UUID  // To identify which generation session
?debug=true       // Optional: include token/latency data
```

### Response Format

Server sends SSE updates with this shape:

```typescript
interface StatusUpdate {
  timestamp: string; // ISO8601
  phase: 1 | 2 | 3 | 4;
  phaseProgress: number; // 0-100 percent
  activeAgent?: {
    name: string;
    description: string;
    startedAt: string; // ISO8601
  };
  agents: {
    [phaseName]: {
      [agentName]: {
        status: "pending" | "active" | "complete" | "failed";
        completedAt?: string; // ISO8601
        tokensUsed?: { input: number; output: number };
        latencyMs?: number;
        error?: {
          message: string;
          code: string;
        };
      };
    };
  };
  elapsedMs: number;
  costSoFar: number;
  estimatedTotalCostUSD: number;
}
```

### Example Stream Sequence

```
event: status-update
data: {"phase": 1, "phaseProgress": 0, "activeAgent": {"name": "OrchestratorAgent", "description": "Asking clarifying questions..."}, "elapsedMs": 500, "costSoFar": 0.0002, "estimatedTotalCostUSD": 0.033}

event: status-update
data: {"phase": 1, "phaseProgress": 50, "activeAgent": {"name": "OrchestratorAgent", "description": "Normalizing context answers..."}, "elapsedMs": 2500, "costSoFar": 0.0008, "estimatedTotalCostUSD": 0.033}

event: status-update
data: {"phase": 1, "phaseProgress": 100, "agents": {"Phase 1": {"OrchestratorAgent": {"status": "complete", "completedAt": "2026-05-11T10:30:05Z", "tokensUsed": {"input": 1500, "output": 500}, "latencyMs": 3200}}}, "elapsedMs": 3500, "costSoFar": 0.0012, "estimatedTotalCostUSD": 0.033}

event: status-update
data: {"phase": 2, "phaseProgress": 0, "activeAgent": {"name": "CustomerSegmentsAgent", "description": "Identifying target customer groups..."}, "elapsedMs": 3600, "costSoFar": 0.0012, "estimatedTotalCostUSD": 0.033}

event: status-update
data: {"phase": 2, "phaseProgress": 11, "activeAgent": {"name": "ValuePropositionsAgent", "description": "Defining why customers would choose this..."}, "elapsedMs": 8400, "costSoFar": 0.0065, "estimatedTotalCostUSD": 0.033, "agents": {"Phase 2": {"CustomerSegmentsAgent": {"status": "complete", "completedAt": "2026-05-11T10:30:10Z", "tokensUsed": {"input": 2100, "output": 2800}, "latencyMs": 6800}}}}

... (more updates as agents complete)

event: status-update
data: {"phase": 2, "phaseProgress": 100, "agents": {"Phase 2": {"CustomerSegmentsAgent": {...}, "ValuePropositionsAgent": {...}, ...}}, "elapsedMs": 35600, "costSoFar": 0.0205, "estimatedTotalCostUSD": 0.033}

event: status-update
data: {"phase": 3, "phaseProgress": 0, "activeAgent": {"name": "MarketFeasibilityAgent", "description": "Validating market opportunity..."}, "elapsedMs": 35700, "costSoFar": 0.0205, "estimatedTotalCostUSD": 0.033}

... (Phase 3 & 4 updates)

event: complete
data: {"finalCost": 0.032, "totalElapsedMs": 52400}
```

### Update Frequency

- **On event:** Emit immediately when agent status changes (pending → active → complete)
- **Minimum:** Every 2 seconds (if no events, send heartbeat with current elapsed time)
- **Maximum:** Every 500ms (debounce rapid changes to avoid overwhelming client)

### Connection Management

```typescript
// Client-side
const eventSource = new EventSource('/api/bmc-generator/stream/status?request_id=' + requestId);

eventSource.addEventListener('status-update', (event) => {
  const update = JSON.parse(event.data);
  setStatusDisplay(update);
});

eventSource.addEventListener('complete', (event) => {
  const result = JSON.parse(event.data);
  console.log(`Generation complete in ${result.totalElapsedMs}ms, cost: $${result.finalCost}`);
  eventSource.close();
  // Transition to results display
});

eventSource.addEventListener('error', (event) => {
  console.error('Stream error:', event);
  // Show error state, offer retry
});

// Timeout: if no updates for 10 seconds, force reconnect
const timeoutId = setTimeout(() => {
  eventSource.close();
  // Reconnect or show error
}, 10000);

eventSource.onmessage = () => clearTimeout(timeoutId); // Reset on any message
```

---

## Phase Progress Calculation

### Phase 1: Orchestration
```
Progress % = agents_complete / agents_total
           = 1 / 1 = 0-100%
```

### Phase 2: BMC Generation
```
Progress % = agents_complete / 9
           = 0/9 → 1/9 → 2/9 ... → 9/9
           = 0% → 11% → 22% → ... → 100%
```

### Phase 3: Red Team Critique
```
Progress % = agents_complete / 3
           = 0/3 → 1/3 → 2/3 → 3/3
           = 0% → 33% → 67% → 100%
```

### Phase 4: Synthesis
```
Progress % = synthesis_started ? (synthesis_complete ? 100% : 50%) : 0%
           = 0% → 50% (when agent starts) → 100% (when complete)
```

---

## Mobile Responsiveness

### Small Screen (<768px)

```
┌──────────────────────────────┐
│ BMC Generator — In Progress  │
├──────────────────────────────┤
│ ValuePropositionsAgent       │
│ (Identifying value...)       │
│                              │
│ Phase 1: ✅ 100%            │
│ Phase 2: 📊 67% (6/9)       │
│ Phase 3: ⏳ 0%              │
│ Phase 4: ⏳ 0%              │
│                              │
│ Elapsed: 23s  Cost: $0.015  │
│                              │
│  Phase 2 Agents:            │
│  ✅ ✅ ⚫ ⚬ ⚬              │
│  ⚬ ⚬ ⚬ ⚬                 │
│                              │
│       [Cancel]               │
└──────────────────────────────┘
```

Key changes:
- Stack phases vertically
- Agents in rows of 4-5 (wrapping)
- Smaller text but still readable
- Cost/elapsed on single line

---

## Accessibility

### ARIA Labels

```typescript
<div role="progressbar" aria-valuenow={67} aria-valuemin={0} aria-valuemax={100} aria-label="Phase 2 progress: 67% complete">
  {/* Visual progress bar */}
</div>

<div aria-live="polite" aria-atomic="true">
  Currently analyzing: {activeAgent.name}
</div>
```

### Color Not Only Indicator

- Use icons + text, not just colors
- ✅ for complete, ⚫ for active, etc.
- Always include agent name + status text

---

## Error States

### Agent Failure

If an agent fails:
1. Mark agent with ❌ (red)
2. Show error message on hover
3. Continue with other agents (don't block Phase 2 completion)
4. Mark phase as "complete with issues"

```
⚫ CustomerSegmentsAgent
❌ ValuePropositionsAgent (error: timeout after 30s)
⚫ ChannelsAgent
```

### Stream Disconnection

If SSE stream drops:
1. Show "Connection lost... reconnecting" message
2. Auto-reconnect after 2 seconds
3. If reconnection fails, show error + retry button

### Full Generation Failure

If entire generation fails:
1. Hide status display
2. Show error message + session log
3. Offer "Report this error" button (copy log to clipboard)

---

## Debug Mode

When `?debug=true` in URL:

```
Phase 2: 67% complete (6/9)
├─ ✅ CustomerSegmentsAgent (2100 in, 2800 out, 6.8s, $0.0068)
├─ ✅ ValuePropositionsAgent (1900 in, 3200 out, 8.1s, $0.0085)
├─ ⚫ ChannelsAgent (2000 in, 0 out, 5.2s active, ~$0.0052 est)
├─ ⚬ CustomerRelationshipsAgent (pending)
├─ ⚬ RevenueStreamsAgent (pending)
├─ ⚬ KeyResourcesAgent (pending)
├─ ⚬ KeyActivitiesAgent (pending)
├─ ⚬ KeyPartnersAgent (pending)
└─ ⚬ CostStructureAgent (pending)

Total tokens: 6000 in / 6000 out
Estimated final cost: $0.032
```

---

## Testing Checklist

- [ ] Updates flow smoothly (no jumps, stuttering)
- [ ] Phase progress % accurate
- [ ] Agent status transitions properly
- [ ] Mobile responsive at 375px, 768px, 1920px
- [ ] SSE stream handles reconnection
- [ ] No memory leaks (EventSource cleaned up)
- [ ] Accessibility: ARIA labels correct
- [ ] Error states graceful
- [ ] Cost calculation correct
- [ ] Elapsed time accurate
- [ ] No UI freezing during 60-90s wait
