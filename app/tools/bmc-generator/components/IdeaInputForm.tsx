'use client';

import { useState, useCallback, useMemo } from 'react';
import { apiClient, APIError } from '../lib/api-client';
import { cls } from '../lib/css-module-safe';
import styles from '../styles/idea-input-form.module.css';

interface IdeaInputFormProps {
  onQuestionsReceived: (
    sessionId: string,
    questions: string[],
    generationToken: string,
    estimatedCost: number,
    estimatedLatencySeconds: number
  ) => void;
}

const MIN_CHARS = 50;
const MAX_CHARS = 500;

export default function IdeaInputForm({ onQuestionsReceived }: IdeaInputFormProps) {
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Character count (trimmed)
  const trimmedIdea = idea.trim();
  const charCount = trimmedIdea.length;
  const isValidLength = charCount >= MIN_CHARS && charCount <= MAX_CHARS;

  // Handle textarea change
  const handleIdeaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIdea(e.target.value);
    // Clear error on user input
    if (error) setError('');
  }, [error]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Validation
      if (!isValidLength) {
        setError(
          charCount < MIN_CHARS
            ? `Please enter at least ${MIN_CHARS} characters`
            : `Please enter no more than ${MAX_CHARS} characters`
        );
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await apiClient.start(trimmedIdea);
        onQuestionsReceived(
          response.session_id,
          response.questions,
          response.generation_token,
          response.estimated_cost,
          response.estimated_latency_seconds
        );
      } catch (err) {
        // Generic error message (no data leakage)
        const errorMessage =
          err instanceof APIError && err.code >= 400 && err.code < 500
            ? 'Please check your input and try again.'
            : 'Please try again. Contact support if the issue persists.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [isValidLength, charCount, trimmedIdea, onQuestionsReceived]
  );

  // Handle clear button
  const handleClear = useCallback(() => {
    setIdea('');
    setError('');
  }, []);

  return (
    <div className={cls(styles, 'container')}>
      <div className={cls(styles, 'header')}>
        <h1 className={cls(styles, 'title')}>BMC Generator</h1>
        <p className={cls(styles, 'subtitle')}>
          Describe your business idea in plain English. Be specific about the problem you solve and who benefits.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={cls(styles, 'form')}>
        {/* Idea Input Field */}
        <div className={cls(styles, 'fieldGroup')}>
          <label htmlFor="idea-input" className={cls(styles, 'label')}>
            My idea:
          </label>
          <textarea
            id="idea-input"
            className={cls(styles, 'textarea')}
            value={idea}
            onChange={handleIdeaChange}
            placeholder="E.g., AI-powered fitness coach that provides personalized workout routines based on user fitness level and available equipment..."
            disabled={loading}
            aria-label="Business idea"
            aria-describedby={error ? 'idea-error' : undefined}
          />

          {/* Character Counter */}
          <div
            className={`${cls(styles, 'charCounterContainer')} ${
              charCount > MAX_CHARS ? cls(styles, 'charCounterError') : ''
            }`}
            aria-live="polite"
            aria-atomic="true"
          >
            <span className={cls(styles, 'charCounter')}>
              {charCount}/{MAX_CHARS} characters
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div id="idea-error" className={cls(styles, 'errorMessage')} role="alert">
            {error}
          </div>
        )}

        {/* Info Section */}
        <div className={cls(styles, 'infoSection')}>
          <p className={cls(styles, 'infoText')}>
            Estimated cost: <span className={cls(styles, 'highlight')}>$0.02-0.05</span>
          </p>
          <p className={cls(styles, 'infoText')}>
            Estimated time: <span className={cls(styles, 'highlight')}>45-90 seconds</span>
          </p>
        </div>

        {/* Button Group */}
        <div className={cls(styles, 'buttonGroup')}>
          <button
            type="submit"
            disabled={!isValidLength || loading}
            className={cls(styles, 'submitButton')}
            aria-label={loading ? 'Analyzing your idea...' : 'Analyze your business idea'}
          >
            {loading ? (
              <span className={cls(styles, 'loadingContainer')}>
                <span className={cls(styles, 'spinner')} aria-hidden="true" />
                Analyzing...
              </span>
            ) : (
              'Analyze'
            )}
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={loading || charCount === 0}
            className={cls(styles, 'clearButton')}
            aria-label="Clear the input field"
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
