"use client";

/**
 * Email Subject Line Tester - Main Page
 * Score and optimize email subject lines for better open rates
 */

import { useState, useEffect, useMemo } from "react";
import styles from "./styles.css";
import { scoreSubjectLine, getSubjectLineStatistics } from "./lib/subject-scorer";

const LOCALSTORAGE_KEY = "est-subject";

export default function EmailSubjectTesterPage() {
  const [subjectLine, setSubjectLine] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCALSTORAGE_KEY);
    if (saved) setSubjectLine(saved);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(LOCALSTORAGE_KEY, subjectLine);
  }, [subjectLine]);

  // Score and statistics
  const score = useMemo(() => scoreSubjectLine(subjectLine), [subjectLine]);
  const stats = useMemo(() => getSubjectLineStatistics(subjectLine), [subjectLine]);

  const getScoreColor = (scoreValue: number): string => {
    if (scoreValue >= 80) return "#10b981"; // green
    if (scoreValue >= 60) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  const getScoreTier = (scoreValue: number): string => {
    if (scoreValue >= 90) return "Excellent";
    if (scoreValue >= 80) return "Good";
    if (scoreValue >= 70) return "Fair";
    if (scoreValue >= 60) return "Needs Work";
    return "Poor";
  };

  return (
    <div className={styles["email-subject-tester"]}>
      <header className={styles["email-subject-tester__header"]}>
        <h1>Email Subject Line Tester</h1>
        <p>Score and optimize your subject lines for better open rates</p>
      </header>

      <main className={styles["email-subject-tester__main"]}>
        {/* Input section */}
        <section className={styles["email-subject-tester__input-section"]}>
          <div className={styles["email-subject-tester__field"]}>
            <label className={styles["email-subject-tester__label"]}>
              Paste Your Subject Line
            </label>
            <input
              type="text"
              className={styles["email-subject-tester__input"]}
              value={subjectLine}
              onChange={(e) => setSubjectLine(e.target.value)}
              placeholder="e.g., Your exclusive 50% discount expires today..."
              maxLength={100}
            />
            <div className={styles["email-subject-tester__counter"]}>
              {subjectLine.length}/100 characters
            </div>
          </div>
        </section>

        {subjectLine && (
          <>
            {/* Overall Score */}
            <section className={styles["email-subject-tester__score-section"]}>
              <div className={styles["email-subject-tester__overall-score"]}>
                <div
                  className={styles["email-subject-tester__score-circle"]}
                  style={{ borderColor: getScoreColor(score.overallScore) }}
                >
                  <span className={styles["email-subject-tester__score-value"]}>
                    {score.overallScore}
                  </span>
                </div>
                <div className={styles["email-subject-tester__score-info"]}>
                  <h3 className={styles["email-subject-tester__score-tier"]}>
                    {getScoreTier(score.overallScore)}
                  </h3>
                  <p className={styles["email-subject-tester__open-rate"]}>
                    Estimated Open Rate:{" "}
                    <strong>{score.estimatedOpenRate === "high" ? "🟢 High" : score.estimatedOpenRate === "medium" ? "🟡 Medium" : "🔴 Low"}</strong>
                  </p>
                </div>
              </div>
            </section>

            {/* Dimension Scores */}
            <section className={styles["email-subject-tester__dimensions"]}>
              <h3>Performance Breakdown</h3>
              <div className={styles["email-subject-tester__dimension-grid"]}>
                {/* Length */}
                <div className={styles["email-subject-tester__dimension"]}>
                  <div className={styles["email-subject-tester__dimension-header"]}>
                    <span className={styles["email-subject-tester__dimension-name"]}>Length</span>
                    <span className={styles["email-subject-tester__dimension-score"]}>
                      {score.length.score}%
                    </span>
                  </div>
                  <div className={styles["email-subject-tester__progress-bar"]}>
                    <div
                      className={styles["email-subject-tester__progress-fill"]}
                      style={{
                        width: `${score.length.score}%`,
                        backgroundColor: getScoreColor(score.length.score),
                      }}
                    />
                  </div>
                  <p className={styles["email-subject-tester__dimension-message"]}>
                    {score.length.message}
                  </p>
                </div>

                {/* Urgency */}
                <div className={styles["email-subject-tester__dimension"]}>
                  <div className={styles["email-subject-tester__dimension-header"]}>
                    <span className={styles["email-subject-tester__dimension-name"]}>Urgency</span>
                    <span className={styles["email-subject-tester__dimension-score"]}>
                      {score.urgency.score}%
                    </span>
                  </div>
                  <div className={styles["email-subject-tester__progress-bar"]}>
                    <div
                      className={styles["email-subject-tester__progress-fill"]}
                      style={{
                        width: `${score.urgency.score}%`,
                        backgroundColor: getScoreColor(score.urgency.score),
                      }}
                    />
                  </div>
                  <p className={styles["email-subject-tester__dimension-message"]}>
                    {score.urgency.message}
                  </p>
                </div>

                {/* Personalization */}
                <div className={styles["email-subject-tester__dimension"]}>
                  <div className={styles["email-subject-tester__dimension-header"]}>
                    <span className={styles["email-subject-tester__dimension-name"]}>
                      Personalization
                    </span>
                    <span className={styles["email-subject-tester__dimension-score"]}>
                      {score.personalization.score}%
                    </span>
                  </div>
                  <div className={styles["email-subject-tester__progress-bar"]}>
                    <div
                      className={styles["email-subject-tester__progress-fill"]}
                      style={{
                        width: `${score.personalization.score}%`,
                        backgroundColor: getScoreColor(score.personalization.score),
                      }}
                    />
                  </div>
                  <p className={styles["email-subject-tester__dimension-message"]}>
                    {score.personalization.message}
                  </p>
                </div>

                {/* Curiosity */}
                <div className={styles["email-subject-tester__dimension"]}>
                  <div className={styles["email-subject-tester__dimension-header"]}>
                    <span className={styles["email-subject-tester__dimension-name"]}>Curiosity</span>
                    <span className={styles["email-subject-tester__dimension-score"]}>
                      {score.curiosity.score}%
                    </span>
                  </div>
                  <div className={styles["email-subject-tester__progress-bar"]}>
                    <div
                      className={styles["email-subject-tester__progress-fill"]}
                      style={{
                        width: `${score.curiosity.score}%`,
                        backgroundColor: getScoreColor(score.curiosity.score),
                      }}
                    />
                  </div>
                  <p className={styles["email-subject-tester__dimension-message"]}>
                    {score.curiosity.message}
                  </p>
                </div>

                {/* Power Words */}
                <div className={styles["email-subject-tester__dimension"]}>
                  <div className={styles["email-subject-tester__dimension-header"]}>
                    <span className={styles["email-subject-tester__dimension-name"]}>Power Words</span>
                    <span className={styles["email-subject-tester__dimension-score"]}>
                      {score.powerWords.score}%
                    </span>
                  </div>
                  <div className={styles["email-subject-tester__progress-bar"]}>
                    <div
                      className={styles["email-subject-tester__progress-fill"]}
                      style={{
                        width: `${score.powerWords.score}%`,
                        backgroundColor: getScoreColor(score.powerWords.score),
                      }}
                    />
                  </div>
                  <p className={styles["email-subject-tester__dimension-message"]}>
                    {score.powerWords.message}
                  </p>
                </div>

                {/* Special Characters */}
                <div className={styles["email-subject-tester__dimension"]}>
                  <div className={styles["email-subject-tester__dimension-header"]}>
                    <span className={styles["email-subject-tester__dimension-name"]}>Formatting</span>
                    <span className={styles["email-subject-tester__dimension-score"]}>
                      {score.specialCharacters.score}%
                    </span>
                  </div>
                  <div className={styles["email-subject-tester__progress-bar"]}>
                    <div
                      className={styles["email-subject-tester__progress-fill"]}
                      style={{
                        width: `${score.specialCharacters.score}%`,
                        backgroundColor: getScoreColor(score.specialCharacters.score),
                      }}
                    />
                  </div>
                  <p className={styles["email-subject-tester__dimension-message"]}>
                    {score.specialCharacters.message}
                  </p>
                </div>
              </div>
            </section>

            {/* Statistics */}
            <section className={styles["email-subject-tester__stats-section"]}>
              <h3>Statistics</h3>
              <div className={styles["email-subject-tester__stats-grid"]}>
                <div className={styles["email-subject-tester__stat"]}>
                  <div className={styles["email-subject-tester__stat-value"]}>{stats.wordCount}</div>
                  <div className={styles["email-subject-tester__stat-label"]}>Words</div>
                </div>
                <div className={styles["email-subject-tester__stat"]}>
                  <div className={styles["email-subject-tester__stat-value"]}>{stats.characterCount}</div>
                  <div className={styles["email-subject-tester__stat-label"]}>Characters</div>
                </div>
                <div className={styles["email-subject-tester__stat"]}>
                  <div className={styles["email-subject-tester__stat-value"]}>{stats.numbersCount}</div>
                  <div className={styles["email-subject-tester__stat-label"]}>Numbers</div>
                </div>
                <div className={styles["email-subject-tester__stat"]}>
                  <div className={styles["email-subject-tester__stat-value"]}>
                    {stats.hasEmoji ? "✓" : "-"}
                  </div>
                  <div className={styles["email-subject-tester__stat-label"]}>Emoji</div>
                </div>
              </div>
            </section>

            {/* Suggestions */}
            <section className={styles["email-subject-tester__suggestions"]}>
              <h3>Recommendations</h3>
              <ul className={styles["email-subject-tester__suggestion-list"]}>
                {score.suggestions.map((suggestion, idx) => (
                  <li key={idx} className={styles["email-subject-tester__suggestion-item"]}>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>

      <footer className={styles["email-subject-tester__footer"]}>
        <p>
          <small>
            Free tool by{" "}
            <a href="/" className={styles["email-subject-tester__link"]}>
              topaitoolrank.com
            </a>
          </small>
        </p>
      </footer>
    </div>
  );
}

export const metadata = {
  title: "Email Subject Line Tester - Free Online Tool",
  description:
    "Score and optimize email subject lines for better open rates. Analyze urgency, personalization, length, and more.",
  keywords: [
    "email subject line tester",
    "email subject line analyzer",
    "email marketing",
    "open rate optimization",
    "free email tool",
  ],
};
