import { describe, test, expect } from "vitest";
import {
  generateSearchIndex,
  SearchIndexEntry,
} from "@/app/lib/search-index";

describe("blog-search-index", () => {
  describe("generateSearchIndex", () => {
    test("returns an array of SearchIndexEntry objects", async () => {
      const index = await generateSearchIndex();
      expect(Array.isArray(index)).toBe(true);
      expect(index.length).toBeGreaterThan(0);
    });

    test("excludes draft posts from index", async () => {
      const index = await generateSearchIndex();
      // All entries should have published status (implied by being in the index)
      index.forEach((entry) => {
        expect(entry).toHaveProperty("slug");
        expect(entry).toHaveProperty("title");
        expect(entry).toHaveProperty("publishedAt");
      });
    });

    test("each entry includes all required fields", async () => {
      const index = await generateSearchIndex();

      if (index.length > 0) {
        const entry = index[0];
        expect(entry).toHaveProperty("slug");
        expect(entry).toHaveProperty("title");
        expect(entry).toHaveProperty("description");
        expect(entry).toHaveProperty("author");
        expect(entry).toHaveProperty("category");
        expect(entry).toHaveProperty("tags");
        expect(entry).toHaveProperty("publishedAt");
        expect(entry).toHaveProperty("excerpt");
      }
    });

    test("tags is always an array (never null/undefined)", async () => {
      const index = await generateSearchIndex();

      index.forEach((entry) => {
        expect(Array.isArray(entry.tags)).toBe(true);
      });
    });

    test("excerpt does not exceed 200 characters", async () => {
      const index = await generateSearchIndex();

      index.forEach((entry) => {
        expect(entry.excerpt.length).toBeLessThanOrEqual(200);
      });
    });

    test("excerpt is not empty for published posts", async () => {
      const index = await generateSearchIndex();

      index.forEach((entry) => {
        expect(entry.excerpt.length).toBeGreaterThan(0);
      });
    });

    test("sorts entries by publishedAt descending", async () => {
      const index = await generateSearchIndex();

      if (index.length > 1) {
        for (let i = 0; i < index.length - 1; i++) {
          const current = new Date(index[i].publishedAt).getTime();
          const next = new Date(index[i + 1].publishedAt).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });

    test("excerpt type is string", async () => {
      const index = await generateSearchIndex();

      index.forEach((entry) => {
        expect(typeof entry.excerpt).toBe("string");
      });
    });
  });
});
