import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  RateLimiter,
  AccountLockout,
  validateLoginInput,
  createSessionToken,
  verifySessionToken,
  getCredentials,
} from '../lib/auth-helpers';

// ---------------------------------------------------------------------------
// validateLoginInput
// ---------------------------------------------------------------------------
describe('validateLoginInput', () => {
  it('accepts valid username and password', () => {
    const result = validateLoginInput('demo_user', 'securepass1');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects empty username', () => {
    const result = validateLoginInput('', 'securepass1');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Missing username or password');
  });

  it('rejects empty password', () => {
    const result = validateLoginInput('demo_user', '');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Missing username or password');
  });

  it('rejects username shorter than 3 characters', () => {
    const result = validateLoginInput('ab', 'securepass1');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Missing username or password');
  });

  it('rejects username longer than 20 characters', () => {
    const result = validateLoginInput('a'.repeat(21), 'securepass1');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Missing username or password');
  });

  it('rejects username with special characters (not alphanumeric/underscore/dash)', () => {
    const result = validateLoginInput('user@name', 'securepass1');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Missing username or password');
  });

  it('accepts username with underscores and dashes', () => {
    const result = validateLoginInput('user-name_1', 'securepass1');
    expect(result.valid).toBe(true);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = validateLoginInput('demo_user', 'short');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Missing username or password');
  });

  it('rejects password longer than 64 characters', () => {
    const result = validateLoginInput('demo_user', 'a'.repeat(65));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Missing username or password');
  });

  it('returns generic error message for all validation failures (prevents enumeration)', () => {
    // All invalid inputs return the same generic message
    const cases = [
      validateLoginInput('', ''),
      validateLoginInput('ab', 'securepass1'),
      validateLoginInput('user@name', 'securepass1'),
      validateLoginInput('demo_user', 'short'),
    ];
    for (const result of cases) {
      expect(result.error).toBe('Missing username or password');
    }
  });
});

// ---------------------------------------------------------------------------
// RateLimiter (per-IP, 5 failures per 10 min window)
// ---------------------------------------------------------------------------
describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({
      maxAttempts: 5,
      windowMs: 10 * 60 * 1000, // 10 minutes
    });
  });

  it('allows requests under the limit', () => {
    const result = limiter.check('192.168.1.1');
    expect(result.allowed).toBe(true);
    expect(result.retryAfterSeconds).toBeUndefined();
  });

  it('tracks failed attempts per IP', () => {
    for (let i = 0; i < 4; i++) {
      limiter.recordFailure('192.168.1.1');
    }
    const result = limiter.check('192.168.1.1');
    expect(result.allowed).toBe(true);
  });

  it('blocks after 5 failed attempts from same IP', () => {
    for (let i = 0; i < 5; i++) {
      limiter.recordFailure('192.168.1.1');
    }
    const result = limiter.check('192.168.1.1');
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(600); // max 10 min
  });

  it('does not block different IPs', () => {
    for (let i = 0; i < 5; i++) {
      limiter.recordFailure('192.168.1.1');
    }
    const result = limiter.check('192.168.1.2');
    expect(result.allowed).toBe(true);
  });

  it('resets after the time window expires', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    for (let i = 0; i < 5; i++) {
      limiter.recordFailure('192.168.1.1');
    }
    expect(limiter.check('192.168.1.1').allowed).toBe(false);

    // Advance time past the 10-minute window
    vi.spyOn(Date, 'now').mockReturnValue(now + 10 * 60 * 1000 + 1);
    expect(limiter.check('192.168.1.1').allowed).toBe(true);

    vi.restoreAllMocks();
  });

  it('returns correct retryAfterSeconds', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    for (let i = 0; i < 5; i++) {
      limiter.recordFailure('192.168.1.1');
    }

    // Advance time by 3 minutes
    vi.spyOn(Date, 'now').mockReturnValue(now + 3 * 60 * 1000);
    const result = limiter.check('192.168.1.1');
    expect(result.allowed).toBe(false);
    // Should be ~7 minutes remaining (420 seconds)
    expect(result.retryAfterSeconds).toBeGreaterThanOrEqual(419);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(421);

    vi.restoreAllMocks();
  });
});

// ---------------------------------------------------------------------------
// AccountLockout (per-username, 5 failures per 24h, 30 min lock)
// ---------------------------------------------------------------------------
describe('AccountLockout', () => {
  let lockout: AccountLockout;

  beforeEach(() => {
    lockout = new AccountLockout({
      maxAttempts: 5,
      trackingWindowMs: 24 * 60 * 60 * 1000, // 24 hours
      lockDurationMs: 30 * 60 * 1000, // 30 minutes
    });
  });

  it('allows login attempts under the limit', () => {
    const result = lockout.check('admin');
    expect(result.locked).toBe(false);
  });

  it('tracks failed attempts per username', () => {
    for (let i = 0; i < 4; i++) {
      lockout.recordFailure('admin');
    }
    const result = lockout.check('admin');
    expect(result.locked).toBe(false);
  });

  it('locks account after 5 failed attempts', () => {
    for (let i = 0; i < 5; i++) {
      lockout.recordFailure('admin');
    }
    const result = lockout.check('admin');
    expect(result.locked).toBe(true);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(1800); // max 30 min
  });

  it('does not lock different usernames', () => {
    for (let i = 0; i < 5; i++) {
      lockout.recordFailure('admin');
    }
    const result = lockout.check('other_user');
    expect(result.locked).toBe(false);
  });

  it('unlocks after 30-minute lock duration expires', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    for (let i = 0; i < 5; i++) {
      lockout.recordFailure('admin');
    }
    expect(lockout.check('admin').locked).toBe(true);

    // Advance time past the 30-minute lock
    vi.spyOn(Date, 'now').mockReturnValue(now + 30 * 60 * 1000 + 1);
    expect(lockout.check('admin').locked).toBe(false);

    vi.restoreAllMocks();
  });

  it('resets failure count on successful login', () => {
    for (let i = 0; i < 4; i++) {
      lockout.recordFailure('admin');
    }
    lockout.recordSuccess('admin');

    // After reset, should be able to fail 4 more times without lock
    for (let i = 0; i < 4; i++) {
      lockout.recordFailure('admin');
    }
    expect(lockout.check('admin').locked).toBe(false);
  });

  it('resets failure count after 24-hour tracking window', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    for (let i = 0; i < 4; i++) {
      lockout.recordFailure('admin');
    }

    // Advance time past 24 hours
    vi.spyOn(Date, 'now').mockReturnValue(now + 24 * 60 * 60 * 1000 + 1);

    // Old failures should be expired; 5 new failures needed to lock
    for (let i = 0; i < 4; i++) {
      lockout.recordFailure('admin');
    }
    expect(lockout.check('admin').locked).toBe(false);

    vi.restoreAllMocks();
  });

  it('returns correct retryAfterSeconds when locked', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    for (let i = 0; i < 5; i++) {
      lockout.recordFailure('admin');
    }

    // Advance time by 10 minutes
    vi.spyOn(Date, 'now').mockReturnValue(now + 10 * 60 * 1000);
    const result = lockout.check('admin');
    expect(result.locked).toBe(true);
    // Should be ~20 minutes remaining (1200 seconds)
    expect(result.retryAfterSeconds).toBeGreaterThanOrEqual(1199);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(1201);

    vi.restoreAllMocks();
  });
});

// ---------------------------------------------------------------------------
// Session Token (create / verify)
// ---------------------------------------------------------------------------
describe('createSessionToken and verifySessionToken', () => {
  const secret = 'test-secret-key-minimum-32-bytes!';

  it('creates a valid token that can be verified', () => {
    const token = createSessionToken('demo_user', secret);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);

    const result = verifySessionToken(token, secret);
    expect(result.valid).toBe(true);
    expect(result.username).toBe('demo_user');
  });

  it('rejects token signed with a different secret', () => {
    const token = createSessionToken('demo_user', secret);
    const result = verifySessionToken(token, 'different-secret-32-bytes-long!!');
    expect(result.valid).toBe(false);
    expect(result.username).toBeUndefined();
  });

  it('rejects tampered token', () => {
    const token = createSessionToken('demo_user', secret);
    const tampered = token + 'tampered';
    const result = verifySessionToken(tampered, secret);
    expect(result.valid).toBe(false);
  });

  it('rejects empty token', () => {
    const result = verifySessionToken('', secret);
    expect(result.valid).toBe(false);
  });

  it('rejects expired token', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    const token = createSessionToken('demo_user', secret, 1); // 1 second TTL

    // Advance time past TTL
    vi.spyOn(Date, 'now').mockReturnValue(now + 2000);
    const result = verifySessionToken(token, secret);
    expect(result.valid).toBe(false);

    vi.restoreAllMocks();
  });
});

// ---------------------------------------------------------------------------
// getCredentials (from env vars)
// ---------------------------------------------------------------------------
describe('getCredentials', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns credentials when both env vars are set', () => {
    process.env.BMC_GENERATOR_USERNAME = 'testuser';
    process.env.BMC_GENERATOR_PASSWORD = 'testpassword';
    const creds = getCredentials();
    expect(creds.username).toBe('testuser');
    expect(creds.password).toBe('testpassword');
  });

  it('throws when BMC_GENERATOR_USERNAME is missing', () => {
    delete process.env.BMC_GENERATOR_USERNAME;
    process.env.BMC_GENERATOR_PASSWORD = 'testpassword';
    expect(() => getCredentials()).toThrow(
      'BMC_GENERATOR_USERNAME and BMC_GENERATOR_PASSWORD must be set'
    );
  });

  it('throws when BMC_GENERATOR_PASSWORD is missing', () => {
    process.env.BMC_GENERATOR_USERNAME = 'testuser';
    delete process.env.BMC_GENERATOR_PASSWORD;
    expect(() => getCredentials()).toThrow(
      'BMC_GENERATOR_USERNAME and BMC_GENERATOR_PASSWORD must be set'
    );
  });

  it('throws when both env vars are missing', () => {
    delete process.env.BMC_GENERATOR_USERNAME;
    delete process.env.BMC_GENERATOR_PASSWORD;
    expect(() => getCredentials()).toThrow(
      'BMC_GENERATOR_USERNAME and BMC_GENERATOR_PASSWORD must be set'
    );
  });

  it('throws when username is empty string', () => {
    process.env.BMC_GENERATOR_USERNAME = '';
    process.env.BMC_GENERATOR_PASSWORD = 'testpassword';
    expect(() => getCredentials()).toThrow(
      'BMC_GENERATOR_USERNAME and BMC_GENERATOR_PASSWORD must be set'
    );
  });

  it('throws when password is empty string', () => {
    process.env.BMC_GENERATOR_USERNAME = 'testuser';
    process.env.BMC_GENERATOR_PASSWORD = '';
    expect(() => getCredentials()).toThrow(
      'BMC_GENERATOR_USERNAME and BMC_GENERATOR_PASSWORD must be set'
    );
  });
});
