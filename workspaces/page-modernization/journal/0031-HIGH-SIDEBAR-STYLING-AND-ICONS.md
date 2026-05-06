---
id: "0031"
type: HIGH
slug: sidebar-styling-missing-variables-icon-rendering
date: 2026-05-06T14:45:00Z
severity: HIGH
status: FIXED
---

# High: Sidebar Navigation Styling and Icon Rendering Issues

## What Happened

Sidebar navigation had two related issues:

1. **Duplicate text labels**: Icons were rendering as text (e.g., "dashboard Dashboard", "mail Messages")
2. **White/transparent background**: Sidebar background didn't match the design system

**Impact**: Visual broken state; navigation illegible; inconsistent design.

## Root Causes

### Issue 1: Icon Rendering (Layout-Client)

Manifest defined icons as strings:
```json
"navigation": [
  { "label": "Dashboard", "icon": "dashboard" },
  { "label": "Messages", "icon": "mail" }
]
```

But `layout-client.tsx` passed icon strings directly to ToolShell:
```typescript
icon: item.icon || undefined,  // passes "dashboard" (string)
```

ToolShell rendered the string as text:
```typescript
{item.icon && <span aria-hidden="true">{item.icon}</span>}  // renders "dashboard"
{item.label}  // renders "Dashboard"
```

Result: "dashboard Dashboard" (icon + label as text).

### Issue 2: Missing CSS Variables (Globals.css)

ToolShell.module.css referenced CSS variables that didn't exist:

```css
.shell {
  background-color: var(--color-bg-default);  /* undefined */
}
.sidebar {
  background-color: var(--color-bg-surface);  /* undefined */
}
.navLink:hover {
  background-color: var(--color-bg-hover, rgba(0, 0, 0, 0.05));  /* undefined */
}
.navLinkActive {
  background-color: var(--color-accent-subtle, rgba(59, 130, 246, 0.1));  /* undefined */
}
```

When CSS variables are undefined, they fall back to transparent/white, breaking the design system color hierarchy.

## Fixes Applied

**Commit**: `894b5a8`  
**Files Changed**:
- `app/tools/wa-sender/layout-client.tsx` (icon mapping)
- `app/globals.css` (CSS variables)

### Fix 1: Icon Mapping

Added iconMap to convert icon strings to emoji icons in layout-client.tsx:

```typescript
const iconMap: Record<string, string> = {
  dashboard: '📊',
  mail: '📧',
  template: '📝',
  settings: '⚙️',
  messages: '💬',
  contacts: '👥',
  history: '📜',
};

// Then use in navigation conversion:
icon: item.icon ? iconMap[item.icon] || item.icon : undefined,
```

Result: "📊 Dashboard" instead of "dashboard Dashboard".

### Fix 2: CSS Variables

Added missing variables to `:root` in globals.css:

```css
--color-bg-default: #f5f5f5;
--color-bg-surface: #ffffff;
--color-bg-hover: rgba(0, 0, 0, 0.05);
--color-accent-subtle: rgba(59, 130, 246, 0.1);
```

Values chosen to match design system:
- `--color-bg-default`: Light gray (page background)
- `--color-bg-surface`: White (sidebar, card backgrounds)
- `--color-bg-hover`: Subtle transparency for hover states
- `--color-accent-subtle`: Light blue tint for active navigation

## Deployment

- **Commit**: `894b5a8`
- **Deployment**: `dpl_FgiGgVpEoGbtecyrKCvmYqfimT7V`
- **URL**: https://topaitoolrank.com
- **Build Time**: 37s
- **Status**: READY

## Verification

After deployment:
- ✅ Navigation shows emoji icons followed by labels ("📊 Dashboard", not "dashboard Dashboard")
- ✅ Sidebar has proper white background (#ffffff)
- ✅ No duplicate text rendering
- ✅ Hover and active states use correct subtle background colors
- ✅ Design system tokens applied correctly

## Prevention

1. **Icon System**: Create a shared icon component library instead of string-based mappings
2. **CSS Variables**: Validate that all CSS variables referenced in components are defined in globals.css
3. **Component Tests**: Add visual regression tests to catch broken styling on CI
4. **Design Tokens Documentation**: Keep an up-to-date list of all CSS variables in use

## Alternative Approaches (Not Implemented)

- Use a proper icon library (react-icons, heroicons, etc.) instead of emoji
- Generate icon mappings from manifest at build time
- Validate CSS variables at build time to catch missing definitions

## Related Issues

- **0029**: Auth session race condition (different issue, same session area)
- **0030**: Session persistence bug (data loss, same code area)

---

**Fixed by**: Commit 894b5a8  
**Deployed**: 2026-05-06 14:45 UTC  
**Status**: ✅ RESOLVED
