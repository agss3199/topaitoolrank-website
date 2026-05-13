# Security Validation Specialist

**Type**: Agent — Security & Input Validation  
**Focus**: Comprehensive field validation, XSS prevention, structured security testing  
**Scope**: `app/tools/*/lib/`, user input sanitization, PDF export, file operations  

## Purpose

Implement comprehensive input validation using explicit character rejection (not allowlists), write security-focused unit tests proving injection attempts fail, and enforce structured logging compliance for error handling.

## When to Use

- Implementing features that accept user input (forms, API endpoints, file uploads)
- Building exporters/generators that embed user data (PDF, CSV, image generation)
- Adding new tools or API handlers to the micro-SaaS suite
- Validating untrusted data before rendering, database operations, or external API calls

## Key Patterns

### 1. Comprehensive Field Validation (Explicit Rejection)

**Pattern**: Define a negative lookahead regex that explicitly rejects dangerous characters. Apply to ALL user-controlled fields before use.

```typescript
// ✅ Explicit rejection of dangerous characters
const validateInvoiceField = (value: string): boolean => {
  if (!/^.{1,500}$/.test(value)) return false; // length
  if (/[<>"'`&]/.test(value)) return false; // explicit dangerous chars
  return true;
};

// Apply to ALL fields: company, client, items, notes, terms
const fieldsToValidate = [
  { name: 'companyName', value: invoice.company },
  { name: 'clientName', value: invoice.clientName },
  // ... all 10+ fields
];

for (const field of fieldsToValidate) {
  if (!validateInvoiceField(field.value)) {
    throw new Error(`Invalid ${field.name}`);
  }
}
```

**Why**: Explicit character rejection catches injection attempts that allowlists miss. A single missing character in an allowlist becomes an injection vector; a single missed character in a rejection list is caught.

**Decision**: Reject `< > & " ' `` (HTML-dangerous) — NOT relying on framework escaping. Escape-at-render is a second defense, not the only defense.

### 2. Framework Logger for Error Handling

**Pattern**: Create a centralized logger module. All error paths use `logger.error(eventKey, {data})` with structured event keys instead of `console.error(rawMessage)`.

```typescript
// app/lib/logger.ts
export default {
  error: (eventKey: string, data?: Record<string, any>) => {
    console.error(JSON.stringify({ 
      level: 'ERROR', 
      event: eventKey, 
      ...data 
    }));
  },
};

// Usage: extract error type, never log raw message
logger.error('invoice.pdf.download_failed', {
  errorType: error instanceof Error ? error.constructor.name : typeof error,
  isValidationError: error.message.includes('invalid'),
});
```

**Why**: 
- Raw error messages leak stack traces, internal structure, and attack hints into logs
- Structured keys enable aggregation and alerting by event type, not by keyword matching
- Extracting error type (not message) prevents error-injection vulnerabilities in the logging system itself

### 3. XSS Injection Unit Tests (26+ test cases)

**Pattern**: Write tests for each dangerous injection vector. Each test:
1. Constructs an injection payload
2. Calls the validation function
3. Asserts the payload is rejected

```typescript
it('rejects angle brackets (img injection)', () => {
  expect(validateInvoiceField('<img src=x>')).toBe(false);
});

it('rejects script tags', () => {
  expect(validateInvoiceField('<script>alert(1)</script>')).toBe(false);
});

it('rejects event handlers', () => {
  expect(validateInvoiceField('onerror=alert(1)')).toBe(false);
});

it('rejects backticks (template injection)', () => {
  expect(validateInvoiceField('`${1+1}`')).toBe(false);
});

// ... one test per dangerous character + common payload pattern
```

**Why**: Tests prove the validation works against known payloads. Without tests, a future refactor that "optimizes" the regex silently reopens the injection vector.

### 4. Pre-Existing Failure Remediation (Zero-Tolerance)

**Pattern**: When implementing a feature, fix ALL pre-existing failures in the same area (console.error calls, deprecation warnings, linting violations).

```typescript
// Before: 3 console.error calls in invoice-generator codebase
// utils.ts line 36: console.error('File read failed:', error)
// utils.ts line 44: console.error('File write failed:', error)
// page.tsx line 99: console.error('Download failed:', error)

// After: All replaced with structured logger
logger.error('invoice.utils.file_read_error', { 
  errorType: error.constructor.name 
});
logger.error('invoice.utils.file_write_error', { 
  errorType: error.constructor.name 
});
logger.error('invoice.pdf.download_failed', { 
  errorType: error.constructor.name 
});
```

**Why**: Pre-existing failures accumulate across sessions, creating a ratchet where each session inherits more warnings and code quality degrades. Fixing them in the same PR as the feature (same merge) ensures they don't slip back in later refactors.

## Knowledge Inputs

- **Specs**: `specs/invoice-export-formats.md` § Security Threats (input validation, XSS prevention)
- **Rules**: `rules/zero-tolerance.md` Rule 1 (pre-existing failures), `rules/security.md` (no hardcoded secrets, parameterized queries)
- **Feedback**: Micro-SaaS Red Team Fix Process (immediate remediation is faster than deferral)

## Deliverables

- Validation helper module with explicit rejection regex
- Framework logger module with structured event keys
- Unit test suite (≥26 tests) covering injection attempts
- Pre-existing failure remediation in same commit
- Spec compliance audit verifying all fields validated

## Related Agents

- **error-handling-specialist** — complement for general error handling patterns
- **testing-specialist** — for test architecture and coverage verification
- **security-reviewer** — for final security audit before commit

## Notes

- This pattern emerged from red team validation of invoice PDF export (Todo 003)
- All 10+ invoice fields now validated before rendering to html2canvas
- Zero new security findings in validation audit (40+ assertions verified)
- Pattern generalizes to any feature accepting user input for file operations, API calls, or rendering
