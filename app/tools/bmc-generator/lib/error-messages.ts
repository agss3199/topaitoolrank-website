/**
 * Canonical user-facing error messages per HTTP status code.
 *
 * These messages are safe to display to end users (no internal details).
 * Server-side logging captures the full error context separately.
 */

/** Map HTTP status code to a safe user-facing message. */
export function getUserMessage(code: number): string {
  switch (code) {
    case 400:
      return 'Invalid input. Please check your answers and try again.';
    case 401:
      return 'Session expired. Please log in again.';
    case 403:
      return 'Access denied. Please refresh and try again.';
    case 404:
      return 'Session not found. Please start over.';
    case 429:
      return 'Too many requests. Please wait and try again.';
    case 500:
      return 'Processing error. Please try again later.';
    default:
      if (code >= 500) {
        return 'Processing error. Please try again later.';
      }
      if (code >= 400 && code < 500) {
        return 'Invalid input. Please check your answers and try again.';
      }
      return 'Something went wrong. Please try again.';
  }
}

/** Returns true when the code signals the user must re-authenticate. */
export function isAuthError(code: number): boolean {
  return code === 401;
}

/** Returns true for network errors (APIClient uses code 0 for network failures). */
export function isNetworkError(code: number): boolean {
  return code === 0;
}

/** Structured server-side log payload for error responses. */
export interface ServerErrorLog {
  timestamp: string;
  session_id: string | null;
  error_type: string;
  status_code: number;
  user_message: string;
  internal_message?: string;
}

/**
 * Build a structured server-side error log payload.
 * Safe to write to server logs — internal_message is for ops only,
 * never sent to the client.
 */
export function buildServerErrorLog(params: {
  session_id: string | null;
  error_type: string;
  status_code: number;
  internal_message?: string;
}): ServerErrorLog {
  return {
    timestamp: new Date().toISOString(),
    session_id: params.session_id,
    error_type: params.error_type,
    status_code: params.status_code,
    user_message: getUserMessage(params.status_code),
    internal_message: params.internal_message,
  };
}
