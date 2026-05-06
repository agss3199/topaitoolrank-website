# DECISION: Complete Tool Isolation Architecture

**Date**: 2026-05-06  
**Phase**: /todos  
**Status**: Approved and documented in specs

## Decision

Each of the 10 micro-SaaS tools will be **completely isolated** with zero dependency on shared website infrastructure:

1. **Folder structure**: Each tool in `app/tools/[tool-name]/` with own sub-folders (`lib/`, `components/`, `assets/`)
2. **CSS isolation**: Each tool has its own `styles.css` with namespace-scoped selectors (e.g., `.word-counter__*`)
3. **No shared resources**: No imports from project-level `lib/`, `components/`, `utils/`
4. **Extractable**: Each tool can be extracted to a separate domain without any modification needed
5. **Data local**: All data persists in `localStorage` only, never written to backend

## Rationale

**User's explicit constraint**: "make sure each tool is separate inside a separate folder with its individual css relevant to brand and it is not dependent on anything else from our website. No other shared resources"

This constraint differs fundamentally from the WA Sender tool (which uses shared design tokens, components, and utilities). It treats each tool as a standalone product.

**Benefits**:
- Each tool can be deployed independently
- No version conflicts between tools
- Easy to extract and publish as separate NPM packages later
- Clear boundaries prevent accidental coupling
- Each tool can have its own brand color palette and styling
- SEO advantages (completely self-contained tools rank higher for niche searches)

**Trade-offs**:
- Code duplication: Common UI patterns repeated 10 times instead of shared
- Maintenance: CSS variables are duplicated across tools
- Bundle size: Each tool carries its own copy of styling logic
- Team discipline: Must actively avoid importing from shared resources

## Impact

- **Specs**: `specs/micro-saas-tools.md` § 1 (Architecture Principle: Complete Tool Isolation)
- **Todo structure**: Every todo must verify no imports from shared resources
- **Testing**: Integration test (401) verifies complete isolation between tools
- **Development**: Setup todo (001) creates templates that enforce isolation by default

## Implementation Constraints

1. **CSS pattern**: Each tool uses BEM namespace + CSS custom properties
   - Example: `.word-counter`, `.word-counter__input`, `.word-counter__button`
   - All colors in tool's own `:root` with `--tool-slug-*` prefix

2. **Utilities**: Any shared logic (regex, calculations) must be replicated in each tool's `lib/` folder

3. **Components**: No imports from project's `components/` — every component re-implemented per tool

4. **Testing**: Regression test (404) includes "no shared state" verification

## Alternatives Considered

**Option A: Shared component library** (rejected)
- Pros: DRY principle, easier maintenance
- Cons: Violates user's explicit "no shared resources" constraint
- Decision: Rejected — user explicitly requested isolation

**Option B: Monorepo with separate packages** (rejected for now)
- Pros: Clean isolation, deployable separately
- Cons: Infrastructure overhead (separate package management, CI/CD per tool)
- Decision: Deferred — can refactor to monorepo later if tools prove successful

**Option C: Shared CSS variables via custom properties** (rejected)
- Pros: Some DRY benefit for colors/spacing
- Cons: Creates hidden dependency on `globals.css`, violates isolation
- Decision: Rejected — each tool defines its own CSS variables

## Approval

✅ User approved via `/todos` command with explicit isolation constraint  
✅ Documented in specs/micro-saas-tools.md  
✅ Enforced by setup todo (001) and isolation checklist

## Risk Mitigation

**Risk**: Developer accidentally imports from shared `lib/` or `components/`  
**Mitigation**:
- Setup todo creates templates that don't import shared resources
- Each todo includes verification checklist for isolation
- Integration test (401) detects cross-tool state leakage
- Code review can grep for suspicious imports

## Future Consideration

After Wave 1 completes and tools prove successful, evaluate:
- Moving to monorepo with per-tool packages (cleaner isolation)
- Publishing popular tools as separate NPM packages
- Creating a shared "tool SDK" that is opt-in, not default
