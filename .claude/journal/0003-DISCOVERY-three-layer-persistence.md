---
date: 2026-04-29
type: DISCOVERY
title: Three-Layer Persistence Model for User Session State
---

## Summary

Extracted and validated a reusable architectural pattern for persisting user session state across login cycles in Next.js + Supabase applications.

## The Three-Layer Model

```
┌─ React Component (State) ──────────────┐
│  sheets[], mode, message, sentStatus   │
└────────────┬─────────────────────────┘
             │ auto-save on change
             ↓
┌─ Next.js API Route (Validation) ──────┐
│  UUID check, length limits, types      │
└────────────┬─────────────────────────┘
             │ validated payload
             ↓
┌─ Supabase PostgreSQL (Persistence) ───┐
│  wa_sender_sessions table              │
└────────────┬─────────────────────────┘
             │ query on mount
             ↓
┌─ React Component (Restoration) ────────┐
│  All fields restored from database      │
└─────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Exhaustive Dependency Arrays

The auto-save useEffect must include ALL mutable state:

```typescript
useEffect(() => {
  const timer = setTimeout(() => saveSession(...), 500);
  return () => clearTimeout(timer);
}, [sheets, mode, countryCode, message, emailSubject, emailBody, currentIndex, sentStatus]);
```

**Why:** Missing dependencies cause silent data loss. If `emailSubject` isn't in the dependency array and the user edits the subject, the change triggers no save.

### 2. Separate Load Effect

Load happens ONCE on component mount via a separate effect with empty dependencies:

```typescript
useEffect(() => {
  if (!userId || didMountRef.current) return;
  didMountRef.current = true;
  loadSessionFromSupabase();
}, []); // Empty deps
```

**Why:** Prevents double-save on mount. If load were in the auto-save effect, it would trigger the auto-save callback, creating infinite loops.

### 3. Validation at API Boundary

Validate ALL inputs at the API route before touching the database:

```typescript
if (!isValidUUID(userId)) return error();
if (message_template.length > 4096) return error();
if (email_subject.length > 255) return error();
```

**Why:** Frontend validation is UX-only. Backend validation is security-critical. Never trust the frontend.

### 4. User-Facing Error Notifications

Every error visible via `setNotice()`:

```typescript
const res = await fetch('/api/sheets/save', {...});
if (!res.ok) {
  const { error } = await res.json();
  setNotice({
    text: `Save failed: ${error}`,
    kind: 'error',
  });
}
```

**Why:** Silent failures are the worst UX. Users need to know when saves fail so they can either retry or save locally.

### 5. Structured Logging with Masking

Every error logged with context but WITHOUT exposing PII:

```typescript
console.error('[wa-sender] save.error', {
  userId: userId.substring(0, 8) + '...',  // Masked
  errorCode: error.code,
  timestamp: new Date().toISOString(),
});
```

**Why:** Operators can triage "user 550e8400... had this error" without accessing personal data.

## Field Mapping

| React State | Column Name | Type | Max | Default |
|-------------|-------------|------|-----|---------|
| sheets | sheet_data | JSONB | — | [] |
| mode | send_mode | TEXT | — | 'whatsapp' |
| countryCode | country_code | TEXT | 5 | '+1' |
| message | message_template | TEXT | 4096 | '' |
| emailSubject | email_subject | TEXT | 255 | '' |
| emailBody | email_body | TEXT | 65536 | '' |
| currentIndex | current_index | INTEGER | — | 0 |
| sentStatus | sent_status | JSONB | — | {} |

## Testing Coverage

All eight fields tested for:
- Save when changed
- Restore when user logs back in
- Validation on save
- Error notification on failure
- Default values when field is null

40+ test cases implemented; all passing.

## Reusability

This pattern can be reused for any Next.js + Supabase application that needs to persist user session state. The key invariants are:

1. Use exhaustive dependency arrays (include all mutable state)
2. Separate load from auto-save (prevent loops)
3. Validate at API boundary (security)
4. Show all errors to user (UX)
5. Mask PII in logs (privacy)

Any deviation from these invariants creates either data loss (missing deps), infinite loops (merged effects), security issues (missing validation), or poor UX (silent failures).
