# BMC Generator Architecture Specialist

**Type:** Specialist agent  
**Domain:** AI-powered multi-phase orchestration with cost tracking and timeout guarantees  
**Scope:** Designs orchestration patterns for long-running generation tasks with partial-output fallbacks  
**Status:** Codified from production implementation (May 2026)

## When to Use This Agent

When building:
- Multi-phase AI generation workflows (3+ sequential or parallel agent phases)
- Tools with cost constraints and timeout requirements
- Services where "no output on failure" is unacceptable to users
- Workflows that need to gracefully degrade under time pressure

**NOT for:** Simple single-agent API wrappers, batch jobs, or systems where failures are acceptable.

## Key Patterns

### Pattern 1: Three-Tier Timeout Strategy

**Problem:** 90-second timeout with no fallback → user sees blank canvas + pays for partial work.

**Solution:** Guarantee output at every tier:

```typescript
// Tier 1: Normal completion (<90s)
// All phases complete → show full results + charge actual cost

// Tier 2: Soft timeout at 100s (10s grace window)
// If phase overruns, skip remaining agents in that phase
// Example: Phase 2 at 40s with 7/9 agents done → skip agents 8-9, move to Phase 3
// Charge actual cost only

// Tier 3: Hard timeout at 120s (full abort)
// Return partial output:
//   - If Phase 2+ complete: return partial canvas (mark missing sections)
//   - If Phase 2 incomplete: return agent outputs as markdown
//   - If Phase 1 only: return error + try-again button
// Charge actual cost only (not full budget)
```

**Implementation:**

```typescript
const totalTimeoutMs = 120_000;
const startTime = Date.now();

while (phasesRemaining) {
  const elapsed = Date.now() - startTime;
  const timeRemaining = totalTimeoutMs - elapsed;
  
  // 5s or less: abort current phase, return what we have
  if (timeRemaining < 5_000) {
    return buildFallbackOutput(completedPhases);
  }
  
  // Less than 15s: skip remaining agents in this phase
  if (timeRemaining < 15_000 && phaseCount > currentPhase) {
    skipRemainingAgents();
  }
  
  // Run current phase with timeout
  const phaseTimeout = Math.min(30_000, timeRemaining - 5_000);
  const result = await runPhaseWithTimeout(phase, phaseTimeout);
  
  if (result.timedOut) {
    // Move to next phase even if incomplete
    continueWithoutWaiting();
  }
}
```

### Pattern 2: Stateless HTTP + EventSource (Not WebSocket)

**Advantage:** Simple one-way streaming, lower server overhead, Vercel-friendly.

**Server-side:**

```typescript
// In-memory state per session
const sseSessionState = new Map<string, {
  events: Event[];
  lastEventId: number;
  createdAt: number;
  clientCount: number;
}>();

// Emit progress events
export function emitProgressEvent(sessionId, phase, activeAgent, progress, tokens, cost) {
  const state = sseSessionState.get(sessionId);
  if (!state) return; // session doesn't exist
  
  const event = {
    id: state.lastEventId++,
    type: 'progress',
    data: { phase, activeAgent, progress, tokens, costUSD: cost },
    timestamp: Date.now(),
  };
  
  state.events.push(event);
  // Keep only last 100 events for replay
  if (state.events.length > 100) state.events.shift();
}

// GET endpoint returns EventSource stream
export async function GET(request: Request) {
  const { sessionId, resumeFrom } = parseQuery(request.url);
  const state = sseSessionState.get(sessionId);
  
  if (!state) return new Response('Session not found', { status: 404 });
  
  // If client disconnected and reconnects, replay missed events
  const missedEvents = state.events.filter(e => e.id > parseInt(resumeFrom || '0'));
  
  return new Response(
    new ReadableStream({
      start(controller) {
        // Send missed events first
        missedEvents.forEach(e => {
          controller.enqueue(`id: ${e.id}\ndata: ${JSON.stringify(e.data)}\n\n`);
        });
        
        // Then stream new events
        const interval = setInterval(() => {
          const latestEvent = state.events[state.events.length - 1];
          if (latestEvent?.id > resumeFrom) {
            controller.enqueue(`id: ${latestEvent.id}\ndata: ${JSON.stringify(latestEvent.data)}\n\n`);
          }
        }, 500);
        
        // 30-second heartbeat
        const heartbeat = setInterval(() => {
          controller.enqueue(`:heartbeat\n\n`);
        }, 30_000);
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store, no-cache',
        'Connection': 'keep-alive',
      },
    },
  );
}
```

**Client-side:**

```typescript
class SSEManager {
  private eventSource: EventSource | null = null;
  private listeners = new Map<string, Set<Function>>();
  private lastEventId = 0;
  
  connect(sessionId: string) {
    const url = `/api/bmc-generator/stream/status?sessionId=${sessionId}&resumeFrom=${this.lastEventId}`;
    this.eventSource = new EventSource(url);
    
    this.eventSource.addEventListener('progress', (e) => {
      this.lastEventId = parseInt(e.lastEventId);
      this.notify('progress', JSON.parse(e.data));
    });
    
    this.eventSource.addEventListener('error', () => {
      // Auto-reconnect with exponential backoff
      this.reconnect(sessionId);
    });
  }
  
  private reconnect(sessionId: string) {
    const backoff = Math.min(10_000, (this.retries + 1) * 1000);
    setTimeout(() => this.connect(sessionId), backoff);
  }
  
  on(type: string, listener: Function) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
  }
  
  private notify(type: string, data: any) {
    this.listeners.get(type)?.forEach(fn => fn(data));
  }
}
```

### Pattern 3: Cost Tracking with Partial Output Guarantee

**Key Principle:** Charge only for tokens actually used, not for budgeted amount.

```typescript
class CostTracker {
  private phases: Array<{
    phase: number;
    agents: string[];
    inputTokens: number;
    outputTokens: number;
    costUSD: number;
  }> = [];
  
  record(phase: number, agentName: string, inputTokens: number, outputTokens: number) {
    const inputCost = (inputTokens / 1_000_000) * 0.80; // Haiku input price
    const outputCost = (outputTokens / 1_000_000) * 4.00; // Haiku output price
    const cost = inputCost + outputCost;
    
    this.phases.push({
      phase,
      agents: [agentName],
      inputTokens,
      outputTokens,
      costUSD: cost,
    });
  }
  
  calculate() {
    const totalInputTokens = this.phases.reduce((sum, p) => sum + p.inputTokens, 0);
    const totalOutputTokens = this.phases.reduce((sum, p) => sum + p.outputTokens, 0);
    const estimatedCostUSD = this.phases.reduce((sum, p) => sum + p.costUSD, 0);
    
    return {
      totalInputTokens,
      totalOutputTokens,
      estimatedCostUSD,
    };
  }
}

// In /generate endpoint:
const costTracker = new CostTracker();
let completedPhases = 0;

try {
  // Phase 2: 9 agents in parallel
  const phase2Results = await Promise.allSettled(
    agents.map(agent => {
      const timeout = getPhaseTimeout(timeRemaining, currentPhase);
      return runAgentWithTimeout(agent, timeout);
    })
  );
  
  // Record cost for each completed agent
  phase2Results.forEach((result, idx) => {
    if (result.status === 'fulfilled') {
      const { inputTokens, outputTokens } = result.value;
      costTracker.record(2, agents[idx], inputTokens, outputTokens);
    }
  });
  
  completedPhases = 2;
} catch (e) {
  // Even on error, charge only for work completed
  const { estimatedCostUSD } = costTracker.calculate();
  return Response.json({
    completion: 'partial',
    completedPhases,
    costCharged: estimatedCostUSD,
    message: `Generation failed after Phase ${completedPhases}. Charged: $${estimatedCostUSD.toFixed(4)}`,
  });
}
```

### Pattern 4: Parallel Agent Orchestration with Graceful Degradation

**Use Promise.allSettled(), not Promise.all():**

```typescript
// Promise.all: one failure aborts everything
const results = await Promise.all(agentPromises);  // ❌ one failed agent = whole generation fails

// Promise.allSettled: one failure is just a count
const results = await Promise.allSettled(agentPromises);  // ✅ 8/9 agents is fine

// Process results
const completed = results.filter(r => r.status === 'fulfilled').map(r => r.value);
const failed = results.filter(r => r.status === 'rejected').map(r => r.reason);

if (completed.length >= minimumAgents) {
  // Have enough to continue
  synthesizePartialOutput(completed);
} else {
  // Failed too many agents
  return fallbackResponse(completed, failed);
}
```

## Security & Cost Guards

1. **Token Binding:** generation_token signed with HMAC-SHA256, bound to session_id
2. **One-Time Use:** Token marked as used after /answers, fresh token generated for /generate
3. **Rate Limiting:** Per-IP (5 calls/min), per-session concurrent (1), per-session daily (20), global cost ceiling ($0.50/day)
4. **Cost Ceiling:** Hard stop if daily global cost exceeds $0.50

## Common Pitfalls

❌ **Mistake:** Hard timeout with no fallback (user sees blank canvas, feels robbed)  
✅ **Fix:** Three-tier strategy guarantees output at every tier

❌ **Mistake:** Charging full budget even on partial completion  
✅ **Fix:** Track actual tokens used, charge only that amount

❌ **Mistake:** WebSocket for progress updates (stateful, harder to scale)  
✅ **Fix:** EventSource (stateless, one-way, event replay for resilience)

❌ **Mistake:** Promise.all for parallel agents (one failure = total failure)  
✅ **Fix:** Promise.allSettled (partial results acceptable)

## Related Skills

- `.claude/skills/project/bmc-generator-authentication` — Session management for paid tools
- `.claude/skills/project/component-css-module-safety` — CSS Module patterns for dynamic components

## Further Reading

- `workspaces/bmc-generator/journal/0034-RISK-timeout-partial-output-cost-guarantee.md` — Full risk analysis
- `workspaces/bmc-generator/journal/0034-COMPLETION-phase-implementation-complete.md` — Implementation details
