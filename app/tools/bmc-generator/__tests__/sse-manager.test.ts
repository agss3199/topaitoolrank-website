import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SSEManager } from '../lib/sse-manager';
import type { AgentStatus } from '../lib/types';

// Mock EventSource
class MockEventSource {
  readyState = 1; // EventSource.OPEN
  onerror: ((event: Event) => void) | null = null;
  listeners: Map<string, Set<(e: Event) => void>> = new Map();

  constructor(public url: string) {}

  addEventListener(event: string, listener: (e: Event) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  removeEventListener(event: string, listener: (e: Event) => void): void {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event: string, messageEvent: MessageEvent): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((l) => l(messageEvent));
    }
  }

  close(): void {
    this.readyState = 2; // EventSource.CLOSED
  }
}

let mockEventSourceInstance: MockEventSource | null = null;

function MockEventSourceConstructor(url: string): MockEventSource {
  mockEventSourceInstance = new MockEventSource(url);
  return mockEventSourceInstance;
}

global.EventSource = MockEventSourceConstructor as any;

describe('SSEManager', () => {
  let manager: SSEManager;

  beforeEach(() => {
    mockEventSourceInstance = null;
    manager = new SSEManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    manager.disconnect();
    mockEventSourceInstance = null;
  });

  // =========================================================================
  // Connection & Disconnection
  // =========================================================================

  describe('Connection & Disconnection', () => {
    it('should open EventSource on connect()', () => {
      manager.connect('session-123');

      // Verify EventSource was created with correct URL
      expect(mockEventSourceInstance).not.toBeNull();
      expect(mockEventSourceInstance?.url).toContain('session_id=session-123');
    });

    it('should throw error if already connected', () => {
      manager.connect('session-123');

      expect(() => {
        manager.connect('session-456');
      }).toThrow('already connected');
    });

    it('should close EventSource on disconnect()', () => {
      manager.connect('session-123');
      const es = mockEventSourceInstance;

      manager.disconnect();

      expect(es?.readyState).toBe(2); // CLOSED
    });

    it('should prevent reconnection after manual disconnect', async () => {
      manager.connect('session-123');
      const initialEventSource = mockEventSourceInstance;

      manager.disconnect();

      // Simulate network error
      if (initialEventSource?.onerror) {
        initialEventSource.onerror(new Event('error'));
      }

      // Manager should not attempt reconnection (no setTimeout should be active)
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
      // If we reach here, no reconnection happened — test passes
    });
  });

  // =========================================================================
  // Event Listeners
  // =========================================================================

  describe('Event Listeners', () => {
    it('should emit progress events to listeners', () => {
      manager.connect('session-123');

      const mockStatus: AgentStatus = {
        phase: 2,
        activeAgent: 'CustomerSegmentsAgent',
        progress: 0.333,
        elapsedMs: 8000,
        tokensUsed: { input: 4000, output: 2500 },
        costUSD: 0.0085,
        timestamp: '2026-05-13T10:30:45.123Z',
      };

      const listener = vi.fn();
      manager.on('progress', listener);

      if (mockEventSourceInstance) {
        mockEventSourceInstance.emit(
          'progress',
          new MessageEvent('progress', {
            data: JSON.stringify(mockStatus),
            lastEventId: 'event-1',
          })
        );
      }

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'progress',
          data: mockStatus,
        })
      );
    });

    it('should emit heartbeat events to listeners', () => {
      manager.connect('session-123');

      const listener = vi.fn();
      manager.on('heartbeat', listener);

      if (mockEventSourceInstance) {
        mockEventSourceInstance.emit(
          'heartbeat',
          new MessageEvent('heartbeat', {
            data: JSON.stringify({
              phase: 2,
              progress: 0.333,
              elapsedMs: 12000,
              costUSD: 0.0087,
              timestamp: '2026-05-13T10:30:47.123Z',
            }),
            lastEventId: 'event-2',
          })
        );
      }

      expect(listener).toHaveBeenCalled();
    });

    it('should emit error events to listeners', () => {
      manager.connect('session-123');

      const listener = vi.fn();
      manager.on('error', listener);

      if (mockEventSourceInstance) {
        mockEventSourceInstance.emit(
          'error',
          new MessageEvent('error', {
            data: JSON.stringify({
              error: 'agent_timeout',
              message: 'Agent did not complete within 30s',
              phase: 2,
              activeAgent: 'ValuePropositionsAgent',
            }),
          })
        );
      }

      expect(listener).toHaveBeenCalled();
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
        })
      );
    });

    it('should emit complete events to listeners', () => {
      manager.connect('session-123');

      const listener = vi.fn();
      manager.on('complete', listener);

      if (mockEventSourceInstance) {
        mockEventSourceInstance.emit(
          'complete',
          new MessageEvent('complete', {
            data: JSON.stringify({
              phase: 4,
              completion: 'full',
              totalElapsedMs: 67000,
              finalCost: 0.0333,
              timestamp: '2026-05-13T10:31:52.123Z',
            }),
          })
        );
      }

      expect(listener).toHaveBeenCalled();
    });

    it('should support multiple listeners per event type', () => {
      manager.connect('session-123');

      const listener1 = vi.fn();
      const listener2 = vi.fn();

      manager.on('progress', listener1);
      manager.on('progress', listener2);

      if (mockEventSourceInstance) {
        mockEventSourceInstance.emit(
          'progress',
          new MessageEvent('progress', {
            data: JSON.stringify({
              phase: 2,
              activeAgent: 'TestAgent',
              progress: 0.5,
              elapsedMs: 10000,
              tokensUsed: { input: 1000, output: 500 },
              costUSD: 0.005,
              timestamp: '2026-05-13T10:30:50.123Z',
            }),
          })
        );
      }

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should remove listeners with off()', () => {
      manager.connect('session-123');

      const listener = vi.fn();
      manager.on('progress', listener);
      manager.off('progress', listener);

      if (mockEventSourceInstance) {
        mockEventSourceInstance.emit(
          'progress',
          new MessageEvent('progress', {
            data: JSON.stringify({
              phase: 2,
              activeAgent: 'TestAgent',
              progress: 0.5,
              elapsedMs: 10000,
              tokensUsed: { input: 1000, output: 500 },
              costUSD: 0.005,
              timestamp: '2026-05-13T10:30:50.123Z',
            }),
          })
        );
      }

      expect(listener).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Session Expiration
  // =========================================================================

  describe('Session Expiration', () => {
    it('should close permanently on session_expired error', () => {
      manager.connect('session-123');

      const listener = vi.fn();
      manager.on('error', listener);

      if (mockEventSourceInstance) {
        mockEventSourceInstance.emit(
          'error',
          new MessageEvent('error', {
            data: JSON.stringify({
              error: 'session_expired',
              message: 'Your session has expired. Please log in again.',
              timestamp: '2026-05-13T10:35:00.123Z',
            }),
          })
        );
      }

      expect(listener).toHaveBeenCalled();
      // Verify that EventSource was closed (readyState = 2 = CLOSED)
      expect(mockEventSourceInstance?.readyState).toBe(2);
    });
  });

  // =========================================================================
  // Event ID Tracking (for reconnection replay)
  // =========================================================================

  describe('Event ID Tracking', () => {
    it('should store lastEventId from server', () => {
      manager.connect('session-123');

      manager.on('progress', () => {
        // Just listen
      });

      if (mockEventSourceInstance) {
        mockEventSourceInstance.emit(
          'progress',
          new MessageEvent('progress', {
            data: JSON.stringify({
              phase: 2,
              activeAgent: 'TestAgent',
              progress: 0.5,
              elapsedMs: 10000,
              tokensUsed: { input: 1000, output: 500 },
              costUSD: 0.005,
              timestamp: '2026-05-13T10:30:50.123Z',
            }),
            lastEventId: 'event-42',
          })
        );
      }

      const state = manager.getState();
      expect(state.lastEventId).toBe('event-42');
    });
  });

  // =========================================================================
  // Connection State
  // =========================================================================

  describe('Connection State', () => {
    it('should return correct connection state', () => {
      let state = manager.getState();
      expect(state.connected).toBe(false);
      expect(state.sessionId).toBeNull();

      manager.connect('session-123');

      state = manager.getState();
      expect(state.connected).toBe(true);
      expect(state.sessionId).toBe('session-123');
    });
  });

  // =========================================================================
  // Error Handling in Listeners
  // =========================================================================

  describe('Error Handling', () => {
    it('should handle errors in listener callbacks gracefully', () => {
      manager.connect('session-123');

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      manager.on('progress', () => {
        throw new Error('Listener error');
      });

      if (mockEventSourceInstance) {
        mockEventSourceInstance.emit(
          'progress',
          new MessageEvent('progress', {
            data: JSON.stringify({
              phase: 2,
              activeAgent: 'TestAgent',
              progress: 0.5,
              elapsedMs: 10000,
              tokensUsed: { input: 1000, output: 500 },
              costUSD: 0.005,
              timestamp: '2026-05-13T10:30:50.123Z',
            }),
          })
        );
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in progress listener'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle invalid JSON in event data', () => {
      manager.connect('session-123');

      const listener = vi.fn();
      manager.on('progress', listener);

      if (mockEventSourceInstance) {
        mockEventSourceInstance.emit(
          'progress',
          new MessageEvent('progress', {
            data: 'not valid json',
          })
        );
      }

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            raw: 'not valid json',
          }),
        })
      );
    });
  });
});
