/**
 * Prompt Preview Component
 * Displays the generated prompt with real-time updates
 */

import { useMemo } from "react";
import { getPromptStats } from "../lib/prompt-builder";
import styles from "../styles.css";

interface Props {
  prompt: string;
  isValid: boolean;
}

export default function PromptPreview({ prompt, isValid }: Props) {
  const stats = useMemo(() => {
    if (!isValid) return null;
    return getPromptStats(prompt);
  }, [prompt, isValid]);

  return (
    <div // @ts-ignore
      className={styles["ai-prompt-generator__preview-container"]}>
      <div // @ts-ignore
      className={styles["ai-prompt-generator__preview-header"]}>
        <h3 // @ts-ignore
      className={styles["ai-prompt-generator__preview-title"]}>Generated Prompt</h3>
        {isValid && stats && (
          <div // @ts-ignore
      className={styles["ai-prompt-generator__preview-stats"]}>
            <span // @ts-ignore
      className={styles["ai-prompt-generator__stat-badge"]}>
              {stats.wordCount} words
            </span>
            <span // @ts-ignore
      className={styles["ai-prompt-generator__stat-badge"]}>
              {stats.estimatedReadTime} min read
            </span>
          </div>
        )}
      </div>

      <div // @ts-ignore
      className={styles["ai-prompt-generator__preview-box"]}>
        {isValid ? (
          <p // @ts-ignore
      className={styles["ai-prompt-generator__preview-text"]}>{prompt}</p>
        ) : (
          <p // @ts-ignore
      className={styles["ai-prompt-generator__preview-placeholder"]}>
            Fill in all fields above to generate your prompt
          </p>
        )}
      </div>

      {isValid && (
        <div // @ts-ignore
      className={styles["ai-prompt-generator__preview-info"]}>
          <p // @ts-ignore
      className={styles["ai-prompt-generator__info-text"]}>
            Ready to use this prompt! Copy it in the next step or download for later.
          </p>
        </div>
      )}
    </div>
  );
}
