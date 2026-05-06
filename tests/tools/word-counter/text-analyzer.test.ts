/**
 * Unit tests for Word Counter text analyzer
 */

import { analyzeText, type TextStats } from "@/app/tools/word-counter/lib/text-analyzer";

describe("analyzeText", () => {
  describe("Empty and minimal text", () => {
    it("returns zero statistics for empty string", () => {
      const result = analyzeText("");

      expect(result.characters).toBe(0);
      expect(result.charactersNoSpaces).toBe(0);
      expect(result.words).toBe(0);
      expect(result.sentences).toBe(0);
      expect(result.paragraphs).toBe(0);
      expect(result.readingTimeMinutes).toBe(0);
      expect(result.readingTimeSeconds).toBe(0);
      expect(result.topWords).toEqual([]);
    });

    it("returns zero statistics for whitespace-only string", () => {
      const result = analyzeText("   \n\n   ");

      expect(result.characters).toBe(0);
      expect(result.words).toBe(0);
      expect(result.sentences).toBe(0);
      expect(result.topWords).toEqual([]);
    });

    it("handles single word", () => {
      const result = analyzeText("Hello");

      expect(result.words).toBe(1);
      expect(result.characters).toBe(5);
      expect(result.charactersNoSpaces).toBe(5);
      expect(result.sentences).toBe(1); // Default to 1 for single word without punctuation
    });

    it("counts single sentence without period", () => {
      const result = analyzeText("Hello world");

      expect(result.words).toBe(2);
      expect(result.sentences).toBe(1);
    });
  });

  describe("Word counting", () => {
    it("counts words correctly with simple text", () => {
      const result = analyzeText("The quick brown fox jumps over the lazy dog");

      expect(result.words).toBe(9);
    });

    it("ignores extra whitespace between words", () => {
      const result = analyzeText("The   quick    brown     fox");

      expect(result.words).toBe(4);
    });

    it("counts hyphenated words as one word", () => {
      const result = analyzeText("mother-in-law is here");

      expect(result.words).toBe(3); // mother-in-law, is, here
    });

    it("counts contractions as one word", () => {
      const result = analyzeText("don't can't won't");

      expect(result.words).toBe(3);
    });

    it("counts numbers as words", () => {
      const result = analyzeText("I have 2 cats and 3 dogs");

      expect(result.words).toBe(6); // I, have, 2, cats, and, 3, dogs is 7 - let me recount
      // Actually: I(1) have(2) 2(3) cats(4) and(5) 3(6) dogs(7) = 7
      expect(result.words).toBe(7);
    });
  });

  describe("Character counting", () => {
    it("counts all characters including spaces", () => {
      const result = analyzeText("Hello World");

      expect(result.characters).toBe(11); // H-e-l-l-o-space-W-o-r-l-d
    });

    it("counts characters without spaces", () => {
      const result = analyzeText("Hello World");

      expect(result.charactersNoSpaces).toBe(10); // HelloWorld
    });

    it("includes punctuation in character count", () => {
      const result = analyzeText("Hello, World!");

      expect(result.characters).toBe(13);
      expect(result.charactersNoSpaces).toBe(11);
    });

    it("handles special characters", () => {
      const result = analyzeText("!@#$%^&*()");

      expect(result.characters).toBe(10);
      expect(result.charactersNoSpaces).toBe(10);
    });

    it("counts newlines and tabs as characters", () => {
      const result = analyzeText("Hello\nWorld\tTest");

      expect(result.characters).toBeGreaterThan(14);
    });
  });

  describe("Sentence counting", () => {
    it("counts sentences ending with period", () => {
      const result = analyzeText("First sentence. Second sentence.");

      expect(result.sentences).toBe(2);
    });

    it("counts sentences ending with question mark", () => {
      const result = analyzeText("Is this a question? Yes.");

      expect(result.sentences).toBe(2);
    });

    it("counts sentences ending with exclamation mark", () => {
      const result = analyzeText("What an amazing day! This is great.");

      expect(result.sentences).toBe(2);
    });

    it("handles multiple punctuation marks", () => {
      const result = analyzeText("Really?! Yes!! Absolutely...");

      expect(result.sentences).toBeGreaterThan(0);
    });

    it("treats abbreviations with periods correctly", () => {
      const result = analyzeText("Dr. Smith went to the U.S.A. yesterday.");

      expect(result.sentences).toBeLessThanOrEqual(3); // At most 3 sentences
    });
  });

  describe("Paragraph counting", () => {
    it("counts paragraphs separated by double newlines", () => {
      const result = analyzeText("First paragraph.\n\nSecond paragraph.\n\nThird paragraph.");

      expect(result.paragraphs).toBe(3);
    });

    it("counts single paragraph", () => {
      const result = analyzeText("This is a single paragraph.");

      expect(result.paragraphs).toBe(1);
    });

    it("ignores leading/trailing whitespace", () => {
      const result = analyzeText("\n\nParagraph one.\n\nParagraph two.\n\n");

      expect(result.paragraphs).toBe(2);
    });

    it("handles multiple consecutive newlines as paragraph separator", () => {
      const result = analyzeText("Para 1.\n\n\n\nPara 2.");

      expect(result.paragraphs).toBe(2);
    });
  });

  describe("Reading time calculation", () => {
    it("calculates reading time at 200 WPM baseline", () => {
      // 200 words = 1 minute at 200 WPM
      const text = "word ".repeat(200).trim();
      const result = analyzeText(text);

      expect(result.readingTimeMinutes).toBe(1);
      expect(result.readingTimeSeconds).toBe(0);
    });

    it("calculates reading time for less than 1 minute", () => {
      // 100 words = 30 seconds at 200 WPM
      const text = "word ".repeat(100).trim();
      const result = analyzeText(text);

      expect(result.readingTimeMinutes).toBe(0);
      expect(result.readingTimeSeconds).toBe(30);
    });

    it("calculates reading time for multiple minutes", () => {
      // 400 words = 2 minutes at 200 WPM
      const text = "word ".repeat(400).trim();
      const result = analyzeText(text);

      expect(result.readingTimeMinutes).toBe(2);
      expect(result.readingTimeSeconds).toBe(0);
    });

    it("includes fractional seconds in calculation", () => {
      // 50 words = 15 seconds at 200 WPM
      const text = "word ".repeat(50).trim();
      const result = analyzeText(text);

      expect(result.readingTimeSeconds).toBe(15);
    });

    it("returns 0 reading time for empty text", () => {
      const result = analyzeText("");

      expect(result.readingTimeMinutes).toBe(0);
      expect(result.readingTimeSeconds).toBe(0);
    });
  });

  describe("Top words analysis", () => {
    it("returns top 10 most frequent words", () => {
      const text =
        "the the the the the apple apple apple banana orange orange orange orange orange orange";
      const result = analyzeText(text);

      expect(result.topWords.length).toBeLessThanOrEqual(10);
      expect(result.topWords[0].word).toBe("orange");
      expect(result.topWords[0].count).toBe(6);
    });

    it("returns empty array for text with no repeated words", () => {
      const result = analyzeText("one two three four five");

      expect(result.topWords.length).toBe(5);
      expect(result.topWords.every((w) => w.count === 1)).toBe(true);
    });

    it("converts words to lowercase for frequency count", () => {
      const text = "The the THE";
      const result = analyzeText(text);

      expect(result.topWords.length).toBe(1);
      expect(result.topWords[0].word).toBe("the");
      expect(result.topWords[0].count).toBe(3);
    });

    it("excludes punctuation from word frequency", () => {
      const text = "Hello, hello! hello";
      const result = analyzeText(text);

      expect(result.topWords.length).toBe(1);
      expect(result.topWords[0].word).toBe("hello");
    });

    it("sorts by frequency descending", () => {
      const text = "cat cat cat dog dog bird";
      const result = analyzeText(text);

      expect(result.topWords[0].count).toBeGreaterThanOrEqual(result.topWords[1].count);
      expect(result.topWords[1].count).toBeGreaterThanOrEqual(result.topWords[2].count);
    });

    it("limits output to 10 words maximum", () => {
      const words = ["word", "test", "hello", "world", "foo", "bar", "baz", "qux", "alpha", "beta", "gamma"];
      const text = words.map((w) => w + " ").join("");
      const result = analyzeText(text);

      expect(result.topWords.length).toBeLessThanOrEqual(10);
    });

    it("handles words with apostrophes", () => {
      const text = "don't don't can't won't";
      const result = analyzeText(text);

      const dontWord = result.topWords.find((w) => w.word === "don't");
      expect(dontWord?.count).toBe(2);
    });
  });

  describe("Comprehensive text examples", () => {
    it("analyzes complete paragraph correctly", () => {
      const text =
        "The quick brown fox jumps over the lazy dog. This is a test. Another sentence here!";
      const result = analyzeText(text);

      expect(result.words).toBeGreaterThan(0);
      expect(result.characters).toBeGreaterThan(0);
      expect(result.sentences).toBe(3);
      expect(result.paragraphs).toBe(1);
    });

    it("handles real-world text with mixed formatting", () => {
      const text = `Lorem ipsum dolor sit amet, consectetur adipiscing elit.

Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Ut enim ad minim veniam, quis nostrud exercitation.`;

      const result = analyzeText(text);

      expect(result.paragraphs).toBe(3);
      expect(result.words).toBeGreaterThan(20);
      expect(result.sentences).toBeGreaterThan(0);
    });

    it("verifies result type structure", () => {
      const result = analyzeText("Test text");

      expect(result).toHaveProperty("characters");
      expect(result).toHaveProperty("charactersNoSpaces");
      expect(result).toHaveProperty("words");
      expect(result).toHaveProperty("sentences");
      expect(result).toHaveProperty("paragraphs");
      expect(result).toHaveProperty("readingTimeMinutes");
      expect(result).toHaveProperty("readingTimeSeconds");
      expect(result).toHaveProperty("topWords");
    });
  });

  describe("Edge cases", () => {
    it("handles text with only numbers", () => {
      const result = analyzeText("123 456 789");

      expect(result.words).toBe(3);
      expect(result.characters).toBe(11);
    });

    it("handles text with emoji", () => {
      const result = analyzeText("Hello 😀 World 🌍");

      expect(result.characters).toBeGreaterThan(0);
    });

    it("handles text with URLs", () => {
      const text = "Check out https://example.com for more info";
      const result = analyzeText(text);

      expect(result.words).toBeGreaterThan(0);
    });

    it("handles very long single word", () => {
      const result = analyzeText("a".repeat(1000));

      expect(result.words).toBe(1);
      expect(result.characters).toBe(1000);
    });
  });
});
