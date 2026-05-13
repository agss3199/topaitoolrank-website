'use client';

import { useState, useCallback } from 'react';
import type { FinalBMC, BMCSection } from '../lib/types';
import { cls } from '../../lib/css-module-safe';
import styles from '../styles/bmc-canvas-display.module.css';

/** Labels for the 9 BMC sections in display order (3x3 grid) */
const SECTION_ORDER = [
  'key_partners',
  'key_activities',
  'value_propositions',
  'customer_relationships',
  'customer_segments',
  'key_resources',
  'channels',
  'cost_structure',
  'revenue_streams',
] as const;

const SECTION_LABELS: Record<string, string> = {
  customer_segments: 'Customer Segments',
  value_propositions: 'Value Propositions',
  channels: 'Channels',
  customer_relationships: 'Customer Relationships',
  revenue_streams: 'Revenue Streams',
  key_resources: 'Key Resources',
  key_activities: 'Key Activities',
  key_partners: 'Key Partners',
  cost_structure: 'Cost Structure',
};

interface BMCCanvasDisplayProps {
  /** Full FinalBMC when synthesis completed */
  canvas?: FinalBMC['canvas'];
  /** Partial agent outputs for fallback rendering */
  agentOutputs?: BMCSection[];
  /** Whether generation timed out */
  timedOut?: boolean;
  /** Elapsed time at timeout (ms) */
  timeoutElapsedMs?: number;
  /** Cost charged */
  costCharged?: number;
}

export default function BMCCanvasDisplay({
  canvas,
  agentOutputs,
  timedOut = false,
  timeoutElapsedMs,
  costCharged,
}: BMCCanvasDisplayProps) {
  const [toastVisible, setToastVisible] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!canvas && !agentOutputs?.length) return;

    let markdown = '# Business Model Canvas\n\n';
    if (canvas) {
      for (const key of SECTION_ORDER) {
        const label = SECTION_LABELS[key] || key;
        const content = canvas[key as keyof typeof canvas];
        markdown += `## ${label}\n${content || '[Unavailable]'}\n\n`;
      }
    } else if (agentOutputs) {
      for (const section of agentOutputs) {
        const label = SECTION_LABELS[section.section_name] || section.section_name;
        markdown += `## ${label}\n${section.content.points.join('\n')}\n\n`;
      }
    }

    await navigator.clipboard.writeText(markdown.trim());
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  }, [canvas, agentOutputs]);

  const handleDownloadPDF = useCallback(async () => {
    const element = document.getElementById('bmc-canvas-content');
    if (!element) return;

    const html2pdf = (await import('html2pdf.js')).default;
    html2pdf()
      .set({
        margin: 10,
        filename: 'business-model-canvas.pdf',
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      })
      .from(element)
      .save();
  }, []);

  // Agent-only fallback: <6 sections or no canvas
  const useAgentFallback =
    !canvas && agentOutputs && agentOutputs.length > 0;

  // Determine which sections are available
  const availableSections = new Set(
    agentOutputs?.map((s) => s.section_name) || []
  );
  const completedCount = canvas
    ? SECTION_ORDER.length
    : availableSections.size;

  return (
    <div className={cls(styles, 'canvas-container')} role="region" aria-label="Business Model Canvas">
      {/* Timeout banner */}
      {timedOut && (
        <div className={cls(styles, 'timeout-banner')} role="alert">
          <p>
            Generation timed out at {Math.round((timeoutElapsedMs || 0) / 1000)} seconds.
            Showing {completedCount} of 9 sections.
            {costCharged != null && ` Cost charged: $${costCharged.toFixed(2)}`}
          </p>
        </div>
      )}

      {/* Header with actions */}
      <div className={cls(styles, 'canvas-header')}>
        <h2>Business Model Canvas</h2>
        <div className={cls(styles, 'canvas-actions')}>
          <button onClick={handleCopy} aria-label="Copy canvas to clipboard">
            Copy
          </button>
          <button onClick={handleDownloadPDF} aria-label="Download canvas as PDF">
            Download PDF
          </button>
        </div>
      </div>

      {/* Full/Partial canvas grid */}
      {!useAgentFallback && (
        <div
          id="bmc-canvas-content"
          className={cls(styles, 'canvas-grid')}
          role="table"
          aria-label="BMC 3x3 grid"
        >
          {SECTION_ORDER.map((sectionKey) => {
            const label = SECTION_LABELS[sectionKey];
            const content = canvas?.[sectionKey as keyof typeof canvas];
            const isAvailable = canvas
              ? !!content
              : availableSections.has(sectionKey);
            const cellClass = isAvailable
              ? cls(styles, 'cell-complete')
              : cls(styles, 'cell-unavailable');

            return (
              <div
                key={sectionKey}
                className={`${cls(styles, 'canvas-cell')} ${cellClass}`}
                role="cell"
                aria-label={label}
              >
                <h3>{label}</h3>
                <p>
                  {isAvailable
                    ? (content ||
                        agentOutputs
                          ?.find((s) => s.section_name === sectionKey)
                          ?.content.points.join(', '))
                    : '[Unavailable]'}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Agent-only fallback */}
      {useAgentFallback && (
        <div
          id="bmc-canvas-content"
          className={cls(styles, 'fallback-container')}
          role="region"
          aria-label="Partial BMC results"
        >
          {agentOutputs!.map((section) => (
            <div key={section.section_name} className={cls(styles, 'fallback-section')}>
              <h3>{SECTION_LABELS[section.section_name]}</h3>
              <p>{section.content.points.join('\n')}</p>
            </div>
          ))}
          <p className={cls(styles, 'missing-sections')}>
            Missing sections:{' '}
            {SECTION_ORDER.filter((s) => !availableSections.has(s))
              .map((s) => SECTION_LABELS[s])
              .join(', ')}
          </p>
        </div>
      )}

      {/* Toast notification */}
      {toastVisible && (
        <div className={cls(styles, 'toast')} role="status" aria-live="polite">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}
