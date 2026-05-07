"use client";

nexport const dynamicParams = false;


/**
 * WhatsApp Message Formatter — BUILD + WIRE Phases (todos 101-102)
 *
 * Converts markdown-style formatting to WhatsApp formatting:
 * **bold** → *bold*
 * _italic_ → _italic_
 * `code` → ```code```
 * ~~strikethrough~~ → ~~strikethrough~~
 *
 * WIRE additions (todo 102):
 * - localStorage persistence (load/save draft)
 * - Copy to clipboard button
 * - Download as file button
 */

import { useState, useEffect } from "react";
import styles from "./styles.css";
import { markdownToWhatsApp, MARKDOWN_SYNTAX_HINTS } from "./lib/markdown-to-whatsapp";
import { downloadAsFile, copyToClipboard, loadFromlocalStorage, saveTolocalStorage } from "./lib/utils";
import Preview from "./components/Preview";

const LOCALSTORAGE_KEY = "wam-draft";
const LOCALSTORAGE_FORMATTED_KEY = "wam-formatted";

export default function WAMFormatterPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState({
    formatted: "",
    patterns: {
      bold: 0,
      italic: 0,
      code: 0,
      boldItalic: 0,
      strikethrough: 0,
      monospace: 0,
    },
  });
  const [copyMessage, setCopyMessage] = useState("");

  // Load draft from localStorage on mount
  useEffect(() => {
    const saved = loadFromlocalStorage(LOCALSTORAGE_KEY);
    if (saved) {
      setInput(saved);
    }
  }, []);

  // Save draft to localStorage when input changes
  useEffect(() => {
    if (input.trim()) {
      saveTolocalStorage(LOCALSTORAGE_KEY, input);
    }
  }, [input]);

  // Process markdown to WhatsApp formatting in real-time
  useEffect(() => {
    if (input.trim()) {
      const converted = markdownToWhatsApp(input);
      setResult(converted);
      // Also save formatted version for download
      saveTolocalStorage(LOCALSTORAGE_FORMATTED_KEY, converted.formatted);
    } else {
      setResult({
        formatted: "",
        patterns: {
          bold: 0,
          italic: 0,
          code: 0,
          boldItalic: 0,
          strikethrough: 0,
          monospace: 0,
        },
      });
    }
  }, [input]);

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!result.formatted) return;
    const success = await copyToClipboard(result.formatted);
    if (success) {
      setCopyMessage("✓ Copied to clipboard!");
      setTimeout(() => setCopyMessage(""), 3000);
    } else {
      setCopyMessage("✗ Copy failed");
      setTimeout(() => setCopyMessage(""), 3000);
    }
  };

  // Handle download
  const handleDownload = () => {
    if (!result.formatted) return;
    downloadAsFile(result.formatted, "whatsapp-message.txt");
  };

  const isEmptyInput = !input || input.trim().length === 0;

  // @ts-ignore CSS Module types
  return (
    <div className={styles["whatsapp-message-formatter"]}>
      <header className={styles["whatsapp-message-formatter__header"]}>
        <h1>WhatsApp Message Formatter</h1>
        <p>Convert markdown formatting to WhatsApp compatible syntax</p>
      </header>

      <main className={styles["whatsapp-message-formatter__main"]}>
        {/* Input section */}
        <div className={styles["whatsapp-message-formatter__section"]}>
          <h2>Markdown Input</h2>

          {/* Syntax hints */}
          <div className={styles["whatsapp-message-formatter__hints"]}>
            <h3>Supported Syntax</h3>
            <ul className={styles["whatsapp-message-formatter__hint-list"]}>
              {MARKDOWN_SYNTAX_HINTS.map((hint) => (
                <li
                  key={hint.markdown}
                  className={styles["whatsapp-message-formatter__hint-item"]}
                >
                  <span className={styles["whatsapp-message-formatter__hint-code"]}>
                    {hint.markdown}
                  </span>
                  <span> → </span>
                  <span className={styles["whatsapp-message-formatter__hint-code"]}>
                    {hint.whatsapp}
                  </span>
                  <span> ({hint.description})</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Input textarea */}
          <label
            className={styles["whatsapp-message-formatter__label"]}
            htmlFor="markdown-input"
          >
            Paste your markdown-formatted text
          </label>
          <textarea
            id="markdown-input"
            className={styles["whatsapp-message-formatter__textarea"]}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Example:\n\n**Hello** _world_!\n\n\`code example\`\n\n~~strikethrough~~`}
          />

          {copyMessage && (
            <div className={styles["whatsapp-message-formatter__status--success"]}>
              {copyMessage}
            </div>
          )}

          <div className={styles["whatsapp-message-formatter__button-group"]}>
            <button
              className={styles["whatsapp-message-formatter__button"]}
              onClick={() => setInput("")}
              disabled={isEmptyInput}
              title="Clear the input text"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Preview section */}
        <Preview
          result={result}
          isEmptyInput={isEmptyInput}
          onCopy={handleCopy}
          onDownload={handleDownload}
        />
      </main>

      <footer className={styles["whatsapp-message-formatter__footer"]}>
        <p>
          <small>
            Free tool by{" "}
            <a href="/" className={styles["whatsapp-message-formatter__link"]}>
              topaitoolrank.com
            </a>
            . No signup required.
          </small>
        </p>
      </footer>
    </div>
  );
}

