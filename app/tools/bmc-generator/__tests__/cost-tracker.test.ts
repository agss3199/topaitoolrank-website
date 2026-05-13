import { describe, it, expect } from 'vitest';
import { CostTracker } from '../lib/cost-tracker';

describe('CostTracker', () => {
  // --- Construction ---
  it('initializes with zero totals', () => {
    const tracker = new CostTracker();
    const result = tracker.calculate();
    expect(result.totalInputTokens).toBe(0);
    expect(result.totalOutputTokens).toBe(0);
    expect(result.estimatedCostUSD).toBe(0);
  });

  // --- record() ---
  it('records token usage for a single agent', () => {
    const tracker = new CostTracker();
    tracker.record(1, 'OrchestratorAgent', 500, 200);
    const result = tracker.calculate();
    expect(result.totalInputTokens).toBe(500);
    expect(result.totalOutputTokens).toBe(200);
  });

  it('records token usage for multiple agents across phases', () => {
    const tracker = new CostTracker();
    tracker.record(1, 'OrchestratorAgent', 500, 200);
    tracker.record(2, 'CustomerSegmentsAgent', 300, 150);
    tracker.record(2, 'ValuePropositionsAgent', 400, 250);
    const result = tracker.calculate();
    expect(result.totalInputTokens).toBe(1200);
    expect(result.totalOutputTokens).toBe(600);
  });

  it('overwrites previous record for same phase+agent', () => {
    const tracker = new CostTracker();
    tracker.record(1, 'OrchestratorAgent', 500, 200);
    tracker.record(1, 'OrchestratorAgent', 700, 300);
    const result = tracker.calculate();
    expect(result.totalInputTokens).toBe(700);
    expect(result.totalOutputTokens).toBe(300);
  });

  // --- record() validation ---
  it('throws on invalid phase (0)', () => {
    const tracker = new CostTracker();
    expect(() => tracker.record(0, 'Agent', 100, 50)).toThrow('Invalid phase');
  });

  it('throws on invalid phase (5)', () => {
    const tracker = new CostTracker();
    expect(() => tracker.record(5, 'Agent', 100, 50)).toThrow('Invalid phase');
  });

  it('throws on non-integer phase', () => {
    const tracker = new CostTracker();
    expect(() => tracker.record(1.5, 'Agent', 100, 50)).toThrow('Invalid phase');
  });

  it('throws on empty agentName', () => {
    const tracker = new CostTracker();
    expect(() => tracker.record(1, '', 100, 50)).toThrow('agentName must be a non-empty string');
  });

  it('throws on negative inputTokens', () => {
    const tracker = new CostTracker();
    expect(() => tracker.record(1, 'Agent', -1, 50)).toThrow('Invalid inputTokens');
  });

  it('throws on non-integer inputTokens', () => {
    const tracker = new CostTracker();
    expect(() => tracker.record(1, 'Agent', 100.5, 50)).toThrow('Invalid inputTokens');
  });

  it('throws on negative outputTokens', () => {
    const tracker = new CostTracker();
    expect(() => tracker.record(1, 'Agent', 100, -1)).toThrow('Invalid outputTokens');
  });

  it('throws on non-integer outputTokens', () => {
    const tracker = new CostTracker();
    expect(() => tracker.record(1, 'Agent', 100, 50.5)).toThrow('Invalid outputTokens');
  });

  // --- calculate() cost formula ---
  it('calculates cost correctly with known values', () => {
    const tracker = new CostTracker();
    // 1M input tokens at $0.80/1M = $0.80
    // 1M output tokens at $4.00/1M = $4.00
    // Total = $4.80
    tracker.record(1, 'Agent', 1_000_000, 1_000_000);
    const result = tracker.calculate();
    expect(result.estimatedCostUSD).toBeCloseTo(4.80, 2);
  });

  it('calculates cost with small token counts', () => {
    const tracker = new CostTracker();
    // 1000 input tokens at $0.80/1M = $0.0008
    // 500 output tokens at $4.00/1M = $0.002
    // Total = $0.0028
    tracker.record(1, 'Agent', 1000, 500);
    const result = tracker.calculate();
    expect(result.estimatedCostUSD).toBeCloseTo(0.0028, 4);
  });

  // --- toJSON() ---
  it('exports valid CostTrackerSchema-compliant JSON', () => {
    const tracker = new CostTracker();
    tracker.record(1, 'OrchestratorAgent', 500, 200);
    tracker.record(2, 'CustomerSegmentsAgent', 300, 150);
    const json = tracker.toJSON();
    expect(json.phases['1'].agents['OrchestratorAgent'].inputTokens).toBe(500);
    expect(json.phases['2'].agents['CustomerSegmentsAgent'].outputTokens).toBe(150);
  });

  it('exports empty state as valid JSON', () => {
    const tracker = new CostTracker();
    const json = tracker.toJSON();
    expect(json.phases).toEqual({});
  });
});
