# 003 — Create API Route with Gemini Vision Integration

**Status**: completed  
**Owner**: react-specialist  
**Phase**: implement  
**Effort**: 20 min (copy + adapt from source)  
**Depends on**: none  
**Blocks**: 007 (testing)

---

## Overview

Create the API endpoint at `/app/api/tools/palm-reader/route.ts` that accepts a base64-encoded palm image, calls the Google Generative AI (Gemini) API with a specialized prompt, parses the JSON response, and returns structured palm reading results to the client.

**Scope**: ~100 LOC, straightforward request/response handler.

---

## Specification References

- **R2: Palm Analysis via Gemini Vision API** — spec §R2 request/response format, prompt, error handling

---

## Acceptance Criteria

### Route Handler Structure
- [ ] Create `app/api/tools/palm-reader/route.ts`
- [ ] Export async `POST` handler: `export async function POST(request: Request)`
- [ ] Handler returns NextResponse with proper CORS headers
- [ ] Accept JSON body: `{ image: string }` (data URL or base64)
- [ ] Return JSON response matching spec §R2 format

### Gemini API Integration
- [ ] Initialize Google Generative AI client with `NEXT_PUBLIC_GEMINI_KEY` env var
- [ ] Use model: `gemini-2.0-flash`
- [ ] Send multimodal request (image + text prompt)
- [ ] Extract base64 from data URL if needed
- [ ] Call Gemini API with:
  - Temperature: 0.2 (low, for consistency)
  - Max tokens: 1024
  - Image format: JPEG, quality 0.8

### Prompt Engineering
Craft a specialized prompt that:
- [ ] Instructs Gemini to analyze a palm image
- [ ] Requests structured JSON response (specify exact field names from spec §R2)
- [ ] Rejects non-palm images with `is_palm: false`
- [ ] Identifies 5 palm lines: life, heart, head, fate, sun
- [ ] Provides descriptions and interpretations for each line
- [ ] Includes overall reading (1-2 sentences)
- [ ] Provides one practical tip
- [ ] Explicitly forbids medical/harm predictions (spec §R2)

### Response Parsing
- [ ] Parse Gemini response JSON (expect multiline JSON in response text)
- [ ] Validate response structure matches PalmReadingResponse type
- [ ] Return success response: `{ success: true, data: {...} }`
- [ ] Handle non-palm images: return `{ is_palm: false, confidence: 0, ...empty lines }`

### Input Validation & Security (CRITICAL)
- [ ] Validate image payload size: reject if base64 string > 10MB
- [ ] Return 413 (Payload Too Large) for oversized images
- [ ] Validate MIME type: image data URL must match `data:image/(jpeg|png|webp);base64,...`
- [ ] Return 400 (Bad Request) for invalid MIME types
- [ ] Implement rate limiting: max 5 requests per IP per minute
- [ ] Return 429 (Too Many Requests) if limit exceeded
- [ ] Do NOT log or validate API key format (prevent information disclosure)

### Error Handling
- [ ] Catch and handle API errors (network, rate limit, invalid key)
- [ ] Return HTTP status codes:
  - 200 OK: successful analysis
  - 400 Bad Request: missing/invalid/oversized image
  - 413 Payload Too Large: image > 10MB
  - 429 Too Many Requests: rate limit exceeded
  - 500 Internal Server Error: API error
- [ ] Include user-friendly error messages in response (generic, no internal details)
- [ ] Log detailed errors server-side only (not exposed to client)

### Type Safety
- [ ] Define PalmReadingResponse type (or import from lib/types.ts if created in 002)
- [ ] No `any` types in TypeScript
- [ ] Proper error type handling (Error vs string)

### Environment Variables
- [ ] Use `process.env.GEMINI_API_KEY` (server-side only, NO `NEXT_PUBLIC_` prefix)
- [ ] Handle missing env var gracefully (return 500 with message)
- [ ] Do NOT log or validate API key format in error messages (prevent information disclosure)

### Package Verification
- [ ] Verify `@google/generative-ai` installed: `npm list @google/generative-ai`
- [ ] If missing: `npm install @google/generative-ai`

### Test Coverage
- [ ] Unit test: Handler accepts valid image and returns formatted response
- [ ] Unit test: Handler rejects non-palm image with `is_palm: false`
- [ ] Unit test: Handler returns 400 for missing image
- [ ] Unit test: Handler catches Gemini API errors and returns 500
- [ ] Unit test: Handler returns 413 for oversized image (>10MB base64)
- [ ] Unit test: Handler returns 400 for invalid MIME type (not image/jpeg, image/png, image/webp)
- [ ] Unit test: Handler returns 429 after rate limit exceeded (5 requests per minute)
- [ ] Integration test: Handler calls real Gemini API (use test key if available)
- [ ] Integration test: Response parses to valid JSON matching spec §R2
- [ ] Integration test: Oversized payload rejected in production limits
- [ ] Integration test: Rate limiting works correctly under load

### Code Quality
- [ ] No hardcoded API keys or secrets
- [ ] All errors logged with context (request ID, timestamp)
- [ ] Response time monitoring (log duration for perf tracking)
- [ ] No unhandled promise rejections

---

## Files to Create/Modify

```
app/api/tools/palm-reader/
├── route.ts (new, ~100 LOC)
└── prompt.ts (new, ~30 LOC) — extracted prompt string
```

---

## Prompt Template

```typescript
// In prompt.ts
export const PALM_ANALYSIS_PROMPT = `
You are an AI palm reader providing entertainment and divination insights.

Analyze this palm image and provide a structured palm reading.

If this is NOT a palm image, respond with is_palm: false.

If this IS a palm, analyze the major lines and provide interpretations.

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "is_palm": true/false,
  "confidence": 0-100,
  "lines": {
    "life_line": {"present": true/false, "description": "...", "interpretation": "..."},
    "heart_line": {"present": true/false, "description": "...", "interpretation": "..."},
    "head_line": {"present": true/false, "description": "...", "interpretation": "..."},
    "fate_line": {"present": true/false, "description": "...", "interpretation": "..."},
    "sun_line": {"present": true/false, "description": "...", "interpretation": "..."}
  },
  "overall_reading": "1-2 sentence summary",
  "tips": "One practical tip"
}

IMPORTANT: This is entertainment only. Never predict health, death, or harm.
`;
```

---

## Request/Response Examples

### Successful Request
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

### Successful Response (Palm Detected)
```json
{
  "is_palm": true,
  "confidence": 85,
  "lines": {
    "life_line": {
      "present": true,
      "description": "Long line extending from wrist to base of pinky",
      "interpretation": "Indicates a full life with many experiences"
    },
    ...
  },
  "overall_reading": "Your palm suggests a balanced life with good fortune.",
  "tips": "Embrace opportunities that come your way."
}
```

### Non-Palm Response
```json
{
  "is_palm": false,
  "confidence": 0,
  "lines": { ... empty objects ... },
  "overall_reading": "",
  "tips": ""
}
```

---

## Implementation Notes

### Image Format Handling
- Client sends data URL: `data:image/jpeg;base64,...`
- Extract base64 part: split on comma, take second part
- Pass to Gemini API in `content` array with `image` part

### API Call Pattern (using google-generative-ai package)
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const client = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_KEY);
const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

const result = await model.generateContent([
  {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image,
    },
  },
  PALM_ANALYSIS_PROMPT,
]);

const text = result.response.text();
const jsonResponse = JSON.parse(text); // May need cleanup for multiline JSON
```

### Response Cleanup
Gemini may return markdown-wrapped JSON (e.g., wrapped in backticks). Clean before parsing:
```typescript
let cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
const response = JSON.parse(cleanJson);
```

---

## Verification Checklist

- [ ] Route file created at correct path: `app/api/tools/palm-reader/route.ts`
- [ ] POST handler exported and callable
- [ ] Accepts image in request body
- [ ] Calls Gemini API with correct model and prompt
- [ ] Parses response JSON successfully
- [ ] Returns response matching spec §R2 format
- [ ] Handles missing/invalid image with 400
- [ ] Handles API errors with 500 + message
- [ ] Works with real Gemini API (test with sample image)
- [ ] Response time: 2-3 seconds typical
- [ ] All unit tests pass: `npm test -- api/tools/palm-reader`
- [ ] No console errors when called from page.tsx

---

## Related Todos

- **Depends on**: none (can be built independently)
- **Blocks**: 007 (testing needs working API)
- **Parallelize with**: 001, 002 (page components)

---

## Session Context

- Source API handler: `AIIndividualProject/workspaces/palm-reader-ai/app/api/analyze/route.js`
- Gemini docs: Google Generative AI official documentation
- API key: Available in project `.env.local` as `NEXT_PUBLIC_GEMINI_KEY`

