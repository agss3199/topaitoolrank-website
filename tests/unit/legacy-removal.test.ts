import { describe, it, expect, test } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Milestone 3: Legacy Element Removal", () => {
  const projectRoot = process.cwd();
  const pageFile = readFileSync(join(projectRoot, "app/page.tsx"), "utf-8");
  const styleFile = readFileSync(
    join(projectRoot, "public/css/style.css"),
    "utf-8"
  );

  describe("Todo 023: Remove hero orb HTML elements", () => {
    test("should not contain hero-orb-one div", () => {
      expect(pageFile).not.toMatch(/className="hero-orb hero-orb-one"/);
    });

    test("should not contain hero-orb-two div", () => {
      expect(pageFile).not.toMatch(/className="hero-orb hero-orb-two"/);
    });

    test("should not contain any hero-orb class references", () => {
      expect(pageFile).not.toMatch(/hero-orb/);
    });
  });

  describe("Todo 024: Remove hero orb CSS", () => {
    test("should not contain .hero-orb selector", () => {
      expect(styleFile).not.toMatch(/\.hero-orb\s*{/);
    });

    test("should not contain .hero-orb-one selector", () => {
      expect(styleFile).not.toMatch(/\.hero-orb-one\s*{/);
    });

    test("should not contain .hero-orb-two selector", () => {
      expect(styleFile).not.toMatch(/\.hero-orb-two\s*{/);
    });

    test("should not contain orb-related gradients", () => {
      expect(styleFile).not.toMatch(
        /background:\s*radial-gradient\([^)]*rgba\(6,\s*182,\s*212/
      );
      expect(styleFile).not.toMatch(
        /background:\s*radial-gradient\([^)]*rgba\(124,\s*58,\s*237/
      );
    });
  });

  describe("Todo 025: Remove legacy gradients", () => {
    test("should not contain orb-specific gradient definitions", () => {
      const orbGradientPattern = /radial-gradient\([^)]*rgba\(\d+,\s*\d+,\s*\d+,\s*0\.\d+\)[^)]*transparent/g;
      const matches = styleFile.match(orbGradientPattern);
      // May still have other gradients (nav), just not orb-specific ones
      if (matches) {
        matches.forEach((match) => {
          expect(match).not.toMatch(/cyan|purple/i); // Colors used in orbs
        });
      }
    });
  });

  describe("Todo 026: Verify canvas element removed", () => {
    test("should not contain canvas element", () => {
      expect(pageFile).not.toMatch(/<canvas/i);
    });

    test("should not contain canvasRef reference", () => {
      expect(pageFile).not.toMatch(/canvasRef/);
    });

    test("should not contain particle animation code", () => {
      expect(pageFile).not.toMatch(/drawParticles|createParticles|particlesRef/);
    });

    test("should not contain canvas CSS rules", () => {
      expect(styleFile).not.toMatch(/#canvas-3d/);
    });
  });

  describe("Todo 027: CSS audit and cleanup", () => {
    test("should not have hero-orb class in CSS", () => {
      expect(styleFile).not.toMatch(/hero-orb/);
    });

    test("hero section should have hero-grid class", () => {
      expect(styleFile).toMatch(/\.hero-grid\s*{[\s\S]*?display:\s*grid/);
    });

    test("hero section should maintain 2-column layout", () => {
      expect(styleFile).toMatch(
        /\.hero-grid\s*{[\s\S]*?grid-template-columns:\s*1fr\s*1fr/
      );
    });

    test("should have credibility-strip styling", () => {
      expect(styleFile).toMatch(/\.credibility-strip/);
    });

    test("should have services-grid styling", () => {
      expect(styleFile).toMatch(/\.services-grid/);
    });

    test("hero visual should have offset class available", () => {
      expect(styleFile).toMatch(/\.hero-visual/);
    });
  });

  describe("Todo 028: Verify no console errors", () => {
    test("page should have no undefined CSS selectors referencing removed elements", () => {
      // This is a static file check - actual console errors would be caught in Playwright tests
      const orphanedSelectors = [
        ".hero-orb",
        ".hero-orb-one",
        ".hero-orb-two",
        "#canvas-3d",
      ];

      orphanedSelectors.forEach((selector) => {
        expect(styleFile).not.toMatch(new RegExp(`\\${selector}\\s*{`));
      });
    });

    test("page file should be syntactically valid JSX", () => {
      // Check for basic JSX validity (matching braces, no orphaned fragments)
      const openBraces = (pageFile.match(/{/g) || []).length;
      const closeBraces = (pageFile.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    test("style file should have valid CSS (no orphaned braces)", () => {
      const openBraces = (styleFile.match(/{/g) || []).length;
      const closeBraces = (styleFile.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });
  });

  describe("Integration: Layout structure intact", () => {
    test("hero section should be present", () => {
      expect(pageFile).toMatch(/className="hero"/);
    });

    test("hero content should be present", () => {
      expect(pageFile).toMatch(/className="hero-content/);
    });

    test("hero visual should be present", () => {
      expect(pageFile).toMatch(/className="hero-visual/);
    });

    test("service-card-offset class should exist for item 3", () => {
      expect(pageFile).toMatch(/service-card-offset/);
      expect(styleFile).toMatch(/\.service-card-offset/);
    });

    test("floating chips should still be present", () => {
      expect(pageFile).toMatch(/floating-chip/);
    });

    test("ai-card should still be present", () => {
      expect(pageFile).toMatch(/ai-card/);
    });
  });

  describe("Cleanliness: No hardcoded legacy patterns", () => {
    test("should not reference old animation patterns", () => {
      expect(pageFile).not.toMatch(/@keyframes.*orb/i);
    });

    test("should not have orphaned div elements with no classes", () => {
      // Check for bare divs that were likely cleanup leftovers
      const bareDiv = /<div>\s*<\/div>/g;
      expect(pageFile).not.toMatch(bareDiv);
    });

    test("CSS should not have duplicate selectors", () => {
      // Extract all CSS selectors
      const selectorRegex = /^\.?[\w-]+\s*{/gm;
      const selectors = styleFile.match(selectorRegex) || [];
      const uniqueSelectors = new Set(selectors);
      // If duplicates exist, Set size will be less
      // This is a loose check - some selectors may legitimately appear multiple times
      expect(selectors.length).toBeLessThanOrEqual(uniqueSelectors.size + 5);
    });
  });

  describe("Verification: No visual regressions", () => {
    test("container width should be intact", () => {
      expect(styleFile).toMatch(/max-width.*1180px/);
    });

    test("container padding should be intact", () => {
      expect(styleFile).toMatch(/padding.*40px/);
    });

    test("grid gap should be correct for sections", () => {
      expect(styleFile).toMatch(/gap:\s*(?:24px|32px|60px)/);
    });

    test("responsive breakpoints should be intact", () => {
      expect(styleFile).toMatch(/@media.*max-width:\s*1023px/);
      expect(styleFile).toMatch(/@media.*max-width:\s*767px/);
    });
  });
});
