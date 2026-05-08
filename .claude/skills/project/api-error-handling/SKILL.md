# API Error Handling Skill

**Purpose:** Implement clear user feedback when API calls fail or network issues occur.

**Applies To:** Any React page that fetches dynamic content (especially tool pages with `/api/tools/article` loading).

## Progressive Disclosure

### Level 1: State Management

Every async API fetch needs three states:

1. **loading** — request in flight (prevent UI flashing, show loading state)
2. **data** — success case (display content)
3. **error** — failure case (show error message to user)

**Pattern:**
```typescript
const [loading, setLoading] = useState(true);
const [data, setData] = useState<Content | null>(null);
const [error, setError] = useState<string>("");
```

### Level 2: Fetch with Error Handling

**DO:**
- Check response status explicitly (`if (res.ok)`)
- Catch both API errors and network errors separately
- Clear error state on success
- Log errors for debugging without exposing to users

**DO NOT:**
- Silently ignore errors (`try/catch` with empty catch block)
- Display raw error objects to users
- Assume success just because fetch didn't throw

**Template:**
```typescript
useEffect(() => {
  const fetchData = async () => {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setError("");  // ← Clear previous errors
      } else {
        setError(`API error: ${res.statusText || `${res.status}`}`);
        setData(null);
      }
    } catch (err) {
      console.error(err);  // ← Debug log, not user-facing
      setError("Network error. Please refresh and try again.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [url]);
```

### Level 3: User-Facing Display

**Error container should:**
- Display before checking loading state (users see it immediately)
- Be visually distinct (different color, border, spacing)
- Use clear language ("Unable to load article. Please refresh." not "fetch() failed")
- Not expose implementation details (no stack traces, no raw error codes)

**Template:**
```typescript
// Show error first (high priority)
{error && (
  <div className={cls(styles, "module__error-container")}>
    <p>{error}</p>
  </div>
)}

// Show loading state
{loading && (
  <div className={cls(styles, "module__loading")}>
    Loading...
  </div>
)}

// Show content only when ready
{!loading && data && (
  <div className={cls(styles, "module__content")}>
    {/* render data */}
  </div>
)}
```

### Level 4: Edge Cases

**Race conditions:** If dependencies change while fetch is in flight, the state update from old fetch can overwrite new fetch result.

**Fix:** Abort controller or ref-based cleanup
```typescript
useEffect(() => {
  let isMounted = true;
  
  const fetchData = async () => {
    // ... fetch logic
    if (isMounted) {
      setData(json);  // Only update if component still mounted
    }
  };
  
  fetchData();
  return () => {
    isMounted = false;  // Cleanup on unmount or dep change
  };
}, [deps]);
```

**Stale errors:** Previous error message lingers when retry succeeds.

**Fix:** Always clear error on success
```typescript
if (res.ok) {
  setData(json);
  setError("");  // ← Critical: prevents stale error state
}
```

## Examples

### Article Loading (Micro-SaaS Tools)

See `.claude/agents/project/error-handling-specialist.md` for the full pattern used across all 9 tool pages.

### Form Submission Error

```typescript
const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);
  
  try {
    const res = await fetch("/api/submit", {
      method: "POST",
      body: JSON.stringify(formData),
    });
    
    if (res.ok) {
      setSuccess(true);
    } else if (res.status === 422) {
      setError("Please check your input and try again.");
    } else {
      setError("Server error. Please try again later.");
    }
  } catch {
    setError("Network error. Please check your connection.");
  } finally {
    setLoading(false);
  }
};
```

## Testing

Every async component needs tests for:
- ✅ Success path (data displays)
- ✅ API error path (error message shows, not data)
- ✅ Network error path (error message shows, not data)
- ✅ Stale error clearing (old error doesn't persist on retry)

**Example:**
```typescript
test("shows error when API fails", async () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    statusText: "Server Error",
  });
  render(<MyComponent />);
  
  await waitFor(() => {
    expect(screen.getByText(/Server Error/)).toBeInTheDocument();
    expect(screen.queryByTestId("data")).not.toBeInTheDocument();
  });
});
```

## Related

- `.claude/rules/project/css-module-safety.md` — use `cls()` helper for error container classes
- `.claude/rules/project/session-debounce-safety.md` — handle auth/session errors similarly
- `tests/integration/api-error-handling.test.ts` (example test file)

---

**Status:** Core pattern implemented across all 9 tools ✅
**Last Updated:** 2026-05-07
**Examples Verified:** 60/60 article tests passing
