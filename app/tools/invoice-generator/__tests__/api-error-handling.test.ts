import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * API Error Handling tests for invoice generator.
 * Verifies correct user-facing messages for each HTTP error status.
 */

interface ApiErrorResult {
  message: string;
  action: 'show-message' | 'redirect';
  redirectTo?: string;
}

/**
 * Maps HTTP error responses to user-facing messages.
 * This is the error handling logic extracted for testability.
 */
function handleApiError(status: number): ApiErrorResult {
  switch (status) {
    case 400:
      return {
        message: 'Invalid request. Please check your input and try again.',
        action: 'show-message',
      };
    case 401:
      return {
        message: 'Your session has expired. Please log in again.',
        action: 'redirect',
        redirectTo: '/auth/login',
      };
    case 403:
      return {
        message: 'You do not have permission to access this resource.',
        action: 'show-message',
      };
    case 404:
      return {
        message: 'Session not found. It may have been deleted or expired.',
        action: 'show-message',
      };
    case 429:
      return {
        message: 'Too many requests. Please wait a moment and try again.',
        action: 'show-message',
      };
    case 500:
    default:
      return {
        message: 'Something went wrong while processing your request. Please try again later.',
        action: 'show-message',
      };
  }
}

describe('API Error Handling', () => {
  it('400 error: shows generic message without exposing field details', () => {
    const result = handleApiError(400);
    expect(result.action).toBe('show-message');
    expect(result.message).toContain('check your input');
    // Must NOT expose internal field names or validation details
    expect(result.message).not.toMatch(/field|column|schema|sql/i);
  });

  it('401 error: redirects to login', () => {
    const result = handleApiError(401);
    expect(result.action).toBe('redirect');
    expect(result.redirectTo).toBe('/auth/login');
  });

  it('403 error: shows access denied message', () => {
    const result = handleApiError(403);
    expect(result.action).toBe('show-message');
    expect(result.message).toContain('permission');
  });

  it('404 error: shows session not found message', () => {
    const result = handleApiError(404);
    expect(result.action).toBe('show-message');
    expect(result.message).toContain('not found');
  });

  it('429 error: shows rate limit message with retry suggestion', () => {
    const result = handleApiError(429);
    expect(result.action).toBe('show-message');
    expect(result.message).toContain('Too many requests');
    expect(result.message).toMatch(/wait|try again/i);
  });

  it('500 error: shows generic processing error', () => {
    const result = handleApiError(500);
    expect(result.action).toBe('show-message');
    expect(result.message).toContain('Something went wrong');
    // Must NOT expose stack traces or internal details
    expect(result.message).not.toMatch(/stack|trace|exception|internal/i);
  });
});
