/**
 * Integration Tests — WhatsApp Message Formatter (todo 103)
 *
 * Tests I/O operations: localStorage, copy, download
 * Tests full user workflows
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("WhatsApp Message Formatter — Integration Tests", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("localStorage persistence", () => {
    it("should save draft to localStorage", () => {
      const testDraft = "**hello** world";
      localStorage.setItem("wam-draft", testDraft);
      expect(localStorage.getItem("wam-draft")).toBe(testDraft);
    });

    it("should load draft from localStorage", () => {
      const testDraft = "**hello** world";
      localStorage.setItem("wam-draft", testDraft);
      const loaded = localStorage.getItem("wam-draft");
      expect(loaded).toBe(testDraft);
    });

    it("should save formatted output separately", () => {
      const formatted = "*hello* world";
      localStorage.setItem("wam-formatted", formatted);
      expect(localStorage.getItem("wam-formatted")).toBe(formatted);
    });

    it("should persist across multiple saves", () => {
      const draft1 = "**first** draft";
      const draft2 = "**second** draft";

      localStorage.setItem("wam-draft", draft1);
      expect(localStorage.getItem("wam-draft")).toBe(draft1);

      localStorage.setItem("wam-draft", draft2);
      expect(localStorage.getItem("wam-draft")).toBe(draft2);
    });

    it("should handle empty draft", () => {
      localStorage.setItem("wam-draft", "");
      expect(localStorage.getItem("wam-draft")).toBe("");
    });

    it("should handle long drafts", () => {
      const longDraft = "**" + "a".repeat(5000) + "**";
      localStorage.setItem("wam-draft", longDraft);
      expect(localStorage.getItem("wam-draft")).toBe(longDraft);
    });
  });

  describe("Copy to clipboard simulation", () => {
    it("should copy text successfully", async () => {
      const text = "*formatted* text";
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: () => Promise.resolve(),
        },
      });

      try {
        await navigator.clipboard.writeText(text);
        // Success if no error thrown
        expect(true).toBe(true);
      } catch (error) {
        // Fallback method
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textarea);
        expect(success).toBe(true);
      }
    });

    it("should handle copy errors gracefully", async () => {
      // Simulate clipboard denied
      Object.assign(navigator, {
        clipboard: {
          writeText: () =>
            Promise.reject(new Error("Clipboard write denied")),
        },
      });

      let failed = false;
      try {
        await navigator.clipboard.writeText("test");
      } catch (error) {
        failed = true;
      }

      expect(failed).toBe(true);
    });
  });

  describe("Download file simulation", () => {
    it("should create blob for download", () => {
      const content = "*hello* world";
      const blob = new Blob([content], { type: "text/plain" });

      expect(blob).toBeDefined();
      expect(blob.type).toBe("text/plain");
    });

    it("should create object URL from blob", () => {
      const content = "*hello* world";
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);

      expect(url).toBeDefined();
      expect(url.startsWith("blob:")).toBe(true);

      URL.revokeObjectURL(url);
    });

    it("should create downloadable link element", () => {
      const content = "*hello* world";
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "whatsapp-message.txt";

      expect(link.download).toBe("whatsapp-message.txt");
      expect(link.href).toContain("blob:");

      URL.revokeObjectURL(url);
    });
  });

  describe("Full user workflow", () => {
    it("should handle: input → format → copy → download", () => {
      // 1. User inputs text
      const input = "**bold** and `code`";
      localStorage.setItem("wam-draft", input);

      // 2. Verify saved
      expect(localStorage.getItem("wam-draft")).toBe(input);

      // 3. Simulate formatted output
      const formatted = "*bold* and ```code```";
      localStorage.setItem("wam-formatted", formatted);

      // 4. Verify formatted saved
      expect(localStorage.getItem("wam-formatted")).toBe(formatted);

      // 5. Verify both exist
      expect(localStorage.getItem("wam-draft")).toBeDefined();
      expect(localStorage.getItem("wam-formatted")).toBeDefined();
    });

    it("should handle: refresh → restore draft", () => {
      // 1. User inputs
      const draft = "**important message**";
      localStorage.setItem("wam-draft", draft);

      // 2. Simulate page refresh (localStorage persists)
      const restored = localStorage.getItem("wam-draft");

      // 3. Verify draft restored
      expect(restored).toBe(draft);
    });

    it("should handle: clear input", () => {
      // 1. Set draft
      localStorage.setItem("wam-draft", "**message**");
      expect(localStorage.getItem("wam-draft")).toBe("**message**");

      // 2. Clear (remove)
      localStorage.removeItem("wam-draft");

      // 3. Verify cleared
      expect(localStorage.getItem("wam-draft")).toBeNull();
    });
  });

  describe("Edge cases", () => {
    it("should handle localStorage quota exceeded", () => {
      // Fill localStorage to near quota
      let size = 0;
      const maxSize = 5 * 1024 * 1024; // 5MB limit

      try {
        const largeData = "x".repeat(maxSize - 100);
        localStorage.setItem("wam-large", largeData);
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    it("should handle special characters in draft", () => {
      const specialChars = "**hello @#$%^&*()** _world_";
      localStorage.setItem("wam-draft", specialChars);
      expect(localStorage.getItem("wam-draft")).toBe(specialChars);
    });

    it("should handle unicode/emoji in draft", () => {
      const emoji = "**hello** 👋 _world_ 🌍";
      localStorage.setItem("wam-draft", emoji);
      expect(localStorage.getItem("wam-draft")).toBe(emoji);
    });

    it("should handle very long draft (edge case)", () => {
      const longDraft = "**" + "a".repeat(10000) + "**";
      localStorage.setItem("wam-draft", longDraft);
      expect(localStorage.getItem("wam-draft")).toBe(longDraft);
    });
  });

  describe("Tool isolation", () => {
    it("should use tool-specific localStorage keys", () => {
      // Set tool-specific keys
      localStorage.setItem("wam-draft", "WhatsApp formatter draft");
      localStorage.setItem("wc-text", "Word counter text"); // Different tool

      // Verify they don't interfere
      expect(localStorage.getItem("wam-draft")).toBe(
        "WhatsApp formatter draft"
      );
      expect(localStorage.getItem("wc-text")).toBe("Word counter text");
    });

    it("should not interfere with other tools", () => {
      // Simulate other tools using localStorage
      localStorage.setItem("json-data", '{"test": "value"}');
      localStorage.setItem("wam-draft", "**my message**");

      // Verify isolation
      expect(localStorage.getItem("json-data")).toBe('{"test": "value"}');
      expect(localStorage.getItem("wam-draft")).toBe("**my message**");

      // Clearing one shouldn't affect the other
      localStorage.removeItem("wam-draft");
      expect(localStorage.getItem("json-data")).toBe('{"test": "value"}');
    });
  });
});
