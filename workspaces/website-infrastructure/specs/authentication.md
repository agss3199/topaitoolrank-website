# Authentication Specification

**Domain:** User identity, session management, tool-scoped credential isolation  
**Authority:** Single source of truth for auth flows, token architecture, isolation guarantees  
**Last Updated:** 2026-05-02  

## 1. Current State

**Status: Client-side only, WA-Sender-specific, zero isolation.**

- Single `lib/useAuth.ts` hook, shared across all tools
- Credentials stored in localStorage with `wa-sender-` prefix
- No server-side token validation or refresh
- No middleware.ts (no route protection)
- No concept of "tool-scoped tokens"
- Blog/article pages have zero auth (fully public)

**Isolation problems:**
- A single user identity is shared across all tools
- No server-side enforcement
- Any tool can import and use credentials from any other tool
- No refresh token expiry checks
- No logout from a single tool (logout is global)

---

## 2. Auth Architecture (Proposed)

### Level 1: Server-Side JWT with Tool Scope

**Token Structure (JWT claims):**

```json
{
  "sub": "user-id-uuid",
  "tool_id": "wa-sender",
  "iat": 1715000000,
  "exp": 1715003600,
  "aud": "tool:wa-sender"
}
```

**Key rules:**
- Access token: 1-hour expiry
- Refresh token: 7-day expiry, stored httpOnly cookie (server-side)
- `tool_id` and `aud` claims enforce tool-scoped audience — WA Sender's token is invalid for Tool B

### Level 2: Middleware.ts (Route Protection)

Runs on every request. Validates:
1. Token present in Authorization header or httpOnly cookie
2. Token signature valid (HMAC with `process.env.JWT_SECRET`)
3. Token not expired
4. `tool_id` in token matches the route's required tool
5. If expired, attempt refresh using refresh token
6. If refresh fails, redirect to login

```typescript
// middleware.ts pseudo-code
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Public routes (no auth required)
  if (isPublicRoute(pathname)) return NextResponse.next();
  
  // Protected routes (auth required + tool match)
  const toolId = extractToolFromRoute(pathname);  // "wa-sender" from /tools/wa-sender/*
  const accessToken = getAccessToken(request);
  
  if (!accessToken) {
    return redirectToLogin();
  }
  
  const payload = await verifyJWT(accessToken, process.env.JWT_SECRET);
  if (!payload || payload.tool_id !== toolId) {
    return redirectToLogin();
  }
  
  if (isTokenExpired(payload.exp)) {
    const newAccessToken = await refreshAccessToken(request);
    if (!newAccessToken) {
      return redirectToLogin();
    }
    // Attach new token to response headers for client to store
    const response = NextResponse.next();
    response.headers.set('x-access-token', newAccessToken);
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/tools/:path*',     // All tool routes require auth
    '/auth/:path*',      // Auth routes (login/logout/signup)
    '/((?!blogs|api/public|_next|public).*)',  // All non-public routes
  ],
};
```

### Level 3: Per-Tool Session Context

Each tool can access ONLY its own credentials via a scoped hook:

```typescript
// app/tools/wa-sender/hooks/useWASenderSession.ts
export function useWASenderSession() {
  const session = useAuth();
  
  // Validate tool scope
  if (session?.tool_id !== 'wa-sender') {
    throw new AuthenticationError('Tool scope mismatch: token is not for wa-sender');
  }
  
  return session;
}
```

**Why:** Explicit scope validation in the hook prevents accidental cross-tool credential use. The hook throws if a WA Sender component somehow receives a different tool's token.

### Level 4: API Routes (Server Actions + Middleware)

All API routes that mutate data MUST:
1. Use middleware to validate the request's tool_id
2. Pass the authenticated user ID to the service layer
3. Validate again at the service layer (defense-in-depth)

```typescript
// app/api/wa-sender/messages/send/route.ts
import { middleware } from '@/middleware';

export async function POST(request: NextRequest) {
  // Middleware already ran and validated tool_id == 'wa-sender'
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];
  const payload = await verifyJWT(accessToken);
  const userId = payload.sub;
  
  const body = await request.json();
  const result = await waSenderService.sendMessage(userId, body);
  
  return NextResponse.json(result);
}
```

---

## 3. Tool-Scoped Token Flows

### Login Flow (Per Tool)

```
1. User visits /auth/login?tool=wa-sender
2. POST /api/auth/login with email + password + tool_id
3. Backend:
   - Verify credentials
   - Generate JWT with tool_id="wa-sender" claim
   - Return access token + refresh token (httpOnly cookie)
4. Client:
   - Stores access token in localStorage (window.sessionStorage for current session)
   - Refresh token stored in httpOnly cookie (automatic on every request)
5. Redirect to /tools/wa-sender (authenticated)
```

### Token Refresh Flow

```
1. Client detects access token expired (clock skew checks, exp claim)
2. POST /api/auth/refresh with current access token OR refresh token cookie
3. Backend:
   - Verify refresh token
   - Generate new access token (same tool_id)
   - Return new access token
4. Client:
   - Updates localStorage with new access token
   - Continues request
```

### Logout Flow (Per Tool)

```
1. User clicks logout in /tools/wa-sender
2. POST /api/auth/logout (tool_id="wa-sender") with access token
3. Backend:
   - Invalidate refresh token (mark in token blacklist / store invalidation timestamp)
   - Clear httpOnly cookie
4. Client:
   - Clear localStorage (access token)
   - Redirect to /auth/login
```

**Rule:** A logout from WA Sender does NOT clear tokens for Tool B. Each tool's session is independent.

---

## 4. Isolation Guarantees

### Guarantee 1: Token Scope Enforcement

- WA Sender's JWT has `aud: "tool:wa-sender"`
- Any request to `/tools/tool-b/*` with WA Sender's token is REJECTED by middleware
- Server-side validation, not client-side (cannot be bypassed by modifying localStorage)

### Guarantee 2: Per-Tool Route Isolation

- `/tools/wa-sender/*` requires `tool_id == "wa-sender"` claim
- `/tools/tool-b/*` requires `tool_id == "tool-b"` claim
- Middleware checks this before route handler runs

### Guarantee 3: No Credential Leakage in Logs

- Tokens MUST be masked in all logs
- Access token logged as `access_token=<first8>...<last4>`
- Refresh token not logged (or logged as `refresh_token=***`)
- See `rules/observability.md` § "No secrets in logs"

### Guarantee 4: User Data Isolation

- API responses MUST include user_id and tool_id
- Backend queries MUST filter by BOTH user_id AND tool_id
- Example: `SELECT * FROM messages WHERE user_id = :uid AND tool_id = 'wa-sender'`

```typescript
// WRONG — leaks other tool's messages
const messages = await db.messages.list({ user_id: userId });

// CORRECT — scoped to tool
const messages = await db.messages.list({ user_id: userId, tool_id: 'wa-sender' });
```

---

## 5. Validation Checklist

Before shipping any auth flow:

- [ ] Middleware.ts exists and runs on all protected routes
- [ ] JWT token includes `tool_id` and `aud` claims with tool name
- [ ] Access token has 1-hour expiry, refresh token has 7-day expiry
- [ ] Refresh token is httpOnly (not readable by JavaScript)
- [ ] All API routes validate tool_id match before executing
- [ ] Logout clears BOTH access token (localStorage) AND refresh token (cookie)
- [ ] Refresh token is invalidated server-side on logout (not just cleared client-side)
- [ ] Tool-scoped hooks (`useWASenderSession`) validate tool scope
- [ ] No hardcoded JWT_SECRET — use environment variable
- [ ] No credentials in logs or error messages (mask tokens)
- [ ] Database queries include tool_id filter alongside user_id
- [ ] New tool cannot access another tool's token or user data
- [ ] Middleware config includes all protected routes (catch-all matcher)

---

## 6. Extension for New Tools (Without Code Changes)

When Tool B is added:

1. Tool B defines its own scoped hook:
   ```typescript
   // app/tools/tool-b/hooks/useToolBSession.ts
   export function useToolBSession() {
     const session = useAuth();
     if (session?.tool_id !== 'tool-b') {
       throw new AuthenticationError('Token is not for tool-b');
     }
     return session;
   }
   ```

2. Tool B's API routes validate tool_id in middleware (automatic via middleware matcher)

3. Tool B's database tables include tool_id column and index:
   ```sql
   CREATE TABLE tool_b_data (
     id UUID PRIMARY KEY,
     user_id UUID NOT NULL,
     tool_id TEXT NOT NULL DEFAULT 'tool-b',  -- always 'tool-b'
     data JSONB,
     FOREIGN KEY (user_id) REFERENCES users(id),
     UNIQUE(user_id, tool_id, id)  -- enforce user+tool scope
   );
   CREATE INDEX idx_tool_b_data_user_tool ON tool_b_data(user_id, tool_id);
   ```

**No changes to shared auth system, middleware, or WA Sender code required.**

---

## 7. Security Threat Model

### Threat 1: Cross-Tool Token Reuse

**Attack:** User logs into WA Sender, obtains access token. Manually modifies token's `tool_id` claim to "tool-b" and sends it to `/tools/tool-b/api/*`.

**Mitigation:** 
- Tokens are signed with HMAC. Modifying `tool_id` breaks the signature.
- Middleware verifies signature before checking claims.
- Invalid signature → 401 Unauthorized, request rejected.

**Test:** Alter a token's payload and verify it's rejected.

### Threat 2: Refresh Token Theft

**Attack:** Attacker steals refresh token from localStorage (XSS attack).

**Mitigation:**
- Refresh token is NOT stored in localStorage (that would be vulnerable)
- Refresh token is httpOnly cookie (JavaScript cannot read it, only sent automatically on HTTP requests)
- Even if attacker has access token, it expires in 1 hour
- Server-side blacklist can invalidate tokens immediately on logout

**Test:** Verify refresh token is NOT readable by JavaScript; verify httpOnly cookie is not sent to `http://` endpoints.

### Threat 3: Session Fixation (Tool A → Tool B)

**Attack:** Attacker obtains Tool A's refresh token, tries to use it to refresh and get a Tool B token.

**Mitigation:**
- Refresh token has `tool_id` embedded in the JWT payload
- When refreshing, backend validates `tool_id` matches the request path
- `/api/auth/refresh?tool=tool-b` with Tool A's refresh token (which has `tool_id=tool-a`) is rejected

**Test:** Attempt to refresh with a mismatched tool_id.

### Threat 4: Logout Bypass

**Attack:** User logs out from WA Sender, but attacker still has the refresh token and can refresh to get a new access token.

**Mitigation:**
- On logout, refresh token is marked as "revoked" in a server-side blacklist
- Subsequent refresh requests check the blacklist
- Blacklist is stored in Redis (fast in-memory check) with TTL matching token expiry

**Test:** Logout, then attempt to refresh; verify refresh fails.

---

## 8. Implementation Notes

### JWT Secret Rotation

When rotating the JWT_SECRET (e.g., annual rotation or after a suspected breach):

1. Add new secret to `JWT_SECRET_NEW` in `.env`
2. Middleware tries to verify with `JWT_SECRET` first, then `JWT_SECRET_NEW` (graceful rollover)
3. After 7 days (refresh token expiry), all tokens using old secret have expired
4. Switch `JWT_SECRET` to the new value, remove `JWT_SECRET_NEW`

**Why 7 days?** Matches the longest-lived token's expiry; ensures all old tokens are gone before the old secret is removed.

### Token Expiry & Clock Skew

- Issue tokens with 30-second grace period (exp + 30s) to account for clock skew between client and server
- Client-side checks for expiry should use `Date.now() > token.exp * 1000 - 60000` (1-minute buffer)

### Stateless vs Stateful

This design is **stateless**:
- No server-side session table
- Tokens are self-contained (all claims in the JWT)
- Validation is done via JWT verification, not table lookup
- Logout adds to a blacklist (minimal state)

**Why stateless?** Scales horizontally — any server can validate any token.

