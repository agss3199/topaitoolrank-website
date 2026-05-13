import { CostTrackerSchema } from './validators';
import type { CostTracker as CostTrackerData } from './types';

const INPUT_COST_PER_1M = 0.80;
const OUTPUT_COST_PER_1M = 4.00;

/**
 * CostTracker — accumulates token usage across phases and agents,
 * then calculates estimated cost in USD.
 *
 * Usage: server instantiates once per session, calls record() after
 * each agent completes, emits cost via calculate() to frontend.
 */
export class CostTracker {
  private data: Record<number, Record<string, { inputTokens: number; outputTokens: number }>>;

  constructor() {
    this.data = {};
  }

  /**
   * Record token usage for a specific agent in a specific phase.
   * Overwrites any previous record for the same phase+agent combination.
   */
  record(phase: number, agentName: string, inputTokens: number, outputTokens: number): void {
    if (!Number.isInteger(phase) || phase < 1 || phase > 4) {
      throw new Error(`Invalid phase: ${phase}. Must be an integer between 1 and 4.`);
    }
    if (!agentName || typeof agentName !== 'string') {
      throw new Error('agentName must be a non-empty string.');
    }
    if (!Number.isInteger(inputTokens) || inputTokens < 0) {
      throw new Error(`Invalid inputTokens: ${inputTokens}. Must be a non-negative integer.`);
    }
    if (!Number.isInteger(outputTokens) || outputTokens < 0) {
      throw new Error(`Invalid outputTokens: ${outputTokens}. Must be a non-negative integer.`);
    }

    if (!this.data[phase]) {
      this.data[phase] = {};
    }
    this.data[phase][agentName] = { inputTokens, outputTokens };
  }

  /**
   * Calculate total token usage and estimated cost across all phases.
   */
  calculate(): {
    totalInputTokens: number;
    totalOutputTokens: number;
    estimatedCostUSD: number;
  } {
    let totalIn = 0;
    let totalOut = 0;
    for (const phase in this.data) {
      for (const agent in this.data[phase]) {
        totalIn += this.data[phase][agent].inputTokens;
        totalOut += this.data[phase][agent].outputTokens;
      }
    }
    const estimatedCost =
      (totalIn / 1_000_000) * INPUT_COST_PER_1M +
      (totalOut / 1_000_000) * OUTPUT_COST_PER_1M;
    return {
      totalInputTokens: totalIn,
      totalOutputTokens: totalOut,
      estimatedCostUSD: estimatedCost,
    };
  }

  /**
   * Export internal state as a Zod-validated CostTrackerData object.
   */
  toJSON(): CostTrackerData {
    const raw: Record<string, { agents: Record<string, { inputTokens: number; outputTokens: number }> }> = {};
    for (const phase in this.data) {
      raw[phase] = { agents: this.data[phase] };
    }
    return CostTrackerSchema.parse({ phases: raw });
  }
}
