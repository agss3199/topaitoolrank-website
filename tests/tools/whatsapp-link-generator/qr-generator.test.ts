/**
 * Unit tests for WhatsApp Link Generator QR code generator
 */

import { generateQRCode } from "@/app/tools/whatsapp-link-generator/lib/qr-generator";

describe("generateQRCode", () => {
  describe("QR code generation", () => {
    it("generates QR code for valid URL", async () => {
      const url = "https://wa.me/12025551234";
      const qrCode = await generateQRCode(url);

      expect(qrCode).toBeDefined();
      expect(typeof qrCode).toBe("string");
      expect(qrCode.startsWith("data:image")).toBe(true);
    });

    it("generates different QR codes for different URLs", async () => {
      const url1 = "https://wa.me/12025551234";
      const url2 = "https://wa.me/919876543210";

      const qrCode1 = await generateQRCode(url1);
      const qrCode2 = await generateQRCode(url2);

      expect(qrCode1).not.toBe(qrCode2);
    });

    it("generates same QR code for identical URL", async () => {
      const url = "https://wa.me/12025551234";

      const qrCode1 = await generateQRCode(url);
      const qrCode2 = await generateQRCode(url);

      expect(qrCode1).toBe(qrCode2);
    });

    it("handles URL with message parameter", async () => {
      const url = "https://wa.me/12025551234?text=Hello%20World";
      const qrCode = await generateQRCode(url);

      expect(qrCode).toBeDefined();
      expect(qrCode.startsWith("data:image")).toBe(true);
    });

    it("generates PNG data URI", async () => {
      const url = "https://wa.me/12025551234";
      const qrCode = await generateQRCode(url);

      expect(qrCode).toMatch(/^data:image\/png;base64,/);
    });

    it("handles long URLs with multiple parameters", async () => {
      const url =
        "https://wa.me/12025551234?text=Hello%20World%21%20This%20is%20a%20test%20message%20with%20special%20chars%3A%20%40%23%24%25";
      const qrCode = await generateQRCode(url);

      expect(qrCode).toBeDefined();
      expect(qrCode.startsWith("data:image")).toBe(true);
    });
  });

  describe("Error handling", () => {
    it("rejects empty URL", async () => {
      expect(async () => {
        await generateQRCode("");
      }).rejects.toThrow();
    });

    it("rejects invalid URL format", async () => {
      expect(async () => {
        await generateQRCode("not-a-valid-url");
      }).rejects.toThrow();
    });

    it("handles URLs with special characters", async () => {
      const url = "https://wa.me/12025551234?text=test%26special%3Dchars";
      const qrCode = await generateQRCode(url);

      expect(qrCode).toBeDefined();
    });
  });

  describe("Base64 encoding", () => {
    it("produces valid base64 string", async () => {
      const url = "https://wa.me/12025551234";
      const qrCode = await generateQRCode(url);

      const base64Part = qrCode.split(",")[1];
      expect(() => {
        Buffer.from(base64Part, "base64");
      }).not.toThrow();
    });

    it("produces decodable PNG data", async () => {
      const url = "https://wa.me/12025551234";
      const qrCode = await generateQRCode(url);

      const base64Part = qrCode.split(",")[1];
      const buffer = Buffer.from(base64Part, "base64");

      // PNG magic bytes
      expect(buffer[0]).toBe(0x89);
      expect(buffer[1]).toBe(0x50);
      expect(buffer[2]).toBe(0x4e);
      expect(buffer[3]).toBe(0x47);
    });
  });

  describe("Performance", () => {
    it("generates QR code under 1 second", async () => {
      const url = "https://wa.me/12025551234";
      const start = Date.now();

      await generateQRCode(url);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });

    it("handles multiple concurrent QR generations", async () => {
      const urls = [
        "https://wa.me/12025551234",
        "https://wa.me/919876543210",
        "https://wa.me/441234567890",
      ];

      const results = await Promise.all(urls.map((url) => generateQRCode(url)));

      expect(results.length).toBe(3);
      expect(results.every((r) => r.startsWith("data:image"))).toBe(true);
    });
  });
});
