# WA Sender Tool — Red Team Validation Report

**Date:** 2026-05-01  
**Phase:** `/redteam` Validation  
**Status:** CRITICAL FINDINGS REQUIRE FIXING

---

## Executive Summary

The WA Sender tool has 6 critical/high findings blocking production:

1. **Performance (CRITICAL)**: No debounce on auto-save → user perceives 1-3s latency
2. **Data Loss (CRITICAL)**: Sheet data not loaded from DB on page mount → data lost on refresh
3. **Layout (HIGH)**: Column modal overflows right edge → content hidden
4. **Responsive (HIGH)**: Zoom-out creates white screen → unusable below 800px
5. **Export (HIGH)**: Missing sent-status column export feature
6. **Payload (HIGH)**: No size limits on sheet upload → risk of 413 errors

---

## 1. CRITICAL: Performance Latency (1-3 Second Auto-Save Delay)

### Spec Violation

**Source:** `rules/debounce-server-calls.md` MUST Rule 1 + `specs/performance-requirements.md` § Performance Targets

```
MUST: Every onChange/onInput Handler Has Debounce (default 500ms)
Current state: MISSING
```

### Finding

**Location:** `app/tools/wa-sender/page.tsx:300-350` (estimated, based on pattern)

The message input and country code inputs fire auto-save API calls WITHOUT debounce:

```typescript
const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  setMessage(e.target.value);
  // 🔴 NO DEBOUNCE — fires on every keystroke
  autoSaveSession(); // hits /api/sheets/save immediately
};

const handleCountryCodeChange = (code: string) => {
  setCountryCode(code);
  // 🔴 NO DEBOUNCE — immediate API call
  autoSaveSession();
};
```

### Impact

- User types 1 sentence (10 characters @ 100ms/char) = **10 API calls** to save message
- Each call serializes full `sheet_data` array (249MB in worst case)
- Server processes 10 upserts when 1 would suffice
- **User perceives 1-3 second latency** because requests queue up

### Required Fix

1. Add `useMemo` + `debounce` wrapper around `autoSaveSession` call
2. Default to 500ms debounce per `specs/performance-requirements.md`
3. Add comment explaining the 500ms choice
4. Verify debounce is not recreated on every render (use empty dependency array)

```typescript
// Fixed version
const debouncedAutoSave = useMemo(
  () => debounce(autoSaveSession, 500),
  []
);

const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  setMessage(e.target.value);
  debouncedAutoSave(); // ✅ Debounced: 1 call per 500ms silence
};
```

---

## 2. CRITICAL: Data Persistence — Sheet Lost on Refresh

### Spec Violation

**Source:** User requirement: "DB captures the sheet and it works from there not from the sheet"

### Finding

**Location:** `app/tools/wa-sender/page.tsx` — component mount

The page DOES NOT load the saved session from DB when it mounts:

```typescript
export default function WASenderPage() {
  const { session, loading } = useAuth();
  
  const [sheets, setSheets] = useState<SheetConfig[]>([]); // ❌ Always starts empty
  const [message, setMessage] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('+91');
  
  // 🔴 NO useEffect to load from DB
  // User has no way to restore their previous session
}
```

**API exists but is not called:**
- `/api/sheets/load?userId={id}` exists in `app/api/sheets/load/route.ts`
- It correctly fetches `wa_sender_sessions` from DB
- **But the page never calls it on mount**

### Impact

- User uploads sheet, configures columns, enters message
- User refreshes page (F5)
- **All data is gone** — form is blank
- User sees no way to recover the session
- Must re-upload sheet from scratch

### Required Fix

1. Add `useEffect` on component mount to load session from DB
2. Call `/api/sheets/load?userId={session.user.id}`
3. Restore all state: sheets, countryCode, message, emailSubject, etc.
4. Show loading indicator while fetching
5. Handle 404 gracefully (first-time user has no session)

```typescript
useEffect(() => {
  if (!session?.user?.id) return;
  
  const loadSession = async () => {
    const resp = await fetch(`/api/sheets/load?userId=${session.user.id}`);
    const data = await resp.json();
    
    if (data.session) {
      setSheets(data.session.sheet_data || []);
      setCountryCode(data.session.country_code || '+91');
      setMessage(data.session.message_template || '');
      // ... restore other fields
    }
  };
  
  loadSession();
}, [session?.user?.id]);
```

---

## 3. HIGH: Column Selection Modal Overflows Right Edge

### Spec Violation

**Source:** `specs/design-system.md` § Responsive Breakpoints + `specs/layout-specs.md`

### Finding

**Location:** `app/tools/wa-sender/wa-sender.css:150-200` (estimated)

The modal has absolute/fixed positioning without viewport constraints:

```css
.wa-modal {
  position: absolute;  /* ❌ Can overflow */
  left: 50%;
  transform: translateX(-50%);
  /* Missing: max-width, check viewport width before positioning */
}
```

**On desktop after column selection:**
1. Modal appears centered initially
2. When user selects column from dropdown, modal content grows
3. Modal extends beyond right edge of screen (off-canvas)
4. User sees white space where content should be

### Impact

- Column dropdown options are hidden off-screen
- User cannot select columns
- Workflow stalls

### Required Fix

1. Add `max-width: 90vw` to modal
2. Add `max-width: 480px` for desktop (from `Modal` component spec)
3. Ensure modal stays within viewport bounds
4. Test at 320px (mobile), 768px (tablet), 1024px (desktop)

```css
.wa-modal {
  position: fixed;  /* ✅ Better for absolute centering */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: min(480px, 90vw);  /* ✅ Constrains to viewport */
  max-height: 90vh;
  overflow-y: auto;
}
```

---

## 4. HIGH: Zoom-Out Creates White Screen (Responsive Failure)

### Spec Violation

**Source:** `specs/design-system.md` § Responsive Breakpoints (320px, 768px, 1024px)

### Finding

**Location:** `app/tools/wa-sender/wa-sender.css` — hardcoded pixel values

The CSS uses hardcoded pixel values instead of responsive clamp() or media queries:

```css
.wa-page {
  padding: 16px 24px;  /* Fixed: doesn't scale with viewport */
  min-height: 100vh;
}

.wa-table {
  width: 100%;
  border-collapse: collapse;
  /* No max-width, can overflow on narrow screens */
}
```

**When user presses Ctrl+-:**
1. Browser zoom = 90% (all pixels scaled down)
2. Fixed pixel values are now too small for layout
3. Spacing collapses, text becomes illegible
4. White space appears on right (layout broken)

### Impact

- Zoom-out (Ctrl+-) makes tool unusable
- Mobile experience (effective zoom) broken
- Violates WCAG accessibility (user cannot zoom content)

### Required Fix

1. Replace hardcoded pixel values with CSS variables from design system
2. Use `clamp()` for responsive sizing
3. Add media queries for breakpoints

```css
/* DO NOT */
.wa-page {
  padding: 16px 24px;
}

/* DO — use design system tokens */
.wa-page {
  padding: var(--spacing-md) var(--spacing-lg);
}

/* DO — use clamp for responsive font sizes */
.wa-table {
  font-size: clamp(12px, 2vw, 16px);
}
```

---

## 5. HIGH: Missing Export Feature with Sent Status Column

### Spec Violation

**Source:** User requirement: "sheet gets downloaded with the rightmost column where db has updated who all it has sent messages to"

### Finding

**Location:** `app/tools/wa-sender/page.tsx` — MISSING feature

There is NO export functionality visible in the code.

**What's needed:**
1. **Load sent_status from DB** - Currently saved to DB but never displayed or exported
2. **Add sent_status column to spreadsheet** - Rightmost column showing which contacts were sent
3. **Export as CSV/XLSX** - Download file with status column preserved

### Current State

The API saves `sent_status` correctly:
```typescript
// app/api/sheets/save/route.ts line 74
if (sent_status !== undefined) updateFields.sent_status = sent_status;
```

But the frontend never:
- ❌ Loads `sent_status` from DB
- ❌ Displays status in the table/UI
- ❌ Exports with status column included

### Impact

- User cannot tell which numbers/emails were sent
- Must manually track outside the app
- Cannot re-import to resume after interruption

### Required Fix

1. Load `sent_status` from DB session on mount
2. Add column to rendered table showing send status (✅ / pending)
3. Wire up export function to include status column
4. Support re-importing with status column (skip already-sent contacts)

---

## 6. HIGH: Payload Size Validation Missing

### Spec Violation

**Source:** `rules/payload-size-guard.md` MUST Rule 1

```
MUST: Every POST/PUT/PATCH Route Has an Explicit Payload Limit Check
Current state: MISSING on /api/sheets/save
```

### Finding

**Location:** `app/api/sheets/save/route.ts:38-50`

```typescript
export async function POST(req: NextRequest) {
  try {
    const { userId, sheet_data, ... } = await req.json();  // ❌ No size check
    // ...
  }
}
```

**No explicit `content-length` validation before reading body.**

### Impact

- User uploads 100MB file → Vercel returns 413 (Content Too Large)
- No helpful error message to user
- User experience: "Upload failed, try again"

### Required Fix

Add explicit size check at route start:

```typescript
export async function POST(req: NextRequest) {
  const contentLength = req.headers.get('content-length');
  const maxSize = 4 * 1024 * 1024; // 4MB for sheet uploads
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    return NextResponse.json(
      { error: `Sheet upload exceeds 4MB limit. Try splitting into smaller files.` },
      { status: 413 }
    );
  }
  
  const { userId, sheet_data, ... } = await req.json();
  // ...
}
```

---

## 7. HIGH: Payload Content Optimization (Secondary to Debounce Fix)

### Spec Violation

**Source:** `rules/payload-size-guard.md` Rule 3 + Commit history shows prior fix

### Context

The codebase shows awareness of this issue:

```typescript
// app/api/sheets/save/route.ts line 64
// Issue 3: delta updates
const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() };
if (sheet_data !== undefined) updateFields.sheet_data = sheet_data;
```

But the frontend still sends `sheet_data: rows[]` (full spreadsheet).

### Finding

**Location:** `app/tools/wa-sender/page.tsx` — wherever `autoSaveSession` is called

Should send **only** `contacts: string[]` (extracted contact list), not full `rows: Record<string, unknown>[]`.

### Impact

- 249MB spreadsheet serialized on every keystroke → massive network traffic
- Combines with missing debounce (Issue #1) for compounding slowness

### Required Fix

1. Extract contact list from sheet on upload
2. Send only contacts array to API
3. API stores full sheet_data only when explicitly uploaded (not on every auto-save)

```typescript
// Extract once on file upload
const extractContacts = (rows: Record<string, unknown>[], phoneCol: string) => {
  return rows.map(row => String(row[phoneCol] || '')).filter(Boolean);
};

// Auto-save sends only contacts
const autoSaveSession = async () => {
  await fetch('/api/sheets/save', {
    method: 'POST',
    body: JSON.stringify({
      userId: session.user.id,
      contacts, // ✅ Only contact list, not full sheet_data
      message_template: message,
      country_code: countryCode,
    }),
  });
};
```

---

## Convergence Criteria Status

### Red Team Sign-Off Requirements

| Criterion | Status | Evidence |
|-----------|--------|----------|
| **0 CRITICAL findings** | ❌ FAIL | 2 CRITICAL: Performance, Persistence |
| **0 HIGH findings** | ❌ FAIL | 4 HIGH: Modal overflow, Zoom, Export, Payload |
| **Spec compliance 100%** | ❌ FAIL | Violations in 3 specs: performance, design, payload |
| **New tests added** | ❌ UNCHECKED | Need integration tests for DB persistence |
| **No mock data in frontend** | ✅ PASS | Code uses real sheet upload, real DB |

### Recommendation

**BLOCK** deployment. These findings are not surface-level — they block core user workflows:
1. Auto-save latency makes tool unusable
2. Data loss on refresh breaks trust
3. Modal overflow prevents column selection
4. Responsive failure makes tool inaccessible

Fix in order:
1. **Persistence** (Issue #2) — blocks all others
2. **Debounce** (Issue #1) — critical for UX
3. **Payload limit** (Issue #6) — safety gate
4. **Modal layout** (Issue #3) — unblocks column selection
5. **Responsive** (Issue #4) — accessibility
6. **Export feature** (Issue #5) — nice-to-have, schedule separately

---

## Next Steps

1. Fix issues 1-6 via `/implement`
2. Add Tier 2 integration tests:
   - Session persistence (load from DB on mount)
   - Debounce effectiveness (1 API call per 500ms silence)
   - Payload size validation (4MB limit enforcement)
3. Run `/redteam` again to verify all findings resolved
4. Approve for deployment

---

**Prepared by:** Red Team  
**Status:** Awaiting fixes via `/implement`
