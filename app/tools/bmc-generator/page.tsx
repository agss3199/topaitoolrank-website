'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import IdeaInputForm from './components/IdeaInputForm';
import ClarifyingQuestionsForm from './components/ClarifyingQuestionsForm';
import GenerationStatusPanel from './components/GenerationStatusPanel';
import BMCCanvasDisplay from './components/BMCCanvasDisplay';
import CritiqueSummary from './components/CritiqueSummary';
import RecommendationsPanel from './components/RecommendationsPanel';
import ErrorBoundary from './components/ErrorBoundary';
import { apiClient, APIError } from './lib/api-client';
import type { BusinessContext, FinalBMC } from './lib/validators';

export const dynamic = 'force-dynamic';

type WizardStep = 'idea' | 'clarify' | 'generate' | 'results';

interface GenerationState {
  sessionId: string;
  generationToken: string;
  businessContext: BusinessContext | null;
  finalBMC: FinalBMC | null;
  totalCost: number;
  wallClockMs: number;
}

export default function BMCGeneratorPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>('idea');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [state, setState] = useState<GenerationState>({
    sessionId: '',
    generationToken: '',
    businessContext: null,
    finalBMC: null,
    totalCost: 0,
    wallClockMs: 0,
  });

  // =========================================================================
  // Step 1: Idea Input → Clarifying Questions
  // =========================================================================

  const handleIdeasReceived = useCallback(
    (
      sessionId: string,
      questions: string[],
      generationToken: string,
      estimatedCost: number,
      estimatedLatencySeconds: number
    ) => {
      setState((prev) => ({
        ...prev,
        sessionId,
        generationToken,
      }));
      sessionStorage.setItem(
        'bmc_questions',
        JSON.stringify({
          questions,
          estimatedCost,
          estimatedLatencySeconds,
          receivedAt: Date.now(),
        })
      );
      setCurrentStep('clarify');
    },
    []
  );

  // =========================================================================
  // Step 2: Clarifying Questions → Business Context
  // =========================================================================

  const handleAnswersSubmitted = useCallback(
    async (answers: Record<string, string>) => {
      if (!state.sessionId || !state.generationToken) {
        setError('Session state lost. Please start over.');
        setCurrentStep('idea');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await apiClient.answers(
          state.sessionId,
          state.generationToken,
          answers
        );

        setState((prev) => ({
          ...prev,
          generationToken: response.generation_token, // Fresh token from /answers
          businessContext: response.context,
        }));

        sessionStorage.setItem(
          'bmc_context',
          JSON.stringify(response.context)
        );
        setCurrentStep('generate');
      } catch (err) {
        if (err instanceof APIError) {
          if (err.code === 401) {
            // Session expired
            setError('Your session has expired. Please log in again.');
            router.push('/tools/bmc-generator/login');
            return;
          }
          setError('Failed to process answers. Please try again.');
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    },
    [state.sessionId, state.generationToken, router]
  );

  // =========================================================================
  // Step 3: Business Context → Generation & Results
  // =========================================================================

  const handleGenerationComplete = useCallback(
    (finalBMC: FinalBMC, totalCost: number, wallClockMs: number) => {
      setState((prev) => ({
        ...prev,
        finalBMC,
        totalCost,
        wallClockMs,
      }));
      sessionStorage.setItem('bmc_final', JSON.stringify(finalBMC));
      setCurrentStep('results');
    },
    []
  );

  const handleGenerationError = useCallback((errMsg: string) => {
    setError(errMsg);
    setCurrentStep('generate');
  }, []);

  // =========================================================================
  // Navigation Handlers
  // =========================================================================

  const handleBack = useCallback(() => {
    if (currentStep === 'clarify') {
      setCurrentStep('idea');
    } else if (currentStep === 'generate') {
      setCurrentStep('clarify');
    } else if (currentStep === 'results') {
      setCurrentStep('idea');
    }
  }, [currentStep]);

  const handleStartOver = useCallback(() => {
    setState({
      sessionId: '',
      generationToken: '',
      businessContext: null,
      finalBMC: null,
      totalCost: 0,
      wallClockMs: 0,
    });
    sessionStorage.removeItem('bmc_questions');
    sessionStorage.removeItem('bmc_context');
    sessionStorage.removeItem('bmc_final');
    setCurrentStep('idea');
    setError('');
  }, []);

  // =========================================================================
  // Logout Handler
  // =========================================================================

  const handleLogout = useCallback(async () => {
    try {
      await apiClient.logout();
      router.push('/tools/bmc-generator/login');
    } catch {
      // Ignore logout errors, user will be redirected
      router.push('/tools/bmc-generator/login');
    }
  }, [router]);

  // =========================================================================
  // Restore State from SessionStorage on Mount
  // =========================================================================

  useEffect(() => {
    const stored = sessionStorage.getItem('bmc_context');
    if (stored) {
      try {
        const context = JSON.parse(stored);
        setState((prev) => ({ ...prev, businessContext: context }));
      } catch {
        // Ignore parse errors
      }
    }

    const storedFinal = sessionStorage.getItem('bmc_final');
    if (storedFinal) {
      try {
        const final = JSON.parse(storedFinal);
        setState((prev) => ({ ...prev, finalBMC: final }));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <ErrorBoundary>
      <div style={{ minHeight: '100vh', backgroundColor: '#f9f9f9', padding: '2rem' }}>
        <header style={{ marginBottom: '2rem', textAlign: 'right' }}>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </header>

        <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Global Error Display */}
          {error && (
            <div
              role="alert"
              style={{
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                color: '#c33',
                padding: '1rem',
                borderRadius: '4px',
                marginBottom: '1rem',
              }}
            >
              {error}
            </div>
          )}

          {/* Wizard Steps */}
          {currentStep === 'idea' && (
            <IdeaInputForm onQuestionsReceived={handleIdeasReceived} />
          )}

          {currentStep === 'clarify' && (
            <ClarifyingQuestionsForm
              sessionId={state.sessionId}
              onAnswersSubmitted={handleAnswersSubmitted}
              onBack={handleBack}
              loading={loading}
            />
          )}

          {currentStep === 'generate' && state.businessContext && (
            <GenerationStatusPanel
              sessionId={state.sessionId}
              generationToken={state.generationToken}
              businessContext={state.businessContext}
              onComplete={handleGenerationComplete}
              onError={handleGenerationError}
            />
          )}

          {currentStep === 'results' && state.finalBMC && (
            <div>
              <BMCCanvasDisplay
                finalBMC={state.finalBMC}
                cost={state.totalCost}
                wallClockMs={state.wallClockMs}
              />
              <CritiqueSummary findings={state.finalBMC.critique_summary} />
              <RecommendationsPanel
                recommendations={state.finalBMC.strategic_recommendations}
                nextSteps={state.finalBMC.next_steps}
              />
              <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button
                  onClick={handleStartOver}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                  }}
                >
                  Generate Another BMC
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}
