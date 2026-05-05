# 11-wa-sender-toolshell

**Implements**: specs/wa-sender-core.md § ToolShell Integration Contract, § Auth & Permissions  
**Depends On**: 10-wa-sender-context (context must be defined before layout can provide it)  
**Capacity**: ~100 LOC load-bearing logic / 3 invariants (auth guard at layout level, ToolShell receives toolId, nav reads from manifest.navigation with href) / 2 call-graph hops (layout → ToolShell → children) / Creates `app/tools/wa-sender/layout.tsx` that wraps children in ToolShell with auth guard and provides the WASenderContext to all sub-routes.  
**Status**: ACTIVE

## Context

ToolShell is a Phase 1 component that renders the tool chrome (sidebar nav, header, user menu). All tools in the registry should be wrapped in it. Currently WA Sender is not wrapped — it uses a custom layout. This todo integrates ToolShell and places the auth guard at the layout level so individual sub-routes don't need to repeat it.

The layout also serves as the WASenderProvider boundary — all sub-routes in `app/tools/wa-sender/` will have access to shared context.

## Scope

**DO:**
- Create `app/tools/wa-sender/layout.tsx` as a server component or client component (client if `useAuth` requires hooks)
- Implement auth guard: redirect to `/login` if not authenticated
- Wrap children in `<ToolShell toolId="wa-sender" user={user}>`
- Wrap children in `<WASenderProvider>` so all sub-routes share state
- ToolShell reads `manifest.navigation` (not `manifest.nav_items` — see red team fix) and renders nav items using `href` (not `path`)
- Active route highlighting: the nav item whose `href` matches `usePathname()` should be visually active

**DO NOT:**
- Duplicate auth checks in individual sub-route pages
- Modify `ToolShell` component itself — only consume it
- Read `manifest.nav_items` or use `path` keys — this was the critical finding from the red team audit (journal 0001 §1)
- Add contacts as a top-level nav item — contacts are accessed within Dashboard per the spec

## Deliverables

**Create:**
- `app/tools/wa-sender/layout.tsx` — layout with auth guard, ToolShell, and WASenderProvider

**Tests:**
- `__tests__/wa-sender-toolshell.test.ts` — unit tests for layout behavior

## Testing

**Unit tests (Tier 1):**
- `test_layout_redirects_unauthenticated_user` — mock `useAuth` returning `{ isAuthenticated: false }`; render layout; verify redirect to `/login`
- `test_layout_renders_tool_shell_when_authenticated` — mock `useAuth` returning `{ isAuthenticated: true }`; verify `<ToolShell>` is in the rendered output
- `test_layout_passes_tool_id_wa_sender` — ToolShell receives `toolId="wa-sender"` prop
- `test_layout_wraps_children_in_provider` — child component calling `useWASender()` does not throw when wrapped in layout

**Manual checks:**
- Visit `/tools/wa-sender` without authentication — redirected to `/login`
- Visit `/tools/wa-sender` authenticated — ToolShell chrome visible with navigation items
- Navigate to `/tools/wa-sender/templates` — nav item "Templates" is highlighted as active
- Navigate back to `/tools/wa-sender` — "Dashboard" is highlighted as active
- File selected in Dashboard persists after navigating to Templates and back (context preserved)

## Implementation Notes

- `ToolShell` component signature from Phase 1: `<ToolShell toolId={string} user={User}>`. Verify the actual prop types from the Phase 1 implementation before writing this.
- If `useAuth` requires `toolId` parameter (per the plan's note in 2C-Foundation: "lib/useAuth.ts (refactor to accept toolId parameter)"), update `lib/useAuth.ts` to accept `toolId?: string` and forward it to the auth proxy. This change is small and belongs in this todo.
- Provider wrapping order: ToolShell must be INSIDE the auth guard check; WASenderProvider should be INSIDE ToolShell (so context is only available to authenticated children):
  ```tsx
  if (!isAuthenticated) redirect('/login');
  return (
    <ToolShell toolId="wa-sender" user={user}>
      <WASenderProvider>
        {children}
      </WASenderProvider>
    </ToolShell>
  );
  ```
- Error boundaries: wrap `{children}` in an `<ErrorBoundary>` component so that a crash in one sub-route does not break the entire ToolShell chrome. This prevents navigation from being unusable after a sub-route error.

## Verification

✅ **Spec Compliance**: All requirements from `wa-sender-core.md` § ToolShell Integration Contract implemented:
- Auth guard at layout level (redirects unauthenticated to /login)
- ToolShell integration with correct props (toolId, toolName, navigation, activeHref)
- WASenderProvider wrapping (context available to all sub-routes)
- manifest.navigation field used (not nav_items) ✓ Red team fix preserved
- nav items use href property (not path) ✓ Red team fix preserved

✅ **Implementation**: Two-file structure created:
- `app/tools/wa-sender/layout.tsx` (server component with metadata export, delegates to layout-client)
- `app/tools/wa-sender/layout-client.tsx` (client component with auth guard, ToolShell, provider)

✅ **Architecture Verified**:
- Metadata export preserved in server layout.tsx
- Client component hooks (useRouter, usePathname, useAuth) isolated to layout-client.tsx
- Correct wrapping order: auth guard → ToolShell → WASenderProvider → children
- Navigation items mapped from manifest.navigation with correct shape (label, href, icon)
- Active nav item highlighting via usePathname() → activeHref prop
- Provider receives userId from session for localStorage scoping

✅ **Testing**: 24 tests passing in `__tests__/wa-sender-toolshell.test.ts` (Tier 1):
- Auth guard tests (redirects unauthenticated, shows nothing while loading)
- ToolShell integration tests (receives correct props, manifest fields mapped correctly)
- Navigation tests (reads from manifest.navigation, uses href, correct field names)
- Provider wrapping tests (WASenderProvider wraps children, provides userId)
- Red team audit fixes verified (manifest.navigation not nav_items, href not path)
- Backwards compatibility tests (existing sessions accessible, no breaking changes)

✅ **Build**: `npm run build` succeeds, all routes compiled, TypeScript passes

✅ **Dependencies**: Todo 10 context completed and integrated; no blocker for subsequent todos

**Status**: READY FOR SUBROUTES (todos 12+ will implement Dashboard, Templates, Contacts, Messages pages)
