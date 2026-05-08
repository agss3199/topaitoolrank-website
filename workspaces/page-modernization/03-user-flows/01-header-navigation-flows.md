# User Flows: Unified Header Navigation

**Objective**: Document how users navigate the site after header unification  
**Target State**: Single header component used on all pages

---

## Flow 1: New Visitor Journey (Homepage as Entry Point)

**Start**: User lands on homepage (/)

```
┌─────────────────────────────┐
│ Homepage                    │
│ ┌───────────────────────┐   │
│ │ HEADER (unified)      │   │
│ │ Logo | Services |     │   │
│ │ Tools | Blogs |       │   │
│ │ Contact | Hamburger   │   │
│ └───────────────────────┘   │
│                             │
│ Hero section (scroll)       │
│ Services section            │
│ Tools showcase              │
│ Why work with me            │
│ Process                     │
│ Contact form                │
└─────────────────────────────┘
```

**Actions Available**:
1. **"Services"** → Scrolls to Services section on same page
2. **"Tools"** dropdown → Shows all 10 tools, user picks one → Navigates to that tool page
3. **"Blogs"** → Navigates to `/blogs/`
4. **"Contact"** → Scrolls to Contact section on same page
5. **Logo click** → Stays on homepage (anchor to #home)
6. **Hamburger (mobile)** → Opens mobile menu with same options

**Outcome**: User discovers the value prop, sees tools, and can navigate to try one.

---

## Flow 2: Tool User Journey (Tool Page as Entry Point)

**Start**: User arrives at a tool page directly (e.g., `/tools/word-counter`)

```
┌─────────────────────────────┐
│ Tool Page (Word Counter)    │
│ ┌───────────────────────┐   │
│ │ HEADER (unified)      │   │
│ │ Logo | Tools dropdown │   │
│ │ Blogs | Contact |     │   │
│ │ Hamburger             │   │
│ └───────────────────────┘   │
│                             │
│ Page header                 │
│ Input textarea              │
│ Stats display               │
│ Article section             │
│ Footer                      │
└─────────────────────────────┘
```

**Actions Available**:
1. **Logo** → Navigates to homepage (/)
2. **"Tools"** dropdown → Shows all 10 tools (categorized), user picks a different tool → Navigates to that tool
3. **"Blogs"** → Navigates to `/blogs/`
4. **"Contact"** → Navigates to homepage and scrolls to contact section
5. **Hamburger (mobile)** → Opens mobile menu with same options

**Outcome**: User can discover other tools or leave to blog/homepage without friction.

---

## Flow 3: Tool-to-Tool Discovery (Tool → Different Tool)

**Start**: User is on `/tools/word-counter`, wants to try a different tool

```
┌──────────────────────────────────────┐
│ Word Counter Tool                    │
│ [HEADER: Tools ▼ | Blogs | Contact] │  ← User clicks "Tools"
└──────────────────────────────────────┘
                ↓
┌──────────────────────────────────────┐
│ Tools Dropdown Menu (Categorized)    │
│ ┌──────────────────────────────────┐ │
│ │ Featured:                        │ │
│ │  • JSON Formatter                │ │
│ │  • Word Counter (current)        │ │
│ │  • Email Subject Tester          │ │
│ │                                  │ │
│ │ Text & Language:                 │ │
│ │  • AI Prompt Generator           │ │
│ │  • ...                           │ │
│ │                                  │ │
│ │ Links & UTM:                     │ │
│ │  • UTM Link Builder              │ │
│ │  • WhatsApp Link Generator       │ │
│ │ ...                              │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
                ↓
        User clicks tool
                ↓
┌──────────────────────────────────────┐
│ JSON Formatter Tool                  │
│ [HEADER: Tools ▼ | Blogs | Contact] │
└──────────────────────────────────────┘
```

**Experience**: Consistent header, categorized tool discovery, instant navigation between tools.

---

## Flow 4: Blog Navigation (Blog as Entry Point)

**Start**: User lands on blog listing page or blog detail page

```
┌─────────────────────────────┐
│ Blog List Page              │
│ ┌───────────────────────┐   │
│ │ HEADER (unified)      │   │  ← Same header on all pages
│ │ Logo | Tools | Blogs  │   │
│ │ Contact | Hamburger   │   │
│ └───────────────────────┘   │
│                             │
│ Blog post cards             │
│ Timestamps, categories      │
│ Read more links             │
│ Pagination                  │
└─────────────────────────────┘
```

**Actions Available**:
1. **Logo** → Navigates to homepage
2. **"Tools"** dropdown → Discover tools (categorized)
3. **"Contact"** → Back to homepage contact section
4. **"Services"** (from Tools dropdown back to home)? 
   - **Note**: From blog, user would need to go home first to see Services. Consider if "Services" should appear in header. For now, accessible via homepage.

**Outcome**: Blog readers can discover tools or return home easily.

---

## Flow 5: Mobile Navigation (All Pages)

**Trigger**: User opens site on mobile (< 768px)

```
DESKTOP VIEW              MOBILE VIEW
┌─────────────┐          ┌──────────┐
│ Logo | Nav  │          │ Logo │ ☰ │  ← Hamburger visible
└─────────────┘          └──────────┘
  Navigation                  ↓
   visible               [Menu opens]
                         ┌──────────┐
                         │ ☰ Close  │
                         │ Home     │
                         │ Services │
                         │ Tools ▼  │
                         │ ├─ Tool1 │
                         │ ├─ Tool2 │
                         │ ├─ ...   │
                         │ Blogs    │
                         │ Contact  │
                         └──────────┘
```

**Key Behaviors**:
- Hamburger appears at mobile breakpoint
- Click hamburger → menu slides open
- Click a menu link → menu closes automatically
- Tools dropdown expands/collapses on click (mobile)
- Full tool list visible under Tools dropdown
- Same navigation available at all breakpoints

---

## Flow 6: Internal Links and Anchor Navigation

**Scenario**: Navigation to sections within homepage

```
Any Page → Click "Services" → Homepage + Scroll to #services
Any Page → Click "Contact" → Homepage + Scroll to #contact
Any Page → Click "Home" → Homepage (scroll to #home)
Any Page → Click Logo → Homepage
```

**Implementation**:
- From homepage: `<a href="#services">` works (same page anchor)
- From tool page: `<a href="/#services">` navigates + scrolls
- From blog: `<a href="/#contact">` navigates + scrolls

**User Experience**: Consistent, predictable navigation that works from any page context.

---

## Responsive Breakpoints

| Breakpoint | Layout | Header Behavior |
|------------|--------|-----------------|
| **Mobile** <480px | Single column | Hamburger menu, stacked links |
| **Tablet** 480–768px | 2 columns | Hamburger menu, horizontal nav visible below |
| **Desktop** >768px | Full width | Horizontal nav visible, hamburger hidden |

**Verification**:
- Test on 320px (small phone)
- Test on 768px (tablet)
- Test on 1200px (desktop)
- All navigation elements responsive and functional

---

## Validation Checklist (Post-Deployment)

| Scenario | Expected | Test Method |
|----------|----------|-------------|
| Homepage loads with header | Header visible, nav works | Visit / in browser |
| Tool page loads with header | Same header, nav works | Visit /tools/word-counter |
| Click Tools on tool page | Dropdown shows, other tools visible | Click "Tools" dropdown |
| Click different tool | Navigates to that tool | Click JSON Formatter from dropdown |
| Click "Contact" on tool page | Navigates to homepage #contact | Click "Contact" on tool page |
| Mobile menu opens | Menu slides open, hamburger visible | Resize to 320px, click hamburger |
| Click link in mobile menu | Menu closes, page navigates | Click menu link on mobile |
| Logo click | Navigates to homepage | Click logo from any page |
| Anchor links work | Page scrolls to section | Click "Services" from homepage |

---

## Summary: What Users See (Post-Unification)

**Key Change**: Same header everywhere → consistent navigation regardless of current page.

**Before**:
- Homepage: Text logo, Services link, Tools link
- Tool page: Emoji logo, no Services, Tools only

**After**:
- Every page: Consistent header with all navigation options
- Logo style unified
- Navigation structure identical
- Mobile menu behavior consistent

**User Benefit**: Predictable, consistent experience across the entire site. No surprises or disorientation when navigating between pages.

