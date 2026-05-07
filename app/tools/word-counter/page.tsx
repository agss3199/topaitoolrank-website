"use client";

export const dynamicParams = false;


import { useState, useEffect } from "react";
import styles from "./styles.css";
import { analyzeText } from "./lib/text-analyzer";
import { copyToClipboard, saveTolocalStorage, loadFromlocalStorage } from "./lib/utils";

const LOCALSTORAGE_KEY = "wc-text";

export default function WordCounterPage() {
  const [text, setText] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const stats = analyzeText(text);

  useEffect(() => {
    const saved = loadFromlocalStorage(LOCALSTORAGE_KEY);
    if (saved) setText(saved);
  }, []);

  useEffect(() => {
    saveTolocalStorage(LOCALSTORAGE_KEY, text);
  }, [text]);

  const handleCopy = async () => {
    const summary = `Words: ${stats.words} | Characters: ${stats.characters} | Sentences: ${stats.sentences}`;
    const success = await copyToClipboard(summary);
    if (success) {
      setCopyMessage("✓ Copied!");
      setTimeout(() => setCopyMessage(""), 2000);
    }
  };

  // @ts-ignore CSS Module types
  return (
    <div className={styles["word-counter"]}>
      <header className={styles["word-counter__header"]}>
        <h1>Word Counter & Text Analyzer</h1>
        <p>Real-time text statistics and analysis</p>
      </header>

      <main className={styles["word-counter__main"]}>
        <section className={styles["word-counter__section"]}>
          <label className={styles["word-counter__label"]}>Paste your text</label>
          <textarea
            className={styles["word-counter__textarea"]}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your text here..."
          />
          <div className={styles["word-counter__button-group"]}>
            <button
              className={styles["word-counter__button"]}
              onClick={() => setText("")}
              disabled={!text}
            >
              Clear
            </button>
            <button
              className={styles["word-counter__button"]}
              onClick={handleCopy}
              disabled={!text}
            >
              📋 Copy Stats
            </button>
          </div>
          {copyMessage && <div className={styles["word-counter__success"]}>{copyMessage}</div>}
        </section>

        <section className={styles["word-counter__section"]}>
          <h2>Statistics</h2>
          <div className={styles["word-counter__stats-grid"]}>
            <div className={styles["word-counter__stat"]}>
              <div className={styles["word-counter__stat-value"]}>{stats.words}</div>
              <div className={styles["word-counter__stat-label"]}>Words</div>
            </div>
            <div className={styles["word-counter__stat"]}>
              <div className={styles["word-counter__stat-value"]}>{stats.characters}</div>
              <div className={styles["word-counter__stat-label"]}>Characters</div>
            </div>
            <div className={styles["word-counter__stat"]}>
              <div className={styles["word-counter__stat-value"]}>{stats.charactersNoSpaces}</div>
              <div className={styles["word-counter__stat-label"]}>No Spaces</div>
            </div>
            <div className={styles["word-counter__stat"]}>
              <div className={styles["word-counter__stat-value"]}>{stats.sentences}</div>
              <div className={styles["word-counter__stat-label"]}>Sentences</div>
            </div>
            <div className={styles["word-counter__stat"]}>
              <div className={styles["word-counter__stat-value"]}>{stats.paragraphs}</div>
              <div className={styles["word-counter__stat-label"]}>Paragraphs</div>
            </div>
            <div className={styles["word-counter__stat"]}>
              <div className={styles["word-counter__stat-value"]}>
                {stats.readingTimeMinutes}:{stats.readingTimeSeconds.toString().padStart(2, "0")}
              </div>
              <div className={styles["word-counter__stat-label"]}>Read Time</div>
            </div>
          </div>

          {stats.topWords.length > 0 && (
            <>
              <h3>Top 10 Words</h3>
              <div className={styles["word-counter__word-list"]}>
                {stats.topWords.map((item) => (
                  <div key={item.word} className={styles["word-counter__word-item"]}>
                    <span>{item.word}</span>
                    <span className={styles["word-counter__word-count"]}>{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      <footer className={styles["word-counter__footer"]}>
        <p>
          <small>
            Free tool by{" "}
            <a href="/" className={styles["word-counter__link"]}>
              topaitoolrank.com
            </a>
          </small>
        </p>
      </footer>
    </div>
  );
}

