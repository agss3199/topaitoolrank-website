import type { AgentStatus } from './types';

/**
 * SSEManager — manages EventSource connection with auto-reconnect and event replay.
 *
 * Lifecycle:
 * 1. `connect(sessionId)` opens EventSource
 * 2. Listens for 'progress', 'heartbeat', 'error', 'complete' events
 * 3. On disconnect: stores lastEventId, attempts auto-reconnect
 * 4. On reconnect: replays events from lastEventId (server keeps last 100 events)
 * 5. On session_expired: emits to listeners, closes permanently
 */

type EventType = 'progress' | 'heartbeat' | 'error' | 'complete';

interface SSEEvent {
  type: EventType;
  timestamp: string;
  data?: AgentStatus | { [key: string]: unknown };
}

type EventListener = (event: SSEEvent) => void;

export class SSEManager {
  private eventSource: EventSource | null = null;
  private sessionId: string | null = null;
  private lastEventId: string | null = null;
  private listeners: Map<EventType, Set<EventListener>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // 1s, backoff to 10s
  private isManuallyClosed = false;

  /**
   * Connect to EventSource stream.
   *
   * Auto-reconnects on disconnect unless `disconnect()` is called.
   * Re-emits stored events from lastEventId.
   *
   * @param sessionId - Session ID from /start response
   * @throws Error if already connected
   */
  connect(sessionId: string): void {
    if (this.eventSource !== null) {
      throw new Error('SSEManager already connected. Call disconnect() first.');
    }

    this.sessionId = sessionId;
    this.isManuallyClosed = false;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;

    this.openConnection();
  }

  /**
   * Disconnect from EventSource.
   *
   * Prevents auto-reconnect.
   */
  disconnect(): void {
    this.isManuallyClosed = true;
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Register a listener for a specific event type.
   *
   * Multiple listeners per type are supported.
   * Listener is called immediately for each matching event.
   */
  on(type: EventType, listener: EventListener): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  /**
   * Remove a listener.
   */
  off(type: EventType, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener);
  }

  /**
   * Get current reconnection state.
   */
  getState(): {
    connected: boolean;
    sessionId: string | null;
    lastEventId: string | null;
    reconnectAttempts: number;
  } {
    return {
      connected: this.eventSource !== null && this.eventSource.readyState === 1, // EventSource.OPEN = 1
      sessionId: this.sessionId,
      lastEventId: this.lastEventId,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Internal: Open the EventSource connection.
   */
  private openConnection(): void {
    if (!this.sessionId) {
      throw new Error('sessionId not set');
    }

    const url = new URL(
      '/api/bmc-generator/stream/status',
      window.location.origin
    );
    url.searchParams.set('session_id', this.sessionId);
    if (this.lastEventId) {
      url.searchParams.set('resumeFrom', this.lastEventId);
    }

    this.eventSource = new EventSource(url.toString());

    // Generic progress event
    this.eventSource.addEventListener('progress', (e: Event) => {
      this.handleEvent(e as MessageEvent, 'progress');
    });

    // Heartbeat/keepalive
    this.eventSource.addEventListener('heartbeat', (e: Event) => {
      this.handleEvent(e as MessageEvent, 'heartbeat');
    });

    // Error or session_expired
    this.eventSource.addEventListener('error', (e: Event) => {
      this.handleEvent(e as MessageEvent, 'error');
    });

    // Generation complete
    this.eventSource.addEventListener('complete', (e: Event) => {
      this.handleEvent(e as MessageEvent, 'complete');
    });

    // Connection opened
    this.eventSource.addEventListener('open', () => {
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000; // Reset backoff
    });

    // Connection error (network down, 401, 403, 404, 500, etc.)
    this.eventSource.onerror = (e) => {
      this.handleConnectionError(e);
    };
  }

  /**
   * Internal: Handle incoming event from server.
   */
  private handleEvent(e: MessageEvent, type: EventType): void {
    // Update lastEventId for reconnection replay
    if (e.lastEventId) {
      this.lastEventId = e.lastEventId;
    }

    // Parse data
    let data: unknown = null;
    try {
      data = e.data ? JSON.parse(e.data) : null;
    } catch {
      // Invalid JSON — emit raw event
      data = { raw: e.data };
    }

    // Check for session_expired in error events
    if (type === 'error' && data && typeof data === 'object') {
      const errorData = data as any;
      if (errorData.error === 'session_expired') {
        // Session expired — close permanently
        this.isManuallyClosed = true;
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
      }
    }

    // Emit to listeners
    const event: SSEEvent = {
      type,
      timestamp: new Date().toISOString(),
      data: data as AgentStatus | { [key: string]: unknown },
    };

    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (err) {
          console.error(`Error in ${type} listener:`, err);
        }
      });
    }
  }

  /**
   * Internal: Handle connection error.
   *
   * If manually closed, don't reconnect.
   * Otherwise, attempt auto-reconnect with exponential backoff.
   */
  private handleConnectionError(e: Event): void {
    if (this.isManuallyClosed) {
      return;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    // Check if we should retry
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      // Max retries exhausted — emit final error
      const listeners = this.listeners.get('error');
      if (listeners) {
        listeners.forEach((listener) => {
          listener({
            type: 'error',
            timestamp: new Date().toISOString(),
            data: {
              error: 'max_reconnect_attempts',
              message: `Failed to reconnect after ${this.maxReconnectAttempts} attempts`,
            },
          });
        });
      }
      return;
    }

    // Schedule reconnect with exponential backoff (capped at 10s)
    this.reconnectAttempts += 1;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 10000);

    setTimeout(() => {
      if (!this.isManuallyClosed && this.sessionId) {
        try {
          this.openConnection();
        } catch (err) {
          console.error('Error reconnecting SSE:', err);
        }
      }
    }, delay);
  }
}

/**
 * Export helper to create SSEManager singleton.
 */
export function createSSEManager(): SSEManager {
  return new SSEManager();
}
