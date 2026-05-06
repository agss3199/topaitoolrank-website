"use client";

/**
 * WhatsApp Message Formatter — BUILD Phase (todo 101)
 *
 * Converts markdown-style formatting to WhatsApp formatting:
 * **bold** → *bold*
 * _italic_ → _italic_
 * `code` → ```code```
 * ~~strikethrough~~ → ~~strikethrough~~
 */

import { useState, useEffect } from "react";
import styles from "./styles.css";
import { markdownToWhatsApp, MARKDOWN_SYNTAX_HINTS } from "./lib/markdown-to-whatsapp";
import Preview from "./components/Preview";

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

  // Process markdown to WhatsApp formatting in real-time
  useEffect(() => {
    if (input.trim()) {
      const converted = markdownToWhatsApp(input);
      setResult(converted);
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

  const isEmptyInput = !input || input.trim().length === 0;

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
        <Preview result={result} isEmptyInput={isEmptyInput} />
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

export const metadata = {
  title:
    "WhatsApp Message Formatter - Convert Markdown to WhatsApp Formatting",
  description:
    "Free online tool to convert markdown formatting (**bold**, _italic_, `code`) to WhatsApp compatible syntax. No signup required.",
  keywords: [
    "WhatsApp formatter",
    "markdown to WhatsApp",
    "message formatter",
    "text formatting",
  ],
};
