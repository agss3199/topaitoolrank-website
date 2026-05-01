# Page Modernization Todos

## Milestone Overview

| Milestone | Todos | Gate Condition |
|-----------|-------|---------------|
| **M1: Component Library** | 001-008 | All 8 todos complete before any page work starts |
| **M2: Auth Pages** | 010-015 | Depends on M1; critical user journey |
| **M3: Tool Pages** | 020-024 | Depends on M1; can run parallel to M2 |
| **M4: Content Pages** | 030-035 | Depends on M1; can run parallel to M2/M3 |
| **M5: QA and Verification** | 040-044 | Depends on all prior milestones complete |

## Dependency Graph

```
001 (CSS tokens)
 └── 002 (Button)
 └── 003 (Input/FormField/Label)
 └── 004 (Card)
 └── 005 (Modal) ← also needs 002
 └── 006 (Badge)
 └── 007 (Avatar)
      └── 008 (Component index) [waits for 002-007]
           ├── 010 (Login BUILD) → 011 (Login WIRE)
           ├── 012 (Signup BUILD) → 013 (Signup WIRE)
           ├── 014 (Forgot PW BUILD) → 015 (Forgot PW WIRE)
           ├── 020 (WA Sender forms)
           │    ├── 021 (WA Sender modals) ← also needs 005
           │    ├── 022 (WA Sender badges) ← also needs 006
           │    ├── 023 (WA Sender upload)
           │    └── 024 (WA Sender responsive) [waits for 020-023]
           ├── 030 (Blog listing BUILD) → 031 (Blog listing WIRE)
           ├── 032 (Blog post BUILD) → 033 (Blog post WIRE) ← needs 031
           ├── 034 (Privacy policy)
           └── 035 (Terms) ← needs 034
                └── 040 (Accessibility audit) [waits for 011,013,015,024,033,035]
                     └── 041 (Responsive testing)
                          └── 042 (Performance)
                               └── 043 (Visual regression)
                                    └── 044 (Cross-browser)
```

## BUILD vs WIRE Split

Pages with external data have two todos:
- **BUILD** todo: visual structure, local state, component wiring — no real API calls
- **WIRE** todo: connect to real API/data source, remove any static data

This separation means pages can be visually reviewed before data integration.

## File Index

| File | Title | Milestone |
|------|-------|-----------|
| 001 | Verify CSS Foundation | M1 |
| 002 | Button Component | M1 |
| 003 | Input/FormField/Label Components | M1 |
| 004 | Card Component | M1 |
| 005 | Modal Component | M1 |
| 006 | Badge Component | M1 |
| 007 | Avatar Component | M1 |
| 008 | Component Index and Shared CSS | M1 |
| 010 | Login Page — Visual Structure | M2 |
| 011 | Login Page — Auth Logic | M2 |
| 012 | Signup Page — Visual Structure | M2 |
| 013 | Signup Page — Registration Logic | M2 |
| 014 | Forgot/Reset Password — Visual Structure | M2 |
| 015 | Forgot/Reset Password — Backend Logic | M2 |
| 020 | WA Sender — Form Standardization | M3 |
| 021 | WA Sender — Modal Restyling | M3 |
| 022 | WA Sender — Status Badges | M3 |
| 023 | WA Sender — File Upload Styling | M3 |
| 024 | WA Sender — Responsive Layout | M3 |
| 030 | Blog Listing — Visual Structure | M4 |
| 031 | Blog Listing — Data Source | M4 |
| 032 | Blog Post Template — Visual Structure | M4 |
| 033 | Blog Post Template — Content Data | M4 |
| 034 | Privacy Policy Page | M4 |
| 035 | Terms of Service Page | M4 |
| 040 | Accessibility Audit | M5 |
| 041 | Responsive Testing | M5 |
| 042 | Performance Verification | M5 |
| 043 | Visual Regression Audit | M5 |
| 044 | Cross-Browser Testing | M5 |
