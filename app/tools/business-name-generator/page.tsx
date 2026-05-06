"use client";

/**
 * Business Name Generator - Main Page
 * Generate creative business names using AI
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import styles from "./styles.css";
import {
  generateBusinessNames,
  GENERATION_STYLES,
  INDUSTRIES,
  validateRequest,
  type GenerationRequest,
  type GeneratedName,
  type GenerationResponse,
} from "./lib/business-name-generator";

const LOCALSTORAGE_KEY = "bng-params";

export default function BusinessNameGeneratorPage() {
  const [keywords, setKeywords] = useState<string[]>([""]);
  const [style, setStyle] = useState<"professional" | "creative" | "descriptive" | "playful">(
    "creative"
  );
  const [industry, setIndustry] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedNames, setGeneratedNames] = useState<GeneratedName[]>([]);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCALSTORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setKeywords(parsed.keywords || [""]);
        setStyle(parsed.style || "creative");
        setIndustry(parsed.industry || "");
        setTargetAudience(parsed.targetAudience || "");
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Save to localStorage when params change
  useEffect(() => {
    localStorage.setItem(
      LOCALSTORAGE_KEY,
      JSON.stringify({
        keywords: keywords.filter(k => k.trim()),
        style,
        industry,
        targetAudience,
      })
    );
  }, [keywords, style, industry, targetAudience]);

  // Validate current form state
  const validation = useMemo(() => {
    return validateRequest({
      keywords: keywords.filter(k => k.trim()),
      style,
      industry,
      targetAudience,
    });
  }, [keywords, style, industry, targetAudience]);

  const handleKeywordChange = (index: number, value: string) => {
    const newKeywords = [...keywords];
    newKeywords[index] = value;
    setKeywords(newKeywords);
  };

  const handleAddKeyword = () => {
    if (keywords.length < 5) {
      setKeywords([...keywords, ""]);
    }
  };

  const handleRemoveKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const handleGenerateNames = async () => {
    setError("");
    setIsLoading(true);

    try {
      const response = await generateBusinessNames({
        keywords: keywords.filter(k => k.trim()),
        style,
        industry,
        targetAudience,
        maxResults: 10,
      });

      if (response.success) {
        setGeneratedNames(response.names);
      } else {
        setError(response.error || "Failed to generate names");
        setGeneratedNames([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setGeneratedNames([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyName = async (name: string) => {
    const success = await navigator.clipboard
      .writeText(name)
      .then(() => true)
      .catch(() => false);

    if (success) {
      setCopyMessage("✓ Copied to clipboard!");
      setTimeout(() => setCopyMessage(""), 2000);
    }
  };

  const handleCopyAllNames = async () => {
    const text = generatedNames.map(n => n.name).join("\n");
    const success = await navigator.clipboard
      .writeText(text)
      .then(() => true)
      .catch(() => false);

    if (success) {
      setCopyMessage("✓ All names copied!");
      setTimeout(() => setCopyMessage(""), 2000);
    }
  };

  return (
    <div className={styles["business-name-generator"]}>
      <header className={styles["business-name-generator__header"]}>
        <h1>Business Name Generator</h1>
        <p>Generate creative business names powered by AI</p>
      </header>

      <main className={styles["business-name-generator__main"]}>
        {/* Input section */}
        <section className={styles["business-name-generator__section"]}>
          <h2 className={styles["business-name-generator__section-title"]}>
            Tell us about your business
          </h2>

          {/* Keywords */}
          <div className={styles["business-name-generator__field-group"]}>
            <label className={styles["business-name-generator__label"]}>
              Keywords <span className={styles["business-name-generator__required"]}>*</span>
            </label>
            <p className={styles["business-name-generator__hint"]}>
              Enter keywords that describe your business (max 5)
            </p>
            <div className={styles["business-name-generator__keywords"]}>
              {keywords.map((keyword, index) => (
                <div
                  key={index}
                  className={styles["business-name-generator__keyword-input"]}
                >
                  <input
                    type="text"
                    className={styles["business-name-generator__input"]}
                    placeholder={`Keyword ${index + 1}`}
                    value={keyword}
                    onChange={e => handleKeywordChange(index, e.target.value)}
                    maxLength={50}
                  />
                  {keywords.length > 1 && (
                    <button
                      className={styles["business-name-generator__remove-btn"]}
                      onClick={() => handleRemoveKeyword(index)}
                      title="Remove keyword"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {keywords.length < 5 && (
              <button
                className={styles["business-name-generator__add-keyword-btn"]}
                onClick={handleAddKeyword}
              >
                + Add another keyword
              </button>
            )}
          </div>

          {/* Style */}
          <div className={styles["business-name-generator__field-group"]}>
            <label htmlFor="style" className={styles["business-name-generator__label"]}>
              Style <span className={styles["business-name-generator__required"]}>*</span>
            </label>
            <select
              id="style"
              className={styles["business-name-generator__select"]}
              value={style}
              onChange={e =>
                setStyle(
                  e.target.value as "professional" | "creative" | "descriptive" | "playful"
                )
              }
            >
              {GENERATION_STYLES.map(s => (
                <option key={s.id} value={s.id}>
                  {s.label} - {s.description}
                </option>
              ))}
            </select>
          </div>

          {/* Industry */}
          <div className={styles["business-name-generator__field-group"]}>
            <label htmlFor="industry" className={styles["business-name-generator__label"]}>
              Industry <span className={styles["business-name-generator__required"]}>*</span>
            </label>
            <select
              id="industry"
              className={styles["business-name-generator__select"]}
              value={industry}
              onChange={e => setIndustry(e.target.value)}
            >
              <option value="">Select an industry</option>
              {INDUSTRIES.map(ind => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* Target Audience */}
          <div className={styles["business-name-generator__field-group"]}>
            <label htmlFor="audience" className={styles["business-name-generator__label"]}>
              Target Audience{" "}
              <span className={styles["business-name-generator__optional"]}>(optional)</span>
            </label>
            <input
              id="audience"
              type="text"
              className={styles["business-name-generator__input"]}
              placeholder="e.g., young professionals, families, tech-savvy users"
              value={targetAudience}
              onChange={e => setTargetAudience(e.target.value)}
              maxLength={100}
            />
            <p className={styles["business-name-generator__hint"]}>
              Who is your target customer? This helps personalize name suggestions
            </p>
          </div>

          {/* Error display */}
          {error && (
            <div className={styles["business-name-generator__error"]}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Generate button */}
          <button
            className={styles["business-name-generator__generate-btn"]}
            onClick={handleGenerateNames}
            disabled={!validation.valid || isLoading}
          >
            {isLoading ? "Generating..." : "Generate Names"}
          </button>

          {!validation.valid && (
            <div className={styles["business-name-generator__validation-error"]}>
              {validation.error}
            </div>
          )}
        </section>

        {/* Results section */}
        {generatedNames.length > 0 && (
          <>
            <section className={styles["business-name-generator__results-section"]}>
              <h2 className={styles["business-name-generator__section-title"]}>
                Generated Names ({generatedNames.length})
              </h2>

              <div className={styles["business-name-generator__results"]}>
                {generatedNames.map((nameItem, index) => (
                  <div
                    key={index}
                    className={styles["business-name-generator__name-card"]}
                  >
                    <div className={styles["business-name-generator__name-header"]}>
                      <h3 className={styles["business-name-generator__name"]}>
                        {nameItem.name}
                      </h3>
                      <button
                        className={styles["business-name-generator__copy-name-btn"]}
                        onClick={() => handleCopyName(nameItem.name)}
                        title="Copy name"
                      >
                        📋
                      </button>
                    </div>

                    <p className={styles["business-name-generator__explanation"]}>
                      {nameItem.explanation}
                    </p>

                    {nameItem.availability && (
                      <div className={styles["business-name-generator__availability"]}>
                        <span
                          className={
                            nameItem.availability === "available"
                              ? styles[
                                  "business-name-generator__availability--available"
                                ]
                              : nameItem.availability === "taken"
                                ? styles[
                                    "business-name-generator__availability--taken"
                                  ]
                                : styles[
                                    "business-name-generator__availability--unknown"
                                  ]
                          }
                        >
                          {nameItem.availability === "available" && "✓"}
                          {nameItem.availability === "taken" && "⚠"}
                          {nameItem.availability === "unknown" && "?"}
                          {` ${nameItem.availability.charAt(0).toUpperCase() + nameItem.availability.slice(1)}`}
                        </span>
                      </div>
                    )}

                    {nameItem.tags && nameItem.tags.length > 0 && (
                      <div className={styles["business-name-generator__tags"]}>
                        {nameItem.tags.map(tag => (
                          <span
                            key={tag}
                            className={styles["business-name-generator__tag"]}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className={styles["business-name-generator__actions"]}>
                <button
                  className={styles["business-name-generator__action-btn"]}
                  onClick={handleCopyAllNames}
                >
                  📋 Copy All
                </button>
              </div>

              {copyMessage && (
                <div className={styles["business-name-generator__copy-message"]}>
                  {copyMessage}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className={styles["business-name-generator__footer"]}>
        <p>
          <small>
            Free tool by{" "}
            <a href="/" className={styles["business-name-generator__link"]}>
              topaitoolrank.com
            </a>
          </small>
        </p>
      </footer>
    </div>
  );
}

export const metadata = {
  title: "Business Name Generator - Free AI-Powered Tool",
  description:
    "Generate creative business names using AI. Get personalized suggestions based on your keywords, industry, and style preferences.",
  keywords: [
    "business name generator",
    "company name ideas",
    "startup names",
    "brand naming",
    "business naming tool",
    "AI business names",
  ],
};
