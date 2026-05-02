# Todo: Implement Auth System Middleware & JWT Token Infrastructure

**Status:** Pending  
**Implements:** specs/authentication.md §Token Structure, §Middleware.ts, §Server-Side JWT  
**Dependencies:** None  
**Blocks:** All tool-specific auth (items 02, 03, 04, etc.)  
**Capacity:** Single session (~400 LOC logic)  

## Description

Build server-side JWT token generation, validation, and refresh logic. Implement `middleware.ts` that runs on every request, validates token claims, checks tool_id matches route, and handles token refresh/expiry. Create `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout` endpoints.

## Implementation

1. **Create JWT helpers** (`lib/jwt.ts`):
   - `createAccessToken(userId, toolId)` → JWT string (1-hour expiry)
   - `createRefreshToken(userId, toolId)` → JWT string (7-day expiry)
   - `verifyToken(token)` → decoded payload or null
   - All use `process.env.JWT_SECRET` (HMAC-SHA256)

2. **Create middleware** (`middleware.ts`):
   - Extract tool_id from route (regex: `/tools/([^/]+)`)
   - Get accessToken from `Authorization` header or cookie
   - Verify token signature and expiry
   - Validate `tool_id` claim matches route requirement
   - If expired: attempt refresh with refresh token
   - If invalid/missing: redirect to login
   - Store user context in response headers for client

3. **Create auth endpoints** (`app/api/auth/[route].ts`):
   - POST `/api/auth/login` — verify credentials, return access + refresh tokens
   - POST `/api/auth/refresh` — validate refresh token, return new access token
   - POST `/api/auth/logout` — invalidate refresh token, clear cookies

## Acceptance Criteria

- [ ] `lib/jwt.ts` exports functions to create/verify tokens
- [ ] Token includes `sub` (user_id), `tool_id`, `aud` (audience), `iat`, `exp` claims
- [ ] Refresh token is httpOnly cookie (not readable by JavaScript)
- [ ] Middleware runs on all `/tools/*` routes
- [ ] Middleware validates tool_id matches route
- [ ] Token mismatch (e.g., wa-sender token on `/tools/tool-b/...`) returns 401
- [ ] Expired access token triggers refresh attempt
- [ ] Invalid/missing token redirects to login
- [ ] All tokens masked in logs (not logged verbatim)

## Testing

```bash
# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "pass"}'
# Returns: { accessToken, refreshToken }

# Test token with wrong tool_id is rejected
# Create wa-sender token, try to access /tools/tool-b/api/...
# Should return 401

# Test token refresh
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Authorization: Bearer <refresh-token>"
# Returns: { accessToken }
```

