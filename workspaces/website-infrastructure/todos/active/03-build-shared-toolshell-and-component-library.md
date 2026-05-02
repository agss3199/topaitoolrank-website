# Todo: Build Shared ToolShell Component & Finalize Component Library

**Status:** Pending  
**Implements:** specs/component-library.md §ToolShell Pattern, §Shared Component Contract  
**Dependencies:** Item 01 (auth system)  
**Blocks:** WA Sender refactor (item 06), Tool B creation (item 08)  
**Capacity:** Single session (~300 LOC)  

## Description

Create a shared `ToolShell` wrapper component that provides auth gating, chrome (header, nav, footer), and consistent layout for all tools. ToolShell accepts tool-specific props (name, navigation items, session) and renders auth-protected UI. Finalize shared component library by converting existing components to use CSS Modules and semantic tokens.

## Implementation

1. **Create ToolShell component** (`app/components/ToolShell.tsx`):
   - Accept props: `toolName`, `toolId`, `session`, `navigation`, `children`
   - Render header with tool name + navigation links
   - Render sidebar or top nav based on layout preference
   - Render main content area
   - Render footer
   - All styled via CSS Modules, use semantic tokens (no raw colors)

2. **Create ToolShell.module.css:**
   - Define `.shell`, `.header`, `.main`, `.footer`, `.nav` classes
   - All use CSS variables: `var(--color-bg-default)`, `var(--spacing-md)`, etc.
   - Support responsive layout (desktop: sidebar, mobile: top nav)
   - No hardcoded colors/sizes

3. **Finalize shared components:**
   - Verify all components in `app/components/` use semantic tokens
   - Convert any remaining `*.css` files to `*.module.css` (scoped CSS Modules)
   - Update barrel export `app/components/index.ts` to include ToolShell
   - Ensure no component has hardcoded colors or magic numbers

## Acceptance Criteria

- [ ] `ToolShell` component accepts toolName, toolId, session, navigation props
- [ ] ToolShell renders authenticated header with tool name
- [ ] ToolShell renders responsive navigation (sidebar on desktop, top nav on mobile)
- [ ] ToolShell accepts children for main content
- [ ] All ToolShell CSS uses semantic tokens (no raw colors)
- [ ] All shared components use CSS Modules (scoped, not global)
- [ ] No shared component has hardcoded hex colors
- [ ] Shared components accept content as props (polymorphic, unstyled)
- [ ] ToolShell is exported in `app/components/index.ts`

## Testing

```typescript
// Test ToolShell renders correctly
import { ToolShell } from '@/app/components/ToolShell';

<ToolShell
  toolName="WA Sender"
  toolId="wa-sender"
  session={mockSession}
  navigation={[
    { label: 'Dashboard', href: '/tools/wa-sender' },
    { label: 'Settings', href: '/tools/wa-sender/settings' },
  ]}
>
  <div>Tool content here</div>
</ToolShell>

// Should render:
// - Header with "WA Sender" title
// - Navigation links in sidebar (desktop) or dropdown (mobile)
// - Main content area with provided children
// - Footer
// - All styled, no unstyled elements
```

