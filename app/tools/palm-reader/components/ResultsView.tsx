'use client';

import { cls, clsx } from '../../lib/css-module-safe';
import styles from '../styles/results.module.css';
import type { PalmReadingResponse } from '../lib/types';

export interface ResultsViewProps {
  results: PalmReadingResponse;
  onRetry: () => void;
  onHome: () => void;
}

/** Color-coded left borders per spec R4 — class names map to CSS module. */
const LINE_CONFIG = {
  life:  { emoji: '\u2764\uFE0F', label: 'Life Line',  borderClass: 'line-border-life' },
  heart: { emoji: '\uD83D\uDC97', label: 'Heart Line', borderClass: 'line-border-heart' },
  head:  { emoji: '\uD83E\uDDE0', label: 'Head Line',  borderClass: 'line-border-head' },
  fate:  { emoji: '\uD83D\uDD2E', label: 'Fate Line',  borderClass: 'line-border-fate' },
  sun:   { emoji: '\u2600\uFE0F', label: 'Sun Line',   borderClass: 'line-border-sun' },
} as const;

type LineKey = keyof typeof LINE_CONFIG;

const LINE_ORDER: LineKey[] = ['life', 'heart', 'head', 'fate', 'sun'];

/**
 * Displays palm reading results from the Gemini API.
 * All text is rendered via JSX interpolation only (XSS prevention).
 */
export default function ResultsView({ results, onRetry, onHome }: ResultsViewProps) {
  return (
    <div className={cls(styles, 'container')}>
      <h2 className={cls(styles, 'heading')}>
        Palm Reading Results
      </h2>

      {/* Palm lines */}
      {LINE_ORDER.map((key) => {
        const line = results.lines[key];
        const config = LINE_CONFIG[key];

        // Hide lines that have no content
        if (!line.description && !line.interpretation) return null;

        return (
          <div
            key={key}
            className={clsx(styles, 'line-section', config.borderClass)}
          >
            <h3 className={cls(styles, 'line-title')}>
              {config.emoji} {config.label}
            </h3>
            <p className={cls(styles, 'line-description')}>
              {line.description}
            </p>
            <p className={cls(styles, 'line-interpretation')}>
              {line.interpretation}
            </p>
          </div>
        );
      })}

      {/* Overall reading */}
      {results.overall_reading && (
        <div className={cls(styles, 'overall-reading')}>
          <h3 className={cls(styles, 'overall-title')}>
            🌟 Overall Reading
          </h3>
          <p className={cls(styles, 'overall-text')}>
            {results.overall_reading}
          </p>
        </div>
      )}

      {/* Tips */}
      {results.tip && (
        <div className={cls(styles, 'tips')}>
          <h3 className={cls(styles, 'tips-title')}>
            💡 Tips
          </h3>
          <p className={cls(styles, 'tips-text')}>
            {results.tip}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className={cls(styles, 'buttons')}>
        <button
          onClick={onRetry}
          type="button"
          className={cls(styles, 'button-primary')}
        >
          Read Another Palm
        </button>
        <button
          onClick={onHome}
          type="button"
          className={cls(styles, 'button-secondary')}
        >
          Home
        </button>
      </div>

      {/* Attribution */}
      <p className={cls(styles, 'attribution')}>
        made by Abhishek Gupta for MGMT6095
      </p>
    </div>
  );
}
