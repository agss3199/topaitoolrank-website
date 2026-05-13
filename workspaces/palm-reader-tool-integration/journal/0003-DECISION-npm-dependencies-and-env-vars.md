# DECISION: NPM Dependencies & Environment Variables Setup

**Date**: 2026-05-13  
**Phase**: Planning (todos phase)  
**Type**: DECISION  
**Topic**: Dependency installation and secret management  

---

## Finding

Red team audit revealed critical dependencies and environment variable configuration gaps in the todo plan:

1. **Missing npm install step** — todos 001, 003 reference packages (`@google/generative-ai`, `@mediapipe/hands`, etc.) but no todo includes installation
2. **API key exposed client-side** — todos 003, 008 use `NEXT_PUBLIC_GEMINI_KEY` which bundles the secret into the browser; must be `GEMINI_API_KEY` (server-side only)
3. **Missing `.env.example` documentation** — Gemini API key not documented for future contributors

## Decision

### NPM Dependencies
Add explicit acceptance criterion to todo 001 (CameraView):
```
- [ ] Verify MediaPipe packages installed: @mediapipe/hands, @mediapipe/camera_utils, @mediapipe/drawing_utils
      npm list @mediapipe/hands
```

Add explicit acceptance criterion to todo 003 (API route):
```
- [ ] Verify Gemini package installed: @google/generative-ai
      npm list @google/generative-ai
      
      If missing: npm install @google/generative-ai
```

Rationale: Packages are available on npm. Implementation agent will install during setup if missing. Verify rather than assume.

### Environment Variables
**Critical change**: Rename `NEXT_PUBLIC_GEMINI_KEY` → `GEMINI_API_KEY` (server-side only)

- Todo 003: Change all references from `process.env.NEXT_PUBLIC_GEMINI_KEY` to `process.env.GEMINI_API_KEY`
- Todo 008: Update deployment section to set `GEMINI_API_KEY` (not `NEXT_PUBLIC_*`)
- Rationale: The API route runs server-side. No need for `NEXT_PUBLIC_` prefix. Exposing it client-side creates a security vulnerability (anyone can read the key from the browser).

### Documentation
Add `.env.example` entry in todo 003:
```
# In .env.example:
GEMINI_API_KEY=your-gemini-api-key-here
```

## Related Risks

Security audit identified three additional HIGH-severity issues:
1. No payload size limit on API route → add validation (max 10MB base64)
2. No rate limiting on API route → implement anti-abuse (IP-based throttling)
3. XSS via Gemini response → confirm JSX interpolation (no `dangerouslySetInnerHTML`)

These are documented separately in `0004-RISK-api-route-security.md`.

## Acceptance Criteria

- [ ] Todo 001, 003 updated with npm verification steps
- [ ] All env var references changed from `NEXT_PUBLIC_GEMINI_KEY` to `GEMINI_API_KEY`
- [ ] Todo 008 deployment section updated
- [ ] `.env.example` includes `GEMINI_API_KEY`
- [ ] Red team verifies all changes

## For Discussion

1. Should we add a pre-implementation "setup" todo that runs `npm install` for all missing packages? (Currently assuming implementation agent installs as needed.)
2. Is the `GEMINI_API_KEY` name preferred over `GOOGLE_GEMINI_API_KEY` or `PALM_READER_API_KEY`? (Using shorter form for consistency with existing website keys.)
3. Should we add a `.env.example.ci` for CI/CD testing with a test API key? (Defer to todo 007 if needed.)

---

**Status**: Pending implementation (todos must be updated before execution begins)

