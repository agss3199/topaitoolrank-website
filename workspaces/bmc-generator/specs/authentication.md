# BMC Generator — Authentication

Simple username/password authentication. Single login page protects all BMC generation functionality.

## Model

**Pattern:** Like WA Sender — one shared login page, simple username/password credentials, session-based authentication.

**No user registration:** Credentials hardcoded or loaded from environment. Single user or small team only. No signup page.

**Session Model:** Browser session via HTTP-only cookie. Survives page refresh, expires on browser close (or configurable TTL).

---

## Authentication Flow

### Pre-Auth (Unauthenticated User Lands on Tool)

1. User navigates to `/tools/bmc-generator/`
2. Middleware redirects to `/tools/bmc-generator/login`
3. User sees login form

### Login Page

**Route:** `GET /tools/bmc-generator/login`

**UI:**
```
┌──────────────────────────────┐
│  BMC Generator               │
│                              │
│  Sign in to continue         │
│                              │
│  Username:                   │
│  [____________________]      │
│                              │
│  Password:                   │
│  [____________________]      │
│                              │
│  [ Sign In ]                 │
│                              │
│  Error (if login failed):    │
│  ❌ Invalid credentials      │
│                              │
└──────────────────────────────┘
```

**Validation:**
- Both fields required (non-empty)
- Username: 3-20 alphanumeric characters + underscore/dash
- Password: 8-64 characters (no specific complexity rules for MVP)

### Login Request

**Route:** `POST /api/bmc-generator/login`

**Request:**
```typescript
{
  username: string;
  password: string;
}
```

**Response (Success):**
```typescript
{
  success: true;
  redirect: "/tools/bmc-generator/";
  user: {
    username: string;
  };
}
```

**Response (Failure):**
```typescript
{
  success: false;
  error: "Invalid username or password";
}
```

**Session Management:**
- On success: Set HTTP-only, Secure, SameSite=Lax cookie containing session token
- Cookie name: `bmc_session`
- Cookie TTL: 24 hours (or configurable via env var `AUTH_SESSION_TTL`)
- Cookie: Not accessible via JavaScript (`HttpOnly` flag set)

### Post-Auth (Authenticated User)

After login, user is redirected to `/tools/bmc-generator/`. All prior flows work normally:
- User submits idea → Phase 1A
- Answers questions → Phase 1B
- Watches generation → Phases 2-4
- Views results → Done

### Logout

**Route:** `POST /api/bmc-generator/logout`

**Request:** No body required

**Response:**
```typescript
{
  success: true;
  redirect: "/tools/bmc-generator/login";
}
```

**Session Management:**
- Delete `bmc_session` cookie
- Clear server-side session store (if using)
- Redirect to login page

---

## Credentials Storage

### Environment Variable (Recommended)

Store credentials in environment variables (simple, no database):

```
BMC_GENERATOR_USERNAME=demo
BMC_GENERATOR_PASSWORD=secure-password-here
```

Loading in route handler:

```typescript
const VALID_USERNAME = process.env.BMC_GENERATOR_USERNAME;
const VALID_PASSWORD = process.env.BMC_GENERATOR_PASSWORD;

if (!VALID_USERNAME || !VALID_PASSWORD) {
  throw new Error('BMC_GENERATOR_USERNAME and BMC_GENERATOR_PASSWORD must be set');
}
```

### Validation Logic

```typescript
async function validateCredentials(username: string, password: string): Promise<boolean> {
  // Simple string comparison (environment variables)
  return username === VALID_USERNAME && password === VALID_PASSWORD;
}
```

**Security Note:** For MVP, this is acceptable. For production, use bcrypt or Argon2 to hash passwords before storing in `.env`.

---

## Protected Routes

All routes except `/login` and `/api/bmc-generator/login` MUST check authentication:

### Protected Frontend Routes

- `GET /tools/bmc-generator/` → Redirect to `/login` if unauthenticated
- All sub-pages (question form, status, results) → Protected by root page auth

### Protected API Routes

All the following MUST validate session cookie before processing:

- `POST /api/bmc-generator/start`
- `POST /api/bmc-generator/answers`
- `POST /api/bmc-generator/generate`
- `GET /api/bmc-generator/stream/status`
- `POST /api/bmc-generator/logout`

**Validation:** Check for valid `bmc_session` cookie. If missing or invalid, return 401 Unauthorized.

**Cookie Validation Logic:**

```typescript
function validateSession(request: NextRequest): boolean {
  const session = request.cookies.get('bmc_session')?.value;
  
  if (!session) return false;
  
  // Verify session is valid (check server-side session store if using)
  // For MVP with stateless approach: use JWT or signed cookie
  
  return isValidSessionToken(session);
}
```

---

## Session Storage

### Option 1: Stateless (Recommended for Vercel)

Use signed/encrypted cookies (JWT-like) instead of server session store:

```typescript
// Login success: create signed token
const token = signSessionToken({ username }, SECRET_KEY);
res.cookies.set('bmc_session', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 // 24 hours
});

// Route protection: verify signed token
const token = request.cookies.get('bmc_session')?.value;
const valid = verifySessionToken(token, SECRET_KEY);
if (!valid) return new Response('Unauthorized', { status: 401 });
```

**Benefit:** No server-side session store needed. Stateless. Works well on Vercel.

### Option 2: Server-Side (Session Store)

Use in-memory or Redis session store:

```typescript
// Login: generate session, store in memory/Redis
const sessionId = crypto.randomUUID();
sessionStore.set(sessionId, { username, createdAt: Date.now() });
res.cookies.set('bmc_session', sessionId, { httpOnly: true, ... });

// Route protection: look up session in store
const sessionId = request.cookies.get('bmc_session')?.value;
const session = sessionStore.get(sessionId);
if (!session || isExpired(session)) return new Response('Unauthorized', { status: 401 });
```

**Benefit:** Easy to revoke sessions on logout. Harder on stateless deployment (Vercel).

---

## Integration with Existing Auth Fixes

### CSRF Token Generation

Generation tokens (from C2 security fix) are issued AFTER login:
1. User logs in → receive `bmc_session` cookie
2. User clicks "Analyze" → `/start` generates `generation_token`
3. Generation token valid ONLY for that user's session

**Code:**
```typescript
// In /api/bmc-generator/start route handler:
const session = validateSession(request); // Check bmc_session cookie
if (!session) return new Response('Unauthorized', { status: 401 });

const generationToken = crypto.randomBytes(32).toString('hex');
// Store token in request context or return to client
return Response.json({ generation_token: generationToken });
```

### Session + IP Binding (from H1 security fix)

Session validation can optionally bind to IP:

```typescript
function validateSession(request: NextRequest): boolean {
  const session = getSessionData(request);
  const clientIP = request.headers.get('x-forwarded-for') || request.ip;
  
  // If session was created with IP binding, verify IP matches
  if (session.boundIP && session.boundIP !== clientIP) {
    return false;
  }
  
  return true;
}
```

---

## Logout Behavior

When user clicks logout:

```typescript
// POST /api/bmc-generator/logout
const session = validateSession(request);
if (!session) return new Response('Already logged out', { status: 400 });

// Clear session cookie
res.cookies.delete('bmc_session');

// Return redirect to login page
return NextResponse.redirect('/tools/bmc-generator/login');
```

On logout:
- Session cookie deleted
- Server-side session store entry deleted (if using)
- User redirected to login page
- All prior generation state lost (sessionStorage cleared)

---

## Accessibility & Mobile

**Login Page Requirements:**
- `<label for="username">` associated with input
- `<label for="password">` associated with input
- Error messages have `role="alert"`
- Password field masked (`type="password"`)
- Mobile-responsive (full-width inputs on <600px)

---

## Error Cases

**Invalid Credentials:**
- Return 401 with generic message: "Invalid username or password"
- Do NOT indicate whether username or password was wrong (prevents enumeration)
- Do NOT log failed attempts to external service (avoid data leak in logs)

**Session Expired:**
- Any route hit with expired session returns 401
- Client redirected to login page (via middleware or frontend catch)

**Missing Credentials:**
- POST /login with missing fields → 400 "Missing username or password"

---

## Implementation Checklist

- [ ] Create `/tools/bmc-generator/login` page (form + styling)
- [ ] Create `/api/bmc-generator/login` route (validate credentials, set cookie)
- [ ] Create `/api/bmc-generator/logout` route (delete cookie, redirect)
- [ ] Add session validation middleware to all protected routes
- [ ] Set environment variables in `.env.local`: `BMC_GENERATOR_USERNAME`, `BMC_GENERATOR_PASSWORD`
- [ ] Test login/logout flow
- [ ] Test session persistence (refresh page, stays logged in)
- [ ] Test session expiry (24h or manual logout)
- [ ] Test invalid credentials (error message shows)
- [ ] Test unauthenticated access to `/tools/bmc-generator/` (redirects to login)

---

## Security Considerations

### Password Security (MVP)

For MVP with hardcoded credentials:
- Use strong passwords (12+ chars, mixed case, numbers, symbols)
- Store in `.env` only (never in code)
- `.env` is NOT committed to git (add to `.gitignore`)

**Future Enhancement:** Use bcrypt for hashed passwords if expanding to multiple users.

### Session Security

- Cookie: `HttpOnly` (not accessible via JavaScript, prevents XSS token theft)
- Cookie: `Secure` (only sent over HTTPS in production)
- Cookie: `SameSite=Lax` (prevents CSRF)
- Cookie: Signed or encrypted (verify integrity server-side)

### Brute Force Protection & Account Lockout

**Per-IP Rate Limit (Global):**
- Max 5 failed login attempts per IP per 10 minutes
- After 5 failures from same IP: Return 429 "Too many login attempts. Try again in X seconds."
- Prevents anonymous brute force attacks from single IP

**Per-Username Account Lockout (Username-Specific):**
- Max 5 failed login attempts per username per 24 hours (not per IP)
- After 5 failed attempts: Lock account for 30 minutes
- Return 423 (Locked) with message: "Account temporarily locked. Try again in 30 minutes."
- This prevents username enumeration via IP lockout (don't lock the IP, lock the account)

**Implementation:**
```
Track failed_attempts_24h per username:
  - On failed login: increment failed_attempts_24h
  - If failed_attempts_24h >= 5: set account locked_until = now() + 30min
  - On successful login: reset failed_attempts_24h to 0, clear locked_until
  - After 24h: reset failed_attempts_24h counter
  - Check locked_until on every login attempt: if now() < locked_until, return 423
```

**Error Responses:**

| Status | Scenario | Message |
|--------|----------|---------|
| 429 | >5 failed attempts from this IP within 10 min | "Too many login attempts from your IP. Try again in X seconds." |
| 423 | >5 failed attempts for this username within 24h | "Account locked after too many failed attempts. Try again in 30 minutes." |
| 401 | Invalid credentials | "Invalid username or password." (generic, prevents enumeration) |

---

## Integration with Cost Control

Authentication is the first gate before cost incurrence:
1. Unauthenticated users cannot call ANY generation endpoints (all protected)
2. Authenticated users are still subject to rate limiting (C1)
3. Per-user generation limits could be added later (e.g., free tier: 5 generations/month)

**Current scope:** Authentication blocks anonymous access. Rate limiting (C1) blocks cost abuse.

---

## Future Enhancements (Out of Scope for MVP)

- Multiple users with per-user generation quotas
- User registration flow
- Password reset via email
- Session timeout on inactivity
- Admin panel to manage users
- Audit log of who generated which BMCs
