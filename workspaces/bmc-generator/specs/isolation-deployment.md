# BMC Generator — Isolation & Deployment

CRITICAL constraint from the brief: "Completely self-contained. Deletable without affecting rest of website."

This spec guarantees complete isolation and zero side effects on removal.

---

## File Structure

```
app/tools/bmc-generator/
├── page.tsx                    # Next.js page component
├── layout.tsx                  # Local layout (if needed)
├── components/
│   ├── IdeaInputForm.tsx
│   ├── ClarifyingQuestionsForm.tsx
│   ├── GenerationStatusPanel.tsx
│   ├── BMCCanvasDisplay.tsx
│   ├── CritiqueSummary.tsx
│   ├── RecommendationsPanel.tsx
│   └── ErrorBoundary.tsx
├── lib/
│   ├── api-client.ts           # HTTP client for /api/bmc-generator/* endpoints
│   ├── cost-tracker.ts         # CostTracker class (local copy)
│   ├── validators.ts           # Zod schema validators (local copy)
│   ├── sse-manager.ts          # SSE event handling
│   └── types.ts                # TypeScript interfaces (local copy of specs)
├── styles/
│   ├── BMCGeneratorPage.module.css
│   └── components.module.css
├── hooks/
│   ├── useGenerationState.ts   # Local state management
│   └── useSSEListener.ts       # SSE subscription hook
├── __tests__/
│   ├── components/
│   ├── lib/
│   └── integration/
└── README.md                   # Local documentation
```

---

## Import Restrictions (MUST)

### ✅ ALLOWED Imports

```typescript
// Next.js built-ins
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useContext } from 'react';

// External libraries (stable, widely-used)
import { z } from 'zod';  // validation
import { EventSource } from 'eventsource';  // SSE (node polyfill for server)

// Local to bmc-generator/
import { IdeaInputForm } from './components/IdeaInputForm';
import { CostTracker } from './lib/cost-tracker';
import { useGenerationState } from './hooks/useGenerationState';
import styles from './styles/BMCGeneratorPage.module.css';
```

### ❌ BLOCKED Imports

```typescript
// DO NOT import from app/components/
import { Button } from '@/components/ui/button';      // ❌ BLOCKED
import { Card } from '@/components/ui/card';          // ❌ BLOCKED

// DO NOT use shared utilities
import { logger } from '@/lib/logger';                 // ❌ BLOCKED
import { useAuth } from '@/hooks/useAuth';             // ❌ BLOCKED

// DO NOT import shared styling
import '@/styles/globals.css';                          // ❌ BLOCKED
import { theme } from '@/config/theme';                 // ❌ BLOCKED

// DO NOT use shared types (copy if needed)
import { User } from '@/types/user';                    // ❌ BLOCKED
```

**Why:** Importing from outside bmc-generator/ creates a dependency. If we delete `/app/tools/bmc-generator/`, any shared import breaks the parent app.

---

## Styling Isolation (MUST)

### CSS Modules Only

All styling via local CSS modules:

```typescript
// ✅ ALLOWED
import styles from './BMCGeneratorPage.module.css';
<div className={styles.container}>...</div>

// ❌ BLOCKED: Global styles
<style>{`
  .bmc-container { color: red; }
`}</style>

// ❌ BLOCKED: Tailwind (shared with app)
<div className="flex bg-blue-50">...</div>

// ❌ BLOCKED: Inline styles
<div style={{ color: 'red' }}>...</div>
```

**CSS Module Files:**
```
BMCGeneratorPage.module.css
├─ .container { }
├─ .form { }
├─ .canvas { }
└─ ...

components.module.css
├─ .input { }
├─ .button { }
├─ .progressBar { }
└─ ...
```

**Colors & Spacing (Hardcoded, No Theme Dependency):**
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  background: #ffffff;
  font-family: system-ui, -apple-system, sans-serif;
  color: #333333;
}

.button {
  background: #0066cc;
  color: white;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 14px;
}

.buttonDisabled {
  background: #cccccc;
  cursor: not-allowed;
  opacity: 0.6;
}
```

**Never reference:**
- `$theme-color`, `var(--theme-primary)`, or other CSS custom properties from global theme
- Tailwind classes
- Shared CSS class names

---

## API Endpoint Isolation

All API calls rooted at `/api/bmc-generator/`:

```typescript
// ✅ ALLOWED
const res = await fetch('/api/bmc-generator/start', { method: 'POST', body });
const res = await fetch('/api/bmc-generator/stream/status?session_id=...');

// ❌ BLOCKED: Calls to shared endpoints
const res = await fetch('/api/auth/me');
const res = await fetch('/api/user/profile');
```

**API Routes (Backend):**

All routes at `app/api/bmc-generator/*` (alongside bmc-generator tool folder).

```
app/api/bmc-generator/
├── start/route.ts             # POST
├── answers/route.ts           # POST
├── generate/route.ts          # POST
├── stream/
│   └── status/route.ts        # GET (SSE)
└── session/[id]/route.ts      # DELETE (cleanup)
```

**No Shared Middleware:**
- Each route handles auth/validation independently
- No dependency on global middlewares (e.g., `/middleware.ts`)

---

## Type Safety (Local Copy)

All types defined locally, no shared type imports:

```typescript
// ✅ ALLOWED: Define locally in app/tools/bmc-generator/lib/types.ts
export type BusinessContext = {
  user_idea_summary: string;
  industry: string;
  // ...
};

// ❌ BLOCKED: Import shared types
import { BusinessContext } from '@/types/business';
```

**Zod Schemas:** Local copy of validators from specs/data-model.md:

```typescript
// app/tools/bmc-generator/lib/validators.ts
export const BusinessContextSchema = z.object({
  user_idea_summary: z.string().min(50).max(500),
  // ... (entire schema from specs)
});
```

---

## State Management (Local Only)

Use React hooks or local context, NO shared state libraries:

```typescript
// ✅ ALLOWED: useGenerationState (custom hook)
const [phase, setPhase] = useState(1);
const [activeAgent, setActiveAgent] = useState('');

// ✅ ALLOWED: Local Context
const GenerationContext = React.createContext();
<GenerationContext.Provider value={state}>
  <App />
</GenerationContext.Provider>

// ❌ BLOCKED: Shared Redux, Zustand, etc.
import { useStore } from '@/store';  // ❌
import { useRecoil } from 'recoil';  // ❌
```

---

## Deletion Safety Checklist

When deleting `/app/tools/bmc-generator/`, verify no breakage in:

### 1. Root App Build
```bash
# Verify no imports of bmc-generator in:
grep -r "bmc-generator" app/layout.tsx    # ❌ MUST be empty
grep -r "bmc-generator" app/page.tsx      # ❌ MUST be empty
grep -r "bmc-generator" app/globals.css   # ❌ MUST be empty
```

### 2. API Handlers
```bash
# Verify no imports of bmc-generator in:
grep -r "bmc-generator" app/api/          # ❌ MUST be empty (except /api/bmc-generator/*)
```

### 3. Navigation Menus
```bash
# Verify no references in:
grep -r "bmc-generator\|BMC Generator" app/components/nav  # ❌ MUST be empty
```

### 4. Tests
```bash
# Verify no shared tests import bmc-generator:
grep -r "bmc-generator" tests/            # ❌ MUST be empty
```

### 5. Styling
```bash
# Verify no shared CSS references the tool:
grep -r "bmc-generator\|bmc-" app/styles/  # ❌ MUST be empty
```

### 6. Environment Variables
```bash
# Any API keys specific to bmc-generator:
grep -r "BMC_" .env*                      # ✅ Optional, but if used, prefix ALL vars BMC_*
```

**Safe to Delete If:** All grep patterns return 0 matches.

---

## Database & Persistence

**No database writes or reads.**

Session data stored client-side only:
- `sessionStorage` (survives page refresh, lost on browser close)
- In-memory state (lost on page reload)

**Why:** Eliminates dependency on shared database, migration complexity, and data schema coupling.

---

## Error Boundaries

Tool must not crash parent app if something fails internally:

```typescript
// BMC tool wrapped in error boundary at page level
<ErrorBoundary fallback={<ToolError />}>
  <BMCGeneratorPage />
</ErrorBoundary>
```

**Fallback UI (if component tree crashes):**
```
❌ BMC Generator encountered an error.
Try refreshing the page or contact support.
```

---

## Logging & Debug Mode

**No dependency on shared logging infrastructure.**

Local logging:
```typescript
// app/tools/bmc-generator/lib/logger.ts (local)
export const log = (msg: string, data?: any) => {
  if (process.env.DEBUG_BMC === 'true') {
    console.log(`[BMC] ${msg}`, data);
  }
};
```

**Debug Mode Enable:**
```bash
DEBUG_BMC=true npm run dev
```

**Never use:** Shared logging service, analytics SDK, error tracking (Sentry, etc.).

---

## Testing Isolation

Tests in `/app/tools/bmc-generator/__tests__/` must not depend on shared test utilities:

```typescript
// ✅ ALLOWED: Jest + React Testing Library built-ins
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';

// ❌ BLOCKED: Shared test fixtures
import { createMockUser } from '@/__tests__/fixtures';  // ❌
```

**Test Structure:**
```
__tests__/
├── components/              # Component unit tests
├── lib/                      # Utility function tests
├── integration/              # End-to-end flow tests
└── setup.ts                  # Local test setup (no shared config)
```

---

## Deployment Steps

### 1. Build
```bash
npm run build
# Verify no errors, no warnings from /app/tools/bmc-generator/
```

### 2. Deletion Safety Check
```bash
./scripts/check-bmc-isolation.sh
# Script runs all grep checks from "Deletion Safety Checklist"
```

### 3. Deploy
```bash
npm run deploy
# Tool is live at /tools/bmc-generator/
```

### 4. Deletion (If Needed)
```bash
rm -rf app/tools/bmc-generator/
rm -rf app/api/bmc-generator/
npm run build  # Should succeed with 0 errors
npm run deploy
```

---

## Dependency List

**Approved External Libraries:**
- `zod` — validation (already in project)
- `react` — UI (already in project)
- `next` — framework (already in project)

**DO NOT add:**
- UI component libraries (creates shared styling dependency)
- State management (creates shared state dependency)
- HTTP clients beyond `fetch` (keep built-in)
- Logging/analytics SDKs (keep console-based)

---

## Hosting & URL

- Path: `/tools/bmc-generator/`
- API: `/api/bmc-generator/*`
- No subdomain, no separate host (co-hosted with main app)
- Deletable by removing two directories (`app/tools/` and `app/api/`)

---

## Summary: Complete Isolation Guarantee

| Aspect | Guarantee |
|--------|-----------|
| Code | Zero imports from outside bmc-generator/ |
| Styling | CSS Modules only, hardcoded colors/spacing |
| APIs | Rooted at /api/bmc-generator/, no shared endpoints |
| Types | Local definitions, no shared type imports |
| State | React hooks only, no shared state library |
| Database | sessionStorage only, no persistent storage |
| Tests | Standalone, no shared fixtures |
| Delete | Remove two directories, zero side effects |

**Verification Command:**
```bash
grep -r "from '@/\|from '../" app/tools/bmc-generator/ \
  | grep -v "from 'react'\|from 'next'\|from 'zod'" \
  | wc -l
# Output: 0 (zero cross-imports)
```
