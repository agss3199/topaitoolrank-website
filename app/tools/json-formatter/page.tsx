"use client";

nexport const dynamicParams = false;


/**
 * JSON Formatter - Main Page
 * Format, validate, and transform JSON with real-time feedback
 */

import { useState, useEffect, useMemo } from "react";
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

const LOCALSTORAGE_KEY = "jf-input";

export default function JSONFormatterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [outputMode, setOutputMode] = useState<"formatted" | "minified" | "sorted">("formatted");

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCALSTORAGE_KEY);
    if (saved) setInput(saved);
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

  // @ts-ignore CSS Module types
  return (
    <div className={styles["json-formatter"]}>
      <header className={styles["json-formatter__header"]}>
        <h1>JSON Formatter</h1>
        <p>Format, validate, and transform JSON</p>
      </header>

      <main className={styles["json-formatter__main"]}>
        {/* Input section */}
        <section className={styles["json-formatter__section"]}>
          <div className={styles["json-formatter__section-header"]}>
            <h2>Input JSON</h2>
            {input && (
              <div className={styles["json-formatter__stats"]}>
                {validation.valid ? (
                  <>
                    <span className={styles["json-formatter__stat"]}>
                      {stats.size} bytes
                    </span>
                    <span className={styles["json-formatter__stat"]}>
                      {stats.keys} keys
                    </span>
                    <span className={`${styles["json-formatter__stat"]} ${styles["json-formatter__complexity"]}`}>
                      {complexity}
                    </span>
                  </>
                ) : (
                  <span className={styles["json-formatter__error-badge"]}>Invalid</span>
                )}
              </div>
            )}
          </div>

          <textarea
            className={styles["json-formatter__textarea"]}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"key": "value"}'
          />

          {!validation.valid && input && (
            <div className={styles["json-formatter__error"]}>
              <strong>Error:</strong> {validation.error}
            </div>
          )}

          {validation.valid && (
            <div className={styles["json-formatter__success"]}>
              ✓ Valid JSON
            </div>
          )}
        </section>

        {validation.valid && (
          <>
            {/* Output modes */}
            <div className={styles["json-formatter__modes"]}>
              <button
                className={`${styles["json-formatter__mode-button"]} ${outputMode === "formatted" ? styles["json-formatter__mode-button--active"] : ""}`}
                onClick={handleFormatClick}
              >
                Format
              </button>
              <button
                className={`${styles["json-formatter__mode-button"]} ${outputMode === "minified" ? styles["json-formatter__mode-button--active"] : ""}`}
                onClick={handleMinifyClick}
              >
                Minify
              </button>
              <button
                className={`${styles["json-formatter__mode-button"]} ${outputMode === "sorted" ? styles["json-formatter__mode-button--active"] : ""}`}
                onClick={handleSortClick}
              >
                Sort Keys
              </button>
            </div>

            {/* Output section */}
            <section className={styles["json-formatter__section"]}>
              <h2>Output</h2>

              <div className={styles["json-formatter__output-box"]}>
                <code className={styles["json-formatter__code"]}>{output}</code>
              </div>

              <div className={styles["json-formatter__action-buttons"]}>
                <button
                  className={styles["json-formatter__button"]}
                  onClick={handleCopyOutput}
                >
                  📋 Copy
                </button>
                <button
                  className={styles["json-formatter__button"]}
                  onClick={handleDownloadJSON}
                >
                  ⬇️ Download JSON
                </button>
                <button
                  className={styles["json-formatter__button"]}
                  onClick={handleCopyToCSV}
                >
                  📊 Copy as CSV
                </button>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className={styles["json-formatter__footer"]}>
        <p>
          <small>
            Free tool by{" "}
            <a href="/" className={styles["json-formatter__link"]}>
              topaitoolrank.com
            </a>
          </small>
        </p>
      </footer>
    </div>
  );
}

