# WA Sender Deployment & Session Persistence

This skill captures patterns learned from deploying and validating the WhatsApp/Email bulk messaging tool on Vercel + Supabase. Core focus: session persistence under debounce race conditions, state visibility, and CSS variable enforcement.

## Session Persistence Race Conditions (CRITICAL)

### The Pattern

When using debounced auto-save with localStorage fallback:
- **Problem**: User uploads file → saved to localStorage (immediate) → debounce waits N ms → user refreshes before debounce → API returns `{ok: true, session: null}` (not in database yet) → code skips localStorage fallback → data appears lost

**Root Cause**: Two-state writes (localStorage synchronous, database asynchronous) create a timing window where refreshes can outrun saves.

### The Solution

Check localStorage as fallback when API returns success but with null data:

```typescript
const loadSessionFromSupabase = async () => {
  const userId = session!.userId;
  const localStorageKey = `wa-sender-session-${userId}`;

  try {
    const res = await fetch(`/api/sheets/load?userId=${userId}`);
    const data = await res.json();

    if (data.ok && data.session) {
      applySessionData(data.session);
      localStorage.setItem(localStorageKey, JSON.stringify(data.session));
    } else if (data.ok && !data.session) {
      // ← NEW: Supabase has no session yet; debounce still in flight
      const cached = localStorage.getItem(localStorageKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          applySessionData(parsed);
        } catch (e) {
          console.warn('Failed to parse cached session:', e);
        }
      }
    }
  } catch (err) {
    // ← Network error: try localStorage as fallback too
    const cached = localStorage.getItem(localStorageKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        applySessionData(parsed);
      } catch (e) {
        console.warn('Failed to parse cached session:', e);
      }
    }
  }
};
```

**Why this works**: 
- Debounce save completes in background
- User sees data restored from localStorage immediately
- On next refresh, Supabase has the data

**When this applies**: Any pattern where:
- Frontend saves to localStorage (synchronous)
- Backend save is debounced/deferred (asynchronous)
- Refresh can happen mid-debounce (user impatience, accidental F5)

### Prevention

1. **Always add localStorage fallback** when debouncing backend saves
2. **Document the race condition** in comments (so future changes don't remove the fallback)
3. **Test the specific case**: upload → immediate refresh (before debounce) → verify data loads

## CSS Variable Enforcement

### The Pattern

A component (like `ToolShell.module.css`) references CSS variables that don't exist in `globals.css`:

```css
/* ToolShell.module.css */
.shell {
  background-color: var(--color-bg-default);  /* undefined */
}
.sidebar {
  background-color: var(--color-bg-surface);  /* undefined */
}
```

When undefined, CSS variables silently fall back to transparent, breaking visual hierarchy.

### The Discovery Workflow

1. **Symptom**: Styling looks wrong (white/transparent where color expected)
2. **Check**: `grep "var(--" <component.css>`
3. **Verify**: Does `globals.css` define all those variables?
4. **Fix**: Add missing variables to `:root` in `globals.css`

```css
:root {
  --color-bg-default: #f5f5f5;
  --color-bg-surface: #ffffff;
  --color-bg-hover: rgba(0, 0, 0, 0.05);
  --color-accent-subtle: rgba(59, 130, 246, 0.1);
}
```

### Grep Command for Audit

```bash
# Find all CSS variable references
grep -r "var(--" app/components app/tools

# Check which are defined in globals.css
grep "^[[:space:]]*--" app/globals.css
```

## Icon Mapping from Manifest

### The Pattern

Manifest defines icons as strings (due to JSON constraints):

```json
{
  "navigation": [
    { "label": "Dashboard", "icon": "dashboard" },
    { "label": "Messages", "icon": "mail" }
  ]
}
```

Component must convert strings to displayable values:

```typescript
// Map icon names from manifest to emoji (or use proper icon library)
const iconMap: Record<string, string> = {
  dashboard: '📊',
  mail: '📧',
  template: '📝',
  settings: '⚙️',
  messages: '💬',
  contacts: '👥',
  history: '📜',
};

// Convert in navigation building
const navigationItems: ToolShellNavItem[] = (manifest.navigation || []).map((item: any) => ({
  label: item.label,
  href: item.href,
  icon: item.icon ? iconMap[item.icon] || item.icon : undefined,
}));
```

**Future improvement**: Replace emoji with proper icon library (react-icons, heroicons) for better semantics and accessibility.

## Sheet Visibility & Delete Control

### The Pattern

When users upload files for processing, the UI must clearly show:
1. **What is loaded** (file/sheet name)
2. **How to change it** (delete/re-upload button)
3. **Current input state** (upload dropzone only visible when empty)

**Symptom of missing**: Users don't know which sheet is active, can't figure out how to upload a different one.

### The Solution

Display loaded state prominently, hide irrelevant inputs:

```typescript
{/* Show loaded sheet names when sheets exist */}
{sheets.length > 0 && (
  <div style={{
    padding: '0.75rem 1rem',
    backgroundColor: 'var(--color-bg-gradient-lighter)',
    borderLeft: '4px solid var(--color-accent)',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }}>
    <div>
      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
        Loaded Sheets
      </p>
      <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-headline)' }}>
        {sheets.map(s => s.name).join(', ')}
      </p>
    </div>
    <button
      onClick={() => {
        setSheets([]);
        setCurrentIndex(0);
        setSentStatus({});
        setSelectedContacts([]);
      }}
      aria-label="Delete loaded sheet and allow re-upload"
    >
      Delete Sheet
    </button>
  </div>
)}

{/* Only show upload UI when no sheets are loaded */}
{sheets.length === 0 && (
  <>
    {/* upload dropzone here */}
  </>
)}
```

**Key principles**:
- One state at a time (show upload OR show loaded sheet, not both)
- Use design system for visual hierarchy (colors, spacing, borders)
- Provide explicit action to change state (delete/clear button)
- Make current state visible without requiring user inference

## Red Team Validation for Next.js/Vercel

### Checklist Pattern

When red teaming a Next.js app on Vercel, verify:

1. **Session persistence across refresh** — load data → refresh → verify data visible (tests debounce race conditions)
2. **CSS variable completeness** — grep for undefined vars that cause styling breaks
3. **Icon/asset mapping** — verify manifest strings convert to displayable values (no raw strings rendered)
4. **State visibility** — users can see current state without guessing
5. **Design system compliance** — all pages match homepage branding (colors, spacing, typography)
6. **Sidebar navigation** — icons render correctly, no duplicate text, hover states work
7. **Form validation** — client-side validation sync, server validation on submit
8. **Debounce effectiveness** — auto-save not firing on every keystroke (check Network tab)

### Tools

- **Playwright/Browser DevTools** — verify visual state, check Network tab for debounce behavior
- **grep for CSS variables** — find undefined vars before they break prod
- **git diff** since last deploy — see what changed
- **vercel logs** — check for deployment errors

---

## When to Apply This Skill

- Fixing session persistence issues in localStorage-based apps
- Discovering missing CSS variables (styled but nothing shows)
- Converting manifest/config data to UI display values
- Improving file upload/management UX clarity
- Red teaming Next.js/Vercel deployments for state and styling

## Future Enhancements

1. **Icon library**: Replace emoji with react-icons for accessibility and consistency
2. **CSS variable validation at build time**: Catch undefined vars during build, not at runtime
3. **Debounce indicators**: Show "Saving..." status to users while debounce is in flight
4. **Session sync tests**: Tier 2 integration tests for localStorage + Supabase round-trips
