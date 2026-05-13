import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSSEListener } from '../hooks/useSSEListener';
import type { AgentStatus } from '../lib/types';

// ---------------------------------------------------------------------------
// Mock SSEManager — we control events from tests
// ---------------------------------------------------------------------------
type EventCallback = (event: { type: string; timestamp: string; data?: unknown }) => void;

const mockListeners: Map<string, Set<EventCallback>> = new Map();
let mockConnectCalled = false;
let mockConnectSessionId = '';
let mockDisconnectCalled = false;
let mockGetStateReturn = { connected: true, sessionId: null as string | null, lastEventId: null, reconnectAttempts: 0 };

const mockSSE = {
  connect: vi.fn((sid: string) => {
    mockConnectCalled = true;
    mockConnectSessionId = sid;
  }),
  disconnect: vi.fn(() => {
    mockDisconnectCalled = true;
  }),
  on: vi.fn((type: string, cb: EventCallback) => {
    if (!mockListeners.has(type)) mockListeners.set(type, new Set());
    mockListeners.get(type)!.add(cb);
  }),
  off: vi.fn((type: string, cb: EventCallback) => {
    mockListeners.get(type)?.delete(cb);
  }),
  getState: vi.fn(() => mockGetStateReturn),
};

vi.mock('../lib/sse-manager', () => ({
  createSSEManager: () => mockSSE,
  SSEManager: vi.fn(),
}));

function emitEvent(type: string, data?: unknown) {
  const listeners = mockListeners.get(type);
  if (listeners) {
    listeners.forEach((cb) =>
      cb({ type, timestamp: new Date().toISOString(), data })
    );
  }
}

function makeAgentStatus(overrides: Partial<AgentStatus> = {}): AgentStatus {
  return {
    phase: 2,
    activeAgent: 'ValuePropositionsAgent',
    progress: 0.5,
    elapsedMs: 15000,
    tokensUsed: { input: 1200, output: 800 },
    costUSD: 0.012,
    timestamp: '2026-05-13T10:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('useSSEListener', () => {
  beforeEach(() => {
    mockListeners.clear();
    mockConnectCalled = false;
    mockConnectSessionId = '';
    mockDisconnectCalled = false;
    mockGetStateReturn = { connected: true, sessionId: null, lastEventId: null, reconnectAttempts: 0 };
    vi.clearAllMocks();
  });

  // === Connection lifecycle ===

  it('connects to SSE on mount with provided sessionId', () => {
    renderHook(() => useSSEListener('sess-abc'));
    expect(mockSSE.connect).toHaveBeenCalledWith('sess-abc');
  });

  it('disconnects on unmount', () => {
    const { unmount } = renderHook(() => useSSEListener('sess-abc'));
    unmount();
    expect(mockSSE.disconnect).toHaveBeenCalled();
  });

  it('registers progress, complete, error, and heartbeat listeners', () => {
    renderHook(() => useSSEListener('sess-abc'));
    expect(mockSSE.on).toHaveBeenCalledWith('progress', expect.any(Function));
    expect(mockSSE.on).toHaveBeenCalledWith('complete', expect.any(Function));
    expect(mockSSE.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockSSE.on).toHaveBeenCalledWith('heartbeat', expect.any(Function));
  });

  it('removes all listeners on unmount', () => {
    const { unmount } = renderHook(() => useSSEListener('sess-abc'));
    unmount();
    expect(mockSSE.off).toHaveBeenCalledWith('progress', expect.any(Function));
    expect(mockSSE.off).toHaveBeenCalledWith('complete', expect.any(Function));
    expect(mockSSE.off).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockSSE.off).toHaveBeenCalledWith('heartbeat', expect.any(Function));
  });

  it('reconnects when sessionId changes', () => {
    const { rerender } = renderHook(
      ({ sid }) => useSSEListener(sid),
      { initialProps: { sid: 'sess-1' } }
    );
    expect(mockSSE.connect).toHaveBeenCalledWith('sess-1');

    rerender({ sid: 'sess-2' });
    expect(mockSSE.disconnect).toHaveBeenCalled();
    expect(mockSSE.connect).toHaveBeenCalledWith('sess-2');
  });

  // === Initial state ===

  it('returns null state initially', () => {
    const { result } = renderHook(() => useSSEListener('sess-abc'));
    expect(result.current.state).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('returns isConnected from SSEManager state', () => {
    mockGetStateReturn.connected = true;
    const { result } = renderHook(() => useSSEListener('sess-abc'));
    expect(result.current.isConnected).toBe(true);
  });

  // === Progress events ===

  it('updates state on progress event', () => {
    const { result } = renderHook(() => useSSEListener('sess-abc'));
    const status = makeAgentStatus({ phase: 2, progress: 0.6, activeAgent: 'ChannelsAgent' });

    act(() => emitEvent('progress', status));

    expect(result.current.state).not.toBeNull();
    expect(result.current.state!.phase).toBe(2);
    expect(result.current.state!.progress).toBe(0.6);
    expect(result.current.state!.activeAgent).toBe('ChannelsAgent');
  });

  it('updates cost from progress event', () => {
    const { result } = renderHook(() => useSSEListener('sess-abc'));

    act(() => emitEvent('progress', makeAgentStatus({ costUSD: 0.025 })));

    expect(result.current.state!.costUSD).toBe(0.025);
  });

  it('updates tokens from progress event', () => {
    const { result } = renderHook(() => useSSEListener('sess-abc'));

    act(() =>
      emitEvent('progress', makeAgentStatus({ tokensUsed: { input: 5000, output: 3000 } }))
    );

    expect(result.current.state!.tokensUsed.input).toBe(5000);
    expect(result.current.state!.tokensUsed.output).toBe(3000);
  });

  it('updates elapsedMs from progress event', () => {
    const { result } = renderHook(() => useSSEListener('sess-abc'));

    act(() => emitEvent('progress', makeAgentStatus({ elapsedMs: 45000 })));

    expect(result.current.state!.elapsedMs).toBe(45000);
  });

  it('handles multiple sequential progress events', () => {
    const { result } = renderHook(() => useSSEListener('sess-abc'));

    act(() => emitEvent('progress', makeAgentStatus({ phase: 2, progress: 0.3 })));
    expect(result.current.state!.progress).toBe(0.3);

    act(() => emitEvent('progress', makeAgentStatus({ phase: 2, progress: 0.7 })));
    expect(result.current.state!.progress).toBe(0.7);

    act(() => emitEvent('progress', makeAgentStatus({ phase: 3, progress: 0.1 })));
    expect(result.current.state!.phase).toBe(3);
    expect(result.current.state!.progress).toBe(0.1);
  });

  it('ignores progress event with no data', () => {
    const { result } = renderHook(() => useSSEListener('sess-abc'));

    act(() => emitEvent('progress', undefined));

    expect(result.current.state).toBeNull();
  });

  // === Complete event ===

  it('sets isComplete on complete event', () => {
    const { result } = renderHook(() => useSSEListener('sess-abc'));

    act(() => emitEvent('complete', { finalBMC: { summary: 'done' } }));

    expect(result.current.isComplete).toBe(true);
  });

  it('stores complete data from complete event', () => {
    const { result } = renderHook(() => useSSEListener('sess-abc'));
    const payload = { finalBMC: { executive_summary: 'test' } };

    act(() => emitEvent('complete', payload));

    expect(result.current.completeData).toEqual(payload);
  });

  // === Error events ===

  it('sets error on error event', () => {
    const { result } = renderHook(() => useSSEListener('sess-abc'));

    act(() => emitEvent('error', { error: 'rate_limited', message: 'Too many requests' }));

    expect(result.current.error).toBe('Too many requests');
  });

  it('falls back to error field if no message', () => {
    const { result } = renderHook(() => useSSEListener('sess-abc'));

    act(() => emitEvent('error', { error: 'unknown_failure' }));

    expect(result.current.error).toBe('unknown_failure');
  });

  it('sets default error message when data has no fields', () => {
    const { result } = renderHook(() => useSSEListener('sess-abc'));

    act(() => emitEvent('error', {}));

    expect(result.current.error).toBe('Generation failed');
  });

  it('handles session_expired error', () => {
    const { result } = renderHook(() => useSSEListener('sess-abc'));

    act(() => emitEvent('error', { error: 'session_expired' }));

    expect(result.current.error).toBe('Session expired. Please log in again.');
  });

  it('handles max_reconnect_attempts error', () => {
    const { result } = renderHook(() => useSSEListener('sess-abc'));

    act(() =>
      emitEvent('error', {
        error: 'max_reconnect_attempts',
        message: 'Failed to reconnect after 10 attempts',
      })
    );

    expect(result.current.error).toBe('Failed to reconnect after 10 attempts');
  });

  // === Heartbeat events ===

  it('updates lastHeartbeat on heartbeat event', () => {
    const { result } = renderHook(() => useSSEListener('sess-abc'));

    act(() => emitEvent('heartbeat', { status: 'alive' }));

    expect(result.current.lastHeartbeat).not.toBeNull();
  });

  // === Disconnect function ===

  it('exposes disconnect function', () => {
    const { result } = renderHook(() => useSSEListener('sess-abc'));
    expect(typeof result.current.disconnect).toBe('function');
  });

  it('disconnect calls SSEManager disconnect', () => {
    const { result } = renderHook(() => useSSEListener('sess-abc'));

    act(() => result.current.disconnect());

    expect(mockSSE.disconnect).toHaveBeenCalled();
  });

  // === Edge cases ===

  it('handles empty sessionId by not connecting', () => {
    renderHook(() => useSSEListener(''));
    expect(mockSSE.connect).not.toHaveBeenCalled();
  });

  it('preserves state across heartbeat events', () => {
    const { result } = renderHook(() => useSSEListener('sess-abc'));

    act(() => emitEvent('progress', makeAgentStatus({ phase: 3, progress: 0.4 })));
    act(() => emitEvent('heartbeat', { status: 'alive' }));

    expect(result.current.state!.phase).toBe(3);
    expect(result.current.state!.progress).toBe(0.4);
  });
});
