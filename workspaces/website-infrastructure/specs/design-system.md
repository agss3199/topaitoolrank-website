# Design System Specification

**Domain:** Visual branding and design tokens  
**Authority:** Single source of truth for colors, typography, spacing, components across all contexts  
**Last Updated:** 2026-05-02  

## 1. Token Hierarchy

All design tokens defined in `app/globals.css` (CSS custom properties). The system has THREE levels:

### Level 1: Semantic Tokens (Foundation)

Color tokens organized by purpose (not by context — shared across all):

```css
/* Semantic colors — used across all pages */
--color-primary: #3b82f6;      /* Primary action, links, highlights */
--color-secondary: #8b5cf6;    /* Secondary actions */
--color-accent: #f59e0b;       /* Attention, warnings */
--color-success: #10b981;      /* Success states, valid input */
--color-error: #ef4444;        /* Errors, destructive actions */
--color-info: #06b6d4;         /* Info messages */

/* Neutrals — backgrounds, text, borders */
--color-bg-light: #fafafa;     /* Lightest background */
--color-bg-default: #ffffff;   /* Default background */
--color-bg-dark: #1f2937;      /* Dark background */
--color-text-primary: #111827; /* Primary text (900) */
--color-text-secondary: #6b7280; /* Secondary text (600) */
--color-border: #e5e7eb;       /* Borders (200) */

/* Shadows (elevation levels 1-4) */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 25px rgba(0,0,0,0.1);
```

### Level 2: Context-Specific Overrides

Each context (blog, tools, marketing) MAY override tokens via CSS class or route group variables.

**Blog Context** (`.blog-context` or `(blog)` route group):
- Typography: Use serif fonts for body text (higher readability for long prose)
- Spacing: Wider line-height (1.8+) for readability
- Colors: Light backgrounds with high contrast text
- Accent: Use info blue for links (proven CTR for reading)

**Tools Context** (`.tools-context` or `(tools)` route group):
- Typography: Sans-serif for all text (dense, scannable UI)
- Spacing: Tighter line-height (1.5) for compact layouts
- Colors: May use brighter accents (drawing attention to CTAs)
- Background: May be darker (reduce eye strain for long work sessions)

**Marketing Context** (`(marketing)` route group, homepage):
- Typography: Large, bold headlines; sans-serif body
- Spacing: Generous whitespace (premium feel)
- Colors: Full color palette (visual appeal)
- Accent: Use primary color aggressively (brand presence)

### Level 3: Component-Level Tokens

Components MAY define local variables for child elements:

```css
/* In Button.css */
.button {
  --button-bg: var(--color-primary);
  --button-text: white;
  --button-padding-y: var(--spacing-sm);
  --button-padding-x: var(--spacing-md);
}

.button:hover {
  --button-bg: var(--color-primary-dark); /* derived, not predefined */
}
```

**Rule:** Component tokens MUST reference Level 1 semantic tokens. Never use raw hex colors.

## 2. Context-Specific Rules

### Blog Context Rules

**Typography:**
- Body: Georgia, serif, 18px (line-height: 1.8)
- Headings: Inter, sans-serif, bold
- Code: Monospace, 14px, light background container

**Spacing:**
- Content max-width: 72 characters (prose optimal)
- Section spacing: 4rem between major sections
- Paragraph spacing: 1.5rem

**Colors:**
- Background: `#fafafa` (light, warm)
- Text: `#1a202c` (dark, comfortable for reading)
- Link: `#06b6d4` (info blue, accessible)
- Highlight (selected text): `#fef08a` (soft yellow, readable)

**Component Specialization:**
- No modals (use page-based dialogs only)
- Share buttons use minimal styling (not primary actions)
- TOC in sidebar (not inline)

### Tools Context Rules

**Typography:**
- All text: Inter, sans-serif
- Body: 14px (compact, scannable)
- Headings: 16-24px depending on level

**Spacing:**
- Content max-width: no limit (fill available space)
- Section spacing: 2rem between sections
- Form field spacing: 1rem

**Colors:**
- Background: `#ffffff` (neutral, professional)
- Accent: Use `--color-accent` aggressively (orange `#f59e0b`)
- Error states: Use red with icon (redundant encoding)
- Inputs: Light gray background (`#f3f4f6`)

**Component Specialization:**
- Modals allowed (standard UX)
- Forms with validation (real-time feedback)
- Tables for data display
- No serif fonts anywhere

### Marketing Context Rules

**Typography:**
- Hero: 48-64px, sans-serif, bold
- Subheading: 24-32px, sans-serif
- Body: 16px, sans-serif

**Spacing:**
- Hero section: full viewport height minimum
- Sections: 6-8rem spacing (generous white space)
- CTA buttons: Large (48px height minimum)

**Colors:**
- Background: White or light gray
- Hero: Full-bleed color, often primary or secondary
- Buttons: Primary color (brand-forward)

**Component Specialization:**
- Large hero section required
- CTA buttons large and prominent
- Cards for feature showcase
- Full-width sections allowed

## 3. Component Token Contract

Every component MUST declare its tokens:

```tsx
// Button.tsx
<button className="button button--primary">Click</button>
```

```css
/* Button.css */
.button {
  --button-bg: var(--color-primary);
  --button-text: white;
  --button-radius: var(--radius-md);
  --button-padding: var(--spacing-sm) var(--spacing-md);
}

.button--secondary {
  --button-bg: var(--color-secondary);
}

/* Never use raw colors */
/* ❌ DO NOT: background: #3b82f6; */
/* ✅ DO: background: var(--button-bg); */
```

## 4. Green Screen Artifact Resolution

**Current Issue:** Article pages show green background at top

**Root Cause:** `public/css/style.css` loaded globally (homepage-specific styles bleeding into articles)

**Solution:** Move homepage styles into route group (see styling-architecture.md)

**Immediate fix (1-line):**
- Remove script injection of `public/css/style.css` from `app/layout.tsx`
- Keep only in `(marketing)` route group layout

## 5. Validation Checklist

Before shipping any page:

- [ ] All colors use CSS variables (not raw hex)
- [ ] Typography follows context rules (serif for blog, sans for tools)
- [ ] Spacing uses `--spacing-*` tokens (no magic numbers)
- [ ] Shadows use `--shadow-*` tokens (4 levels only)
- [ ] Components declare their own tokens
- [ ] No inline styles
- [ ] Context-specific overrides documented in CSS comments

## 6. Extension for New Tools

When Tool B is added:

1. Define context override in Tool B's CSS root:
   ```css
   .tool-b-context {
     --color-primary: #your-color;
     --preferred-font-family: sans-serif;
   }
   ```

2. Wrap Tool B in context class:
   ```tsx
   <div className="tool-b-context">
     <ToolB />
   </div>
   ```

3. Document context rules in this spec

**No changes to existing tokens or components required.**
