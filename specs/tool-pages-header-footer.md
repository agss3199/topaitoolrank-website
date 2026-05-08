# Tool Pages Header/Footer Specification

## Scope

Shared header and footer components for all 9 micro-SaaS tool pages (excluding WA-Sender). Must work across isolated CSS Module scopes while maintaining visual consistency and providing navigation/branding.

## Header Component

### Visual Design

- **Height**: 80px (desktop), 64px (mobile)
- **Padding**: 16px horizontal, 12px vertical
- **Background**: White with subtle bottom border (`#e5e7eb`)
- **Layout**: Flexbox row with space-between alignment
- **Responsive breakpoint**: 768px (switches to hamburger menu)

### Left Section (Branding)

```
[ Logo ] [ Site Name ]
```

- **Logo**: topaitoolrank.com SVG icon or text mark (32×32px)
- **Site Name**: "Top AI Tool Rank" in bold, 18px, color `#111827`
- **Link Target**: Homepage (`/`)
- **Mobile**: Logo only, hide text name

### Center Section (Navigation)

**Desktop** (hidden on mobile):
- Tools dropdown (shows all 10 tools, organized by category)
- Blog link
- About link
- Contact link

**Mobile** (hamburger):
- Hamburger icon (three horizontal lines, 24×24px)
- Opens slide-out sidebar with Tools, Blog, About, Contact, Contact Info

### Right Section (Empty)

- Reserved for future: Search icon, account menu, theme toggle
- Currently empty

### CSS Implementation

```css
/* Shared component CSS */
.tool-header {
  height: 80px;
  padding: 0 16px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tool-header__brand {
  display: flex;
  gap: 12px;
  text-decoration: none;
  color: #111827;
}

.tool-header__nav {
  display: flex;
  gap: 32px;
}

@media (max-width: 768px) {
  .tool-header__nav { display: none; }
  .tool-header__hamburger { display: block; }
}
```

### Implementation Details

- **Location**: Create `app/components/Header.tsx` as shared React component
- **Import path**: All pages (homepage and tool pages) import from `@/app/components/Header`
- **CSS Module**: Single `Header.module.css` shared across all pages
- **Shared across site**: Header is intentionally universal UI (not tool-specific)
- **Accessibility**: ARIA labels on navigation, keyboard navigation support

**Architecture Rationale** (updated 2026-05-08):
Headers are site-wide UI components, not tool-specific infrastructure. Shared UI belongs in `app/components/` per Next.js conventions. The original spec placed headers in `app/tools/lib/` when headers were tool-only. This update reflects the new unified header used on both homepage and all tool pages. All pages import from the canonical `app/components/Header` location.

## Footer Component

### Visual Design

- **Height**: 400px (desktop), 600px (mobile)
- **Padding**: 40px horizontal, 32px vertical
- **Background**: Dark gray (`#1f2937`)
- **Text Color**: Light gray (`#d1d5db`)
- **Layout**: CSS Grid with 4-5 columns (desktop), 1 column (mobile)

### Sections

#### 1. Branding Column

```
[ Logo ]
Top AI Tool Rank
Description: "Free AI tools for productivity and SEO"
Social links (optional for phase 1)
```

- Logo repeated with white background
- 2-3 line description of the site
- Copyright: "© 2026 Top AI Tool Rank. All rights reserved."

#### 2. Tools Column

- Title: "Tools"
- Links to top 5 tools by traffic tier (JSON Formatter, Word Counter, Email Subject Tester first)
- "View all tools" link to `/tools`

#### 3. Resources Column

- Title: "Resources"
- Blog link
- Documentation (if exists)
- API docs (if applicable)

#### 4. Legal Column

- Title: "Legal"
- Privacy Policy link
- Terms of Service link
- Contact link
- Sitemap link

#### 5. Newsletter Column (Optional Phase 2)

- Title: "Stay Updated"
- Email signup form (optional)
- "Subscribe for weekly AI tools & tips"

### CSS Implementation

```css
.tool-footer {
  background: #1f2937;
  color: #d1d5db;
  padding: 40px 16px;
  margin-top: 80px;
  border-top: 1px solid #374151;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
}

.tool-footer__column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tool-footer__column-title {
  font-weight: 600;
  color: white;
  font-size: 16px;
}

.tool-footer__link {
  color: #d1d5db;
  text-decoration: none;
  transition: color 0.2s;
}

.tool-footer__link:hover {
  color: white;
}

@media (max-width: 768px) {
  .tool-footer {
    grid-template-columns: 1fr;
  }
}
```

### Implementation Details

- **Location**: Create `app/tools/lib/Footer.tsx` as shared React component
- **Import path**: All tool pages import from `../lib/Footer`
- **CSS Module**: Single `Footer.module.css` shared across all tools
- **Mobile behavior**: Single column stacked layout, same visual hierarchy

## Layout Integration

### Page Structure (Each Tool Page)

```html
<div class="tool-page">
  <Header />
  <main class="tool-content">
    <ToolUI />
    <ArticleSection />
  </main>
  <Footer />
</div>
```

### Spacing

- Space between Header and Tool: 24px (padding-top on main)
- Space between Tool and Footer: 40px (margin-top on footer)
- All contained within tool-specific CSS scope

### CSS Module Safety

- Header and Footer CSS live in shared `app/tools/lib/`
- Each tool page still imports `../lib/css-module-safe.ts` for its own styles
- Shared header/footer CSS does NOT use the `cls()` helper (it's not dynamic)
- No tool-specific CSS classes interact with header/footer classes

## Cross-Tool Links

### Header (Tools Dropdown)

Dropdown lists all 10 tools organized by category:

```
Featured Tools:
- JSON Formatter
- Word Counter
- Email Subject Tester

Text & Language:
- AI Prompt Generator
- Email Subject Tester
- Word Counter

Links & UTM:
- UTM Link Builder
- WhatsApp Link Generator

Content Tools:
- Invoice Generator
- SEO Analyzer

Messaging:
- WhatsApp Message Formatter
- WA-Sender
```

### Footer (Tool Links)

Top 5 tools displayed as links:
1. JSON Formatter
2. Word Counter
3. Email Subject Tester
4. UTM Link Builder
5. SEO Analyzer

With "View all tools" link to `/tools` page listing all 9.

## Responsive Design

### Desktop (1024px+)

- Full navigation visible
- 4-column footer grid
- Full header height (80px)

### Tablet (768px - 1023px)

- Hamburger menu for navigation
- Responsive footer (2-column or full-width columns)
- Reduced header height (80px)

### Mobile (< 768px)

- Hamburger menu only
- Single-column footer
- Header 64px, larger touch targets (44px minimum)
- 16px font size minimum for all text

## Accessibility

- ARIA labels on navigation items
- Keyboard navigation support (Tab through nav items)
- Color contrast: All text meets WCAG AA standard
- Focus indicators: 2px outline on all interactive elements
- Skip links: Optional for phase 2

## Success Criteria

- Header appears consistent across all 9 tool pages
- Footer appears consistent across all 9 tool pages
- Navigation works on desktop and mobile
- Tools dropdown displays all 10 tools properly
- No CSS conflicts with tool-specific styles
- Responsive layout passes mobile view test
- Accessibility passes basic WCAG AA checks
