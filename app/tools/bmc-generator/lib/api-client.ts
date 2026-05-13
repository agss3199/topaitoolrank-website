import type {
  BusinessContext,
  FinalBMC,
  AgentStatus,
} from './types';

/**
 * APIClient — wrapper for BMC Generator API endpoints.
 *
 * All methods return typed responses or throw an APIError with code, message, and optional details.
 * No response is ever `null` or `undefined` — all error cases throw.
 *
 * Uses absolute URLs (`/api/bmc-generator/...`) for compatibility with SPA routing.
 */

export class APIError extends Error {
  constructor(
    public code: number,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

interface StartResponse {
  session_id: string;
  questions: string[];
  generation_token: string;
  estimated_cost: number;
  estimated_latency_seconds: number;
}

interface AnswersResponse {
  session_id: string;
  context: BusinessContext;
  next_action: 'start_generation';
}

interface GenerateResponse {
  session_id: string;
  status: 'in_progress' | 'complete' | 'partial' | 'failed';
  final_bmc: FinalBMC | null;
  completion: 'full' | 'partial' | 'agents_only';
  completion_percentage: number;
  cost: number;
  wallClockMs: number;
  error: string | null;
}

interface LogoutResponse {
  success: boolean;
  redirect: string;
}

export class APIClient {
  private baseURL = '/api/bmc-generator';

  /**
   * POST /api/bmc-generator/start
   *
   * Submit business idea, receive clarifying questions.
   *
   * @throws APIError on any HTTP error or network failure
   */
  async start(idea: string): Promise<StartResponse> {
    return this.post<StartResponse>('/start', { idea });
  }

  /**
   * POST /api/bmc-generator/answers
   *
   * Submit answers to clarifying questions, receive normalized BusinessContext.
   *
   * @throws APIError on validation failure or token expiry
   */
  async answers(
    sessionId: string,
    generationToken: string,
    answers: Record<string, string>
  ): Promise<AnswersResponse> {
    return this.post<AnswersResponse>('/answers', {
      session_id: sessionId,
      generation_token: generationToken,
      answers,
    });
  }

  /**
   * POST /api/bmc-generator/generate
   *
   * Trigger Phases 2-4 generation (parallel agents + synthesis).
   * Returns immediately with status="in_progress" if generation started,
   * or complete/partial/failed with the final BMC.
   *
   * @throws APIError on auth failure or rate limit
   */
  async generate(
    sessionId: string,
    generationToken: string,
    context: BusinessContext
  ): Promise<GenerateResponse> {
    return this.post<GenerateResponse>('/generate', {
      session_id: sessionId,
      generation_token: generationToken,
      context,
    });
  }

  /**
   * GET /api/bmc-generator/stream/status
   *
   * Open EventSource for real-time progress updates during generation.
   *
   * **Connection Lifecycle:**
   * 1. Client calls this method, opens EventSource
   * 2. Server validates session_id and bmc_session cookie
   * 3. If invalid: EventSource closes immediately with no events
   * 4. If valid: Server streams AgentStatus events
   * 5. Client receives: progress | heartbeat | error | complete events
   * 6. On disconnect: Client can reconnect with resumeFrom parameter
   * 7. On session_expired: Server emits error event, closes stream
   *
   * @param sessionId - Session ID from /start response
   * @param resumeFrom - Optional timestamp to replay events from (for recovery after disconnect)
   * @returns EventSource (never throws; errors emit as error events)
   *
   * **Event Listener Pattern:**
   * ```typescript
   * const es = client.streamStatus(sessionId);
   * es.addEventListener('progress', (e) => {
   *   const status = JSON.parse(e.data) as AgentStatus;
   *   // Update UI with phase, progress, cost, etc.
   * });
   * es.addEventListener('error', (e) => {
   *   if (e.message.includes('session_expired')) {
   *     // Redirect to login
   *   }
   * });
   * ```
   */
  streamStatus(sessionId: string, resumeFrom?: string): EventSource {
    const url = new URL(this.baseURL + '/stream/status', window.location.origin);
    url.searchParams.set('session_id', sessionId);
    if (resumeFrom) {
      url.searchParams.set('resumeFrom', resumeFrom);
    }
    return new EventSource(url.toString());
  }

  /**
   * POST /api/bmc-generator/logout
   *
   * End session, clear authentication cookie.
   *
   * @throws APIError if already logged out (400)
   */
  async logout(): Promise<LogoutResponse> {
    return this.post<LogoutResponse>('/logout', {});
  }

  /**
   * Internal: POST helper with error handling.
   */
  private async post<T>(endpoint: string, body: unknown): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache',
        },
        body: JSON.stringify(body),
        credentials: 'include', // Include bmc_session cookie
      });

      // Parse response body (may be JSON error or successful response)
      let data: unknown;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          data = null;
        }
      } else {
        data = null;
      }

      // Non-2xx response
      if (!response.ok) {
        const message =
          typeof data === 'object' &&
          data !== null &&
          'error' in data &&
          typeof (data as any).error === 'string'
            ? (data as any).error
            : `HTTP ${response.status}`;

        throw new APIError(response.status, message, data);
      }

      // 2xx response but empty body
      if (!data) {
        throw new APIError(response.status, 'Empty response body');
      }

      return data as T;
    } catch (err) {
      // Network error or JSON parse error
      if (err instanceof APIError) {
        throw err;
      }

      if (err instanceof TypeError) {
        throw new APIError(0, `Network error: ${err.message}`);
      }

      throw new APIError(500, `Unknown error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

/**
 * Export singleton instance for use in components.
 */
export const apiClient = new APIClient();
