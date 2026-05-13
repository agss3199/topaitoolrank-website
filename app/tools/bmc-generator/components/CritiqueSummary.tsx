'use client';

import type { FinalBMC } from '../lib/types';
import { cls } from '../../lib/css-module-safe';
import styles from '../styles/critique-summary.module.css';

interface CritiqueSummaryProps {
  critiqueSummary?: FinalBMC['critique_summary'];
}

export default function CritiqueSummary({ critiqueSummary }: CritiqueSummaryProps) {
  if (!critiqueSummary) return null;

  const { high_risk_items, medium_risk_items, areas_of_strength } = critiqueSummary;

  // Graceful no-op: if all arrays empty, render nothing
  if (
    high_risk_items.length === 0 &&
    medium_risk_items.length === 0 &&
    areas_of_strength.length === 0
  ) {
    return null;
  }

  return (
    <div className={cls(styles, 'critique-container')} role="region" aria-label="Red Team Assessment">
      <h2>Red Team Assessment</h2>

      {high_risk_items.length > 0 && (
        <div className={`${cls(styles, 'risk-group')} ${cls(styles, 'high-risk')}`}>
          <h3 aria-label="High risk items">
            <span role="img" aria-label="High risk">{'🔴'}</span>{' '}
            High-Risk Items ({Math.min(high_risk_items.length, 5)})
          </h3>
          <ul aria-label="High risk findings">
            {high_risk_items.slice(0, 5).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {medium_risk_items.length > 0 && (
        <div className={`${cls(styles, 'risk-group')} ${cls(styles, 'medium-risk')}`}>
          <h3 aria-label="Medium risk items">
            <span role="img" aria-label="Medium risk">{'🟡'}</span>{' '}
            Medium-Risk Items ({Math.min(medium_risk_items.length, 5)})
          </h3>
          <ul aria-label="Medium risk findings">
            {medium_risk_items.slice(0, 5).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {areas_of_strength.length > 0 && (
        <div className={`${cls(styles, 'risk-group')} ${cls(styles, 'strength')}`}>
          <h3 aria-label="Strengths">
            <span role="img" aria-label="Strength">{'✅'}</span>{' '}
            Strengths ({Math.min(areas_of_strength.length, 5)})
          </h3>
          <ul aria-label="Strength findings">
            {areas_of_strength.slice(0, 5).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
