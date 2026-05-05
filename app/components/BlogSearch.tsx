"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Fuse from "fuse.js";
import { SearchIndexEntry } from "@/app/lib/search-index";
import "./BlogSearch.css";

const FUSE_OPTIONS = {
  keys: ["title", "description", "author", "tags"],
  threshold: 0.3,
  minMatchCharLength: 2,
};

const MAX_RESULTS = 10;
const DEBOUNCE_MS = 300;

export function BlogSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchIndexEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const indexRef = useRef<SearchIndexEntry[] | null>(null);
  const fuseRef = useRef<Fuse<SearchIndexEntry> | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const indexLoadedRef = useRef(false);

  /**
   * Fetch the search index once on first focus
   */
  const loadIndex = async () => {
    if (indexLoadedRef.current) return;

    setIsLoading(true);
    setHasError(false);

    try {
      const response = await fetch("/search-index.json");
      if (!response.ok) {
        throw new Error(`Failed to load search index: ${response.status}`);
      }

      const data = await response.json();
      indexRef.current = data;
      fuseRef.current = new Fuse(data, FUSE_OPTIONS);
      indexLoadedRef.current = true;
    } catch (error) {
      console.error("Error loading search index:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle search with debounce
   */
  const handleSearch = (value: string) => {
    setQuery(value);

    // Clear debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // If query is empty, close results and return
    if (!value.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    // Set new debounce timeout
    debounceTimeoutRef.current = setTimeout(() => {
      if (fuseRef.current) {
        const searchResults = fuseRef.current.search(value);
        setResults(searchResults.slice(0, MAX_RESULTS).map((r) => r.item));
        setIsOpen(true);
      }
    }, DEBOUNCE_MS);
  };

  /**
   * Handle input focus — load index on first focus
   */
  const handleFocus = async () => {
    if (!indexLoadedRef.current && !isLoading) {
      await loadIndex();
    }
    if (query.trim()) {
      setIsOpen(true);
    }
  };

  /**
   * Handle input blur — close results after a delay
   */
  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  /**
   * Cleanup debounce on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="blog-search">
      <input
        type="text"
        placeholder="Search articles..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        role="search"
        aria-label="Search articles"
        className="blog-search-input"
      />

      {isOpen && (
        <div className="blog-search-dropdown" role="listbox">
          {isLoading ? (
            <div className="blog-search-loading">Loading search index...</div>
          ) : hasError ? (
            <div className="blog-search-error">
              Unable to load search. Please try again.
            </div>
          ) : results.length === 0 ? (
            <div className="blog-search-empty">No results found</div>
          ) : (
            <ul className="blog-search-results" role="list">
              {results.map((post) => (
                <li key={post.slug} role="option">
                  <Link href={`/blogs/${post.slug}`} className="blog-search-result-link">
                    <div className="blog-search-result-title">{post.title}</div>
                    <div className="blog-search-result-description">
                      {post.description}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
