'use client';

import { useState, useCallback } from 'react';
import type { FinalBMC } from '../lib/types';
import { cls } from '../../lib/css-module-safe';
import styles from '../styles/recommendations-panel.module.css';

interface RecommendationsPanelProps {
  recommendations?: FinalBMC['strategic_recommendations'];
  nextSteps?: FinalBMC['next_steps'];
}

export default function RecommendationsPanel({
  recommendations,
  nextSteps,
}: RecommendationsPanelProps) {
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  const handleToggle = useCallback((index: number) => {
    setCheckedSteps((prev) => ({ ...prev, [index]: !prev[index] }));
  }, []);

  // Graceful no-op: if both empty/undefined, render nothing
  if (
    (!recommendations || recommendations.length === 0) &&
    (!nextSteps || nextSteps.length === 0)
  ) {
    return null;
  }

  return (
    <div className={cls(styles, 'recommendations-container')} role="region" aria-label="Strategic Recommendations">
      {recommendations && recommendations.length > 0 && (
        <>
          <h2>Strategic Recommendations</h2>
          <ol className={cls(styles, 'recommendations-list')} aria-label="Strategic recommendations list">
            {recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ol>
        </>
      )}

      {nextSteps && nextSteps.length > 0 && (
        <>
          <h3>Next Steps</h3>
          <ul className={cls(styles, 'next-steps-list')} aria-label="Next steps checklist">
            {nextSteps.map((step, i) => (
              <li key={i}>
                <label>
                  <input
                    type="checkbox"
                    checked={!!checkedSteps[i]}
                    onChange={() => handleToggle(i)}
                    aria-label={`Mark "${step}" as complete`}
                  />
                  <span>{step}</span>
                </label>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
