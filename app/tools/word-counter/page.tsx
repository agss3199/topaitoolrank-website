"use client";

export const dynamic = 'force-dynamic';
export const dynamicParams = false;

import { useState, useEffect } from "react";
import Header from "@/app/components/Header";
import Footer from "../lib/Footer";
import styles from "./styles.css";
import { analyzeText } from "./lib/text-analyzer";
import { copyToClipboard, saveTolocalStorage, loadFromlocalStorage } from "./lib/utils";
import { cls } from "../lib/css-module-safe";
import BreadcrumbSchema from "../lib/BreadcrumbSchema";
import { ArticleSection } from "../lib/ArticleSection";
import FAQSchema from "../lib/FAQSchema";

const LOCALSTORAGE_KEY = "wc-text";

export default function WordCounterPage() {
  const [text, setText] = useState("");
  const [articleContent, setArticleContent] = useState<string>("");
  const [articleLoading, setArticleLoading] = useState(true);
  const [articleError, setArticleError] = useState<string>("");
  const [copyMessage, setCopyMessage] = useState("");
  const stats = analyzeText(text);

  useEffect(() => {
    const saved = loadFromlocalStorage(LOCALSTORAGE_KEY);
    if (saved) setText(saved);
  }, []);

  useEffect(() => {
    saveTolocalStorage(LOCALSTORAGE_KEY, text);
  }, [text]);
  // Load article content
  useEffect(() => {
    const loadArticle = async () => {
      try {
        const res = await fetch('/api/tools/article?tool=word-counter');
        if (res.ok) {
          const data = await res.json();
          setArticleContent(data.content || '');
          setArticleError('');
        } else {
          setArticleError('Failed to load article: ' + (res.statusText || 'Unknown error'));
          setArticleContent('');
        }
      } catch (error) {
        console.error('Failed to load article:', error);
        setArticleError('Unable to load article. Please refresh the page.');
        setArticleContent('');
      } finally {
        setArticleLoading(false);
      }
    };
    loadArticle();
  }, []);

  const handleCopy = async () => {
    const summary = `Words: ${stats.words} | Characters: ${stats.characters} | Sentences: ${stats.sentences}`;
    const success = await copyToClipboard(summary);
    if (success) {
      setCopyMessage("✓ Copied!");
      setTimeout(() => setCopyMessage(""), 2000);
    }
  };

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://topaitoolrank.com' },
          { name: 'Tools', url: 'https://topaitoolrank.com/tools' },
          { name: 'Word Counter', url: 'https://topaitoolrank.com/tools/word-counter' },
        ]}
      />
      <Header />
      <div className={cls(styles, "word-counter")}>
        <header className={cls(styles, "word-counter__header")}>
          <h1>Word Counter & Text Analyzer</h1>
          <p>Real-time text statistics and analysis</p>
        </header>

        <main className={cls(styles, "word-counter__main")}>
        <section className={cls(styles, "word-counter__section")}>
          <label className={cls(styles, "word-counter__label")}>Paste your text</label>
          <textarea
            className={cls(styles, "word-counter__textarea")}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your text here..."
          />
          <div className={cls(styles, "word-counter__button-group")}>
            <button
              className={cls(styles, "word-counter__button")}
              onClick={() => setText("")}
              disabled={!text}
            >
              Clear
            </button>
            <button
              className={cls(styles, "word-counter__button")}
              onClick={handleCopy}
              disabled={!text}
            >
              📋 Copy Stats
            </button>
          </div>
          {copyMessage && <div className={cls(styles, "word-counter__success")}>{copyMessage}</div>}
        </section>

        <section className={cls(styles, "word-counter__section")}>
          <h2>Statistics</h2>
          <div className={cls(styles, "word-counter__stats-grid")}>
            <div className={cls(styles, "word-counter__stat")}>
              <div className={cls(styles, "word-counter__stat-value")}>{stats.words}</div>
              <div className={cls(styles, "word-counter__stat-label")}>Words</div>
            </div>
            <div className={cls(styles, "word-counter__stat")}>
              <div className={cls(styles, "word-counter__stat-value")}>{stats.characters}</div>
              <div className={cls(styles, "word-counter__stat-label")}>Characters</div>
            </div>
            <div className={cls(styles, "word-counter__stat")}>
              <div className={cls(styles, "word-counter__stat-value")}>{stats.charactersNoSpaces}</div>
              <div className={cls(styles, "word-counter__stat-label")}>No Spaces</div>
            </div>
            <div className={cls(styles, "word-counter__stat")}>
              <div className={cls(styles, "word-counter__stat-value")}>{stats.sentences}</div>
              <div className={cls(styles, "word-counter__stat-label")}>Sentences</div>
            </div>
            <div className={cls(styles, "word-counter__stat")}>
              <div className={cls(styles, "word-counter__stat-value")}>{stats.paragraphs}</div>
              <div className={cls(styles, "word-counter__stat-label")}>Paragraphs</div>
            </div>
            <div className={cls(styles, "word-counter__stat")}>
              <div className={cls(styles, "word-counter__stat-value")}>
                {stats.readingTimeMinutes}:{stats.readingTimeSeconds.toString().padStart(2, "0")}
              </div>
              <div className={cls(styles, "word-counter__stat-label")}>Read Time</div>
            </div>
          </div>

          {stats.topWords.length > 0 && (
            <>
              <h3>Top 10 Words</h3>
              <div className={cls(styles, "word-counter__word-list")}>
                {stats.topWords.map((item) => (
                  <div key={item.word} className={cls(styles, "word-counter__word-item")}>
                    <span>{item.word}</span>
                    <span className={cls(styles, "word-counter__word-count")}>{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <footer className={cls(styles, "word-counter__footer")}>
          <p>
            <small>
              Free tool by{" "}
              <a href="/" className={cls(styles, "word-counter__link")}>
                topaitoolrank.com
              </a>
            </small>
          </p>
        </footer>
      </main>
    </div>
    {/* Article Section */}
      {articleError && (
        <div className={cls(styles, "word-counter__article-error")}>
          <p>{articleError}</p>
        </div>
      )}
      {!articleLoading && articleContent && (
        <div className={cls(styles, "word-counter__article-container")}>
          <ArticleSection content={articleContent} />
        </div>
      )}
      <FAQSchema
        questions={[
          { q: "What exactly does a word counter do and how is it different from built-in word counts?", a: "A word counter provides comprehensive metrics including word count, character count (with and without spaces), paragraph count, sentence count, and average sentence length. While most text editors have basic word counting, a dedicated word counter gives you detailed breakdowns across multiple metrics in one place, making it easier to analyze your content structure." },
          { q: "How does a word counter know what counts as a word?", a: "A word counter identifies words by looking for spaces and punctuation. Most counters treat contractions (like \"don't\") as single words and hyphenated words (like \"state-of-the-art\") as one or two words depending on the tool. Understanding these conventions helps you hit exact word count targets when precision matters." },
          { q: "Why should I use a word counter while writing instead of just checking at the end?", a: "Checking word count during your writing process keeps you aware of your progress and helps prevent last-minute panics. If you're targeting one thousand words and discover at the end you've only written seven hundred, you've wasted time. Periodic checks let you adjust your approach as you go." },
          { q: "Is accuracy important, and will different word counters give me different results?", a: "Yes, slight variations exist between different word counters depending on how they handle contractions, hyphenated words, and numbers. For critical assignments with strict word limits, use the same counter throughout or verify in the system where you'll be submitting the work." },
        ]}
      />
    <Footer />
    </>
  );
}

