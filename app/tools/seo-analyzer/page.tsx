"use client";

export const dynamicParams = false;


import { useState, useMemo } from "react";
import styles from "./styles.css";
import {
  isValidURL,
  checkSSL,
  analyzeTitle,
  analyzeDescription,
  generateSEOScore,
  getSuggestions,
  type SEOMetrics,
} from "./lib/seo-analyzer";
import { fetchPageMetadata, getScoreColor, getScoreLabel, copyToClipboard, downloadAsFile } from "./lib/utils";

export default function SEOAnalyzerPage() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<SEOMetrics | null>(null);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const isValidInput = useMemo(() => isValidURL(url), [url]);

  const suggestions = useMemo(() => {
    return metrics ? getSuggestions(metrics) : [];
  }, [metrics]);

  const handleAnalyze = async () => {
    if (!isValidInput) return;

    setIsLoading(true);
    setError("");
    setMetrics(null);

    try {
      const data = await fetchPageMetadata(url);

      if (!data) {
        setError(
          "Could not analyze this URL. Make sure it's publicly accessible and the server allows requests."
        );
        setIsLoading(false);
        return;
      }

      const title = analyzeTitle(data.title || "");
      const description = analyzeDescription(data.description || "");

      const analysisMetrics: SEOMetrics = {
        title: {
          text: data.title || "",
          ...title,
        },
        description: {
          text: data.description || "",
          ...description,
        },
        headings: {
          h1Count: data.h1Count || 0,
          h2Count: data.h2Count || 0,
          h3Count: data.h3Count || 0,
          optimal: (data.h1Count || 0) === 1 && (data.h2Count || 0) > 0,
        },
        content: {
          wordCount: data.wordCount || 0,
          readabilityScore: 75,
          status: (data.wordCount || 0) > 300 ? "Good" : "Improve",
        },
        technical: {
          hasSSL: checkSSL(url),
          hasCanonical: data.hasCanonical || false,
          hasMobileViewport: data.hasMobileViewport || false,
        },
        score: 0,
      };

      analysisMetrics.score = generateSEOScore(analysisMetrics);
      setMetrics(analysisMetrics);
    } catch (err) {
      setError("Failed to analyze URL. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyReport = async () => {
    if (!metrics) return;

    const report = `SEO Analysis Report
URL: ${url}
Overall Score: ${metrics.score}/100

Title: ${metrics.title?.text || "Missing"}
- Length: ${metrics.title?.length || 0} characters
- Status: ${metrics.title?.status}

Meta Description: ${metrics.description?.text || "Missing"}
- Length: ${metrics.description?.length || 0} characters
- Status: ${metrics.description?.status}

Headings:
- H1: ${metrics.headings?.h1Count || 0}
- H2: ${metrics.headings?.h2Count || 0}
- H3: ${metrics.headings?.h3Count || 0}

Content:
- Words: ${metrics.content?.wordCount || 0}
- Readability: ${metrics.content?.readabilityScore || 0}/100

Technical:
- HTTPS: ${metrics.technical?.hasSSL ? "✓" : "✕"}
- Mobile Viewport: ${metrics.technical?.hasMobileViewport ? "✓" : "✕"}
- Canonical: ${metrics.technical?.hasCanonical ? "✓" : "✕"}

Suggestions:
${suggestions.map(s => `- ${s}`).join("\n")}`;

    const success = await copyToClipboard(report);
    if (success) {
      setCopyMessage("✓ Report copied!");
      setTimeout(() => setCopyMessage(""), 2000);
    }
  };

  const handleDownloadReport = () => {
    if (!metrics) return;
    const report = `SEO Analysis for: ${url}\nScore: ${metrics.score}/100\n\nTitle: ${metrics.title?.text}\nDescription: ${metrics.description?.text}`;
    downloadAsFile(report, `seo-report-${Date.now()}.txt`);
  };

  // @ts-ignore CSS Module types
  return (
    <div className={styles["seo-analyzer"]}>
      <header className={styles["seo-analyzer__header"]}>
        <h1>SEO Analyzer</h1>
        <p>Analyze any URL for SEO optimization opportunities</p>
      </header>

      <main className={styles["seo-analyzer__main"]}>
        {/* Input section */}
        <section className={styles["seo-analyzer__input-section"]}>
          <div className={styles["seo-analyzer__input-group"]}>
            <input
              type="url"
              placeholder="Enter URL to analyze (e.g., https://example.com)"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyPress={e => e.key === "Enter" && isValidInput && handleAnalyze()}
              className={styles["seo-analyzer__input"]}
            />
            <button
              onClick={handleAnalyze}
              disabled={!isValidInput || isLoading}
              className={styles["seo-analyzer__analyze-btn"]}
            >
              {isLoading ? "Analyzing..." : "Analyze"}
            </button>
          </div>

          {error && <div className={styles["seo-analyzer__error"]}>{error}</div>}
        </section>

        {/* Results section */}
        {metrics && (
          <>
            {/* Score card */}
            <section className={styles["seo-analyzer__score-section"]}>
              <div
                className={styles["seo-analyzer__score-circle"]}
                style={{
                  borderColor: getScoreColor(metrics.score),
                  color: getScoreColor(metrics.score),
                }}
              >
                <div className={styles["seo-analyzer__score-number"]}>{metrics.score}</div>
                <div className={styles["seo-analyzer__score-label"]}>
                  {getScoreLabel(metrics.score)}
                </div>
              </div>

              <div className={styles["seo-analyzer__metrics-grid"]}>
                <div className={styles["seo-analyzer__metric"]}>
                  <span className={styles["seo-analyzer__metric-label"]}>Title</span>
                  <span
                    className={
                      metrics.title?.optimal
                        ? styles["seo-analyzer__metric-good"]
                        : styles["seo-analyzer__metric-warning"]
                    }
                  >
                    {metrics.title?.optimal ? "✓" : "⚠"}
                  </span>
                </div>
                <div className={styles["seo-analyzer__metric"]}>
                  <span className={styles["seo-analyzer__metric-label"]}>Description</span>
                  <span
                    className={
                      metrics.description?.optimal
                        ? styles["seo-analyzer__metric-good"]
                        : styles["seo-analyzer__metric-warning"]
                    }
                  >
                    {metrics.description?.optimal ? "✓" : "⚠"}
                  </span>
                </div>
                <div className={styles["seo-analyzer__metric"]}>
                  <span className={styles["seo-analyzer__metric-label"]}>HTTPS</span>
                  <span
                    className={
                      metrics.technical?.hasSSL
                        ? styles["seo-analyzer__metric-good"]
                        : styles["seo-analyzer__metric-warning"]
                    }
                  >
                    {metrics.technical?.hasSSL ? "✓" : "✕"}
                  </span>
                </div>
                <div className={styles["seo-analyzer__metric"]}>
                  <span className={styles["seo-analyzer__metric-label"]}>Mobile</span>
                  <span
                    className={
                      metrics.technical?.hasMobileViewport
                        ? styles["seo-analyzer__metric-good"]
                        : styles["seo-analyzer__metric-warning"]
                    }
                  >
                    {metrics.technical?.hasMobileViewport ? "✓" : "✕"}
                  </span>
                </div>
              </div>
            </section>

            {/* Details */}
            <section className={styles["seo-analyzer__details"]}>
              <h2 className={styles["seo-analyzer__details-title"]}>Details</h2>

              <div className={styles["seo-analyzer__detail-item"]}>
                <h3>Title Tag</h3>
                <p>{metrics.title?.text || "Not found"}</p>
                <small>
                  {metrics.title?.length} characters - {metrics.title?.status}
                </small>
              </div>

              <div className={styles["seo-analyzer__detail-item"]}>
                <h3>Meta Description</h3>
                <p>{metrics.description?.text || "Not found"}</p>
                <small>
                  {metrics.description?.length} characters - {metrics.description?.status}
                </small>
              </div>

              <div className={styles["seo-analyzer__detail-item"]}>
                <h3>Headings</h3>
                <p>
                  H1: {metrics.headings?.h1Count} | H2: {metrics.headings?.h2Count} | H3:{" "}
                  {metrics.headings?.h3Count}
                </p>
              </div>

              <div className={styles["seo-analyzer__detail-item"]}>
                <h3>Content</h3>
                <p>{metrics.content?.wordCount || 0} words</p>
              </div>
            </section>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <section className={styles["seo-analyzer__suggestions"]}>
                <h2 className={styles["seo-analyzer__suggestions-title"]}>
                  Improvement Suggestions
                </h2>
                <ul className={styles["seo-analyzer__suggestions-list"]}>
                  {suggestions.map((suggestion, idx) => (
                    <li key={idx}>{suggestion}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Actions */}
            <div className={styles["seo-analyzer__actions"]}>
              <button
                onClick={handleCopyReport}
                className={styles["seo-analyzer__action-btn"]}
              >
                📋 Copy Report
              </button>
              <button
                onClick={handleDownloadReport}
                className={styles["seo-analyzer__action-btn"]}
              >
                ⬇️ Download Report
              </button>
            </div>

            {copyMessage && <div className={styles["seo-analyzer__message"]}>{copyMessage}</div>}
          </>
        )}
      </main>

      <footer className={styles["seo-analyzer__footer"]}>
        <p>
          <small>
            Free tool by{" "}
            <a href="/" className={styles["seo-analyzer__link"]}>
              topaitoolrank.com
            </a>
          </small>
        </p>
      </footer>
    </div>
  );
}

