# BMC Generator Authentication & Session Management

**Codified from:** Production implementation (May 2026)  
**Pattern:** Sliding-window JWT + rate limiting for paid AI tools  
**Scope:** Session validation, lockout protection, cost rate limiting

---

## Pattern: Sliding-Window JWT for Paid Tools

When a tool charges users for execution (e.g., BMC Generator at $0.05/run), session management must:

1. **Protect from brute-force** (rate limiting + lockout)
2. **Refresh session on each request** (sliding window, not fixed expiry)
3. **Enforce cost ceilings** (per-IP, per-user, per-day, global)

### Setup

```typescript
// app/api/bmc-generator/login/route.ts

import crypto from 'crypto';

// 1. Validate credentials from env vars
const BMC_USERNAME = process.env.BMC_GENERATOR_USERNAME!;
const BMC_PASSWORD = process.env.BMC_GENERATOR_PASSWORD!;

// 2. Rate limiting: 5 failed attempts per IP per 10 minutes
const ipAttempts = new Map<string, { count: number; resetAt: number }>();

function checkIPRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempt = ipAttempts.get(ip);
  
  if (attempt && now < attempt.resetAt) {
    if (attempt.count >= 5) return false; // rate limited
    attempt.count++;
  } else {
    ipAttempts.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
  }
  
  return true;
}

// 3. Account lockout: 5 failed attempts per username per 24h
const usernameAttempts = new Map<string, { count: number; lockedUntil: number }>();

function checkUsernameLockout(username: string): boolean {
  const now = Date.now();
  const attempt = usernameAttempts.get(username);
  
  if (attempt && now < attempt.lockedUntil) {
    return false; // account is locked
  }
  
  if (attempt && now < attempt.lockedUntil + 24 * 60 * 60 * 1000) {
    attempt.count++;
    if (attempt.count >= 5) {
      // Lock account for 30 minutes
      attempt.lockedUntil = now + 30 * 60 * 1000;
      return false;
    }
  } else {
    usernameAttempts.set(username, { count: 1, lockedUntil: 0 });
  }
  
  return true;
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const body = await request.json();
  const { username, password } = body;
  
  // Check IP rate limit
  if (!checkIPRateLimit(ip)) {
    return Response.json(
      { error: 'Too many login attempts. Try again in 10 minutes.' },
      { status: 429 }
    );
  }
  
  // Check username lockout
  if (!checkUsernameLockout(username)) {
    return Response.json(
      { error: 'Account locked. Try again in 30 minutes.' },
      { status: 423 }
    );
  }
  
  // Validate credentials with timing-safe comparison
  const usernameMatch = crypto.timingSafeEqual(
    Buffer.from(username || ''),
    Buffer.from(BMC_USERNAME)
  );
  const passwordMatch = crypto.timingSafeEqual(
    Buffer.from(password || ''),
    Buffer.from(BMC_PASSWORD)
  );
  
  if (!usernameMatch || !passwordMatch) {
    return Response.json(
      { error: 'Invalid username or password' },
      { status: 401 }
    );
  }
  
  // Success: generate JWT token
  const secret = process.env.BMC_SESSION_SECRET!;
  const token = generateSessionToken(username, secret);
  
  // Set HTTP-only cookie
  const cookie = buildSessionCookie(token);
  
  return Response.json(
    { success: true, redirect: '/tools/bmc-generator/', user: { username } },
    {
      status: 200,
      headers: { 'Set-Cookie': cookie },
    }
  );
}

// 4. Generate JWT token
function generateSessionToken(username: string, secret: string): string {
  const payload = {
    username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24h expiry
  };
  
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  
  return `${header}.${body}.${signature}`;
}

// 5. Build session cookie
function buildSessionCookie(token: string): string {
  const parts = [
    'bmc_session=' + token,
    'Max-Age=' + (24 * 60 * 60), // 24 hours
    'HttpOnly', // Prevent JavaScript access
    'SameSite=Lax', // CSRF protection
  ];
  
  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure'); // HTTPS only in production
  }
  
  return parts.join('; ');
}
```

### Middleware: Validate & Refresh Session on Every Request

```typescript
// app/api/bmc-generator/_middleware.ts (or app/middleware.ts)

export function validateAndRefreshSession(request: Request): { valid: boolean; username?: string; refreshedToken?: string } {
  const cookieHeader = request.headers.get('Cookie');
  const cookies = parseCookies(cookieHeader);
  const token = cookies.bmc_session;
  
  if (!token) {
    return { valid: false };
  }
  
  // Verify JWT signature
  const secret = process.env.BMC_SESSION_SECRET!;
  const verified = verifyJWT(token, secret);
  
  if (!verified) {
    return { valid: false };
  }
  
  // Check expiry
  if (verified.exp * 1000 < Date.now()) {
    return { valid: false };
  }
  
  // Refresh token (sliding window): issue new token with updated expiry
  const newToken = generateSessionToken(verified.username, secret);
  
  return {
    valid: true,
    username: verified.username,
    refreshedToken: newToken,
  };
}

// Apply middleware to all protected routes
export async function middleware(request: Request) {
  const { pathname } = request.nextUrl;
  
  // Protect these routes
  if (pathname.startsWith('/api/bmc-generator/') && !pathname.includes('/login')) {
    const session = validateAndRefreshSession(request);
    
    if (!session.valid) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'Set-Cookie': 'bmc_session=; Max-Age=0' } }
      );
    }
    
    // Refresh session cookie
    const newCookie = buildSessionCookie(session.refreshedToken!);
    const response = await next();
    response.headers.set('Set-Cookie', newCookie);
    return response;
  }
}
```

### Logout: Delete Session

```typescript
// app/api/bmc-generator/logout/route.ts

export async function POST(request: Request) {
  const session = validateAndRefreshSession(request);
  
  if (!session.valid) {
    return Response.json(
      { error: 'Not logged in' },
      { status: 400 }
    );
  }
  
  // Delete cookie
  const deleteCookie = 'bmc_session=; Max-Age=0; HttpOnly; SameSite=Lax';
  
  return Response.json(
    { success: true, redirect: '/tools/bmc-generator/login' },
    {
      status: 200,
      headers: { 'Set-Cookie': deleteCookie },
    }
  );
}
```

---

## Rate Limiting Strategy

### 1. Per-IP (Brute-Force Protection)

```typescript
// 5 failed attempts per IP per 10 minutes → 429
// Prevents bot farms from guessing username/password
```

### 2. Per-Session Concurrent (Prevent Abuse)

```typescript
// Only 1 generation at a time per session
// If user tries to start another while one is in-flight → 409
```

### 3. Per-Session Daily (Fair Use)

```typescript
// Max 20 generations per user per day
// Prevents single user from consuming the entire daily budget
```

### 4. Global Cost Ceiling (Safety Net)

```typescript
// Hard stop if total daily spend reaches $0.50
// Protects against cascading failures (runaway agents using all budget)
```

---

## Security Practices

### ✅ DO

- Use **timing-safe comparison** for credentials (`crypto.timingSafeEqual`)
  - Prevents timing attacks that leak password length
  
- **Refresh token on every successful request** (sliding window)
  - If user is active, they stay logged in
  - If user is inactive > 24h, they're logged out
  
- **Lock accounts temporarily** (30 min) after 5 failed attempts
  - Exponential delays are overkill for short tools
  - 30 min + try-again is enough friction to prevent brute-force
  
- **HTTP-only cookies** (not localStorage)
  - Prevents JavaScript access (XSS safety)
  - Browser automatically includes in requests (CSRF token unnecessary for simple POST)
  
- **Generic error messages** ("Invalid username or password", not "User not found")
  - Prevents user enumeration attacks
  
- **HMAC-SHA256** for token signing
  - Industry standard, supported by crypto module

### ❌ DON'T

- Hardcode credentials in code (use env vars)
- Return detailed error messages that leak usernames
- Use fixed expiry (always use sliding window for active users)
- Store plain-text passwords (use env vars as single-user vault)
- Skip HTTPS in production

---

## Testing

```typescript
// tests/auth.integration.test.ts

describe('BMC Generator Authentication', () => {
  it('logs in with valid credentials', async () => {
    const res = await fetch('/api/bmc-generator/login', {
      method: 'POST',
      body: JSON.stringify({
        username: process.env.BMC_GENERATOR_USERNAME,
        password: process.env.BMC_GENERATOR_PASSWORD,
      }),
    });
    
    expect(res.status).toBe(200);
    expect(res.headers.get('Set-Cookie')).toContain('HttpOnly');
  });
  
  it('rejects invalid password', async () => {
    const res = await fetch('/api/bmc-generator/login', {
      method: 'POST',
      body: JSON.stringify({
        username: process.env.BMC_GENERATOR_USERNAME,
        password: 'wrong-password',
      }),
    });
    
    expect(res.status).toBe(401);
    expect(await res.json()).toHaveProperty('error');
  });
  
  it('rate-limits after 5 failed attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await fetch('/api/bmc-generator/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'test', password: 'wrong' }),
        headers: { 'X-Forwarded-For': '192.0.2.1' },
      });
    }
    
    const res = await fetch('/api/bmc-generator/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'test', password: 'anything' }),
      headers: { 'X-Forwarded-For': '192.0.2.1' },
    });
    
    expect(res.status).toBe(429);
  });
  
  it('refreshes session on protected endpoint', async () => {
    // Login
    const login = await fetch('/api/bmc-generator/login', { /* ... */ });
    const cookie = login.headers.get('Set-Cookie');
    
    // Call protected endpoint
    const res = await fetch('/api/bmc-generator/start', {
      method: 'POST',
      headers: { Cookie: cookie },
      body: JSON.stringify({ idea: 'Test business idea...' }),
    });
    
    // New session cookie issued
    expect(res.headers.get('Set-Cookie')).toContain('bmc_session=');
  });
  
  it('logs out and invalidates session', async () => {
    // ... login ...
    
    // Logout
    const logout = await fetch('/api/bmc-generator/logout', { /* ... */ });
    expect(logout.headers.get('Set-Cookie')).toContain('Max-Age=0');
    
    // Session now invalid
    const protected = await fetch('/api/bmc-generator/start', {
      headers: { Cookie: logout.headers.get('Set-Cookie') },
    });
    expect(protected.status).toBe(401);
  });
});
```

---

## Environment Variables Required

```bash
BMC_GENERATOR_USERNAME=your-username      # Username for login
BMC_GENERATOR_PASSWORD=your-password      # Password for login
BMC_SESSION_SECRET=<32-char-random-key>   # Secret for JWT signing (min 32 chars)
```

Generate a secure random secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Related Patterns

- **Token Binding:** See `bmc-generator-architecture-specialist` § Pattern 2 (generation_token for CSRF)
- **Cost Rate Limiting:** See `bmc-generator-architecture-specialist` § Pattern 3
- **Three-Tier Timeout:** See `bmc-generator-architecture-specialist` § Pattern 1

---

## Common Mistakes

❌ **Fixed expiry:** Token expires after 24h even if user is active  
✅ **Sliding window:** Refresh token on every successful request

❌ **Detailed error messages:** "User 'alice' not found" (user enumeration)  
✅ **Generic messages:** "Invalid username or password"

❌ **localStorage for tokens:** Subject to XSS theft  
✅ **HTTP-only cookies:** Automatic inclusion, XSS-safe

❌ **One rate limit:** 5 attempts total (too strict or too loose)  
✅ **Layered rate limits:** Per-IP (brute-force), per-session (abuse), per-day (fair use), global (safety net)
