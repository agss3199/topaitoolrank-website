import { z } from 'zod';
import {
  BusinessContextSchema,
  BMCSectionSchema,
  CritiqueOutputSchema,
  FinalBMCSchema,
  AgentStatusSchema,
  CostTrackerSchema,
} from './validators';

/** Phase 1 output: normalized business context from OrchestratorAgent */
export type BusinessContext = z.infer<typeof BusinessContextSchema>;

/** Phase 2 output: individual BMC section from a Phase 2 agent */
export type BMCSection = z.infer<typeof BMCSectionSchema>;

/** Phase 3 output: critique from a Phase 3 critique agent */
export type CritiqueOutput = z.infer<typeof CritiqueOutputSchema>;

/** Phase 4 output: synthesized final Business Model Canvas */
export type FinalBMC = z.infer<typeof FinalBMCSchema>;

/** Real-time SSE event: agent progress update */
export type AgentStatus = z.infer<typeof AgentStatusSchema>;

/** Operational: accumulated token and cost tracking data */
export type CostTracker = z.infer<typeof CostTrackerSchema>;
