# Authentication Requirement Added (2026-05-12)

## Change Summary

**Requirement:** Add simple username/password authentication (like WA Sender).

**Status:** APPROVED and SPECCED

**Scope Change:** Originally "Out of Scope: User accounts / authentication" (brief, line 133). Now REQUIRED for MVP.

**Reason:** Prevent anonymous access. Control who can generate BMCs and incur cost (~$0.18-0.25 per generation).

---

## Impact Analysis

### New Deliverables

1. **Login Page** (`/tools/bmc-generator/login`)
   - Form with username/password inputs
   - Error messaging for invalid credentials
   - Redirect on success to main tool

2. **Login Endpoint** (`POST /api/bmc-generator/login`)
   - Validate credentials against environment variables
   - Issue session cookie (HTTP-only, Secure, SameSite=Lax)
   - Return success/error response

3. **Logout Endpoint** (`POST /api/bmc-generator/logout`)
   - Delete session cookie
   - Redirect to login page

4. **Session Validation** (All protected routes)
   - All `/api/bmc-generator/*` endpoints check `bmc_session` cookie
   - Main page redirects unauthenticated users to login

5. **Environment Variables**
   - `BMC_GENERATOR_USERNAME` — Login username
   - `BMC_GENERATOR_PASSWORD` — Login password
   - `AUTH_SESSION_TTL` — Optional session timeout (default 24 hours)

### Spec Files Created

- `specs/authentication.md` — Complete login flow, session management, security considerations

### Spec Files Updated

- `briefs/00-product-brief.md` — Added "Authentication Requirement Added" section
- `specs/_index.md` — Added authentication spec reference

### Implementation Plan Impact

Original plan was 6 phases with 11 todos. New auth requirement adds:
- **Phase 0A — Authentication** (1-2 todos)
  - Todo 0A1: Create login page + login endpoint
  - Todo 0A2: Add session validation middleware to all protected routes

**Total: 13-14 todos instead of 11.** All prior phases shift (Phase 0 → Phase 1, Phase 1 → Phase 2, etc.).

---

## Design Decisions

### Credentials Storage

**Chosen:** Environment variables (`BMC_GENERATOR_USERNAME`, `BMC_GENERATOR_PASSWORD`)

**Rationale:**
- No database required (MVP stays simple, fully deletable)
- Credentials live in `.env.local` (not committed to git)
- Works with Vercel (environment variables are standard)

**Future:** If multi-user support needed, migrate to database + bcrypt hashing.

### Session Model

**Two Options Documented:**

1. **Stateless (Recommended for Vercel)**
   - Use signed/encrypted cookies (JWT-like)
   - No server session store
   - Easier to scale

2. **Server-Side (Traditional)**
   - Use in-memory or Redis session store
   - Easier to revoke sessions on logout
   - Harder on stateless deployment

**MVP Implementation:** Start with stateless (signed cookies). If in-memory is simpler for dev, switch to that.

### Integration with Existing Security Fixes

Authentication meshes cleanly with prior security mitigations:
- **CSRF Protection (C2):** Generation tokens issued AFTER login, so unauthenticated users never receive tokens
- **Session ID Enumeration (H1):** Session cookie + IP binding prevents enumeration
- **Rate Limiting (C1):** Rate limits apply to authenticated users (prevents cost abuse even after login)

---

## No Breaking Changes

The authentication layer sits entirely at the entry point:
- All existing API contracts unchanged (same `/start`, `/answers`, `/generate` endpoints)
- All existing data models unchanged
- All existing SSE streaming unchanged
- Only addition: `bmc_session` cookie validation before route handler execution

**Backwards Compatibility:** Not applicable (new feature, no prior implementation to break).

---

## Security Considerations (Documented in Spec)

- **Password Security:** Hardcoded in `.env` for MVP (strong passwords required, bcrypt for production)
- **Session Security:** HTTP-only, Secure, SameSite=Lax cookies
- **Brute Force:** Rate limit on `/login` (5 failed attempts per IP per 10 min → 429)
- **Enumeration:** Generic error message ("Invalid username or password") prevents user enumeration

---

## Next Steps

1. **Immediate:** Update implementation plan to add Phase 0A (2 todos for auth)
2. **Before `/implement`:** User should provide actual credentials for `.env.local`
3. **Phase 0A Implementation:** Create login page, login endpoint, session validation
4. **Phase 1+ Implementation:** All subsequent phases continue as planned (now Phase 2, 3, 4, 5, 6, 7)

---

## Cost Impact

**No incremental API cost.** Authentication is local (no external service). Only costs are Anthropic API calls for BMC generation, which remain at ~$0.18-0.25 per generation.

---

## Timeline Impact

**Adds 1 session to the implementation timeline.**

- Original: ~10-11 sessions total
- New: ~12-13 sessions total
- Rationale: Login page + endpoints are straightforward (not complex like multi-agent orchestration)

---

## Approval Status

✅ **APPROVED** — User explicitly requested: "put this page behind sign in simple username and password, just like wa sender"

All impacts have been specced. Ready to integrate into implementation plan.
