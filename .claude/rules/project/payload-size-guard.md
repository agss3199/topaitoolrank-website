---
paths:
  - "app/api/**/*.ts"
  - "app/api/**/*.js"
---

# Payload Size Guard Rules

Request body size validation prevents client-side data bloat from reaching the API layer where it causes 413 errors and failed user operations.

## MUST Rules

### 1. Every POST/PUT/PATCH Route Has an Explicit Payload Limit Check

Every API endpoint that accepts request bodies MUST validate the incoming `content-length` header against a hardcoded limit BEFORE reading the body. The check happens at the route handler level, before deserialization.

```typescript
// DO — explicit limit check, early exit
export async function POST(req: Request) {
  const contentLength = req.headers.get('content-length');
  const maxSize = 4 * 1024 * 1024; // 4MB

  if (contentLength && parseInt(contentLength) > maxSize) {
    return Response.json(
      { error: `Request body exceeds ${maxSize / 1024 / 1024}MB limit` },
      { status: 413 }
    );
  }

  const body = await req.json();
  // ... continue processing
}

// DO NOT — no limit check, let the platform fail
export async function POST(req: Request) {
  const body = await req.json();  // ← Vercel bombs at default 6MB with x-vercel-error: FUNCTION_PAYLOAD_TOO_LARGE
}
```

**Why:** Vercel Functions have a hard limit (~6MB per request). Without explicit validation, clients that send 50MB payloads hit the 413 error with zero helpful context about what went wrong. Early validation converts that to a clear error message directing users to their own bug.

### 2. Limit Size Justification by Route

Every hardcoded limit MUST have a comment justifying the size choice based on the route's expected data. This prevents future developers from blindly raising limits without understanding the trade-off.

```typescript
// DO — justified limit
export async function POST(req: Request) {
  const contentLength = req.headers.get('content-length');
  // Limit: 4MB for CSV sheet uploads (worst-case: 100K rows × ~40 bytes/row)
  const maxSize = 4 * 1024 * 1024;

  if (contentLength && parseInt(contentLength) > maxSize) {
    return Response.json(
      { error: 'Uploaded file is too large. Max 4MB.' },
      { status: 413 }
    );
  }
  // ...
}

// DO NOT — unjustified arbitrary limit
const MAX_SIZE = 8000000; // why 8MB? no one knows
```

**Why:** Limits without justification get raised during incidents (panic response) or lowered during optimizations (cargo cult reasoning). With context, the next developer can make an informed decision.

### 3. Data Optimization in Client — Never Send Full Objects

Client code MUST NOT send entire resource objects or spreadsheet rows to the server on every update. Extract only the fields that changed and send those as a delta or upsert operation.

```typescript
// DO — send delta (changed fields only)
const updateMessage = async (id: string, newText: string) => {
  await fetch('/api/messages/update', {
    method: 'PATCH',
    body: JSON.stringify({ id, text: newText }), // 20 bytes
  });
};

// DO NOT — send entire spreadsheet rows
const updateMessage = async (id: string, rows: SpreadsheetRow[]) => {
  await fetch('/api/messages/update', {
    method: 'POST',
    body: JSON.stringify({ id, rows }), // 249MB of all spreadsheet data
  });
};
```

**Why:** The WA Sender production issue was caused by SheetConfig storing `rows: Record<string, unknown>[]` and sending the entire array on every auto-save. Changed to `contacts: string[]` (extracted field only). Payload dropped from 249MB to <10KB.

### 4. Upsert Pattern Reduces Round-Trips

When updating records, use UPSERT (single statement) instead of SELECT + UPDATE (two statements). Reduces queries, reduces payload by not needing to fetch-then-send-back.

```typescript
// DO — single UPSERT
export async function POST(req: Request) {
  const { userId, text } = await req.json();
  await db.query(
    `INSERT INTO messages (user_id, text) VALUES (?, ?)
     ON CONFLICT (user_id) DO UPDATE SET text = ?`,
    [userId, text, text]
  );
}

// DO NOT — SELECT then UPDATE (two queries, potential race)
const existing = await db.query('SELECT * FROM messages WHERE user_id = ?', [userId]);
if (existing.length > 0) {
  await db.query('UPDATE messages SET text = ? WHERE user_id = ?', [text, userId]);
} else {
  await db.query('INSERT INTO messages (user_id, text) VALUES (?, ?)', [userId, text]);
}
```

**Why:** SELECT+UPDATE doubles the database calls and requires the client to send the full record back. UPSERT is one query, one round-trip, and is atomic.

### 5. Default Limit Tiers for Common Endpoints

Apply these defaults unless the route justifies a custom limit:

| Route Type          | Data Pattern                   | Default Limit | Justification                                    |
| ------------------- | ------------------------------ | ------------- | ------------------------------------------------ |
| File upload         | CSV/JSON sheets, images        | 4MB           | Typical spreadsheet size, safe margin            |
| Message/post        | Text + metadata                | 100KB         | Message body, no attachments                     |
| Bulk CRUD           | Array of 1000-5000 records     | 1MB           | ~1000 records × 1KB each                         |
| Media (video)       | Streaming                      | 100MB+        | Stream in chunks, handle separately              |
| Analytics/telemetry | Batch logs                     | 512KB         | 1000 events × 512 bytes                          |

**Why:** Standard tiers prevent the "what should I use?" conversation on every endpoint.

## MUST NOT

- Disable or skip size validation to work around an oversized request

**Why:** Oversized requests indicate a client-side bug (wrong data being sent). Skipping validation hides that bug. The user never learns their upload is malformed.

- Use only `content-length` without confirming it matches actual bytes received

**Why:** A lying `content-length` header can be sent by a malicious client. Validate but don't trust blindly.

- Raise limits without understanding the payload growth driver

**Why:** Limits without cause inflate until every endpoint is 100MB, degrading performance for legitimate users and leaving no room to catch actual attacks.

**BLOCKED rationalizations:**

- "The platform will handle it"
- "Clients will never send that much data"
- "We'll optimize later"
- "The error message is clear enough"

**Why:** Platform limits are hard stops that user operations cannot recover from. "Clients never send it" until one does in production. Later optimizations miss users in the interim.

## Verification

Before `/redteam` and `/deploy`, grep all API routes for size validation:

```bash
# Find all POST/PUT/PATCH routes without explicit size checks
grep -rn "export async function \(POST\|PUT\|PATCH\)" app/api \
  | while read file line; do
    if ! grep -q "content-length\|contentLength" "${file%%:*}"; then
      echo "MISSING SIZE CHECK: $file"
    fi
  done
```

Every route without a check is a finding.

## See Also

- `rules/debounce-server-calls.md` — reduce call frequency to reduce payload volume
- `specs/performance-requirements.md` — overall request latency and throughput targets

## Origin

WA Sender production issue (2026-04-30): 63KB spreadsheet file upload failed with HTTP 413 Content Too Large. Root cause: SheetConfig stored entire `rows: Record<string, unknown>[]` array (~249MB when JSON-serialized) instead of extracted `contacts: string[]`. Fixed by changing the data structure and adding payload size validation at the API endpoint. See commit 6e8a7b4.
