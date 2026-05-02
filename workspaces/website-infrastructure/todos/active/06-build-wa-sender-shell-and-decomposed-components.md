# Todo: Build WA Sender Shell & Decompose Monolithic Components

**Status:** Pending  
**Implements:** specs/component-library.md §WA Sender, specs/tool-architecture.md §Tool-Scoped Routes  
**Dependencies:** Item 01 (auth), Item 03 (ToolShell)  
**Blocks:** Item 07 (wire WA Sender)  
**Capacity:** Single session (~400 LOC)  

## Description

Decompose WA Sender from a 500+ line monolithic `page.tsx` into smaller components. Create `WASenderShell.tsx` wrapper (using shared ToolShell), create `WASenderDashboard.tsx`, message composer, conversation list, template manager, and settings components. Each component should be independently testable with clear prop contracts.

## Implementation

1. **Create WASenderShell** (`app/tools/wa-sender/components/WASenderShell.tsx`):
   - Imports `useWASenderSession()` hook
   - Imports shared `ToolShell` component
   - Wraps children in ToolShell with wa-sender-specific navigation
   - Passes tool name, ID, navigation items to ToolShell

2. **Create scoped session hook** (`app/tools/wa-sender/hooks/useWASenderSession.ts`):
   - Imports `useAuth()` from shared lib
   - Validates token's `tool_id === 'wa-sender'`
   - Throws `AuthenticationError` if mismatch
   - Returns session object with guaranteed tool scope

3. **Decompose main components:**
   - `WASenderDashboard.tsx` — main dashboard layout
   - `MessageComposer.tsx` — message drafting UI
   - `ConversationList.tsx` — conversation sidebar
   - `ConversationDetail.tsx` — selected conversation view
   - `TemplateManager.tsx` — template CRUD
   - `SettingsPanel.tsx` — tool settings
   - Each component: TypeScript props, CSS Module styling, no internal state management (state passed as props or via context)

4. **Create CSS module** (`app/tools/wa-sender/components/wa-sender.module.css`):
   - All WA Sender–specific styles
   - Uses semantic tokens: `var(--color-primary)`, `var(--spacing-lg)`, etc.
   - No hardcoded colors or sizes
   - Scoped classes (only WA Sender components can use)

5. **Update root page** (`app/tools/wa-sender/page.tsx`):
   - Simplify to just: `<WASenderShell><WASenderDashboard /></WASenderShell>`
   - No more 500+ lines in one file

## Acceptance Criteria

- [ ] `WASenderShell.tsx` exists and imports ToolShell
- [ ] `useWASenderSession()` hook validates tool_id
- [ ] All WA Sender components are in `components/` subdirectory
- [ ] Each component has TypeScript props interface
- [ ] No component has 200+ lines (rule of thumb: max 150 lines/file)
- [ ] All components use CSS Modules (wa-sender.module.css)
- [ ] No hardcoded colors in WA Sender CSS (all use semantic tokens)
- [ ] `page.tsx` is now <20 lines (just renders WASenderShell + Dashboard)
- [ ] Local `npm run dev` renders WA Sender page (may show mock data, that's OK)

## Testing

```typescript
// Test components render without errors
import { WASenderDashboard } from './components/WASenderDashboard';

<WASenderDashboard conversations={[]} onSelectConversation={() => {}} />
// Should render without crashing

// Test scoped hook rejects wrong tool
const { result } = renderHook(() => useWASenderSession(), {
  wrapper: ({ children }) => (
    <AuthProvider value={{ tool_id: 'tool-b' }}>
      {children}
    </AuthProvider>
  ),
});
// result.current should throw AuthenticationError
```

