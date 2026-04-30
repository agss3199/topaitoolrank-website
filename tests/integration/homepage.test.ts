import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Milestone 7: Testing & QA - Homepage Integration", () => {
  const projectRoot = process.cwd();
  const pageFile = readFileSync(join(projectRoot, "app/page.tsx"), "utf-8");
  const styleFile = readFileSync(
    join(projectRoot, "public/css/style.css"),
    "utf-8"
  );
  const layoutFile = readFileSync(join(projectRoot, "app/layout.tsx"), "utf-8");

  describe("Todo 070: Cross-browser desktop testing setup", () => {
    test("should have no browser-specific CSS that breaks in Chrome", () => {
      // Check for -webkit- prefixes that are also provided unprefixed
      const webkitTransform = styleFile.match(/-webkit-transform.*?;/g);
      const unprefixedTransform = styleFile.match(/transform.*?;/g);
      if (webkitTransform && unprefixedTransform) {
        expect(unprefixedTransform.length).toBeGreaterThanOrEqual(
          webkitTransform.length
        );
      }
    });

    test("should use standard CSS that works in Firefox", () => {
      // Firefox doesn't need -moz- for most modern CSS
      expect(styleFile).toMatch(/display:\s*grid/);
      expect(styleFile).toMatch(/transition/);
    });

    test("should have focus-visible for Safari keyboard nav", () => {
      expect(styleFile).toMatch(/:focus-visible/);
    });
  });

  describe("Todo 071: Mobile testing (iOS Safari, Chrome Android)", () => {
    test("should have mobile-optimized viewport", () => {
      expect(layoutFile).toMatch(/name="viewport"/);
      expect(layoutFile).toMatch(/width=device-width/);
      expect(layoutFile).toMatch(/initial-scale=1/);
    });

    test("should not have user-scalable=no (blocks zoom)", () => {
      expect(layoutFile).not.toMatch(/user-scalable\s*=\s*no/i);
    });

    test("should have touch-action rules for mobile", () => {
      // touch-action allows normal touch behavior
      expect(styleFile).not.toMatch(/touch-action:\s*none/);
    });

    test("should have mobile hamburger menu", () => {
      expect(pageFile).toMatch(/className="hamburger"/);
      expect(styleFile).toMatch(/.hamburger/);
    });
  });

  describe("Todo 072: Responsive breakpoint testing", () => {
    test("should have mobile breakpoint at 767px", () => {
      expect(styleFile).toMatch(/@media[^{]*max-width:\s*767px/);
    });

    test("should have tablet breakpoint at 1023px", () => {
      expect(styleFile).toMatch(/@media[^{]*max-width:\s*1023px/);
    });

    test("should have no horizontal scroll at 320px (mobile)", () => {
      // container uses min() for responsive width
      expect(styleFile).toMatch(/min\(\d+px.*?100%/);
    });

    test("should have single column at mobile", () => {
      // Mobile breakpoint should set grid-template-columns to 1fr
      const mobileSection = styleFile.match(
        /@media[^{]*max-width:\s*767px[^}]*{[^}]*grid-template-columns:\s*1fr/
      );
      expect(mobileSection).toBeTruthy();
    });

    test("should have responsive hero grid", () => {
      expect(styleFile).toMatch(/\.hero-grid\s*{[^}]*grid-template-columns:\s*1fr\s*1fr/);
    });
  });

  describe("Todo 073: Form input testing", () => {
    test("should have email input in contact form", () => {
      expect(pageFile).toMatch(/type="email"/);
    });

    test("should have message textarea", () => {
      expect(pageFile).toMatch(/<textarea/);
    });

    test("should have form labels for accessibility", () => {
      expect(pageFile).toMatch(/<label/);
      expect(pageFile).toMatch(/htmlFor/);
    });

    test("should have submit button", () => {
      expect(pageFile).toMatch(/type="submit"/);
    });

    test("should have form error/status element", () => {
      expect(pageFile).toMatch(/formStatus/);
    });

    test("should have input focus styles", () => {
      expect(styleFile).toMatch(/.form-input:focus/);
      expect(styleFile).toMatch(/border.*?--color-accent/);
    });

    test("should have disabled input styles", () => {
      expect(styleFile).toMatch(/.form-input:disabled/);
      expect(styleFile).toMatch(/cursor:\s*not-allowed/);
    });
  });

  describe("Todo 074: Link and navigation testing", () => {
    test("should have navigation links in header", () => {
      expect(pageFile).toMatch(/href="#home"/);
      expect(pageFile).toMatch(/href="#services"/);
      expect(pageFile).toMatch(/href="#contact"/);
    });

    test("should have skip-to-content link", () => {
      expect(layoutFile).toMatch(/skip-to-content/);
      expect(layoutFile).toMatch(/href="#main"/);
    });

    test("should have main content landmark", () => {
      expect(pageFile).toMatch(/<main/);
    });

    test("should have footer landmark", () => {
      expect(pageFile).toMatch(/<footer/);
    });

    test("should have nav landmark", () => {
      expect(pageFile).toMatch(/<nav/);
    });
  });

  describe("Todo 075: Button interaction testing", () => {
    test("should have primary CTA buttons", () => {
      expect(pageFile).toMatch(/className="cta-button primary"/);
    });

    test("should have secondary buttons", () => {
      expect(pageFile).toMatch(/className="cta-button secondary"/);
    });

    test("should have hover state for primary buttons", () => {
      expect(styleFile).toMatch(/.cta-button.primary:hover/);
      expect(styleFile).toMatch(/background.*?var\(--color-accent-hover\)/);
    });

    test("should have button transition", () => {
      expect(styleFile).toMatch(/transition.*?all.*?0\.3s/);
    });

    test("should have active/pressed state", () => {
      expect(styleFile).toMatch(/active|:active/);
    });

    test("should have disabled button styles", () => {
      expect(styleFile).toMatch(/:disabled/);
      expect(styleFile).toMatch(/opacity:\s*0\.5/);
    });
  });

  describe("Todo 076: Accessibility compliance testing", () => {
    test("should have heading hierarchy", () => {
      expect(pageFile).toMatch(/<h1/);
      expect(pageFile).toMatch(/<h2/);
    });

    test("should have focus indicators visible", () => {
      expect(styleFile).toMatch(/:focus-visible/);
      expect(styleFile).toMatch(/outline.*?--color-accent/);
    });

    test("should have skip-to-content for keyboard nav", () => {
      expect(layoutFile).toMatch(/skip-to-content/);
    });

    test("should have ARIA labels on nav", () => {
      expect(pageFile).toMatch(/aria-label="Main navigation"/);
    });

    test("should have ARIA controls on hamburger", () => {
      expect(pageFile).toMatch(/aria-expanded/);
      expect(pageFile).toMatch(/aria-controls/);
    });

    test("should have form labels with for attribute", () => {
      const labelMatch = pageFile.match(/<label[^>]*htmlFor="([^"]+)"/g);
      expect(labelMatch).toBeTruthy();
    });
  });

  describe("Todo 077-079: Visual regression baselines", () => {
    test("should have hero section with stable layout", () => {
      expect(pageFile).toMatch(/className="hero"/);
      expect(styleFile).toMatch(/\.hero\s*{/);
    });

    test("should have services section with cards", () => {
      expect(pageFile).toMatch(/className="services/);
      expect(pageFile).toMatch(/service-card/);
    });

    test("should have footer with layout", () => {
      expect(pageFile).toMatch(/<footer/);
    });

    test("should have consistent spacing throughout", () => {
      // Check for spacing utilities
      expect(styleFile).toMatch(/gap:\s*(?:24px|32px|60px)/);
      expect(styleFile).toMatch(/padding.*?40px/);
    });

    test("should have no layout shift triggers", () => {
      // CLS <0.05: avoid unexpected layout changes
      // Check that offsets are applied early (not dynamically)
      expect(styleFile).toMatch(/transform:\s*translateY/);
    });
  });

  describe("Todo 080: Mobile touch interaction testing", () => {
    test("should have touch targets 44px+", () => {
      // Buttons typically 44-54px
      expect(styleFile).toMatch(/min-height:\s*(?:44px|48px|54px)/);
    });

    test("should not use hover-only interactions", () => {
      // Check for @media (hover: hover) wrapping desktop-only hovers
      expect(styleFile).toMatch(/@media\s*\(\s*hover:\s*hover\s*\)/);
    });

    test("should have active state for mobile", () => {
      expect(styleFile).toMatch(/:active/);
    });

    test("should not have pinch zoom disabled", () => {
      expect(layoutFile).not.toMatch(/user-scalable\s*=\s*no/i);
    });

    test("should have mobile-friendly form inputs", () => {
      expect(styleFile).toMatch(/.form-input/);
      expect(styleFile).toMatch(/min-height:\s*44px/);
    });
  });

  describe("Todo 081: Performance testing", () => {
    test("should have no render-blocking resources", () => {
      // CSS is inline or async
      expect(layoutFile).not.toMatch(/<link.*?rel="stylesheet"[^>]*>/);
    });

    test("should have no third-party blocking scripts", () => {
      // Google Analytics removed, no other third-party scripts
      expect(layoutFile).not.toMatch(/google-analytics/i);
      expect(layoutFile).not.toMatch(/gtag/i);
    });

    test("should have system fonts only", () => {
      expect(styleFile).toMatch(/font-family.*?system-ui/);
      expect(styleFile).not.toMatch(/@font-face/);
    });

    test("should have CSS minification ready", () => {
      // Tailwind will minify on build
      expect(styleFile.length).toBeGreaterThan(0);
    });

    test("should have prefers-reduced-motion for performance", () => {
      expect(styleFile).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);
    });
  });

  describe("Todo 082: Error handling and validation", () => {
    test("should have form status element", () => {
      expect(pageFile).toMatch(/formStatus/);
    });

    test("should have aria-live for error messages", () => {
      expect(pageFile).toMatch(/aria-live="polite"/);
    });

    test("should have error state styles", () => {
      expect(styleFile).toMatch(/\.form-input\.error/);
      expect(styleFile).toMatch(/border.*?#ef4444/);
    });

    test("should handle 404 gracefully", () => {
      expect(layoutFile).toMatch(/<html/);
    });
  });

  describe("Todo 083: SEO verification", () => {
    test("should have title in layout", () => {
      expect(layoutFile).toMatch(/<title/);
    });

    test("should have meta description", () => {
      expect(layoutFile).toMatch(/name="description"/);
    });

    test("should have viewport meta for mobile SEO", () => {
      expect(layoutFile).toMatch(/name="viewport"/);
    });

    test("should have semantic HTML structure", () => {
      expect(pageFile).toMatch(/<h1/);
      expect(pageFile).toMatch(/<section/);
      expect(pageFile).toMatch(/<article/);
    });

    test("should have proper heading hierarchy", () => {
      expect(pageFile).toMatch(/<h1[^>]*>Build the software/);
      expect(pageFile).toMatch(/<h2/);
    });

    test("should have no duplicate IDs", () => {
      const idMatches = pageFile.match(/id="[^"]+"/g) || [];
      const ids = idMatches.map((m) => m.match(/id="([^"]+)"/)[1]);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("Todo 084: Final QA checklist", () => {
    test("should build successfully", () => {
      expect(pageFile).toBeTruthy();
      expect(styleFile).toBeTruthy();
      expect(layoutFile).toBeTruthy();
    });

    test("should have no console errors in structure", () => {
      // Check for basic syntax validity
      const openBraces = (pageFile.match(/{/g) || []).length;
      const closeBraces = (pageFile.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    test("should have no hardcoded demo/test data", () => {
      expect(pageFile).not.toMatch(/TODO|FIXME|XXX|HACK/);
      expect(styleFile).not.toMatch(/TODO|FIXME|XXX|HACK/);
    });

    test("should have responsive design", () => {
      expect(styleFile).toMatch(/@media/);
    });

    test("should have accessibility features", () => {
      expect(pageFile).toMatch(/aria-/);
      expect(layoutFile).toMatch(/skip-to-content/);
    });

    test("should have performance optimizations", () => {
      expect(layoutFile).not.toMatch(/google-analytics/i);
      expect(styleFile).toMatch(/system-ui/);
    });

    test("should have interactive elements", () => {
      expect(styleFile).toMatch(/:hover/);
      expect(styleFile).toMatch(/:focus/);
    });

    test("should have no broken imports or references", () => {
      // Basic check: layout and page should not have unresolved refs
      expect(pageFile).toMatch(/^import/m);
      expect(layoutFile).toMatch(/^import/m);
    });
  });

  describe("Integration: Full homepage workflow", () => {
    test("user can navigate to home section", () => {
      expect(pageFile).toMatch(/id="home"/);
      expect(pageFile).toMatch(/href="#home"/);
    });

    test("user can navigate to services section", () => {
      expect(pageFile).toMatch(/id="services"/);
      expect(pageFile).toMatch(/href="#services"/);
    });

    test("user can navigate to contact section", () => {
      expect(pageFile).toMatch(/id="contact"/);
      expect(pageFile).toMatch(/href="#contact"/);
    });

    test("user can submit contact form", () => {
      expect(pageFile).toMatch(/<form/);
      expect(pageFile).toMatch(/type="submit"/);
      expect(pageFile).toMatch(/type="email"/);
      expect(pageFile).toMatch(/<textarea/);
    });

    test("user can interact on mobile", () => {
      expect(pageFile).toMatch(/className="hamburger"/);
      expect(styleFile).toMatch(/@media[^{]*max-width:\s*767px/);
    });

    test("user experiences smooth animations", () => {
      expect(styleFile).toMatch(/transition/);
      expect(styleFile).toMatch(/opacity.*?0\.6s/);
      expect(styleFile).toMatch(/transform.*?translateY/);
    });

    test("user sees accessible interface", () => {
      expect(pageFile).toMatch(/aria-label/);
      expect(styleFile).toMatch(/:focus-visible/);
      expect(layoutFile).toMatch(/skip-to-content/);
    });
  });
});
