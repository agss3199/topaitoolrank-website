/**
 * GET /api/bmc-generator/stream/status
 *
 * Server-Sent Events (SSE) endpoint for real-time generation progress.
 * Client connects via EventSource and receives progress updates as they happen.
 *
 * Event types:
 *   - progress: Agent finished a phase, emits phase, activeAgent, progress%, tokens, cost
 *   - heartbeat: Keepalive signal (every 30s) to prevent connection timeout
 *   - error: Error occurred during generation (error message included)
 *   - complete: Generation finished (final result included)
 *   - session_expired: Session TTL expired, client should redirect to login
 *
 * Client reconnection (via useSSEListener hook):
 *   - If disconnected, attempts to reconnect with exponential backoff (1s → 10s max)
 *   - Sends ?resumeFrom=<lastEventId> to request event replay from server
 *   - Server keeps last 100 events in memory for replay capability
 */

import { validateAndRefreshSession } from '@/app/tools/bmc-generator/lib/middleware-helpers';

// ---------------------------------------------------------------------------
// Module-level state (persists across requests in the same server instance)
// ---------------------------------------------------------------------------

interface SSEEvent {
  id: string;
  type: 'progress' | 'heartbeat' | 'error' | 'complete' | 'session_expired';
  data: Record<string, unknown>;
}

interface SessionSSEState {
  events: SSEEvent[];
  lastEventId: string;
  createdAt: number;
  clientCount: number;
}

// Maps session_id -> { events: SSEEvent[], lastEventId, createdAt, clientCount }
const sseSessionStates = new Map<string, SessionSSEState>();

const MAX_EVENTS_PER_SESSION = 100;
const EVENT_TTL_MS = 30 * 60 * 1000; // 30 minutes
const HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds

// Periodic cleanup of stale session states (every 100 events emitted across all sessions)
let eventCountSinceCleanup = 0;
const CLEANUP_INTERVAL = 100;

function cleanupStaleSessions(): void {
  const now = Date.now();
  for (const [sessionId, state] of sseSessionStates.entries()) {
    if (now - state.createdAt > EVENT_TTL_MS && state.clientCount === 0) {
      sseSessionStates.delete(sessionId);
    }
  }
}

function getOrCreateSessionState(sessionId: string): SessionSSEState {
  let state = sseSessionStates.get(sessionId);
  if (!state) {
    state = {
      events: [],
      lastEventId: '0',
      createdAt: Date.now(),
      clientCount: 0,
    };
    sseSessionStates.set(sessionId, state);
  }
  return state;
}

function addEvent(sessionId: string, event: SSEEvent): void {
  const state = getOrCreateSessionState(sessionId);
  state.events.push(event);
  if (state.events.length > MAX_EVENTS_PER_SESSION) {
    state.events.shift();
  }
  state.lastEventId = event.id;

  eventCountSinceCleanup++;
  if (eventCountSinceCleanup >= CLEANUP_INTERVAL) {
    cleanupStaleSessions();
    eventCountSinceCleanup = 0;
  }
}

// Export for use by /generate endpoint to emit events
export function emitProgressEvent(
  sessionId: string,
  phase: number,
  activeAgent: string,
  progress: number,
  tokens: { input: number; output: number },
  costUSD: number
): void {
  const eventId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  addEvent(sessionId, {
    id: eventId,
    type: 'progress',
    data: {
      phase,
      activeAgent,
      progress,
      tokens,
      costUSD,
      timestamp: new Date().toISOString(),
    },
  });
}

export function emitErrorEvent(sessionId: string, errorMsg: string): void {
  const eventId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  addEvent(sessionId, {
    id: eventId,
    type: 'error',
    data: {
      error: errorMsg,
      timestamp: new Date().toISOString(),
    },
  });
}

export function emitCompleteEvent(
  sessionId: string,
  finalBMC: unknown,
  totalCost: number,
  wallClockMs: number
): void {
  const eventId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  addEvent(sessionId, {
    id: eventId,
    type: 'complete',
    data: {
      finalBMC,
      totalCost,
      wallClockMs,
      timestamp: new Date().toISOString(),
    },
  });
}

// ---------------------------------------------------------------------------
// GET /api/bmc-generator/stream/status
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<Response> {
  // 1. Validate session
  const sessionValidation = await validateAndRefreshSession(request);
  if (!sessionValidation.valid) {
    return new Response('Unauthorized', { status: 401 });
  }

  const sessionId = new URL(request.url).searchParams.get('session_id') || '';
  if (!sessionId) {
    return new Response('Missing session_id', { status: 400 });
  }

  const resumeFrom = new URL(request.url).searchParams.get('resumeFrom') || '0';

  // 2. Set up SSE stream
  const state = getOrCreateSessionState(sessionId);
  state.clientCount++;

  // Find resume position: if resumeFrom is provided, find the event with that ID
  let resumeIdx = 0;
  if (resumeFrom !== '0') {
    resumeIdx = state.events.findIndex((e) => e.id === resumeFrom);
    if (resumeIdx >= 0) {
      resumeIdx++; // Start from next event
    } else {
      resumeIdx = 0; // If not found, replay all
    }
  }

  // 3. Create readable stream for SSE
  const encoder = new TextEncoder();
  let heartbeatTimeout: NodeJS.Timeout | null = null;
  let isClosed = false;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode(': connected\n\n'));

      // Send buffered events from resume point
      for (let i = resumeIdx; i < state.events.length; i++) {
        const event = state.events[i];
        const eventData = `id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
        controller.enqueue(encoder.encode(eventData));
      }

      // Set up heartbeat to keep connection alive
      heartbeatTimeout = setInterval(() => {
        if (!isClosed) {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        }
      }, HEARTBEAT_INTERVAL_MS);
    },
    cancel() {
      isClosed = true;
      state.clientCount--;
      if (heartbeatTimeout) {
        clearInterval(heartbeatTimeout);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// Export getOrCreateSessionState for testing
export function _testInternals() {
  return {
    sseSessionStates,
    getOrCreateSessionState,
    addEvent,
  };
}
