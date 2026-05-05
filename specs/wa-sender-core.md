# WA Sender Core Architecture

## Overview

WA Sender is a tool for bulk messaging via WhatsApp Web and Gmail. Phase 2 restructures it from a 938-line monolithic component into a multi-route tool with ToolShell integration, persistent state management, and feature modules for templates, contacts, and message history.

## Architecture Decision: ToolShell Integration + Sub-Routes

**Status**: Accepted (ADR-002 from analysis)

The monolithic `app/tools/wa-sender/page.tsx` is restructured into sub-routes within `app/tools/wa-sender/`:

```
app/tools/wa-sender/
├── layout.tsx                    # Wraps in ToolShell
├── page.tsx                      # Dashboard (send workflow)
├── templates/
│   ├── page.tsx                  # Template CRUD
│   └── [id]/edit/page.tsx        # Template editor
├── contacts/
│   ├── page.tsx                  # Contact management
│   └── import/page.tsx           # Bulk import form
├── messages/
│   └── page.tsx                  # Send history & analytics
├── settings/
│   └── page.tsx                  # Preferences (country, columns, etc)
└── tool.manifest.json            # Unchanged
```

## ToolShell Integration Contract

The layout component wraps children in `<ToolShell>`:

```tsx
// app/tools/wa-sender/layout.tsx
import { ToolShell } from '@/app/components/ToolShell';
import { useAuth } from '@/lib/useAuth';

export default function WASenderLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Redirect to="/login" />;

  return (
    <ToolShell toolId="wa-sender" user={user}>
      {children}
    </ToolShell>
  );
}
```

ToolShell reads navigation items from `tool.manifest.json`:

```json
{
  "navigation": [
    { "label": "Dashboard", "href": "/tools/wa-sender", "icon": "dashboard" },
    { "label": "Messages", "href": "/tools/wa-sender/messages", "icon": "mail" },
    { "label": "Templates", "href": "/tools/wa-sender/templates", "icon": "template" },
    { "label": "Settings", "href": "/tools/wa-sender/settings", "icon": "settings" }
  ]
}
```

**Note**: The manifest field is `navigation` (not `nav_items`) and uses `href` (not `path`). Contacts management is accessed within the Dashboard (receiver selection), not as a separate top-level nav item.

## State Management

### Current Problem
State is a 938-line single component with 20+ `useState` calls. Refactoring to sub-routes requires shared state across navigation.

### Solution: React Context

Create `WASenderContext` to hold:
- Session data (Supabase `wa_sender_sessions` record)
- Current send workflow state (file, columns, numbers, recipients)
- Selected template (if any)
- Selected contacts (if any)
- UI state (loading, errors, tabs)

```tsx
// app/tools/wa-sender/context.ts
import { createContext, useContext } from 'react';

interface WASenderContextType {
  // Session
  session: WASenderSession | null;
  loadSession: (sessionId: string) => Promise<void>;
  saveSession: () => Promise<void>;
  
  // Send workflow
  file: File | null;
  columns: string[];
  numbers: PhoneNumber[];
  recipients: Recipient[];
  
  // Selection
  selectedTemplate: Template | null;
  selectedContacts: Contact[];
  
  // UI
  loading: boolean;
  error: string | null;
}

const WASenderContext = createContext<WASenderContextType>(null);

export function useWASender() {
  const ctx = useContext(WASenderContext);
  if (!ctx) throw new Error('useWASender must be used within WASenderProvider');
  return ctx;
}
```

Provider lives in `app/tools/wa-sender/page.tsx` (the Dashboard):

```tsx
export default function WASenderDashboard() {
  const [context, setContext] = useState<Partial<WASenderContextType>>({
    loading: false,
    error: null,
  });

  return (
    <WASenderContext.Provider value={context}>
      {/* Send workflow UI */}
    </WASenderContext.Provider>
  );
}
```

### Backwards Compatibility

The refactoring MUST maintain session persistence — users with active sessions in localStorage MUST load their data on first visit post-refactor. The context provider loads the session on mount using the user-scoped key:

```tsx
useEffect(() => {
  const { user } = useAuth();
  const sessionId = localStorage.getItem(`wa-sender-session-${user?.id}`);
  if (sessionId) {
    loadSession(sessionId).catch(err => setError(err.message));
  }
}, []);
```

**Important**: The localStorage key is `wa-sender-session-${userId}` (hyphenated, user-scoped), not the old `wa_sender_session_id`. This key format is already used in Phase 1 and MUST NOT change.

## Send Workflow (Dashboard)

The send flow is unchanged functionally. It remains the entry point for users:

1. **Upload & Parse** — Excel file upload, auto-detect columns (Name, Phone, Email, etc.)
2. **Validate** — Normalize phone numbers, detect country code from phone prefix
3. **Select Template** — Pick a saved template or write inline
4. **Review** — Preview recipients, mapping, message preview
5. **Send** — Execute via `wa.me` links (WhatsApp Web) or Gmail compose
6. **Export** — Download results with sent status

Context is used to persist state across sub-route navigation. Users can:
- Upload file in Dashboard
- Switch to Templates to pick one
- Return to Dashboard to send
- View history in Messages tab
- Return to Dashboard to continue

## Feature Modules

### Templates (app/tools/wa-sender/templates/page.tsx)

CRUD for message templates. See `wa-sender-templates.md` for full spec.

### Contacts (app/tools/wa-sender/contacts/page.tsx)

Persistent contact management with import/deduplicate. See `wa-sender-contacts.md` for full spec.

### Messages (app/tools/wa-sender/messages/page.tsx)

Send history and basic analytics. See `wa-sender-history.md` for full spec.

### Settings (app/tools/wa-sender/settings/page.tsx)

User preferences:
- Default country code (affects phone normalization)
- Auto-detect column rules (e.g., "contains 'phone'" → phone column)
- Export format (CSV, Excel, JSON)
- Session auto-save interval (currently 500ms, make configurable)

Stored in Supabase `user_preferences` table.

## Auth & Permissions

All routes protected by `layout.tsx` auth guard. Tool-scoped JWT verified in `proxy.ts` (Phase 1).

Access control (all operations user-scoped):
- `read`: own sessions, own templates, own contacts, own messages
- `write`: own sessions, own templates, own contacts
- `delete`: own sessions, own templates, own contacts

Enforced at API layer (see `database-schema.md` § RLS Policies).

## Migration Checklist

Phase 2 implementation MUST verify:

- [ ] Existing sessions load on first visit post-refactor
- [ ] Navigation between sub-routes preserves context (file, columns, state)
- [ ] Send workflow in Dashboard works identically to pre-refactor
- [ ] No localStorage key changes (`wa_sender_session_id` stays the same)
- [ ] Session auto-save still fires every 500ms across all routes
- [ ] Templates, Contacts, Messages routes are lazy-loaded (code splitting)
- [ ] ToolShell nav reflects active route (e.g., "Dashboard" highlighted when on `/tools/wa-sender`)
- [ ] All existing tests pass after refactor

## Implementation Notes

- **File splitting order**: Create layout + sub-routes first, then move send workflow logic from `page.tsx` into Dashboard component
- **Styling**: Existing `wa-sender.css` covers Dashboard; each sub-route may add local styles via CSS Modules
- **Error boundaries**: Wrap each sub-route in `<ErrorBoundary>` to prevent one feature from crashing navigation
- **State serialization**: Session save includes entire context state (file metadata, columns, normalized numbers) to restore post-reload
