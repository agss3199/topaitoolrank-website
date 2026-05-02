# Website Infrastructure Specification Index

**Version:** 1.0  
**Date:** 2026-05-02  
**Authority:** Source of truth for website architecture decisions and contracts  

## Spec Files

| File | Domain | Description |
|------|--------|-------------|
| **design-system.md** | Design | Unified branding kit with context-specific subsystems (blog, tools, marketing). 3-level token hierarchy (semantic, context overrides, component-level). Token definitions, color palette, typography scale, context rules for each domain. |
| **authentication.md** | Auth | Tool-scoped token architecture with server-side JWT. Tool-specific token claims. Middleware route protection. Token refresh/logout flows. Isolation guarantees preventing cross-tool credential reuse. |
| **styling-architecture.md** | CSS | CSS isolation strategy via route groups + CSS Modules. Fix for global CSS leakage (`public/css/style.css`). Design token cascade. Context-specific overrides (blog/tools/marketing). Component CSS contracts. |
| **component-library.md** | Components | Shared component catalog vs tool-specific components. ToolShell wrapper pattern for auth gating and chrome. Import rules preventing cross-tool contamination. Component quality standards. Navigation context-awareness. |
| **tool-architecture.md** | Tools | Plug-and-play tool registration via manifests. Tool discovery mechanism. Manifest format (id, name, routes, navigation, database tables, API endpoints, env vars). Database schema pattern for data isolation. Tool deployment independence. |

## Traceability to Brief

| Brief Requirement | Spec Coverage |
|-------------------|---|
| Overall branding kit | design-system.md § Token Hierarchy |
| Subdivide for articles, tools, website | design-system.md § Context-Specific Rules |
| Fix green screen | styling-architecture.md § CSS Leakage Prevention (root cause) |
| Tool isolation (no auth leakage) | authentication.md + tool-architecture.md |
| Proper asset segmentation | styling-architecture.md + component-library.md |
| Scalable, plug-and-play | tool-architecture.md § Registration & Manifest |
| Auth, login shouldn't leak | authentication.md § Isolation Guarantees |

## How to Use These Specs

1. **During `/todos`**: Link each todo to relevant spec section(s)
2. **During `/implement`**: Code against spec contracts (exact field names, endpoint shapes, error types)
3. **During `/redteam`**: Verify code matches spec assertions via grep/AST
4. **During `/codify`**: Update specs when implementation reveals new domain truth

## Reading Order

1. Start with **design-system.md** (foundation for visual consistency)
2. Then **styling-architecture.md** (how to implement design system in code)
3. Then **authentication.md** (security and user isolation)
4. Then **component-library.md** (building blocks)
5. Finally **tool-architecture.md** (everything together)
