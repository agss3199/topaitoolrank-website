import { describe, it, expect } from 'vitest';
import {
  getUserMessage,
  isAuthError,
  isNetworkError,
  buildServerErrorLog,
} from '../lib/error-messages';

/**
 * Tier 1 (Unit) tests for error-messages utility.
 *
 * Covers all HTTP status codes specified in the deliverables,
 * plus boundary and fallback cases.
 */

describe('getUserMessage', () => {
  it('returns correct message for 400 (invalid input)', () => {
    expect(getUserMessage(400)).toBe(
      'Invalid input. Please check your answers and try again.'
    );
  });

  it('returns correct message for 401 (session expired)', () => {
    expect(getUserMessage(401)).toBe('Session expired. Please log in again.');
  });

  it('returns correct message for 403 (access denied)', () => {
    expect(getUserMessage(403)).toBe('Access denied. Please refresh and try again.');
  });

  it('returns correct message for 404 (session not found)', () => {
    expect(getUserMessage(404)).toBe('Session not found. Please start over.');
  });

  it('returns correct message for 429 (too many requests)', () => {
    expect(getUserMessage(429)).toBe('Too many requests. Please wait and try again.');
  });

  it('returns correct message for 500 (processing error)', () => {
    expect(getUserMessage(500)).toBe('Processing error. Please try again later.');
  });

  it('returns server error message for other 5xx codes', () => {
    expect(getUserMessage(503)).toBe('Processing error. Please try again later.');
    expect(getUserMessage(502)).toBe('Processing error. Please try again later.');
  });

  it('returns generic 4xx message for unmapped client errors', () => {
    const msg = getUserMessage(422);
    expect(msg).toBe('Invalid input. Please check your answers and try again.');
  });

  it('returns generic fallback for unexpected codes', () => {
    expect(getUserMessage(0)).toBe('Something went wrong. Please try again.');
    expect(getUserMessage(200)).toBe('Something went wrong. Please try again.');
  });
});

describe('isAuthError', () => {
  it('returns true for 401', () => {
    expect(isAuthError(401)).toBe(true);
  });

  it('returns false for 403', () => {
    expect(isAuthError(403)).toBe(false);
  });

  it('returns false for 400', () => {
    expect(isAuthError(400)).toBe(false);
  });

  it('returns false for 500', () => {
    expect(isAuthError(500)).toBe(false);
  });
});

describe('isNetworkError', () => {
  it('returns true for code 0 (network failure)', () => {
    expect(isNetworkError(0)).toBe(true);
  });

  it('returns false for any non-zero code', () => {
    expect(isNetworkError(400)).toBe(false);
    expect(isNetworkError(500)).toBe(false);
    expect(isNetworkError(1)).toBe(false);
  });
});

describe('buildServerErrorLog', () => {
  it('includes all required fields', () => {
    const log = buildServerErrorLog({
      session_id: 'sess-123',
      error_type: 'ValidationError',
      status_code: 400,
    });

    expect(log.session_id).toBe('sess-123');
    expect(log.error_type).toBe('ValidationError');
    expect(log.status_code).toBe(400);
    expect(log.user_message).toBe(
      'Invalid input. Please check your answers and try again.'
    );
    expect(typeof log.timestamp).toBe('string');
  });

  it('timestamp is ISO 8601 format', () => {
    const log = buildServerErrorLog({
      session_id: null,
      error_type: 'AuthError',
      status_code: 401,
    });
    expect(() => new Date(log.timestamp).toISOString()).not.toThrow();
  });

  it('accepts null session_id (unauthenticated errors)', () => {
    const log = buildServerErrorLog({
      session_id: null,
      error_type: 'AuthError',
      status_code: 401,
    });
    expect(log.session_id).toBeNull();
  });

  it('includes internal_message when provided', () => {
    const log = buildServerErrorLog({
      session_id: 'sess-xyz',
      error_type: 'AgentFailure',
      status_code: 500,
      internal_message: 'OrchestratorAgent timeout after 90s',
    });
    expect(log.internal_message).toBe('OrchestratorAgent timeout after 90s');
  });

  it('user_message is derived from status_code via getUserMessage', () => {
    const log = buildServerErrorLog({
      session_id: 'sess-abc',
      error_type: 'RateLimit',
      status_code: 429,
    });
    expect(log.user_message).toBe(getUserMessage(429));
  });
});
