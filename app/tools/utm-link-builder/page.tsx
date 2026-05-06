"use client";

/**
 * UTM Link Builder - Main Page
 * Create trackable URLs with UTM parameters for analytics
 */

import { useState, useEffect, useMemo } from "react";
import styles from "./styles.css";
import {
  validateUTMParams,
  buildUTMURL,
  getURLLength,
  getShortenerRecommendation,
  UTM_PRESETS,
  type UTMParams,
} from "./lib/utm-builder";

const LOCALSTORAGE_KEY = "ulb-params";

export default function UTMLinkBuilderPage() {
  const [params, setParams] = useState<UTMParams>({
    url: "",
    source: "",
    medium: "",
    campaign: "",
    content: "",
    term: "",
  });

  const [generatedURL, setGeneratedURL] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCALSTORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setParams(parsed);
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Save to localStorage when params change
  useEffect(() => {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(params));
  }, [params]);

  // Validate and generate URL
  const validation = useMemo(() => validateUTMParams(params), [params]);

  const urlStats = useMemo(() => {
    if (!validation.valid) return null;
    return getURLLength(params);
  }, [params, validation]);

  const shortenerRecommendation = useMemo(() => {
    if (!urlStats) return null;
    return getShortenerRecommendation(urlStats.withUTM);
  }, [urlStats]);

  const handleParamChange = (key: keyof UTMParams, value: string) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Generate URL when parameters are valid
  useEffect(() => {
    if (validation.valid) {
      setGeneratedURL(buildUTMURL(params));
    } else {
      setGeneratedURL("");
    }
  }, [params, validation]);

  return (
    <div className={styles["utm-link-builder"]}>
      <header className={styles["utm-link-builder__header"]}>
        <h1>UTM Link Builder</h1>
        <p>Create trackable URLs with UTM parameters for better analytics</p>
      </header>

      <main className={styles["utm-link-builder__main"]}>
        {/* Input form */}
        <section className={styles["utm-link-builder__form-section"]}>
          <h2 className={styles["utm-link-builder__section-title"]}>Build Your UTM Link</h2>

          {/* URL input */}
          <div className={styles["utm-link-builder__field"]}>
            <label htmlFor="url" className={styles["utm-link-builder__label"]}>
              URL <span className={styles["utm-link-builder__required"]}>*</span>
            </label>
            <input
              id="url"
              type="text"
              className={styles["utm-link-builder__input"]}
              placeholder="https://example.com/page"
              value={params.url}
              onChange={(e) => handleParamChange("url", e.target.value)}
            />
            <p className={styles["utm-link-builder__hint"]}>
              Full URL where you want to send traffic (must start with http:// or https://)
            </p>
          </div>

          {/* Source input */}
          <div className={styles["utm-link-builder__field"]}>
            <label htmlFor="source" className={styles["utm-link-builder__label"]}>
              Traffic Source (utm_source) <span className={styles["utm-link-builder__required"]}>*</span>
            </label>
            <input
              id="source"
              type="text"
              className={styles["utm-link-builder__input"]}
              placeholder="e.g., google, facebook, newsletter"
              value={params.source}
              onChange={(e) => handleParamChange("source", e.target.value)}
              list="sources-list"
            />
            <datalist id="sources-list">
              {UTM_PRESETS.sources.map((src) => (
                <option key={src} value={src} />
              ))}
            </datalist>
            <p className={styles["utm-link-builder__hint"]}>Where the traffic comes from</p>
          </div>

          {/* Medium input */}
          <div className={styles["utm-link-builder__field"]}>
            <label htmlFor="medium" className={styles["utm-link-builder__label"]}>
              Medium (utm_medium) <span className={styles["utm-link-builder__required"]}>*</span>
            </label>
            <input
              id="medium"
              type="text"
              className={styles["utm-link-builder__input"]}
              placeholder="e.g., cpc, organic, email, social"
              value={params.medium}
              onChange={(e) => handleParamChange("medium", e.target.value)}
              list="mediums-list"
            />
            <datalist id="mediums-list">
              {UTM_PRESETS.mediums.map((med) => (
                <option key={med} value={med} />
              ))}
            </datalist>
            <p className={styles["utm-link-builder__hint"]}>Marketing channel or medium</p>
          </div>

          {/* Campaign input */}
          <div className={styles["utm-link-builder__field"]}>
            <label htmlFor="campaign" className={styles["utm-link-builder__label"]}>
              Campaign (utm_campaign) <span className={styles["utm-link-builder__required"]}>*</span>
            </label>
            <input
              id="campaign"
              type="text"
              className={styles["utm-link-builder__input"]}
              placeholder="e.g., spring_sale, product_launch"
              value={params.campaign}
              onChange={(e) => handleParamChange("campaign", e.target.value)}
            />
            <p className={styles["utm-link-builder__hint"]}>Specific campaign or promotion name</p>
          </div>

          {/* Content input (optional) */}
          <div className={styles["utm-link-builder__field"]}>
            <label htmlFor="content" className={styles["utm-link-builder__label"]}>
              Content (utm_content) <span className={styles["utm-link-builder__optional"]}>(optional)</span>
            </label>
            <input
              id="content"
              type="text"
              className={styles["utm-link-builder__input"]}
              placeholder="e.g., banner_v1, text_link"
              value={params.content}
              onChange={(e) => handleParamChange("content", e.target.value)}
            />
            <p className={styles["utm-link-builder__hint"]}>Ad variant or content identifier</p>
          </div>

          {/* Term input (optional) */}
          <div className={styles["utm-link-builder__field"]}>
            <label htmlFor="term" className={styles["utm-link-builder__label"]}>
              Term (utm_term) <span className={styles["utm-link-builder__optional"]}>(optional)</span>
            </label>
            <input
              id="term"
              type="text"
              className={styles["utm-link-builder__input"]}
              placeholder="e.g., blue+running+shoes"
              value={params.term}
              onChange={(e) => handleParamChange("term", e.target.value)}
            />
            <p className={styles["utm-link-builder__hint"]}>Paid keyword for paid search campaigns</p>
          </div>

          {/* Error messages */}
          {!validation.valid && (
            <div className={styles["utm-link-builder__errors"]}>
              <p className={styles["utm-link-builder__error-title"]}>Please fix the following:</p>
              <ul className={styles["utm-link-builder__error-list"]}>
                {validation.errors.map((error, idx) => (
                  <li key={idx} className={styles["utm-link-builder__error-item"]}>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Output section */}
        {validation.valid && generatedURL && (
          <>
            <section className={styles["utm-link-builder__output-section"]}>
              <h2 className={styles["utm-link-builder__section-title"]}>Generated UTM Link</h2>

              <div className={styles["utm-link-builder__output-box"]}>
                <div className={styles["utm-link-builder__output-url"]}>
                  <code>{generatedURL}</code>
                </div>
                <p className={styles["utm-link-builder__output-hint"]}>
                  Use this link in your marketing campaigns to track traffic in Google Analytics
                </p>
              </div>

              {/* URL statistics */}
              {urlStats && (
                <div className={styles["utm-link-builder__stats"]}>
                  <div className={styles["utm-link-builder__stat-item"]}>
                    <span className={styles["utm-link-builder__stat-label"]}>Original URL:</span>
                    <span className={styles["utm-link-builder__stat-value"]}>{urlStats.original} chars</span>
                  </div>
                  <div className={styles["utm-link-builder__stat-item"]}>
                    <span className={styles["utm-link-builder__stat-label"]}>With UTM:</span>
                    <span className={styles["utm-link-builder__stat-value"]}>{urlStats.withUTM} chars</span>
                  </div>
                  <div className={styles["utm-link-builder__stat-item"]}>
                    <span className={styles["utm-link-builder__stat-label"]}>Added:</span>
                    <span className={styles["utm-link-builder__stat-value"]}>
                      +{urlStats.increase} chars
                    </span>
                  </div>
                </div>
              )}

              {/* Shortener recommendation */}
              {shortenerRecommendation && (
                <div
                  className={
                    shortenerRecommendation.recommended
                      ? styles["utm-link-builder__recommendation--warning"]
                      : styles["utm-link-builder__recommendation"]
                  }
                >
                  {shortenerRecommendation.recommended ? "📊 " : "✓ "}
                  {shortenerRecommendation.reason}
                </div>
              )}
            </section>

            {/* Quick reference */}
            <section className={styles["utm-link-builder__reference-section"]}>
              <h3 className={styles["utm-link-builder__reference-title"]}>Your UTM Parameters</h3>
              <div className={styles["utm-link-builder__parameter-grid"]}>
                <div className={styles["utm-link-builder__parameter"]}>
                  <span className={styles["utm-link-builder__param-name"]}>utm_source:</span>
                  <span className={styles["utm-link-builder__param-value"]}>{params.source}</span>
                </div>
                <div className={styles["utm-link-builder__parameter"]}>
                  <span className={styles["utm-link-builder__param-name"]}>utm_medium:</span>
                  <span className={styles["utm-link-builder__param-value"]}>{params.medium}</span>
                </div>
                <div className={styles["utm-link-builder__parameter"]}>
                  <span className={styles["utm-link-builder__param-name"]}>utm_campaign:</span>
                  <span className={styles["utm-link-builder__param-value"]}>{params.campaign}</span>
                </div>
                {params.content && (
                  <div className={styles["utm-link-builder__parameter"]}>
                    <span className={styles["utm-link-builder__param-name"]}>utm_content:</span>
                    <span className={styles["utm-link-builder__param-value"]}>{params.content}</span>
                  </div>
                )}
                {params.term && (
                  <div className={styles["utm-link-builder__parameter"]}>
                    <span className={styles["utm-link-builder__param-name"]}>utm_term:</span>
                    <span className={styles["utm-link-builder__param-value"]}>{params.term}</span>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      <footer className={styles["utm-link-builder__footer"]}>
        <p>
          <small>
            Free tool by{" "}
            <a href="/" className={styles["utm-link-builder__link"]}>
              topaitoolrank.com
            </a>
          </small>
        </p>
      </footer>
    </div>
  );
}

export const metadata = {
  title: "UTM Link Builder - Free Online Tool",
  description:
    "Create trackable URLs with UTM parameters for Google Analytics. Build campaign links for marketing tracking.",
  keywords: [
    "UTM link builder",
    "UTM parameters",
    "Google Analytics",
    "tracking URLs",
    "campaign tracking",
    "marketing links",
  ],
};
