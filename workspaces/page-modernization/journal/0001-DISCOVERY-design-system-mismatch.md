# DISCOVERY: Design System Mismatch Across Pages

**Date**: 2026-04-30
**Impact**: High (affects user perception of brand coherence)

## Finding

The homepage has been modernized with a light-theme, blue-accent design system (#3b82f6, system fonts, 8px spacing), but secondary pages (authentication, tools, content) use entirely different visual approaches:

- **Homepage**: Light background (#fafafa), single blue accent, minimal design
- **Auth pages** (login/signup): Dark gradient background (slate-950 → purple-950), purple/blue/cyan gradients, glassmorphism
- **WA Sender**: Recently updated but partial consistency
- **Blog/Legal**: Minimal styling or placeholders

## Root Cause

1. **Sequential development**: Homepage was modernized first; secondary pages built before design system was finalized
2. **No enforcement**: No specs or checks to ensure pages conform to design system
3. **Library absence**: No component library to standardize form inputs, buttons, cards, modals
4. **Documentation gap**: design-system.md was not created until this analysis

## Implications

- Users see **visual discontinuity** when navigating from homepage to login page
- **Accessibility varies** across pages (contrast, focus indicators, ARIA labels)
- **Performance differs** (dark theme animations vs. light theme smooth transitions)
- **Maintenance burden increases** when fixing design across unaligned pages

## Evidence

Audit of page structure:
- Homepage (`/`): CSS class-based (navbar, hero, reveal, cta-button)
- Login (`/auth/login`): Tailwind utilities + inline gradients
- Signup (`/auth/signup`): Likely same as login
- WA Sender (`/tools/wa-sender`): Mixed (inherited navbar, custom tool UI)
- Blog (`/blogs`): Placeholder with basic navbar
- Legal (`/privacy-policy`, `/terms`): Not fully investigated

Color comparison:
- Homepage accent: #3b82f6 (blue)
- Auth background gradient: slate-950 (#020617) → purple-950 → cyan gradients
- Mismatch severity: **Critical** (opposite theme direction)

## Resolution Strategy

1. **Create design-system.md** (specs/) — Authority on all visual decisions ✅
2. **Build component library** — Reusable form, button, card, modal components
3. **Modernize Tier 1 pages** — Auth pages (highest user impact)
4. **Modernize Tier 2 pages** — Tool pages (functional impact)
5. **Modernize Tier 3 pages** — Content pages (brand impact)
6. **Enforce specs** — CI/CD checks for color usage, spacing compliance

## Timeline

- Tier 1: 1 session (auth pages)
- Tier 2: 1 session (tool pages)
- Tier 3: 1 session (content pages)
- Total: 3 sessions to full modernization

## Related Documents

- `specs/design-system.md` — Authority on visual language
- `workspaces/page-modernization/02-plans/01-modernization-strategy.md` — Detailed implementation approach
- `workspaces/page-modernization/03-user-flows/01-authentication-flow.md` — User experience with modernized pages

