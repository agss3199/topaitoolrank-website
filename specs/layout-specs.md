# Layout Specifications

## Hero Section

### Desktop (1024px+)
```
┌────────────────────────────────────────────────┐
│  [Nav - Glassmorphic, 72px height]             │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ [Hero Content - Left]      [Hero Visual] │  │
│  │ 180px headline             [offset +120px]  │
│  │ 24px subtitle              [Visual OVERFLOWS]│
│  │ 2x CTA buttons             [to next section]│
│  │                                             │
│  │ [Hero Proof - 3 columns]                    │
│  └──────────────────────────────────────────┘  │
│                                                  │
└────────────────────────────────────────────────┘

Grid: 2 columns
- Left: Hero content (text, buttons, proof)
- Right: Hero visual (illustration, diagram, or geometric shape)

Hero visual starts at top but overflows down by 120px into next section (intentional).
```

### Tablet (768px - 1023px)
- Switch to single column layout
- Hero content first (full width)
- Hero visual below (full width, reduced overflow to 60px)

### Mobile (< 768px)
- Single column, centered
- Hero text: 48px H1
- Visual: full width
- No overflow (all contained)

---

## Section Layout (Generic)

### Structure
```
┌────────────────────────────────────────────────┐
│  [Padding top: 60px]                           │
│                                                  │
│  [Section Heading]                              │
│  [Kicker] [H2] [Description]                   │
│                                                  │
│  [Section Content Grid]                         │
│  [Asymmetric items, offset positioning]        │
│                                                  │
│  [Padding bottom: 60px]                        │
└────────────────────────────────────────────────┘
```

### Asymmetric Grid Pattern

Example: Services Grid (4 items)
```
Items 1-2: Normal flow
Item 3: Offset down by 40px (transform: translateY(40px))
Item 4: Normal flow but narrower (grid-column: span 0.9)

Result: Visual rhythm, not perfect symmetry
```

---

## Credibility Strip (Between Hero and Services)

```
┌────────────────────────────────────────────────┐
│  [Thin horizontal bar]                         │
│  [4 columns: stat + label]                     │
│                                                  │
│  Built for          Useful for        Focused on  │
│  Founders           Operations Teams  Speed + Clarity
│                                                  │
└────────────────────────────────────────────────┘

Background: Light gray or off-white
Grid: 4 equal columns
Padding: 24px vertical, 16px horizontal
```

---

## Container Width

- **Max width:** 1180px
- **Padding:** 40px sides (on container)
- **Responsive:** `min(1180px, calc(100% - 40px))`
- Result: 1180px on desktop, narrower on tablet/mobile

---

## Section Ordering

1. **Hero** (offset visual into services)
2. **Credibility Strip** (thin bar)
3. **Services** (4-item grid, asymmetric)
4. **Tools** (2-item grid)
5. **Why Us** (4-item reasons grid)
6. **Process** (4-step timeline)
7. **Contact** (2-column: text + form)
8. **Footer** (4-column grid)

---

## Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|-----------|-------|-----------------|
| Mobile | < 768px | Single column, no overflow, 48px H1 |
| Tablet | 768px - 1023px | 2 columns max, reduced spacing |
| Desktop | 1024px+ | Full 2+ column layouts, full spacing, overflow effects |
| Wide | > 1440px | Same as desktop (max-width enforced) |

---

## Offset/Asymmetry Rules

### Intentional Misalignment
- Hero visual overflows: 120px (desktop), 60px (tablet), 0px (mobile)
- Service cards item 3: translateY(40px)
- Sections may have different padding top/bottom (e.g., hero 80px top, services 60px top)
- Card widths may vary slightly (e.g., 95%, 100%, 98%)

**Goal:** Visual interest without looking broken. All misalignment is proportional and repeats intentionally.

---

## White Space as Design

- Hero: 80px top padding (above content)
- Sections: 60px vertical padding (between sections)
- Items: 32px gap (between cards in grid)
- Text: 24px bottom margin (between headline and paragraph)

More white space → more premium, less cramped

---

## Visual Hierarchy (Size Emphasis)

| Element | Desktop Size | Purpose |
|---------|--------------|---------|
| H1 (Hero) | 180px | Dominates, unforgettable |
| H2 (Section) | 56px | Clear section breaks |
| H3 (Item) | 36px or 28px | Secondary importance |
| Body text | 18px | Content, readable |
| Small text | 14px | Captions, metadata |

**Rule:** Each level is ~1.5-1.7x smaller than above. Creates clear hierarchy without confusion.

---

## Navigation Bar

### Desktop
- Fixed position: top 18px
- Background: rgba(255, 255, 255, 0.82) with blur(18px)
- Border: 1px solid rgba(37, 99, 235, 0.12) [keep current style]
- Height: 72px
- Padding: 0 22px
- Border radius: 999px (fully rounded)
- Logo: Text-based "Top AI Tool Rank"
- Menu: Horizontal, 6px gap between items
- CTA button: Neon lime (new)

### Mobile
- Same fixed position
- Full-width (minus padding)
- Hamburger menu (three lines)
- Dropdown menu below nav
- Font sizes reduced

---

## Footer

### Layout (Desktop)
- 4 columns (equal width)
- Each column has heading + list or text
- Column 1: Brand info
- Column 2: Quick Links
- Column 3: Legal
- Column 4: Contact

### Mobile
- Single column (stacked)
- Full width
- Spacing increased for touch targets

---

## Grid System (CSS Grid)

### Hero Grid
```css
.hero-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  /* Desktop: 2 columns
     Tablet: 1 column
     Mobile: 1 column */
}
```

### Services Grid
```css
.services-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  /* Desktop: 4 columns
     Tablet: 2 columns
     Mobile: 1 column */
}
```

### General Card Grid
```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  /* Responsive auto-fit, minimum 300px per card */
}
```
