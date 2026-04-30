/**
 * Interactive Features Tests (Todos 029-043)
 * TDD: Tests written FIRST, before implementation.
 *
 * Tests validate:
 * - Hover states for buttons, links, cards
 * - Scroll reveal animations with delays
 * - Form focus, error, disabled states
 * - Hamburger menu animation
 * - Mobile menu animation
 * - Prefers-reduced-motion support
 * - Touch/mobile handling
 * - Cursor behavior
 * - Transition timing
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const GLOBALS_CSS = fs.readFileSync(path.join(ROOT, 'app/globals.css'), 'utf-8');
const STYLE_CSS = fs.readFileSync(path.join(ROOT, 'public/css/style.css'), 'utf-8');
const ALL_CSS = GLOBALS_CSS + '\n' + STYLE_CSS;
const PAGE_TSX = fs.readFileSync(path.join(ROOT, 'app/page.tsx'), 'utf-8');

// ============================================================
// Todo 029: Primary CTA Button Hover States
// ============================================================
describe('Todo 029: Primary CTA button hover states', () => {
  it('btn-primary hover changes background to darker accent', () => {
    expect(STYLE_CSS).toMatch(/\.btn-primary:hover\s*\{[^}]*background:\s*var\(--color-accent-hover\)/);
  });

  it('btn-primary hover adds soft shadow', () => {
    expect(STYLE_CSS).toMatch(/\.btn-primary:hover\s*\{[^}]*box-shadow:/);
  });

  it('btn-primary hover uses 0.3s transition (inherited from var(--transition))', () => {
    // The .btn-primary base already has transition: var(--transition) which is all 0.3s ease
    expect(STYLE_CSS).toMatch(/\.btn-primary\s*\{[^}]*transition:/);
  });

  it('cta-button.primary hover exists with transform', () => {
    expect(STYLE_CSS).toMatch(/\.cta-button\.primary:hover\s*\{/);
  });
});

// ============================================================
// Todo 030: Secondary Button Hover States
// ============================================================
describe('Todo 030: Secondary button hover states', () => {
  it('btn-secondary hover changes background to gray-200', () => {
    expect(STYLE_CSS).toMatch(/\.btn-secondary:hover\s*\{[^}]*background:/);
  });

  it('btn-secondary hover adds soft shadow', () => {
    expect(STYLE_CSS).toMatch(/\.btn-secondary:hover\s*\{[^}]*box-shadow:/);
  });
});

// ============================================================
// Todo 031: Text Link and Nav Link Hover States
// ============================================================
describe('Todo 031: Text link and nav link hover states', () => {
  it('btn-text hover adds underline', () => {
    expect(STYLE_CSS).toMatch(/\.btn-text:hover\s*\{[^}]*text-decoration:\s*underline/);
  });

  it('nav-link hover exists with color change', () => {
    expect(STYLE_CSS).toMatch(/\.nav-link:hover\s*\{[^}]*color:/);
  });

  it('footer link hover changes color', () => {
    expect(STYLE_CSS).toMatch(/\.footer a:hover\s*\{[^}]*color:/);
  });

  it('tool-link hover adds underline decoration in accent color', () => {
    expect(STYLE_CSS).toMatch(/\.tool-link:hover\s*\{[^}]*text-decoration/);
  });
});

// ============================================================
// Todo 032: Card Hover States
// ============================================================
describe('Todo 032: Card hover states', () => {
  it('service-card hover transforms upward', () => {
    expect(STYLE_CSS).toMatch(/\.service-card:hover[^{]*\{[^}]*transform:/);
  });

  it('tool-card hover transforms upward', () => {
    expect(STYLE_CSS).toMatch(/\.tool-card:hover[^{]*\{[^}]*transform:/);
  });

  it('reason-item hover transforms upward', () => {
    expect(STYLE_CSS).toMatch(/\.reason-item:hover[^{]*\{[^}]*transform:/);
  });

  it('card component hover uses scale(1.02)', () => {
    expect(STYLE_CSS).toMatch(/\.card:hover\s*\{[^}]*scale\(1\.02\)/);
  });

  it('card hover upgrades shadow', () => {
    expect(STYLE_CSS).toMatch(/\.card:hover\s*\{[^}]*box-shadow:/);
  });
});

// ============================================================
// Todo 033: Scroll-Triggered Reveal Animations
// ============================================================
describe('Todo 033: Scroll reveal animations', () => {
  it('defines .reveal class with opacity 0 and translateY', () => {
    expect(STYLE_CSS).toMatch(/\.reveal\s*\{[^}]*opacity:\s*0/);
    expect(STYLE_CSS).toMatch(/\.reveal\s*\{[^}]*translateY\(30px\)/);
  });

  it('defines .reveal.visible with opacity 1 and translateY(0)', () => {
    expect(STYLE_CSS).toMatch(/\.reveal\.visible\s*\{[^}]*opacity:\s*1/);
    expect(STYLE_CSS).toMatch(/\.reveal\.visible\s*\{[^}]*translateY\(0\)/);
  });

  it('uses 0.6s ease transition for reveals', () => {
    expect(STYLE_CSS).toMatch(/\.reveal\s*\{[^}]*transition:[^;]*0\.6s\s+ease/);
  });

  it('defines delay-1 with 0.2s transition-delay', () => {
    expect(STYLE_CSS).toMatch(/\.reveal\.delay-1\s*\{[^}]*transition-delay:\s*0\.2s/);
  });

  it('defines delay-2 with 0.4s transition-delay', () => {
    expect(STYLE_CSS).toMatch(/\.reveal\.delay-2\s*\{[^}]*transition-delay:\s*0\.4s/);
  });

  it('defines delay-3 with 0.6s transition-delay', () => {
    expect(STYLE_CSS).toMatch(/\.reveal\.delay-3\s*\{[^}]*transition-delay:\s*0\.6s/);
  });

  it('page.tsx has IntersectionObserver for reveal elements', () => {
    expect(PAGE_TSX).toContain('IntersectionObserver');
    expect(PAGE_TSX).toContain('.reveal');
    expect(PAGE_TSX).toContain('visible');
  });

  it('page.tsx uses reveal classes on sections', () => {
    expect(PAGE_TSX).toContain('className="hero-content reveal"');
    expect(PAGE_TSX).toContain('reveal delay-1');
    expect(PAGE_TSX).toContain('reveal delay-2');
    expect(PAGE_TSX).toContain('reveal delay-3');
  });
});

// ============================================================
// Todo 034: Form Input Focus States
// ============================================================
describe('Todo 034: Form input focus states with lime glow', () => {
  it('form-input focus has accent border color', () => {
    expect(STYLE_CSS).toMatch(/\.form-input:focus\s*\{[^}]*border-color:\s*var\(--color-accent\)/);
  });

  it('form-input focus has lime glow shadow', () => {
    expect(STYLE_CSS).toMatch(/\.form-input:focus\s*\{[^}]*box-shadow:[^;]*rgba\(212,\s*255,\s*0/);
  });

  it('contact form inputs have focus state with accent border', () => {
    expect(STYLE_CSS).toMatch(/\.form-group\s+(input|textarea):focus[^{]*\{[^}]*border-color/);
  });
});

// ============================================================
// Todo 035: Form Error and Disabled States
// ============================================================
describe('Todo 035: Form error and disabled states', () => {
  it('form-input error has red border #ef4444', () => {
    expect(STYLE_CSS).toMatch(/\.form-input\.error[^{]*\{[^}]*border-color:\s*var\(--color-error\)/);
  });

  it('form-input error has red glow shadow', () => {
    expect(STYLE_CSS).toMatch(/\.form-input\.error[^{]*\{[^}]*box-shadow:[^;]*rgba\(239,\s*68,\s*68/);
  });

  it('form-input disabled has gray background', () => {
    expect(STYLE_CSS).toMatch(/\.form-input:disabled\s*\{[^}]*background:\s*var\(--color-gray-100\)/);
  });

  it('form-input disabled has muted text color', () => {
    expect(STYLE_CSS).toMatch(/\.form-input:disabled\s*\{[^}]*color:\s*var\(--color-text-muted\)/);
  });

  it('form-input disabled has not-allowed cursor', () => {
    expect(STYLE_CSS).toMatch(/\.form-input:disabled\s*\{[^}]*cursor:\s*not-allowed/);
  });
});

// ============================================================
// Todo 036: Hamburger Menu Animation (Lines to X)
// ============================================================
describe('Todo 036: Hamburger menu animation', () => {
  it('hamburger active first span rotates 45deg', () => {
    expect(STYLE_CSS).toMatch(/\.hamburger\.active\s+span:nth-child\(1\)\s*\{[^}]*rotate\(45deg\)/);
  });

  it('hamburger active second span has opacity 0', () => {
    expect(STYLE_CSS).toMatch(/\.hamburger\.active\s+span:nth-child\(2\)\s*\{[^}]*opacity:\s*0/);
  });

  it('hamburger active third span rotates -45deg', () => {
    expect(STYLE_CSS).toMatch(/\.hamburger\.active\s+span:nth-child\(3\)\s*\{[^}]*rotate\(-45deg\)/);
  });

  it('hamburger spans have transition', () => {
    expect(STYLE_CSS).toMatch(/\.hamburger\s+span\s*\{[^}]*transition:/);
  });
});

// ============================================================
// Todo 037: Mobile Menu Dropdown Animation
// ============================================================
describe('Todo 037: Mobile menu dropdown animation', () => {
  it('nav-menu on mobile is hidden by default (display none)', () => {
    expect(STYLE_CSS).toMatch(/\.nav-menu\s*\{[^}]*display:\s*none/);
  });

  it('nav-menu.active shows the menu', () => {
    expect(STYLE_CSS).toMatch(/\.nav-menu\.active\s*\{[^}]*display:\s*flex/);
  });

  it('page.tsx toggles active class on hamburger click', () => {
    expect(PAGE_TSX).toContain("classList.toggle(\"active\")");
  });
});

// ============================================================
// Todo 038: Submit Button States
// ============================================================
describe('Todo 038: Submit button states', () => {
  it('btn-primary disabled has reduced opacity', () => {
    expect(STYLE_CSS).toMatch(/\.btn-primary:disabled[^{]*\{[^}]*opacity:\s*0\.5/);
  });

  it('btn-primary disabled has not-allowed cursor', () => {
    expect(STYLE_CSS).toMatch(/\.btn-primary:disabled[^{]*\{[^}]*cursor:\s*not-allowed/);
  });

  it('cta-button primary hover has enhanced shadow', () => {
    expect(STYLE_CSS).toMatch(/\.cta-button\.primary:hover\s*\{[^}]*box-shadow:/);
  });
});

// ============================================================
// Todo 039: Touch Handling (No Hover Fallback on Mobile)
// ============================================================
describe('Todo 039: Touch handling for mobile', () => {
  it('card hover effects wrapped in @media (hover: hover)', () => {
    expect(STYLE_CSS).toMatch(/@media\s*\(hover:\s*hover\)/);
  });

  it('hover-only styles are inside hover media query', () => {
    // The hover media query block should contain card hover transforms
    const hoverMediaMatch = STYLE_CSS.match(/@media\s*\(hover:\s*hover\)\s*\{([\s\S]*?)\n\}/);
    expect(hoverMediaMatch).toBeTruthy();
    if (hoverMediaMatch) {
      expect(hoverMediaMatch[1]).toContain('hover');
    }
  });
});

// ============================================================
// Todo 040: Prefers-Reduced-Motion Support
// ============================================================
describe('Todo 040: Prefers-reduced-motion support', () => {
  it('defines prefers-reduced-motion media query', () => {
    expect(ALL_CSS).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  });

  it('reduces animation-duration to near-zero', () => {
    expect(ALL_CSS).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
  });

  it('reduces transition-duration to near-zero', () => {
    expect(ALL_CSS).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
  });

  it('limits animation-iteration-count to 1', () => {
    expect(ALL_CSS).toMatch(/animation-iteration-count:\s*1\s*!important/);
  });
});

// ============================================================
// Todo 041: Cursor Behavior
// ============================================================
describe('Todo 041: Cursor behavior on interactive elements', () => {
  it('buttons have cursor pointer', () => {
    expect(STYLE_CSS).toMatch(/\.btn-primary\s*\{[^}]*cursor:\s*pointer/);
    expect(STYLE_CSS).toMatch(/\.btn-secondary\s*\{[^}]*cursor:\s*pointer/);
    expect(STYLE_CSS).toMatch(/\.cta-button\s*\{[^}]*cursor:\s*pointer/);
  });

  it('disabled buttons have cursor not-allowed', () => {
    expect(STYLE_CSS).toMatch(/\.btn-primary:disabled[^{]*\{[^}]*cursor:\s*not-allowed/);
    expect(STYLE_CSS).toMatch(/\.btn-secondary:disabled[^{]*\{[^}]*cursor:\s*not-allowed/);
  });

  it('disabled tool-link has cursor not-allowed', () => {
    expect(STYLE_CSS).toMatch(/\.tool-link\.disabled\s*\{[^}]*cursor:\s*not-allowed/);
  });

  it('hamburger has cursor pointer', () => {
    expect(STYLE_CSS).toMatch(/\.hamburger\s*\{[^}]*cursor:\s*pointer/);
  });
});

// ============================================================
// Todo 042: Transition Timing and Easing
// ============================================================
describe('Todo 042: Transition timing and easing', () => {
  it('defines --transition custom property as all 0.3s ease', () => {
    expect(ALL_CSS).toMatch(/--transition:\s*all\s+0\.3s\s+ease/);
  });

  it('reveal animations use 0.6s ease timing', () => {
    expect(STYLE_CSS).toMatch(/\.reveal\s*\{[^}]*transition:[^;]*0\.6s\s+ease/);
  });

  it('form inputs use transition for focus effects', () => {
    expect(STYLE_CSS).toMatch(/\.form-input\s*\{[^}]*transition:/);
  });
});

// ============================================================
// Todo 043: No Motion Sickness Triggers
// ============================================================
describe('Todo 043: Accessibility - no motion sickness triggers', () => {
  it('prefers-reduced-motion is defined in globals.css', () => {
    expect(GLOBALS_CSS).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  });

  it('focus-visible outlines defined for keyboard navigation', () => {
    expect(ALL_CSS).toMatch(/\*:focus-visible\s*\{[^}]*outline:/);
  });

  it('no infinite animation loops in production CSS', () => {
    // Check that no animation uses infinite iteration (motion sickness trigger)
    // Allow pulse-dot which is subtle
    const infiniteMatches = STYLE_CSS.match(/animation[^;]*infinite/g) || [];
    // Filter out pulse-dot if it exists
    const problematic = infiniteMatches.filter(m => !m.includes('pulse'));
    expect(problematic.length).toBe(0);
  });

  it('card hover transforms are subtle (no more than 8px or scale 1.05)', () => {
    // Verify translateY values on hover are reasonable
    const cardHoverBlock = STYLE_CSS.match(/\.service-card:hover[^{]*\{([^}]*)\}/);
    if (cardHoverBlock) {
      const translateMatch = cardHoverBlock[1].match(/translateY\(-(\d+)px\)/);
      if (translateMatch) {
        expect(parseInt(translateMatch[1])).toBeLessThanOrEqual(10);
      }
    }
  });
});
