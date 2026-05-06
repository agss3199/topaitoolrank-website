/**
 * Integration tests for WhatsApp Link Generator + QR Code tool
 * Tests the complete tool including UI, localStorage, and data flow
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WhatsAppLinkGeneratorPage from "@/app/tools/whatsapp-link-generator/page";

// Mock next/dynamic for QR code component
jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: (...args: any[]) => {
    if (typeof args[0] === "function") {
      return args[0]();
    }
    return args[0];
  },
}));

describe("WhatsApp Link Generator Tool Integration", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe("Page rendering", () => {
    it("renders the tool with all main sections", () => {
      render(<WhatsAppLinkGeneratorPage />);

      expect(screen.getByText("WhatsApp Link Generator + QR Code")).toBeInTheDocument();
      expect(screen.getByText("Details")).toBeInTheDocument();
      expect(screen.getByLabelText(/Phone Number/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Include country code/i)).toBeInTheDocument();
    });

    it("renders input fields empty on first load", () => {
      render(<WhatsAppLinkGeneratorPage />);

      const phoneInput = screen.getByDisplayValue(
        ""
      ) as HTMLInputElement;
      expect(phoneInput.value).toBe("");
    });

    it("renders Generate button disabled when phone is empty", () => {
      render(<WhatsAppLinkGeneratorPage />);

      const generateButton = screen.getByRole("button", {
        name: /Generate Link & QR/,
      }) as HTMLButtonElement;
      expect(generateButton.disabled).toBe(true);
    });
  });

  describe("User interaction - phone input", () => {
    it("enables Generate button when phone is entered", async () => {
      const user = userEvent.setup();
      render(<WhatsAppLinkGeneratorPage />);

      const phoneInput = screen.getByPlaceholderText(/Include country code/i);
      await user.type(phoneInput, "+1 (202) 555-1234");

      const generateButton = screen.getByRole("button", {
        name: /Generate Link & QR/,
      }) as HTMLButtonElement;
      expect(generateButton.disabled).toBe(false);
    });

    it("disables Generate button when phone is cleared", async () => {
      const user = userEvent.setup();
      render(<WhatsAppLinkGeneratorPage />);

      const phoneInput = screen.getByPlaceholderText(/Include country code/i) as HTMLInputElement;
      await user.type(phoneInput, "+1 (202) 555-1234");

      let generateButton = screen.getByRole("button", {
        name: /Generate Link & QR/,
      }) as HTMLButtonElement;
      expect(generateButton.disabled).toBe(false);

      await user.clear(phoneInput);

      generateButton = screen.getByRole("button", {
        name: /Generate Link & QR/,
      }) as HTMLButtonElement;
      expect(generateButton.disabled).toBe(true);
    });

    it("shows error for invalid phone number", async () => {
      const user = userEvent.setup();
      render(<WhatsAppLinkGeneratorPage />);

      const phoneInput = screen.getByPlaceholderText(/Include country code/i);
      await user.type(phoneInput, "1234567");

      const generateButton = screen.getByRole("button", {
        name: /Generate Link & QR/,
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid phone number/i)).toBeInTheDocument();
      });
    });
  });

  describe("Link generation", () => {
    it("generates wa.me link on button click", async () => {
      const user = userEvent.setup();
      render(<WhatsAppLinkGeneratorPage />);

      const phoneInput = screen.getByPlaceholderText(/Include country code/i);
      await user.type(phoneInput, "+1 (202) 555-1234");

      const generateButton = screen.getByRole("button", {
        name: /Generate Link & QR/,
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/wa.me\/12025551234/)).toBeInTheDocument();
      });
    });

    it("includes message in link when provided", async () => {
      const user = userEvent.setup();
      render(<WhatsAppLinkGeneratorPage />);

      const phoneInput = screen.getByPlaceholderText(/Include country code/i);
      const messageInput = screen.getByPlaceholderText(/Type a message/i);

      await user.type(phoneInput, "+1 (202) 555-1234");
      await user.type(messageInput, "Hello World");

      const generateButton = screen.getByRole("button", {
        name: /Generate Link & QR/,
      });
      await user.click(generateButton);

      await waitFor(() => {
        const linkBox = screen.getByText(/wa.me/).textContent;
        expect(linkBox).toContain("text=Hello%20World");
      });
    });

    it("shows output section after successful generation", async () => {
      const user = userEvent.setup();
      render(<WhatsAppLinkGeneratorPage />);

      const phoneInput = screen.getByPlaceholderText(/Include country code/i);
      await user.type(phoneInput, "+1 (202) 555-1234");

      const generateButton = screen.getByRole("button", {
        name: /Generate Link & QR/,
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText("Your WhatsApp Link")).toBeInTheDocument();
      });
    });
  });

  describe("localStorage persistence", () => {
    it("saves phone number to localStorage", async () => {
      const user = userEvent.setup();
      render(<WhatsAppLinkGeneratorPage />);

      const phoneInput = screen.getByPlaceholderText(/Include country code/i);
      await user.type(phoneInput, "+1 (202) 555-1234");

      await waitFor(() => {
        expect(localStorage.getItem("wlg-phone")).toBe("+1 (202) 555-1234");
      });
    });

    it("saves message to localStorage", async () => {
      const user = userEvent.setup();
      render(<WhatsAppLinkGeneratorPage />);

      const messageInput = screen.getByPlaceholderText(/Type a message/i);
      await user.type(messageInput, "Test message");

      await waitFor(() => {
        expect(localStorage.getItem("wlg-message")).toBe("Test message");
      });
    });

    it("loads phone number from localStorage on mount", () => {
      localStorage.setItem("wlg-phone", "+919876543210");

      render(<WhatsAppLinkGeneratorPage />);

      const phoneInput = screen.getByPlaceholderText(
        /Include country code/i
      ) as HTMLInputElement;
      expect(phoneInput.value).toBe("+919876543210");
    });

    it("loads message from localStorage on mount", () => {
      localStorage.setItem("wlg-message", "Saved message");

      render(<WhatsAppLinkGeneratorPage />);

      const messageInput = screen.getByPlaceholderText(
        /Type a message/i
      ) as HTMLTextAreaElement;
      expect(messageInput.value).toBe("Saved message");
    });

    it("updates localStorage when inputs change", async () => {
      const user = userEvent.setup();
      render(<WhatsAppLinkGeneratorPage />);

      const phoneInput = screen.getByPlaceholderText(/Include country code/i);
      await user.type(phoneInput, "+1");

      await waitFor(() => {
        expect(localStorage.getItem("wlg-phone")).toBe("+1");
      });
    });
  });

  describe("Copy link functionality", () => {
    it("shows copy success message when link is copied", async () => {
      const user = userEvent.setup();
      const clipboardSpy = jest.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);

      render(<WhatsAppLinkGeneratorPage />);

      const phoneInput = screen.getByPlaceholderText(/Include country code/i);
      await user.type(phoneInput, "+1 (202) 555-1234");

      const generateButton = screen.getByRole("button", {
        name: /Generate Link & QR/,
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText("Your WhatsApp Link")).toBeInTheDocument();
      });

      const copyButton = screen.getByRole("button", {
        name: /Copy Link/,
      });
      await user.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/✓ Link copied!/)).toBeInTheDocument();
      });

      expect(clipboardSpy).toHaveBeenCalledWith(expect.stringContaining("wa.me"));

      clipboardSpy.mockRestore();
    });

    it("copies correct link to clipboard", async () => {
      const user = userEvent.setup();
      const clipboardSpy = jest.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);

      render(<WhatsAppLinkGeneratorPage />);

      const phoneInput = screen.getByPlaceholderText(/Include country code/i);
      const messageInput = screen.getByPlaceholderText(/Type a message/i);

      await user.type(phoneInput, "+1 (202) 555-1234");
      await user.type(messageInput, "Test");

      const generateButton = screen.getByRole("button", {
        name: /Generate Link & QR/,
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText("Your WhatsApp Link")).toBeInTheDocument();
      });

      const copyButton = screen.getByRole("button", {
        name: /Copy Link/,
      });
      await user.click(copyButton);

      expect(clipboardSpy).toHaveBeenCalledWith("https://wa.me/12025551234?text=Test");

      clipboardSpy.mockRestore();
    });

    it("copy message disappears after 3 seconds", async () => {
      const user = userEvent.setup();
      jest.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
      jest.useFakeTimers();

      render(<WhatsAppLinkGeneratorPage />);

      const phoneInput = screen.getByPlaceholderText(/Include country code/i);
      await user.type(phoneInput, "+1 (202) 555-1234");

      const generateButton = screen.getByRole("button", {
        name: /Generate Link & QR/,
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText("Your WhatsApp Link")).toBeInTheDocument();
      });

      const copyButton = screen.getByRole("button", {
        name: /Copy Link/,
      });
      await user.click(copyButton);

      expect(screen.getByText(/✓ Link copied!/)).toBeInTheDocument();

      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.queryByText(/✓ Link copied!/)).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe("Open Chat button", () => {
    it("renders Open Chat button after link generation", async () => {
      const user = userEvent.setup();
      render(<WhatsAppLinkGeneratorPage />);

      const phoneInput = screen.getByPlaceholderText(/Include country code/i);
      await user.type(phoneInput, "+1 (202) 555-1234");

      const generateButton = screen.getByRole("button", {
        name: /Generate Link & QR/,
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByRole("link", { name: /Open Chat/ })).toBeInTheDocument();
      });
    });

    it("Open Chat link has correct href", async () => {
      const user = userEvent.setup();
      render(<WhatsAppLinkGeneratorPage />);

      const phoneInput = screen.getByPlaceholderText(/Include country code/i);
      await user.type(phoneInput, "+1 (202) 555-1234");

      const generateButton = screen.getByRole("button", {
        name: /Generate Link & QR/,
      });
      await user.click(generateButton);

      await waitFor(() => {
        const openChatLink = screen.getByRole("link", { name: /Open Chat/ });
        expect(openChatLink).toHaveAttribute("href", "https://wa.me/12025551234");
        expect(openChatLink).toHaveAttribute("target", "_blank");
      });
    });
  });

  describe("Tool isolation", () => {
    it("uses isolated CSS namespace", () => {
      render(<WhatsAppLinkGeneratorPage />);

      const container = screen.getByText("WhatsApp Link Generator + QR Code").closest("div");
      expect(container).toHaveClass("whatsapp-link-generator");
    });

    it("does not reference shared stylesheets", () => {
      const { container } = render(<WhatsAppLinkGeneratorPage />);

      const links = container.querySelectorAll('link[rel="stylesheet"]');
      links.forEach((link) => {
        expect(link.getAttribute("href")).not.toContain("globals");
        expect(link.getAttribute("href")).not.toContain("shared");
      });
    });

    it("localStorage keys are tool-specific", async () => {
      const user = userEvent.setup();
      render(<WhatsAppLinkGeneratorPage />);

      const phoneInput = screen.getByPlaceholderText(/Include country code/i);
      await user.type(phoneInput, "+1 (202) 555-1234");

      await waitFor(() => {
        const allKeys = Object.keys(localStorage);
        expect(allKeys.some((key) => key.startsWith("wlg-"))).toBe(true);
        expect(allKeys.some((key) => key.startsWith("wc-"))).toBe(false);
        expect(allKeys.some((key) => key.startsWith("wam-"))).toBe(false);
      });
    });
  });

  describe("Responsive behavior", () => {
    it("renders correctly on mobile viewport", () => {
      global.innerWidth = 320;
      global.innerHeight = 640;

      const { container } = render(<WhatsAppLinkGeneratorPage />);

      const mainElement = container.querySelector(".whatsapp-link-generator__main");
      expect(mainElement).toBeInTheDocument();
    });

    it("renders correctly on tablet viewport", () => {
      global.innerWidth = 768;
      global.innerHeight = 1024;

      const { container } = render(<WhatsAppLinkGeneratorPage />);

      const mainElement = container.querySelector(".whatsapp-link-generator__main");
      expect(mainElement).toBeInTheDocument();
    });

    it("renders correctly on desktop viewport", () => {
      global.innerWidth = 1920;
      global.innerHeight = 1080;

      const { container } = render(<WhatsAppLinkGeneratorPage />);

      const mainElement = container.querySelector(".whatsapp-link-generator__main");
      expect(mainElement).toBeInTheDocument();
    });
  });

  describe("Metadata export", () => {
    it("exports metadata with SEO tags", () => {
      const { metadata } = require("@/app/tools/whatsapp-link-generator/page");

      expect(metadata.title).toContain("WhatsApp Link Generator");
      expect(metadata.description).toBeDefined();
      expect(metadata.keywords).toBeDefined();
      expect(Array.isArray(metadata.keywords)).toBe(true);
    });
  });
});
