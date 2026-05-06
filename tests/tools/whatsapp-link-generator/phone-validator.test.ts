/**
 * Unit tests for WhatsApp Link Generator phone validator
 */

import { validatePhoneNumber } from "@/app/tools/whatsapp-link-generator/lib/phone-validator";

describe("validatePhoneNumber", () => {
  describe("Valid phone numbers", () => {
    it("accepts +1 format with full number", () => {
      const result = validatePhoneNumber("+1 (234) 567-8900");
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe("+12345678900");
    });

    it("accepts +91 format (India)", () => {
      const result = validatePhoneNumber("+91 9876 543210");
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe("+919876543210");
    });

    it("accepts +44 format (UK)", () => {
      const result = validatePhoneNumber("+44 7911 123456");
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe("+447911123456");
    });

    it("accepts pure digits with country code", () => {
      const result = validatePhoneNumber("+12025551234");
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe("+12025551234");
    });

    it("accepts 7-digit minimum", () => {
      const result = validatePhoneNumber("+1 234567");
      expect(result.valid).toBe(true);
    });

    it("accepts 15-digit maximum", () => {
      const result = validatePhoneNumber("+1 123456789012345");
      expect(result.valid).toBe(true);
    });

    it("removes all formatting characters", () => {
      const result = validatePhoneNumber("+1-(234)-567.8900");
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe("+12345678900");
    });

    it("accepts spaces in middle of number", () => {
      const result = validatePhoneNumber("+1 234 567 8900");
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe("+12345678900");
    });
  });

  describe("Invalid phone numbers", () => {
    it("rejects numbers without country code", () => {
      const result = validatePhoneNumber("(234) 567-8900");
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("rejects too few digits", () => {
      const result = validatePhoneNumber("+1 23456");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("7-15");
    });

    it("rejects too many digits", () => {
      const result = validatePhoneNumber("+1 1234567890123456");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("7-15");
    });

    it("rejects leading zero after country code", () => {
      const result = validatePhoneNumber("+1 01234567890");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("leading zero");
    });

    it("rejects empty string", () => {
      const result = validatePhoneNumber("");
      expect(result.valid).toBe(false);
    });

    it("rejects only spaces", () => {
      const result = validatePhoneNumber("   ");
      expect(result.valid).toBe(false);
    });

    it("rejects invalid characters (letters)", () => {
      const result = validatePhoneNumber("+1 (234) 567-ABC0");
      expect(result.valid).toBe(false);
    });

    it("rejects number without plus sign", () => {
      const result = validatePhoneNumber("1 (234) 567-8900");
      expect(result.valid).toBe(false);
    });

    it("rejects +0 format", () => {
      const result = validatePhoneNumber("+0 1234567890");
      expect(result.valid).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("handles multiple spaces", () => {
      const result = validatePhoneNumber("+1    234    567    8900");
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe("+12345678900");
    });

    it("handles mixed formatting", () => {
      const result = validatePhoneNumber("+91 (98765)-43210");
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe("+919876543210");
    });

    it("preserves country code regardless of formatting", () => {
      const result = validatePhoneNumber("+1-234-567-8900");
      expect(result.valid).toBe(true);
      expect(result.formatted.startsWith("+1")).toBe(true);
    });

    it("handles numbers from different regions", () => {
      const numbers = [
        "+1 (415) 555-0132", // US
        "+44 20 7946 0958", // UK
        "+86 138 0000 0000", // China
        "+81 3-XXXX-XXXX", // Japan (will fail on letters)
      ];

      expect(validatePhoneNumber(numbers[0]).valid).toBe(true);
      expect(validatePhoneNumber(numbers[1]).valid).toBe(true);
      expect(validatePhoneNumber(numbers[2]).valid).toBe(true);
      expect(validatePhoneNumber(numbers[3]).valid).toBe(false); // Letters not allowed
    });
  });
});
