---
paths:
  - "app/**/*.tsx"
  - "app/**/*.ts"
  - "components/**/*.tsx"
---

# Debounce Server Calls Rules

Every input-to-server binding MUST debounce to prevent flooding the database with requests on every keystroke. Unthrottled input binding is the most common cause of "1-3 second latency" complaints where the perception is actually N-keystroke storms hitting the backend.

## MUST Rules

### 1. Every onChange/onInput Handler Has Debounce

Any handler that fires on every keystroke (onChange, onInput, onValueChange, onTextChange) and calls the server MUST apply debounce or throttle. The default MUST be 500ms (adjustable based on UX testing).

```typescript
// DO — debounced server call
const [messageText, setMessageText] = useState('');
const debouncedSave = useMemo(
  () => debounce((text: string) => {
    fetch('/api/messages/save', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }, 500),
  []
);

const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  setMessageText(e.target.value);
  debouncedSave(e.target.value);
};

// DO NOT — unthrottled per-keystroke call
const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  setMessageText(e.target.value);
  fetch('/api/messages/save', {  // fires for EVERY keystroke
    method: 'POST',
    body: JSON.stringify({ text: e.target.value }),
  });
};
```

**Why:** A 1-second typing burst (10 characters @ 100ms/char) produces 10 API calls and 10 database updates. With 500ms debounce, that becomes 1 call. The WA Sender "1-3 second latency" complaint disappeared after adding debounce to auto-save.

### 2. Debounce Delay Justification

Every debounced call MUST have a comment or const name explaining the delay choice:

```typescript
// DO — justified delay
const AUTOSAVE_DEBOUNCE_MS = 500; // 500ms: responsive feel while avoiding chat-like spam

const debouncedSave = useMemo(
  () => debounce(saveHandler, AUTOSAVE_DEBOUNCE_MS),
  []
);

// DO NOT — magic number
const debouncedSave = useMemo(
  () => debounce(saveHandler, 500),  // why 500? guessing?
  []
);
```

**Why:** Without context, future developers adjust delays based on gut feeling. Justified constants survive refactoring and let new developers understand the UX tradeoff.

### 3. Debounce vs Throttle — Choose by UX Requirement

- **Debounce (PREFERRED for inputs)**: Fire ONLY after input stops for N ms. Use when you want a "final" state after the user stops typing.
- **Throttle**: Fire at most once per N ms while input is active. Use when you need periodic feedback (scroll position, window resize).

```typescript
// DO — debounce for input -> server call (wait for user to stop)
const debouncedSave = debounce(() => saveToServer(), 500);

// DO — throttle for scroll/resize (update UI periodically as user drags)
const throttledResize = throttle(() => updateLayout(), 100);

// DO NOT — throttle for input save (wastes database on every 100ms tick)
const throttledSave = throttle(() => saveToServer(), 100);  // fires continuously while typing
```

**Why:** Debounce waits for user to stop — most efficient for database. Throttle fires continuously — appropriate for UI feedback, wasteful for database writes.

### 4. Dependencies and Cleanup

Debounced functions MUST be created in useMemo or useCallback with empty dependency array (stable closure). The callback inside MUST capture server state via closure, NOT dependencies array, to avoid recreating on every render.

```typescript
// DO — stable closure, captured via closure not dependencies
const debouncedSave = useMemo(
  () => debounce((text: string) => {
    fetch('/api/messages/save', { body: JSON.stringify({ text }) });
  }, 500),
  [] // empty — function never recreated
);

// DO NOT — dependencies change, debounce recreated, pending calls lost
const debouncedSave = useCallback(
  debounce((text: string) => {
    fetch('/api/messages/save', { body: JSON.stringify({ text, userId }) });
  }, 500),
  [userId] // recreates on every userId change, cancels pending debounce
);
```

**Why:** If debounce is recreated on every render, pending calls are lost. The user types, hits enter, but the debounced save was cancelled by a re-render.

### 5. Payload Should Be Minimal — Debounce AND Optimize

Debounce reduces call frequency; optimization reduces payload size. Both MUST happen.

```typescript
// DO — debounce + minimal payload
const debouncedSave = useMemo(
  () => debounce((text: string) => {
    fetch('/api/messages/save', {
      method: 'PATCH',
      body: JSON.stringify({ text }),  // only changed field
    });
  }, 500),
  []
);

// DO NOT — debounce + bloated payload (false economy)
const debouncedSave = useMemo(
  () => debounce(() => {
    fetch('/api/messages/save', {
      method: 'POST',
      body: JSON.stringify(entireSpreadsheetState),  // 249MB
    });
  }, 500),
);  // still hammers the server if the user types fast
```

**Why:** Debounce handles frequency; payload optimization handles size. Both matter. Debounce alone with a 249MB payload is still a disaster.

### 6. Form Validation Inputs Should NOT Fire Server Calls

Client-side form validation (checking required fields, format validation) MUST NOT trigger server calls. Only final form submission should hit the server.

```typescript
// DO — validation is sync, no server call
const [email, setEmail] = useState('');
const [emailError, setEmailError] = useState('');

const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setEmail(value);
  // Validation only — sync, no server call
  if (!value.match(/^\S+@\S+\.\S+$/)) {
    setEmailError('Invalid email format');
  } else {
    setEmailError('');
  }
};

// Form submission fires the server call (once, after debounce)
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  debouncedSubmit(email);
};

// DO NOT — validation fires server call on every keystroke
const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setEmail(value);
  // Server call on every keystroke
  fetch('/api/validate-email', { body: JSON.stringify({ email: value }) });
};
```

**Why:** Validation can be done locally and synchronously. Server validation should happen only once at submission time to prevent spam and reduce latency perception.

### 7. Leading vs Trailing Debounce

The choice between "leading" (fire immediately, then debounce further calls) and "trailing" (wait N ms, then fire) depends on UX.

```typescript
// DO — trailing (default): wait for user to stop, then save
// Responsive: user sees changes immediately (local state), server catches up after typing stops
const debouncedSave = debounce(saveToServer, 500, { trailing: true, leading: false });

// DO — leading: fire immediately, then ignore further calls for N ms
// Use when: you need instant feedback (e.g., lock button on click)
const debouncedLock = debounce(lockResource, 100, { leading: true, trailing: false });

// DO NOT — both leading and trailing without justification
const debouncedSave = debounce(saveToServer, 500, { leading: true, trailing: true });
// Fires twice — once immediately, once after delay — defeating the purpose
```

**Why:** Leading = immediate feedback at cost of double-fire. Trailing = delayed feedback but single fire. Choose based on what users see and what's best for the backend.

## MUST NOT

- Fire a server call on every onChange without debounce

**Why:** N keystrokes in T milliseconds = N API calls. Debounce converts this to 1 call.

- Debounce a form submission button click

**Why:** Users submit once intentionally; debouncing a submit button prevents duplicate submissions but adds perceived latency (user clicks, nothing happens for 500ms).

**BLOCKED rationalizations:**

- "Our database can handle high throughput"
- "The user might slow down their typing"
- "We'll optimize later"
- "Debounce is a UI nicety, not required"

**Why:** Database throughput isn't the limiting factor — Vercel serverless function capacity (concurrent connections, execution time) is. Even if the database handles it, you're burning Vercel capacity on unnecessary requests.

## Verification

Before `/redteam` and `/deploy`, grep all handlers for debounce:

```bash
# Find all onChange handlers that call fetch/axios without debounce
grep -rn "onChange\|onInput\|onValueChange" app/components app/pages \
  | grep -v debounce | grep -v "disabled\|readOnly"
# Any matches without a nearby debounce call are findings
```

## See Also

- `rules/payload-size-guard.md` — validate request body sizes
- `specs/performance-requirements.md` — overall latency targets

## Origin

WA Sender production issue (2026-04-30): Message auto-save taking 1-3 seconds. Root cause: auto-save useEffect fired on every keystroke without debounce, sending full payload to server. Fixed by adding 500ms debounce to the auto-save function. Payload size also optimized (separate fix) but debounce provided immediate latency improvement. See commit 6e8a7b4.
