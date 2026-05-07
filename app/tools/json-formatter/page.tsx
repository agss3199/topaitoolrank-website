"use client";

export const dynamic = 'force-dynamic';
export const dynamicParams = false;

/**
 * JSON Formatter - Main Page
 * Format, validate, and transform JSON with real-time feedback
 */

import { useState, useEffect, useMemo } from "react";
import Header from "../lib/Header";
import Footer from "../lib/Footer";
import { ArticleSection } from "../lib/ArticleSection";
import styles from "./styles.css";
import {
  parseJSON,
  formatJSON,
  minifyJSON,
  sortJSONKeys,
  jsonToCSV,
  getJSONStats,
  getComplexity,
} from "./lib/json-utils";
import { cls } from "../lib/css-module-safe";

const LOCALSTORAGE_KEY = "jf-input";

export default function JSONFormatterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [outputMode, setOutputMode] = useState<"formatted" | "minified" | "sorted">("formatted");
  const [articleContent, setArticleContent] = useState<string>("");
  const [articleLoading, setArticleLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCALSTORAGE_KEY);
    if (saved) setInput(saved);
  }, []);

  // Load article content
  useEffect(() => {
    const loadArticle = async () => {
      try {
        const res = await fetch('/api/tools/article?tool=json-formatter');
        if (res.ok) {
          const data = await res.json();
          setArticleContent(data.content || '');
        }
      } catch (error) {
        console.error('Failed to load article:', error);
      } finally {
        setArticleLoading(false);
      }
    };
    loadArticle();
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(LOCALSTORAGE_KEY, input);
  }, [input]);

  // Parse and validate
  const validation = useMemo(() => parseJSON(input), [input]);
  const stats = useMemo(() => getJSONStats(input), [input]);

  // Generate output based on mode
  useEffect(() => {
    if (!validation.valid) {
      setOutput("");
      return;
    }

    switch (outputMode) {
      case "minified":
        setOutput(minifyJSON(input));
        break;
      case "sorted":
        setOutput(sortJSONKeys(input));
        break;
      case "formatted":
      default:
        setOutput(formatJSON(input));
        break;
    }
  }, [input, outputMode, validation]);

  const complexity = useMemo(() => getComplexity(input), [input]);

  const handleFormatClick = () => setOutputMode("formatted");
  const handleMinifyClick = () => setOutputMode("minified");
  const handleSortClick = () => setOutputMode("sorted");

  const handleCopyOutput = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      alert("✓ Copied to clipboard!");
    } catch {
      alert("Failed to copy");
    }
  };

  const handleDownloadJSON = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `data-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyToCSV = async () => {
    if (!validation.valid) return;
    try {
      const csv = jsonToCSV(input);
      await navigator.clipboard.writeText(csv);
      alert("✓ CSV copied to clipboard!");
    } catch {
      alert("Failed to copy CSV");
    }
  };

  return (
    <>
      <Header />
      <div className={cls(styles, "json-formatter")}>
        <header className={cls(styles, "json-formatter__header")}>
          <h1>JSON Formatter</h1>
          <p>Format, validate, and transform JSON</p>
        </header>

        <main className={cls(styles, "json-formatter__main")}>
        {/* Input section */}
        <section className={cls(styles, "json-formatter__section")}>
          <div className={cls(styles, "json-formatter__section-header")}>
            <h2>Input JSON</h2>
            {input && (
              <div className={cls(styles, "json-formatter__stats")}>
                {validation.valid ? (
                  <>
                    <span className={cls(styles, "json-formatter__stat")}>
                      {stats.size} bytes
                    </span>
                    <span className={cls(styles, "json-formatter__stat")}>
                      {stats.keys} keys
                    </span>
                    <span className={`${cls(styles, "json-formatter__stat")} ${cls(styles, "json-formatter__complexity")}`}>
                      {complexity}
                    </span>
                  </>
                ) : (
                  <span className={cls(styles, "json-formatter__error-badge")}>Invalid</span>
                )}
              </div>
            )}
          </div>

          <textarea
            className={cls(styles, "json-formatter__textarea")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"key": "value"}'
          />

          {!validation.valid && input && (
            <div className={cls(styles, "json-formatter__error")}>
              <strong>Error:</strong> {validation.error}
            </div>
          )}

          {validation.valid && (
            <div className={cls(styles, "json-formatter__success")}>
              ✓ Valid JSON
            </div>
          )}
        </section>

        {validation.valid && (
          <>
            {/* Output modes */}
            <div className={cls(styles, "json-formatter__modes")}>
              <button
                className={`${cls(styles, "json-formatter__mode-button")} ${outputMode === "formatted" ? cls(styles, "json-formatter__mode-button--active") : ""}`}
                onClick={handleFormatClick}
              >
                Format
              </button>
              <button
                className={`${cls(styles, "json-formatter__mode-button")} ${outputMode === "minified" ? cls(styles, "json-formatter__mode-button--active") : ""}`}
                onClick={handleMinifyClick}
              >
                Minify
              </button>
              <button
                className={`${cls(styles, "json-formatter__mode-button")} ${outputMode === "sorted" ? cls(styles, "json-formatter__mode-button--active") : ""}`}
                onClick={handleSortClick}
              >
                Sort Keys
              </button>
            </div>

            {/* Output section */}
            <section className={cls(styles, "json-formatter__section")}>
              <h2>Output</h2>

              <div className={cls(styles, "json-formatter__output-box")}>
                <code className={cls(styles, "json-formatter__code")}>{output}</code>
              </div>

              <div className={cls(styles, "json-formatter__action-buttons")}>
                <button
                  className={cls(styles, "json-formatter__button")}
                  onClick={handleCopyOutput}
                >
                  📋 Copy
                </button>
                <button
                  className={cls(styles, "json-formatter__button")}
                  onClick={handleDownloadJSON}
                >
                  ⬇️ Download JSON
                </button>
                <button
                  className={cls(styles, "json-formatter__button")}
                  onClick={handleCopyToCSV}
                >
                  📊 Copy as CSV
                </button>
              </div>
            </section>
          </>
        )}

        <footer className={cls(styles, "json-formatter__footer")}>
          <p>
            <small>
              Free tool by{" "}
              <a href="/" className={cls(styles, "json-formatter__link")}>
                topaitoolrank.com
              </a>
            </small>
          </p>
        </footer>
      </main>

      {/* Article Section */}
      {!articleLoading && articleContent && (
        <div className={cls(styles, "json-formatter__article-container")}>
          <ArticleSection content={articleContent} />
        </div>
      )}
    </div>
    <Footer />
    </>
  );
}

