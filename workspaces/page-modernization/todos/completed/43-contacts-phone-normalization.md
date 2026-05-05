# 43-contacts-phone-normalization

**Implements**: specs/wa-sender-contacts.md § Phone Number Normalization  
**Depends On**: None (pure utility function, no UI or DB dependencies)  
**Capacity**: ~80 LOC load-bearing logic / 3 invariants (E.164 output format, country code detection from user setting fallback to IP, invalid phones produce error not silent skip) / 1 call-graph hop (raw phone string → normalized E.164 string) / Implements phone number normalization to E.164 using `libphonenumber-js`, with fallback country code detection from user settings, returning both original and normalized forms.  
**Status**: ACTIVE

## Context

Phone normalization is a prerequisite for deduplication (todo 40) — two contacts with the same number in different formats must be recognized as duplicates. Normalizing to E.164 (+11234567890) creates a canonical form for comparison.

This todo can be implemented independently and ahead of todos 40-44. It is a pure utility module with well-defined inputs and outputs, making it easy to test in isolation.

## Scope

**DO:**
- Install `libphonenumber-js` npm package
- Create `app/lib/contacts.ts` with:
  - `normalizePhone(phone: string, countryCode: string): { original: string, normalized: string | null, valid: boolean, error?: string }`
  - `detectCountryCode(phone: string): string | null` — attempts to detect country from the number itself (international format)
  - `normalizePhoneWithFallback(phone: string, defaultCountry: string): NormalizePhoneResult` — uses `detectCountryCode` first, falls back to `defaultCountry`
- Handle common formats: `(555) 123-4567`, `555-123-4567`, `5551234567`, `+1-555-123-4567`, `+44 1632 960000`, `0207946 0958`
- Return `valid: false` with `error` string for unparseable numbers — do NOT silently skip invalid phones
- Output format: E.164 (`+11234567890` — no spaces, no dashes, with country code prefix)

**DO NOT:**
- Store original and normalized as separate DB columns — per spec "store original + normalized versions if needed for user reference." Store both in the API handler that calls this function, not in this utility.
- Attempt to "fix" obviously invalid numbers — return valid: false
- Build any UI (this is a pure utility)
- Hard-code country code lists — let `libphonenumber-js` handle them

## Deliverables

**Create:**
- `app/lib/contacts.ts` — phone normalization utilities

**Modify:**
- `package.json` — add `libphonenumber-js` dependency

**Tests:**
- `__tests__/contacts-phone-normalization.test.ts`

## Testing

**Unit tests (Tier 1) — all specified in spec §Phone Number Normalization:**
- `test_normalizes_us_number_without_country_code` — `normalizePhone("555-123-4567", "US")` returns `"+15551234567"`
- `test_normalizes_us_number_with_plus_one` — `normalizePhone("+1-555-123-4567", "US")` returns `"+15551234567"`
- `test_normalizes_uk_number_with_plus` — `normalizePhone("+44 1632 960000", "GB")` returns `"+441632960000"`
- `test_normalizes_uk_number_without_plus` — `normalizePhone("0207946 0958", "GB")` returns `"+442079460958"`
- `test_returns_valid_false_for_random_string` — `normalizePhone("not-a-phone", "US")` returns `{ valid: false, error: "..." }`
- `test_returns_valid_false_for_too_short` — `normalizePhone("123", "US")` returns `{ valid: false }`
- `test_detect_country_code_from_international` — `detectCountryCode("+441632960000")` returns `"GB"`
- `test_detect_country_code_returns_null_for_local_number` — `detectCountryCode("5551234567")` returns null (no country prefix)
- `test_normalize_with_fallback_uses_detected_country` — `normalizePhoneWithFallback("+441632960000", "US")` returns UK-normalized number (not US)
- `test_normalize_with_fallback_uses_default_for_local` — `normalizePhoneWithFallback("5551234567", "US")` uses "US" fallback → returns `"+15551234567"`

**Manual checks (using the function directly):**
- Verify a range of international formats normalize correctly
- Verify that invalid inputs produce `valid: false` with informative error messages

## Implementation Notes

- `libphonenumber-js` API: use `parsePhoneNumber(phone, defaultCountry)` which returns a `PhoneNumber` object. Call `.format('E.164')` for the normalized form. Wrap in try-catch since it throws on invalid input.
- The `countryCode` parameter accepts ISO 3166-1 alpha-2 codes (e.g., "US", "GB", "IN") — matches what `user_preferences.default_country_code` stores.
- If `libphonenumber-js` is too heavy for the bundle, use `libphonenumber-js/min` (core only, ~50% smaller) since we only need parsing and E.164 formatting.
- The `NormalizePhoneResult` type:
  ```typescript
  interface NormalizePhoneResult {
    original: string;
    normalized: string | null;
    valid: boolean;
    error?: string;
  }
  ```
- This function is called during import (server-side, in the API route handler) — not client-side. It does not need to be in the browser bundle. Put it in a file that is only imported from API routes to avoid bloating the frontend bundle.
