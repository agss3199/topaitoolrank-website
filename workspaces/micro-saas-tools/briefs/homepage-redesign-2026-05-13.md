# Homepage Redesign Brief — May 13, 2026

## Objective

Redesign the homepage to feel **premium, interactive, and alive** — not just visually polished, but responsive to user scrolling and interaction.

## Core Requirements

1. **Premium Aesthetic** ($10,000 investment level)
   - Modern, sophisticated visual hierarchy
   - High-end SaaS / AI tools positioning
   - Professional credibility without corporate stiffness

2. **Scroll Feel & Performance**
   - Every scroll should feel responsive and intentional
   - Micro-interactions that reward interaction
   - Smooth animations tied to scroll position
   - Zero jank, 60fps minimum
   - Optimized for mobile and desktop

3. **Brand Consistency**
   - Keep existing color system (#3b82f6 primary, gray scale)
   - Leverage Tailwind + existing design tokens
   - Maintain layout structure (hero, services, tools, why-us, process, contact)

4. **Reference Aesthetic**
   - shadcn/ui patterns (clean, accessible, modern)
   - Tailwind UI (premium polish, sophisticated)
   - High-end SaaS homepages (Vercel, Linear, Figma)

5. **Performance Non-Negotiable**
   - No heavy libraries (no Three.js, no Framer Motion with complex workflows)
   - CSS-first animations (GPU-accelerated)
   - Intersection Observer for scroll-triggered animations
   - Lazy loading for images/sections
   - Core Web Vitals: LCP <2.5s, FID <100ms, CLS <0.1

## Current State

- Hero section: broken neural-core animation (3 rotating rings) — **remove**
- Services: basic card grid — needs visual elevation
- Tools showcase: functional but unpolished grid
- Form: standard inputs — needs design refinement
- No scroll-based interactions or micro-animations

## Success Criteria

✅ Homepage feels premium and interactive on first scroll  
✅ Users can "feel" the scroll — responsive visual feedback  
✅ No performance degradation (lighthouse >90)  
✅ Mobile experience is sophisticated (not "responsive" in breakpoint sense, but truly mobile-first)  
✅ All sections communicate business value clearly  
✅ Builds in one session without cutting corners  
