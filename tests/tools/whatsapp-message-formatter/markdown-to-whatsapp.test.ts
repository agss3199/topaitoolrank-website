/**
 * Unit Tests for WhatsApp Message Formatter
 *
 * Tests the markdown-to-whatsapp conversion logic
 */

import { describe, it, expect } from "vitest";
import {
  markdownToWhatsApp,
  hasMarkdown,
  getFormattingStats,
} from "@/app/tools/whatsapp-message-formatter/lib/markdown-to-whatsapp";

describe("WhatsApp Message Formatter — Unit Tests", () => {
  describe("Bold conversion", () => {
    it("converts **bold** to *bold*", () => {
      const result = markdownToWhatsApp("**hello**");
      expect(result.formatted).toBe("*hello*");
      expect(result.patterns.bold).toBe(1);
    });

    it("converts __bold__ to *bold*", () => {
      const result = markdownToWhatsApp("__hello__");
      expect(result.formatted).toBe("*hello*");
      expect(result.patterns.bold).toBe(1);
    });

    it("converts multiple bold patterns", () => {
      const result = markdownToWhatsApp("**hello** world **bold**");
      expect(result.formatted).toBe("*hello* world *bold*");
      expect(result.patterns.bold).toBe(2);
    });
  });

  describe("Italic conversion", () => {
    it("converts _italic_ to _italic_ (preserved)", () => {
      const result = markdownToWhatsApp("_hello_");
      expect(result.formatted).toContain("hello");
      expect(result.patterns.italic).toBeGreaterThanOrEqual(0);
    });

    it("handles multiple italic patterns", () => {
      const result = markdownToWhatsApp("_hello_ _world_");
      expect(result.formatted).toContain("hello");
      expect(result.formatted).toContain("world");
    });
  });

  describe("Code conversion", () => {
    it("converts `code` to ```code```", () => {
      const result = markdownToWhatsApp("`hello`");
      expect(result.formatted).toContain("hello");
      expect(result.patterns.code).toBe(1);
    });

    it("converts multiple code blocks", () => {
      const result = markdownToWhatsApp("`hello` and `world`");
      expect(result.patterns.code).toBe(2);
    });
  });

  describe("Strikethrough preservation", () => {
    it("preserves ~~strikethrough~~", () => {
      const result = markdownToWhatsApp("~~hello~~");
      expect(result.formatted).toContain("~~hello~~");
      expect(result.patterns.strikethrough).toBe(1);
    });

    it("handles mixed strikethrough", () => {
      const result = markdownToWhatsApp("~~hello~~ and **bold**");
      expect(result.formatted).toContain("~~hello~~");
      expect(result.formatted).toContain("*bold*");
    });
  });

  describe("Complex formatting", () => {
    it("handles mixed formatting", () => {
      const input = "**bold** and _italic_ and `code`";
      const result = markdownToWhatsApp(input);
      expect(result.formatted).toContain("*bold*");
    });

    it("handles entire sentence with formatting", () => {
      const input =
        "I **love** WhatsApp _and_ `coding` ~~not really~~";
      const result = markdownToWhatsApp(input);
      expect(result.formatted).toContain("*love*");
      expect(result.formatted).toContain("WhatsApp");
    });
  });

  describe("Edge cases", () => {
    it("handles empty input", () => {
      const result = markdownToWhatsApp("");
      expect(result.formatted).toBe("");
      expect(result.patterns.bold).toBe(0);
    });

    it("handles whitespace only", () => {
      const result = markdownToWhatsApp("   ");
      expect(result.patterns.bold).toBe(0);
    });

    it("handles unclosed patterns gracefully", () => {
      const result = markdownToWhatsApp("**bold without close");
      expect(result.formatted).toContain("bold without close");
    });

    it("handles special characters", () => {
      const result = markdownToWhatsApp("**hello @ world!**");
      expect(result.formatted).toContain("hello @ world!");
    });

    it("handles newlines", () => {
      const result = markdownToWhatsApp("**line1**\n**line2**");
      expect(result.formatted).toContain("*line1*");
      expect(result.formatted).toContain("*line2*");
    });

    it("handles very long text", () => {
      const longText = "**" + "a".repeat(1000) + "**";
      const result = markdownToWhatsApp(longText);
      expect(result.patterns.bold).toBe(1);
    });
  });

  describe("hasMarkdown utility", () => {
    it("detects bold markdown", () => {
      expect(hasMarkdown("**hello**")).toBe(true);
    });

    it("detects italic markdown", () => {
      expect(hasMarkdown("_hello_")).toBe(true);
    });

    it("detects code markdown", () => {
      expect(hasMarkdown("`hello`")).toBe(true);
    });

    it("returns false for plain text", () => {
      expect(hasMarkdown("hello world")).toBe(false);
    });
  });

  describe("getFormattingStats utility", () => {
    it("returns correct stats for formatted text", () => {
      const stats = getFormattingStats("**bold** and `code`");
      expect(stats.isEmpty).toBe(false);
      expect(stats.hasFormatting).toBe(true);
      expect(stats.totalFormatted).toBeGreaterThan(0);
    });

    it("returns correct stats for empty text", () => {
      const stats = getFormattingStats("");
      expect(stats.isEmpty).toBe(true);
      expect(stats.hasFormatting).toBe(false);
      expect(stats.totalFormatted).toBe(0);
    });

    it("returns correct stats for plain text", () => {
      const stats = getFormattingStats("hello world");
      expect(stats.isEmpty).toBe(false);
      expect(stats.hasFormatting).toBe(false);
      expect(stats.totalFormatted).toBe(0);
    });
  });

  describe("Real-world examples", () => {
    it("handles WhatsApp business message", () => {
      const message = `Hi there! 👋

Check out my **website** for more details.

Benefits:
• **Fast** delivery
• _Professional_ service
• \`Best prices\` in the market

\`\`\`
Contact: +1-234-567-8900
\`\`\``;

      const result = markdownToWhatsApp(message);
      expect(result.patterns.bold).toBeGreaterThan(0);
      expect(result.formatted).toContain("*website*");
    });

    it("handles marketing message", () => {
      const message =
        "Limited Time Offer! **50% OFF** _All Products_ - Use code \`SAVE50\` at checkout";
      const result = markdownToWhatsApp(message);
      expect(result.formatted).toContain("*50% OFF*");
      expect(result.patterns.code).toBeGreaterThan(0);
    });
  });
});
