'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { SSEManager, createSSEManager } from '../lib/sse-manager';
import { cls } from '../lib/css-module-safe';
import type { AgentStatus } from '../lib/types';
import styles from '../styles/generation-status-panel.module.css';

interface GenerationStatusPanelProps {
  sessionId: string;
  estimatedCost: number;
  onComplete: () => void;
  onError: (message: string) => void;
}

interface PhaseState {
  progress: number; // 0-1
}

const TARGET_DURATION_MS = 90_000; // 90s target generation time

function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds} seconds`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min} min ${sec} sec`;
}

function formatRemaining(elapsedMs: number): string {
  const remaining = Math.max(0, TARGET_DURATION_MS - elapsedMs);
  const seconds = Math.ceil(remaining / 1000);
  if (seconds <= 0) return 'finishing up...';
  return `~${seconds} seconds remaining`;
}

function getProgressColor(progress: number): string {
  if (progress < 0.5) return cls(styles, 'phaseBarFillBlue');
  if (progress < 0.8) return cls(styles, 'phaseBarFillYellow');
  return cls(styles, 'phaseBarFillRed');
}

function getCostClass(cost: number): string {
  if (cost < 0.03) return cls(styles, 'costGreen');
  if (cost <= 0.04) return cls(styles, 'costYellow');
  return cls(styles, 'costRed');
}

export default function GenerationStatusPanel({
  sessionId,
  estimatedCost,
  onComplete,
  onError,
}: GenerationStatusPanelProps) {
  const sseRef = useRef<SSEManager | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const [phases, setPhases] = useState<PhaseState[]>([
    { progress: 1 },   // Phase 1 always 100%
    { progress: 0 },
    { progress: 0 },
    { progress: 0 },
  ]);
  const [activeAgent, setActiveAgent] = useState<string>('Initializing...');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [currentCost, setCurrentCost] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Elapsed time ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleProgress = useCallback((event: { data?: AgentStatus | { [key: string]: unknown } }) => {
    const data = event.data as AgentStatus | undefined;
    if (!data) return;

    setActiveAgent(data.activeAgent);
    setCurrentCost(data.costUSD);
    setElapsedMs(data.elapsedMs);

    setPhases((prev) => {
      const next = [...prev];
      const phaseIdx = data.phase - 1;
      if (phaseIdx >= 0 && phaseIdx < 4) {
        next[phaseIdx] = { progress: data.progress };
      }
      return next;
    });
  }, []);

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const handleError = useCallback((event: { data?: AgentStatus | { [key: string]: unknown } }) => {
    const data = event.data as { error?: string; message?: string } | undefined;
    const message = data?.message || data?.error || 'Generation failed';

    if (data?.error === 'session_expired') {
      onError('Session expired. Please log in again.');
      return;
    }

    setError(message);
    onError(message);
  }, [onError]);

  // SSE connection lifecycle
  useEffect(() => {
    const sse = createSSEManager();
    sseRef.current = sse;

    sse.on('progress', handleProgress);
    sse.on('complete', handleComplete);
    sse.on('error', handleError);
    sse.connect(sessionId);

    return () => {
      sse.off('progress', handleProgress);
      sse.off('complete', handleComplete);
      sse.off('error', handleError);
      sse.disconnect();
    };
  }, [sessionId, handleProgress, handleComplete, handleError]);

  return (
    <section className={cls(styles, 'panel')} aria-label="Generation progress">
      <header className={cls(styles, 'header')}>
        <h2 className={cls(styles, 'title')}>Generating Your Business Model Canvas</h2>
        <p className={cls(styles, 'warning')} role="alert">
          Do not refresh or leave this page
        </p>
      </header>

      {/* Phase progress bars */}
      <div
        className={cls(styles, 'phaseBars')}
        role="group"
        aria-label="Phase progress indicators"
      >
        {phases.map((phase, idx) => (
          <div
            key={idx}
            className={cls(styles, 'phaseBarTrack')}
            role="progressbar"
            aria-valuenow={Math.round(phase.progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Phase ${idx + 1} progress: ${Math.round(phase.progress * 100)}%`}
          >
            <div
              className={`${cls(styles, 'phaseBarFill')} ${
                idx === 0 ? cls(styles, 'phaseBarFillGray') : getProgressColor(phase.progress)
              }`}
              style={{ width: `${phase.progress * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className={cls(styles, 'phaseLabels')}>
        <span>Phase 1</span>
        <span>Phase 2</span>
        <span>Phase 3</span>
        <span>Phase 4</span>
      </div>

      {/* Active agent */}
      <div className={cls(styles, 'agentName')} aria-live="polite" aria-label="Active agent">
        {activeAgent}
      </div>

      {/* Timing */}
      <div className={cls(styles, 'timingRow')}>
        <span aria-label="Elapsed time">Elapsed: {formatElapsed(elapsedMs)}</span>
        <span aria-label="Estimated remaining time">{formatRemaining(elapsedMs)}</span>
      </div>

      {/* Cost */}
      <div className={cls(styles, 'costDisplay')}>
        <div
          className={`${cls(styles, 'costValue')} ${getCostClass(currentCost)}`}
          aria-label={`Current cost: $${currentCost.toFixed(4)}`}
        >
          ${currentCost.toFixed(4)}
        </div>
        <div className={cls(styles, 'costLabel')}>
          estimated total: ${estimatedCost.toFixed(3)}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className={cls(styles, 'errorBox')} role="alert" aria-label="Generation error">
          {error}
        </div>
      )}
    </section>
  );
}
