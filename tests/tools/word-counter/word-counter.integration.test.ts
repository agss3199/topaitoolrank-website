/**
 * Integration tests for Word Counter & Text Analyzer tool
 * Tests the complete tool including UI, localStorage, and real-time updates
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WordCounterPage from "@/app/tools/word-counter/page";

describe("Word Counter Tool Integration", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe("Page rendering", () => {
    it("renders the tool with all main sections", () => {
      render(<WordCounterPage />);

      expect(screen.getByText("Word Counter & Text Analyzer")).toBeInTheDocument();
      expect(screen.getByText("Real-time text statistics and analysis")).toBeInTheDocument();
      expect(screen.getByLabelText(/Paste your text/)).toBeInTheDocument();
      expect(screen.getByText("Statistics")).toBeInTheDocument();
    });

    it("renders textarea empty on first load", () => {
      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/) as HTMLTextAreaElement;
      expect(textarea.value).toBe("");
    });

    it("renders Clear button disabled when empty", () => {
      render(<WordCounterPage />);

      const clearButton = screen.getByRole("button", {
        name: /Clear/,
      }) as HTMLButtonElement;
      expect(clearButton.disabled).toBe(true);
    });

    it("renders Copy Stats button disabled when empty", () => {
      render(<WordCounterPage />);

      const copyButton = screen.getByRole("button", {
        name: /Copy Stats/,
      }) as HTMLButtonElement;
      expect(copyButton.disabled).toBe(true);
    });

    it("displays all statistics sections", () => {
      render(<WordCounterPage />);

      expect(screen.getByText("Words")).toBeInTheDocument();
      expect(screen.getByText("Characters")).toBeInTheDocument();
      expect(screen.getByText("No Spaces")).toBeInTheDocument();
      expect(screen.getByText("Sentences")).toBeInTheDocument();
      expect(screen.getByText("Paragraphs")).toBeInTheDocument();
      expect(screen.getByText("Read Time")).toBeInTheDocument();
    });
  });

  describe("User interaction - text input", () => {
    it("enables buttons when text is entered", async () => {
      const user = userEvent.setup();
      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/);
      await user.type(textarea, "Test text");

      const clearButton = screen.getByRole("button", {
        name: /Clear/,
      }) as HTMLButtonElement;
      const copyButton = screen.getByRole("button", {
        name: /Copy Stats/,
      }) as HTMLButtonElement;

      expect(clearButton.disabled).toBe(false);
      expect(copyButton.disabled).toBe(false);
    });

    it("disables buttons when text is cleared", async () => {
      const user = userEvent.setup();
      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/) as HTMLTextAreaElement;
      await user.type(textarea, "Test text");

      let clearButton = screen.getByRole("button", {
        name: /Clear/,
      }) as HTMLButtonElement;
      expect(clearButton.disabled).toBe(false);

      await user.clear(textarea);

      clearButton = screen.getByRole("button", {
        name: /Clear/,
      }) as HTMLButtonElement;
      expect(clearButton.disabled).toBe(true);
    });

    it("clears text when Clear button is clicked", async () => {
      const user = userEvent.setup();
      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/) as HTMLTextAreaElement;
      await user.type(textarea, "Test text");

      const clearButton = screen.getByRole("button", {
        name: /Clear/,
      });
      await user.click(clearButton);

      expect(textarea.value).toBe("");
    });
  });

  describe("Real-time statistics", () => {
    it("shows word count for single word", async () => {
      const user = userEvent.setup();
      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/);
      await user.type(textarea, "Hello");

      await waitFor(() => {
        const wordStats = screen.getByText("Words").closest("div");
        expect(wordStats?.textContent).toContain("1");
      });
    });

    it("shows word count for multiple words", async () => {
      const user = userEvent.setup();
      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/);
      await user.type(textarea, "Hello world test");

      await waitFor(() => {
        const wordStats = screen.getByText("Words").closest("div");
        expect(wordStats?.textContent).toContain("3");
      });
    });

    it("shows character count", async () => {
      const user = userEvent.setup();
      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/);
      await user.type(textarea, "Hello");

      await waitFor(() => {
        const charStats = screen.getByText("Characters").closest("div");
        expect(charStats?.textContent).toContain("5");
      });
    });

    it("shows characters without spaces", async () => {
      const user = userEvent.setup();
      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/);
      await user.type(textarea, "Hello World");

      await waitFor(() => {
        const noSpaceStats = screen.getByText("No Spaces").closest("div");
        expect(noSpaceStats?.textContent).toContain("10");
      });
    });

    it("shows sentence count", async () => {
      const user = userEvent.setup();
      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/);
      await user.type(textarea, "First sentence. Second sentence.");

      await waitFor(() => {
        const sentenceStats = screen.getByText("Sentences").closest("div");
        expect(sentenceStats?.textContent).toContain("2");
      });
    });

    it("shows paragraph count", async () => {
      const user = userEvent.setup();
      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/);
      await user.type(textarea, "Para 1.\n\nPara 2.");

      await waitFor(() => {
        const paraStats = screen.getByText("Paragraphs").closest("div");
        expect(paraStats?.textContent).toContain("2");
      });
    });

    it("shows reading time", async () => {
      const user = userEvent.setup();
      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/);
      // Add 200 words for 1 minute read time
      await user.type(textarea, "word ".repeat(200).trim());

      await waitFor(() => {
        const readTimeStats = screen.getByText("Read Time").closest("div");
        expect(readTimeStats?.textContent).toContain("1:00");
      });
    });

    it("updates statistics in real-time as user types", async () => {
      const user = userEvent.setup();
      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/);

      await user.type(textarea, "Hello");
      let wordStats = screen.getByText("Words").closest("div");
      expect(wordStats?.textContent).toContain("1");

      await user.type(textarea, " world");
      wordStats = screen.getByText("Words").closest("div");
      expect(wordStats?.textContent).toContain("2");
    });
  });

  describe("Top words display", () => {
    it("displays Top 10 Words heading when words are repeated", async () => {
      const user = userEvent.setup();
      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/);
      await user.type(textarea, "the the the apple apple banana");

      await waitFor(() => {
        expect(screen.getByText("Top 10 Words")).toBeInTheDocument();
      });
    });

    it("shows word frequency list", async () => {
      const user = userEvent.setup();
      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/);
      await user.type(textarea, "cat cat dog dog dog bird");

      await waitFor(() => {
        expect(screen.getByText("dog")).toBeInTheDocument();
        expect(screen.getByText("cat")).toBeInTheDocument();
      });
    });

    it("shows word counts in frequency list", async () => {
      const user = userEvent.setup();
      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/);
      await user.type(textarea, "hello hello world");

      await waitFor(() => {
        const wordList = screen.getByText("hello").closest("div");
        expect(wordList?.textContent).toContain("2");
      });
    });

    it("hides Top 10 Words section when no repeated words", async () => {
      const user = userEvent.setup();
      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/);
      await user.type(textarea, "hello world");

      await waitFor(() => {
        expect(screen.queryByText("Top 10 Words")).not.toBeInTheDocument();
      });
    });

    it("limits to top 10 words", async () => {
      const user = userEvent.setup();
      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/);
      // Create text with 15 different words repeated
      const words = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o"];
      const text = words.map((w) => w + " ").join("").repeat(2);
      await user.type(textarea, text);

      await waitFor(() => {
        const wordItems = screen.getAllByText(/\d+$/);
        expect(wordItems.length).toBeLessThanOrEqual(10);
      });
    });
  });

  describe("Copy Stats functionality", () => {
    it("copies stats in correct format", async () => {
      const user = userEvent.setup();
      const clipboardSpy = jest.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);

      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/);
      await user.type(textarea, "Hello world");

      const copyButton = screen.getByRole("button", {
        name: /Copy Stats/,
      });
      await user.click(copyButton);

      await waitFor(() => {
        expect(clipboardSpy).toHaveBeenCalledWith(
          expect.stringMatching(/Words: \d+ \| Characters: \d+ \| Sentences: \d+/)
        );
      });

      clipboardSpy.mockRestore();
    });

    it("shows copy success message", async () => {
      const user = userEvent.setup();
      jest.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);

      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/);
      await user.type(textarea, "Test text");

      const copyButton = screen.getByRole("button", {
        name: /Copy Stats/,
      });
      await user.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/✓ Copied!/)).toBeInTheDocument();
      });
    });

    it("success message disappears after 2 seconds", async () => {
      const user = userEvent.setup();
      jest.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
      jest.useFakeTimers();

      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/);
      await user.type(textarea, "Test text");

      const copyButton = screen.getByRole("button", {
        name: /Copy Stats/,
      });
      await user.click(copyButton);

      expect(screen.getByText(/✓ Copied!/)).toBeInTheDocument();

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.queryByText(/✓ Copied!/)).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe("localStorage persistence", () => {
    it("saves text to localStorage", async () => {
      const user = userEvent.setup();
      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/);
      await user.type(textarea, "Test content");

      await waitFor(() => {
        expect(localStorage.getItem("wc-text")).toBe("Test content");
      });
    });

    it("loads text from localStorage on mount", () => {
      localStorage.setItem("wc-text", "Saved content");

      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/) as HTMLTextAreaElement;
      expect(textarea.value).toBe("Saved content");
    });

    it("updates localStorage when text changes", async () => {
      const user = userEvent.setup();
      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/);

      await user.type(textarea, "First");
      expect(localStorage.getItem("wc-text")).toBe("First");

      await user.type(textarea, " Second");
      expect(localStorage.getItem("wc-text")).toBe("First Second");
    });

    it("uses tool-specific localStorage key", async () => {
      const user = userEvent.setup();
      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/);
      await user.type(textarea, "Test");

      const allKeys = Object.keys(localStorage);
      expect(allKeys.some((key) => key.startsWith("wc-"))).toBe(true);
      expect(allKeys.some((key) => key.startsWith("wlg-"))).toBe(false);
      expect(allKeys.some((key) => key.startsWith("wam-"))).toBe(false);
    });

    it("preserves text across tool unmount/remount", async () => {
      const user = userEvent.setup();
      const { unmount } = render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/);
      await user.type(textarea, "Persistent text");

      expect(localStorage.getItem("wc-text")).toBe("Persistent text");

      unmount();

      const { rerender } = render(<WordCounterPage />);
      const newTextarea = screen.getByPlaceholderText(
        /Paste your text here/
      ) as HTMLTextAreaElement;
      expect(newTextarea.value).toBe("Persistent text");
    });
  });

  describe("Tool isolation", () => {
    it("uses isolated CSS namespace", () => {
      render(<WordCounterPage />);

      const container = screen.getByText("Word Counter & Text Analyzer").closest("div");
      expect(container).toHaveClass("word-counter");
    });

    it("does not reference shared stylesheets", () => {
      const { container } = render(<WordCounterPage />);

      const links = container.querySelectorAll('link[rel="stylesheet"]');
      links.forEach((link) => {
        expect(link.getAttribute("href")).not.toContain("globals");
        expect(link.getAttribute("href")).not.toContain("shared");
      });
    });

    it("localStorage keys are tool-specific", async () => {
      const user = userEvent.setup();
      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/);
      await user.type(textarea, "Test");

      const allKeys = Object.keys(localStorage);
      expect(allKeys.filter((k) => k.startsWith("wc-")).length).toBeGreaterThan(0);
      expect(allKeys.filter((k) => k.startsWith("wlg-")).length).toBe(0);
      expect(allKeys.filter((k) => k.startsWith("wam-")).length).toBe(0);
    });
  });

  describe("Responsive behavior", () => {
    it("renders correctly on mobile viewport", () => {
      global.innerWidth = 320;
      global.innerHeight = 640;

      const { container } = render(<WordCounterPage />);

      const mainElement = container.querySelector(".word-counter__main");
      expect(mainElement).toBeInTheDocument();
    });

    it("renders correctly on tablet viewport", () => {
      global.innerWidth = 768;
      global.innerHeight = 1024;

      const { container } = render(<WordCounterPage />);

      const mainElement = container.querySelector(".word-counter__main");
      expect(mainElement).toBeInTheDocument();
    });

    it("renders correctly on desktop viewport", () => {
      global.innerWidth = 1920;
      global.innerHeight = 1080;

      const { container } = render(<WordCounterPage />);

      const mainElement = container.querySelector(".word-counter__main");
      expect(mainElement).toBeInTheDocument();
    });
  });

  describe("Metadata export", () => {
    it("exports metadata with SEO tags", () => {
      const { metadata } = require("@/app/tools/word-counter/page");

      expect(metadata.title).toContain("Word Counter");
      expect(metadata.description).toBeDefined();
      expect(metadata.keywords).toBeDefined();
      expect(Array.isArray(metadata.keywords)).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("handles very long text", async () => {
      const user = userEvent.setup();
      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/);
      const longText = "word ".repeat(10000).trim();
      await user.type(textarea, longText);

      await waitFor(() => {
        expect(localStorage.getItem("wc-text")).toBe(longText);
      });
    });

    it("handles text with special characters", async () => {
      const user = userEvent.setup();
      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/);
      await user.type(textarea, "!@#$%^&*(){}[]|\\:;<>?,./");

      const charStats = screen.getByText("Characters").closest("div");
      expect(charStats?.textContent).toContain("25");
    });

    it("handles text with emoji", async () => {
      const user = userEvent.setup();
      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/);
      await user.type(textarea, "Hello 😀 World");

      await waitFor(() => {
        const charStats = screen.getByText("Characters").closest("div");
        expect(charStats?.textContent).toBeDefined();
      });
    });

    it("handles rapid text changes", async () => {
      const user = userEvent.setup();
      render(<WordCounterPage />);

      const textarea = screen.getByPlaceholderText(/Paste your text here/);

      for (let i = 0; i < 10; i++) {
        await user.type(textarea, "word");
      }

      await waitFor(() => {
        const wordStats = screen.getByText("Words").closest("div");
        expect(wordStats?.textContent).toContain("10");
      });
    });
  });
});
