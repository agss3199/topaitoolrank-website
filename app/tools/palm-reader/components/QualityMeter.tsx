'use client';

import { cls } from '../../lib/css-module-safe';
import styles from '../styles/camera.module.css';

export interface QualityMeterProps {
  quality: number;
}

/**
 * Displays palm detection quality as a percentage bar.
 * Positioned in the top-left corner of the camera overlay.
 */
export default function QualityMeter({ quality }: QualityMeterProps) {
  const clamped = Math.max(0, Math.min(100, quality));

  return (
    <div className={cls(styles, 'meter-wrapper')}>
      <p className={cls(styles, 'meter-label')}>
        Quality: {clamped.toFixed(0)}%
      </p>
      <div className={cls(styles, 'meter-track')}>
        <div
          className={cls(styles, 'meter-fill')}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
