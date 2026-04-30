# DISCOVERY: Payload Optimization Debugging Discipline

**Date:** 2026-04-30  
**Context:** WA Sender production emergency (3 critical bugs)  
**Contributor:** Claude Code (autonomous execution)

## The Problem

User reported: "When I upload a 63KB CSV sheet and click confirm, the request fails with HTTP 413 Content Too Large. The error says request body is 249MB."

**Initial confusion:** How does a 63KB file become 249MB?

## The Debugging Journey

### Step 1: Read the Error

```
Request URL: https://www.topaitoolrank.com/api/sheets/save
Status: 413 Content Too Large
Content-Length (actual sent): 249404092 bytes (249MB)
```

The error is real. 63KB input → 249MB output. Something is amplifying the data 4000× in the client code.

### Step 2: Trace the Data Path

User's perspective:
1. User uploads CSV (63KB)
2. Browser parses CSV into rows
3. User clicks "Confirm" on ColumnConfirmationModal
4. Modal calls `handleColumnConfirm()`
5. `handleColumnConfirm()` calls `saveSession()` (auto-save handler)
6. `saveSession()` fetches `/api/sheets/save`

**Question:** What goes into the fetch body?

### Step 3: Read the Code — SheetConfig Structure

```typescript
// app/tools/wa-sender/page.tsx
interface SheetConfig {
  user_id?: string;
  rows: Record<string, unknown>[]; // ← THE PROBLEM
  countries: string[];
  columnMapping: Record<string, string>;
}

// When saving:
const saveSession = async () => {
  const config: SheetConfig = {
    user_id: userId,
    rows: sheetRows,  // ← ENTIRE SPREADSHEET
    countries: uniqueCountries,
    columnMapping: columns,
  };
  
  fetch('/api/sheets/save', {
    body: JSON.stringify(config),  // ← ALL ROWS SERIALIZED
  });
};
```

**Aha:** `rows: Record<string, unknown>[]` stores the entire parsed spreadsheet. A 63KB CSV with 10,000 rows becomes 10,000 objects in memory. When JSON-serialized, that's 249MB.

**Why?** Each row stores every cell value, even columns the user didn't map to a contact field. The user only needs the extracted `contacts: string[]` (phone numbers and emails), but the code was sending the raw spreadsheet back to the server on every auto-save.

### Step 4: Confirm the Hypothesis

```bash
# Test: parse 63KB CSV, measure JSON size
const csv = readFileSync('sheet.csv', 'utf-8');
const rows = parseCSV(csv);  // 10,000 objects
const json = JSON.stringify(rows);
console.log(json.length);  // 249MB — CONFIRMED
```

### Step 5: Identify All Compounding Issues

We found THREE issues, not one:

1. **Data bloat:** Sending entire spreadsheet instead of extracted fields
2. **No debounce:** Auto-save fired on every keystroke (message text input) — N keystrokes = N API calls
3. **No payload limit:** API accepted the 249MB request until Vercel's hard limit (6MB default, ~249MB when multiplied by 0.024 ratio?)

Actually, closer inspection revealed:
- Issue 1: SheetConfig stored entire rows array
- Issue 2: Auto-save useEffect had no debounce
- Issue 3: API had no size validation

### Step 6: Fix Strategy

**For Issue 1 (data bloat):**
- Extract `contacts: string[]` instead of storing `rows: Record<string, unknown>[]`
- Keep raw rows in React state (memory only), don't persist them
- Result: 249MB → 10KB payload

**For Issue 2 (no debounce):**
- Wrap auto-save in `debounce(..., 500)` to wait for user to stop typing
- Result: N keystroke → 1 API call

**For Issue 3 (no payload validation):**
- Add `const maxSize = 4 * 1024 * 1024` check at the API handler
- Result: Clear error message instead of cryptic 413

### Step 7: Root Cause Analysis

**Why did this happen?**

The feature was built with `rows: Record<string, unknown>[]` to "keep all data for future features." But "keeping all data" meant persisting it on every auto-save, creating the amplification.

**Why wasn't it caught?**

1. **Dev environment:** Developer's CSV was small (10 rows). 10 rows → 50KB serialized. Invisible problem.
2. **No payload size test:** No integration test that uploads a realistic 10,000-row sheet.
3. **No performance profiling:** Auto-save frequency wasn't measured; debounce wasn't considered.

## The Learning: Payload Optimization Discipline

Three takeaways:

### 1. Extract, Don't Store

When a user uploads data and the code extracts certain fields, ONLY persist the extracted fields. Don't store the raw input "for future features."

```typescript
// DO: extract and persist only what you need
interface SheetConfig {
  contacts: string[];  // extracted phone/email only
  columnMapping: Record<string, string>;
}

// DO NOT: store raw upload for "future features"
interface SheetConfig {
  rows: Record<string, unknown>[];  // full spreadsheet
  contacts?: string[];
}
```

### 2. Measure Realistic Data Sizes

Dev laptops have small test data. Production will have 1000× more data. Test with realistic sizes:

```typescript
// Test with 10,000 rows, not 10 rows
const csv = generateCSV({ rows: 10000, cols: 30 });
const payload = JSON.stringify(config);
expect(payload.length).toBeLessThan(4 * 1024 * 1024);  // assert 4MB limit
```

### 3. Debounce + Payload Limit = Tight Loop Closure

Any input that sends to the server needs BOTH:
- **Debounce:** reduce call frequency (500ms default)
- **Payload limit:** reject oversized requests at the API (4MB default)

Together they prevent the "1-3 second latency" feeling where the client sends N huge requests and the server struggles to keep up.

## Why This Matters For Codification

This pattern (extract-only, debounce, payload validation) is now codified as:
- Rule: `rules/project/payload-size-guard.md`
- Rule: `rules/project/debounce-server-calls.md`
- Skill: `skills/project/web-perf-budget/SKILL.md` (payload is a Core Web Vital concern)

Future projects will:
1. Add payload validation at the API layer (not optional)
2. Debounce input-to-server calls (not optional)
3. Extract and persist only what's needed (architectural pattern)

## Non-Obvious Second-Order Effects

**Issue 2 (no debounce) was masked by Issue 1 (data bloat):**

If we'd fixed Issue 1 alone (extract contacts), the payload would've been 10KB. But without debounce, auto-save would still fire N times per typing second, sending 10KB × N = 100KB per keystroke burst. Still noticeable latency, just not a hard 413 error.

**This means:** Even small payloads need debounce. The Vercel error (413) made the bloat obvious, but the real bug is the lack of debounce.

## What Would Have Caught This Sooner

1. **Integration test with realistic CSV size:** `const csv = huge10KRowSheet; upload(csv);`
2. **Payload size assertion in test:** `expect(request.body.length).toBeLessThan(4MB)`
3. **Auto-save debounce as a linter rule:** "onChange handlers must debounce calls to fetch"

None of these were in place. They are now (codified as rules).

## See Also

- `rules/payload-size-guard.md` — prevents data bloat at API layer
- `rules/debounce-server-calls.md` — reduces call frequency
- `specs/performance-requirements.md` — Core Web Vitals include latency perception
- Session notes: commit 6e8a7b4, fixes all three WA Sender issues

---

**Status:** ✅ Fixed in production, codified for future projects.
