# RISK: API Route Security Gaps (Payload Size, Rate Limiting, XSS)

**Date**: 2026-05-13  
**Phase**: Planning (todos phase)  
**Type**: RISK  
**Topic**: API route validation and protection  
**Severity**: HIGH (3 findings)  

---

## Findings

Security audit of todo 003 (API route) identified three HIGH-severity gaps:

### Risk 1: No Payload Size Limit
- **Issue**: API route accepts `{ image: string }` with no maximum size validation
- **Attack**: Malicious user POSTs 100MB+ base64 string → server runs out of memory → Vercel function crashes or hits resource limits
- **Cost impact**: Each crash could incur Vercel penalty; wasted processing time
- **Current state**: Todo 003 mentions validating image but not size limits
- **Mitigation**: Validate `image` field length before sending to Gemini API

### Risk 2: No Rate Limiting
- **Issue**: API route has no throttling; each Gemini request costs API credits
- **Attack**: Bot loops rapid requests → API quota exhausted → tool unavailable for legitimate users + billing spike
- **Cost impact**: Gemini free tier has quota limits; exceeded quota = 403 error; premium tier = charges
- **Current state**: Todo 003 mentions 429 error handling but no rate limiting implementation
- **Mitigation**: Implement per-IP rate limiting (e.g., 5 requests per minute per IP)

### Risk 3: XSS via Gemini API Response
- **Issue**: ResultsView renders `description`, `interpretation`, `overall_reading`, `tips` from Gemini API response without sanitization
- **Attack**: Prompt injection via crafted image + Gemini jailbreak → Gemini returns text with HTML tags or JavaScript → rendered in DOM → XSS executes
- **Example**: Image metadata or crafted visual elements → Gemini returns `<img src=x onerror="alert('xss')">`
- **Mitigation**: Confirm todo 002 (ResultsView) uses JSX interpolation (`{text}`), never `dangerouslySetInnerHTML`
- **Current state**: Todo 002 spec mentions rendering results but doesn't explicitly block dangerous HTML methods

## Recommended Mitigations

### For Todo 003 (API Route)

Add to acceptance criteria:

```
### Input Validation & Security
- [ ] Validate image payload size (max 10MB base64 = ~7.5MB JPEG)
      Return 413 (Payload Too Large) if exceeded
- [ ] Validate image format: must be data:image/(jpeg|png|webp);base64,...
      Reject other MIME types with 400
- [ ] Implement rate limiting: max 5 requests per IP per minute
      Return 429 (Too Many Requests) if exceeded
- [ ] Test error scenarios:
      - [ ] Oversized image returns 413
      - [ ] Rapid requests return 429 after limit
      - [ ] Invalid MIME type returns 400
```

### For Todo 002 (ResultsView)

Add to acceptance criteria:

```
### XSS Prevention
- [ ] All Gemini response text rendered via JSX interpolation only
      Example: <p>{results.overall_reading}</p>  ✅
      Do NOT use: dangerouslySetInnerHTML, innerHTML, or eval
- [ ] Confirm no HTML/JavaScript in response breaks the DOM
      (React's default escaping is sufficient; no custom sanitization needed)
- [ ] Test with potentially malicious response:
      - [ ] Text with <script> tags → rendered as literal text, not executed
      - [ ] Text with event handlers → rendered as literal text, not executed
```

### For Todo 007 (Testing)

Add test cases:

```
### API Route Security Tests
- [ ] Test oversized image (>10MB base64): expect 413
- [ ] Test rate limiting: 6 rapid requests from same IP, expect 429 on 6th
- [ ] Test invalid MIME type: expect 400
- [ ] Test XSS payload in image analysis: Gemini response with HTML tags → rendered as text, not executed
```

### For Todo 008 (Deployment)

Add verification:

```
### Post-Deployment Security Verification
- [ ] Test rate limiting in production: curl API 10 times, verify 429 on excess
- [ ] Monitor Vercel function logs for oversized payloads (413 errors)
- [ ] Test XSS in production: supply image, verify results don't contain unescaped HTML
```

## Risk Assessment

| Finding | Probability | Impact | Detectability | Priority |
| --- | --- | --- | --- | --- |
| Payload exhaustion | Medium | High (service crash) | High (monitoring) | HIGH |
| Rate limit abuse | Medium | High (quota exhaustion) | Medium (logs) | HIGH |
| XSS via response | Low (Gemini jailbreak required) | High (account compromise) | High (testing) | HIGH |

## Decision

**All three HIGH-severity gaps MUST be addressed in todo 003 & 002 acceptance criteria before implementation begins.**

These are not post-deployment fixes; they are core requirements that prevent the tool from being deployed safely.

## For Discussion

1. What is the appropriate rate limit? (Proposed: 5 per minute per IP. Does this align with expected user behavior?)
2. Should rate limiting be per-IP or per-user-session? (Free tier tool with no auth suggests per-IP.)
3. Should we log rate limit violations for monitoring abuse patterns? (Recommended: yes.)
4. Is 10MB max size appropriate for palm images? (JPEG quality 0.8 at 640x480 ≈ 100KB; 10MB allows huge batch uploads or videos.)

---

**Status**: Pending todo updates (todos 002, 003, 007 must be revised with these criteria)

