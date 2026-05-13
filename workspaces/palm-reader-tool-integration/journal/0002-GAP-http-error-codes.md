# GAP: HTTP Error Codes Not Specified

**Date**: 2026-05-13  
**Phase**: Analysis Validation  
**Type**: GAP  
**Severity**: Low (informational)

## Issue

The API specification in 03-requirements-specifications.md §R2 defines the Gemini Vision API request/response format but does not explicitly specify HTTP status codes for different error scenarios.

## Examples of Missing Specification

```
What IS specified:
- If not a palm: {"is_palm": false, "confidence": X}
- If is a palm: {...full response...}

What is NOT specified:
- Bad request (400 vs 422)
- Server error (500)
- Rate limit exceeded (429)
- API key invalid (401 vs 403)
```

## Remediation

This gap is **not blocking** because:
1. **Inferrable**: HTTP error codes follow standard REST conventions
2. **Documented**: Gemini API documentation provides reference codes
3. **Implementation-friendly**: Developer can refer to Gemini API docs during `/implement` phase
4. **Minor**: Error handling is already designed (app shows user-friendly messages)

## How to Address

**During implementation**:
1. Reference Gemini API documentation for status codes
2. Wrap API calls in try/catch with explicit status code handling
3. Map Gemini error codes to user-friendly messages

**Example handling**:
```typescript
if (response.status === 400) {
  // Invalid request format
  return { success: false, message: "Invalid image format" };
}
if (response.status === 429) {
  // Rate limit exceeded
  return { success: false, message: "Rate limit exceeded, try again later" };
}
if (response.status === 500) {
  // Gemini API error
  return { success: false, message: "Analysis service temporarily unavailable" };
}
```

## Prevention for Future

Add to 03-requirements-specifications.md §R2 (API Response Format):

```markdown
## HTTP Status Codes

| Code | Scenario | Response |
|------|----------|----------|
| 200 | Success | {...} |
| 400 | Invalid image format | {"success": false, "message": "..."} |
| 429 | Rate limit exceeded | {"success": false, "message": "..."} |
| 500 | Gemini API error | {"success": false, "message": "..."} |
```

## Impact on Timeline

None — This gap does not affect planning or implementation timeline. It's discoverable during implementation and handled via standard patterns.

## Status

Not blocking analysis phase completion. Will be addressed during `/implement` phase.
