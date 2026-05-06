---
name: Type Safety in Error Responses
description: Type casting error responses revealed need for defensive response handling in API consumers
type: RISK
---

# Type Safety Risk: Error Response Casting

## Summary

During red team validation, found a TypeScript type error in the History page where an API response was type-cast to `PaginatedMessages` before checking if the response was successful. Error responses from the API return a different structure (`{ error: string }`), not the success response type.

## Issue

In `app/tools/wa-sender/messages/page.tsx`, the code was:

```typescript
const response = await fetch(`/api/wa-sender/messages?${params}`);
const data: PaginatedMessages = await response.json();

if (data.error) {  // Type error: 'error' not in PaginatedMessages
  setError(data.error);
}
```

This caused a TypeScript compilation error because `data: PaginatedMessages` doesn't have an `error` field — that field only exists on error responses.

## Root Cause

The issue reflects a common pattern in API consumers: assuming the response is always the success type before checking if the request succeeded. In Next.js/Fetch, you must check `response.ok` before assuming the response body matches the success type.

## Fix Applied

Check `response.ok` first, then type cast:

```typescript
const response = await fetch(`/api/wa-sender/messages?${params}`);

if (!response.ok) {
  const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
  setError(errorData.error || 'Failed to fetch messages');
  // ...
} else {
  const data: PaginatedMessages = await response.json();
  // ... success case
}
```

## Commits

- `387c4bb`: Fix TypeScript error in history page error handling

## Implications for Future Work

1. **API Consumer Pattern**: All fetch-based API consumers should check `response.ok` before type casting
2. **Type Union**: Consider using `Response<Success | Error>` type unions for type-safe API responses
3. **Error Response Standardization**: All error responses should follow a consistent `{ error: string, status?: number }` shape

## Severity

**LOW** — Caught by TypeScript compiler before deployment. No runtime risk, only prevented build.

## Follow-up

Monitor for similar patterns in other pages/components calling the API endpoints.
