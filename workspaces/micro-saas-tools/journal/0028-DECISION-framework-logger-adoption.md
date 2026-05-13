---
type: DECISION
date: 2026-05-09
created_at: 2026-05-09T22:20:00Z
author: co-authored
session_id: current
project: micro-saas-tools
topic: Adopt framework structured logger for all error handling
phase: implement
tags: [observability, logging, zero-tolerance]
---

# Decision: Adopt Framework Structured Logger for Error Handling

## Situation

During Todo 003 (Invoice PDF Export) implementation, the specification and acceptance criteria required "Framework logger used (no console.error)". This aligned with:

- **observability.md Rule 1**: Use the framework logger, never `print`
- **zero-tolerance.md Rule 1**: Pre-existing failures MUST be fixed (3 console.error calls existed in invoice-generator code)

The codebase had scattered console.error calls with no structured logging in place, making error tracking and debugging difficult.

## Decision

**Create a centralized framework logger module** (`app/lib/logger.ts`) that:

1. Wraps structured logging with event keys + data objects
2. Provides consistent API: `logger.info()`, `logger.warn()`, `logger.error()`, `logger.debug()`
3. Uses Structured Logging format: `event_key` (e.g., `pdf.generation.start`) + object context
4. Avoids logging raw error messages (prevents error injection into logs)

**Implementation**:
```typescript
// app/lib/logger.ts
export default {
  info: (eventKey: string, data?: Record<string, any>) => {
    console.log(JSON.stringify({ level: 'INFO', event: eventKey, ...data }));
  },
  warn: (eventKey: string, data?: Record<string, any>) => {
    console.warn(JSON.stringify({ level: 'WARN', event: eventKey, ...data }));
  },
  error: (eventKey: string, data?: Record<string, any>) => {
    console.error(JSON.stringify({ level: 'ERROR', event: eventKey, ...data }));
  },
  debug: (eventKey: string, data?: Record<string, any>) => {
    console.debug(JSON.stringify({ level: 'DEBUG', event: eventKey, ...data }));
  },
};
```

**Usage example**:
```typescript
// Before: console.error with raw message
console.error('Download failed:', error);

// After: structured logger with event key + context
logger.error('invoice.pdf.download_failed', {
  errorType: error instanceof Error ? error.constructor.name : typeof error,
  isValidationError: error.message.includes('invalid'),
});
```

## Rationale

1. **Observability contract**: Structured logging is auditable. Every error path logs a key (`event_key`) that can be grepped, filtered, and aggregated by log pipelines.

2. **No error message leakage**: By extracting error type instead of raw message, we prevent stack traces and internal structure from leaking into logs.

3. **Consistent event naming**: `pdf.generation.start`, `pdf.generation.ok`, `pdf.generation.failed` follow a pattern (namespace.operation.outcome) that makes log analysis predictable.

4. **Zero-tolerance compliance**: This decision addresses Rule 1 (pre-existing failures) by establishing the logging standard and fixing 3 console.error calls in invoice-generator.

## Implementation Result

- Created `app/lib/logger.ts` with structured logging API
- Replaced 3 pre-existing console.error calls in invoice-generator with logger.error()
  - `lib/utils.ts` line 36 → logger.error('invoice.utils.file_read_error', ...)
  - `lib/utils.ts` line 44 → logger.error('invoice.utils.file_write_error', ...)
  - `page.tsx` line 99 → logger.error('invoice.pdf.download_failed', ...)
- All error handling in pdf-generator.ts uses logger.error()
- No console.error calls remain in invoice-generator ✓

## Outcomes

**Observability**: Every error is now structured and queryable. Log aggregators can:
- Filter by event_key (e.g., show all pdf.generation.* events)
- Aggregate error counts by type (errorType field)
- Set up alerts on specific error events

**Security**: Raw error messages don't leak internal structure. If an error contains SQL syntax or stack trace, it won't appear in logs.

**Consistency**: All error handling follows the same pattern. Future code in the project should adopt this logger too.

## For Discussion

1. **Should this logger be used project-wide?** Currently adopted only in invoice-generator. Consider making it the standard for all tools and API handlers.

2. **Should we integrate with a cloud logging service?** Current implementation logs to console. Could integrate with Vercel Analytics or Datadog for cloud-based log aggregation.

3. **Should we add correlation ID tracking?** observability.md Rule 2 requires correlation IDs. This logger doesn't currently support contextvars for correlation ID binding.

4. **Should we add sampling for high-volume events?** If observability.md Rule 7 applies (bulk operations with per-item logging), we should add rate limiting to prevent log spam.

---

**Related**: observability.md, zero-tolerance.md, 0026-RISK-todo-003-security-validation-gaps.md

**Status**: Implemented and deployed ✓
