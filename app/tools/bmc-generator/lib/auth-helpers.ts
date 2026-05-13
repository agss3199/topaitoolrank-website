/**
 * BMC Generator Authentication Helpers
 *
 * Provides input validation, rate limiting, account lockout,
 * session token management, and credential loading.
 *
 * All helpers are isolated to the BMC Generator tool.
 * No shared auth with other tools.
 */

import * as crypto from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export interface LockoutResult {
  locked: boolean;
  retryAfterSeconds?: number;
}

export interface TokenVerifyResult {
  valid: boolean;
  username?: string;
}

export interface Credentials {
  username: string;
  password: string;
}

// ---------------------------------------------------------------------------
// Input Validation & Timing-Safe Credential Comparison
// ---------------------------------------------------------------------------

/**
 * Validate login form input.
 *
 * Returns a generic error message for ALL validation failures
 * to prevent user enumeration.
 *
 * Username rules: 3-20 alphanumeric characters + underscore/dash
 * Password rules: 8-64 characters
 */
export function validateLoginInput(
  username: string,
  password: string
): ValidationResult {
  const GENERIC_ERROR = 'Missing username or password';

  if (!username || !password) {
    return { valid: false, error: GENERIC_ERROR };
  }

  // Username: 3-20 chars, alphanumeric + underscore + dash
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  if (!usernameRegex.test(username)) {
    return { valid: false, error: GENERIC_ERROR };
  }

  // Password: 8-64 characters
  if (password.length < 8 || password.length > 64) {
    return { valid: false, error: GENERIC_ERROR };
  }

  return { valid: true };
}

/**
 * Constant-time credential comparison using HMAC digests.
 *
 * Prevents timing attacks where attackers measure response time differences
 * to recover credentials character-by-character.
 *
 * Both fields are HMAC-digested to fixed length before comparison, ensuring
 * timing is independent of where mismatches occur.
 *
 * @param inputUser - Username from login form
 * @param inputPass - Password from login form
 * @param expectedUser - Expected username from credentials
 * @param expectedPass - Expected password from credentials
 * @param secret - Shared secret for HMAC (should be the session secret)
 */
export function verifyCredentials(
  inputUser: string,
  inputPass: string,
  expectedUser: string,
  expectedPass: string,
  secret: string
): boolean {
  // Create fixed-length HMAC digests for both username and password
  const digestUser = (val: string) =>
    crypto.createHmac('sha256', secret).update(val).digest('hex');

  const userDigest = digestUser(inputUser);
  const expectedUserDigest = digestUser(expectedUser);

  const passDigest = digestUser(inputPass);
  const expectedPassDigest = digestUser(expectedPass);

  // Both comparisons must run unconditionally (no short-circuit AND)
  // to prevent timing leakage about which field failed
  let userMatch = false;
  let passMatch = false;

  try {
    userMatch = crypto.timingSafeEqual(
      Buffer.from(userDigest),
      Buffer.from(expectedUserDigest)
    );
  } catch {
    // timingSafeEqual throws if lengths differ; treat as mismatch
    userMatch = false;
  }

  try {
    passMatch = crypto.timingSafeEqual(
      Buffer.from(passDigest),
      Buffer.from(expectedPassDigest)
    );
  } catch {
    // timingSafeEqual throws if lengths differ; treat as mismatch
    passMatch = false;
  }

  return userMatch && passMatch;
}

// ---------------------------------------------------------------------------
// Rate Limiter (per-IP)
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  attempts: number;
  firstAttemptAt: number;
}

interface RateLimiterConfig {
  maxAttempts: number;
  windowMs: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimiterConfig;
  private callCount = 0;

  constructor(config: RateLimiterConfig) {
    this.config = config;
  }

  /**
   * Evict expired entries periodically to prevent unbounded map growth.
   * Called every N-th operation to amortize cleanup cost.
   *
   * Prevents memory exhaustion from attacker flooding with spoofed IPs.
   */
  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.firstAttemptAt >= this.config.windowMs) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Check whether the given key (IP address) is currently rate-limited.
   */
  check(key: string): RateLimitResult {
    // Periodically evict expired entries (every 100th call)
    this.callCount = (this.callCount + 1) % 100;
    if (this.callCount === 0) {
      this.evictExpired();
    }

    const entry = this.store.get(key);
    if (!entry) {
      return { allowed: true };
    }

    const elapsed = Date.now() - entry.firstAttemptAt;

    // Window has expired -- clear entry and allow
    if (elapsed >= this.config.windowMs) {
      this.store.delete(key);
      return { allowed: true };
    }

    // Under the limit -- allow
    if (entry.attempts < this.config.maxAttempts) {
      return { allowed: true };
    }

    // Over the limit -- blocked
    const remainingMs = this.config.windowMs - elapsed;
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(remainingMs / 1000),
    };
  }

  /**
   * Record a failed attempt for the given key.
   */
  recordFailure(key: string): void {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now - entry.firstAttemptAt >= this.config.windowMs) {
      // Start a new window
      this.store.set(key, { attempts: 1, firstAttemptAt: now });
      return;
    }

    entry.attempts += 1;
  }

  /**
   * Clear all state (for testing purposes).
   */
  reset(): void {
    this.store.clear();
    this.callCount = 0;
  }
}

// ---------------------------------------------------------------------------
// Account Lockout (per-username)
// ---------------------------------------------------------------------------

interface LockoutEntry {
  failureTimestamps: number[];
  lockedUntil: number | null;
}

interface AccountLockoutConfig {
  maxAttempts: number;
  trackingWindowMs: number;
  lockDurationMs: number;
}

export class AccountLockout {
  private store = new Map<string, LockoutEntry>();
  private config: AccountLockoutConfig;
  private callCount = 0;

  constructor(config: AccountLockoutConfig) {
    this.config = config;
  }

  /**
   * Evict expired lockout entries to prevent unbounded map growth.
   * Called every N-th operation to amortize cleanup cost.
   *
   * Prevents memory exhaustion from attacker flooding with spoofed usernames.
   */
  private evictExpired(): void {
    const now = Date.now();
    for (const [username, entry] of this.store.entries()) {
      // Keep entry if: currently locked OR has recent failures
      const hasRecentFailures = entry.failureTimestamps.some(
        (ts) => now - ts < this.config.trackingWindowMs
      );
      const isCurrentlyLocked =
        entry.lockedUntil !== null && now < entry.lockedUntil;

      if (!hasRecentFailures && !isCurrentlyLocked) {
        this.store.delete(username);
      }
    }
  }

  /**
   * Check whether the given username is currently locked out.
   */
  check(username: string): LockoutResult {
    // Periodically evict expired entries (every 100th call)
    this.callCount = (this.callCount + 1) % 100;
    if (this.callCount === 0) {
      this.evictExpired();
    }

    const entry = this.store.get(username);
    if (!entry) {
      return { locked: false };
    }

    const now = Date.now();

    // Check if currently locked
    if (entry.lockedUntil !== null) {
      if (now < entry.lockedUntil) {
        const remainingMs = entry.lockedUntil - now;
        return {
          locked: true,
          retryAfterSeconds: Math.ceil(remainingMs / 1000),
        };
      }
      // Lock has expired -- clear lock
      entry.lockedUntil = null;
    }

    // Count recent failures within the tracking window
    const recentFailures = entry.failureTimestamps.filter(
      (ts) => now - ts < this.config.trackingWindowMs
    );

    // Update stored timestamps to only keep recent ones
    entry.failureTimestamps = recentFailures;

    return { locked: false };
  }

  /**
   * Record a failed login attempt for the given username.
   */
  recordFailure(username: string): void {
    const now = Date.now();
    let entry = this.store.get(username);

    if (!entry) {
      entry = { failureTimestamps: [], lockedUntil: null };
      this.store.set(username, entry);
    }

    // Filter to only recent failures
    entry.failureTimestamps = entry.failureTimestamps.filter(
      (ts) => now - ts < this.config.trackingWindowMs
    );

    entry.failureTimestamps.push(now);

    // Check if threshold reached
    if (entry.failureTimestamps.length >= this.config.maxAttempts) {
      entry.lockedUntil = now + this.config.lockDurationMs;
    }
  }

  /**
   * Record a successful login -- resets the failure counter.
   */
  recordSuccess(username: string): void {
    this.store.delete(username);
  }

  /**
   * Clear all state (for testing purposes).
   */
  reset(): void {
    this.store.clear();
    this.callCount = 0;
  }
}

// ---------------------------------------------------------------------------
// Session Token (HMAC-based signed token)
// ---------------------------------------------------------------------------

/**
 * Create a signed session token.
 *
 * Format: base64(payload).base64(signature)
 * Payload: { username, issuedAt, expiresAt }
 *
 * Uses HMAC-SHA256 for signing. No external JWT library needed
 * for this simple use case.
 *
 * @param username - The authenticated username
 * @param secret - Server-side secret for signing (>= 32 bytes)
 * @param ttlSeconds - Token time-to-live in seconds (default 86400 = 24h)
 */
export function createSessionToken(
  username: string,
  secret: string,
  ttlSeconds: number = 86400
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    username,
    iat: now,
    exp: now + ttlSeconds,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verify a session token.
 *
 * Checks signature integrity and expiration.
 */
export function verifySessionToken(
  token: string,
  secret: string
): TokenVerifyResult {
  if (!token || typeof token !== 'string') {
    return { valid: false };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false };
  }

  const [payloadB64, receivedSig] = parts;

  // Verify signature
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  // Timing-safe comparison to prevent timing attacks
  if (
    receivedSig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(
      Buffer.from(receivedSig),
      Buffer.from(expectedSig)
    )
  ) {
    return { valid: false };
  }

  // Parse payload
  let payload: { username: string; iat: number; exp: number };
  try {
    const decoded = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    payload = JSON.parse(decoded);
  } catch {
    return { valid: false };
  }

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (now >= payload.exp) {
    return { valid: false };
  }

  return { valid: true, username: payload.username };
}

// ---------------------------------------------------------------------------
// Credential Loading
// ---------------------------------------------------------------------------

/**
 * Load credentials from environment variables.
 *
 * Raises a clear error if env vars are missing or empty.
 * NEVER returns defaults -- always fails loudly.
 */
export function getCredentials(): Credentials {
  const username = process.env.BMC_GENERATOR_USERNAME;
  const password = process.env.BMC_GENERATOR_PASSWORD;

  if (!username || !password) {
    throw new Error(
      'BMC_GENERATOR_USERNAME and BMC_GENERATOR_PASSWORD must be set'
    );
  }

  return { username, password };
}
