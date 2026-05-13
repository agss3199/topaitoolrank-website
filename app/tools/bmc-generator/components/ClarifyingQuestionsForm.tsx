'use client';

import { useState, useCallback, useRef } from 'react';
import { apiClient, APIError } from '../lib/api-client';
import { cls } from '../../lib/css-module-safe';
import type { BusinessContext } from '../lib/types';
import styles from '../styles/clarifying-questions-form.module.css';

interface ClarifyingQuestionsFormProps {
  questions: string[];
  sessionId: string;
  generationToken: string;
  onQuestionsAnswered: (context: BusinessContext) => void;
  onBack: () => void;
}

const MIN_ANSWER_CHARS = 10;
const MAX_ANSWER_CHARS = 500;

/**
 * Determines if a question is required or optional.
 * By spec: all questions are required unless explicitly marked optional.
 * We detect "(optional)" at the end of the question text.
 */
function isQuestionOptional(question: string): boolean {
  return question.toLowerCase().trim().endsWith('(optional)');
}

/**
 * Validates a single answer field.
 * Required: 10-500 chars (trimmed)
 * Optional: empty OR 10-500 chars (trimmed)
 */
function validateAnswer(
  answer: string,
  optional: boolean
): string | null {
  const trimmed = answer.trim();

  if (optional && trimmed.length === 0) {
    return null; // empty optional is valid
  }

  if (!optional && trimmed.length === 0) {
    return 'This field is required. Please provide an answer.';
  }

  if (trimmed.length > 0 && trimmed.length < MIN_ANSWER_CHARS) {
    return `Please enter at least ${MIN_ANSWER_CHARS} characters.`;
  }

  if (trimmed.length > MAX_ANSWER_CHARS) {
    return `Please enter no more than ${MAX_ANSWER_CHARS} characters.`;
  }

  return null;
}

export default function ClarifyingQuestionsForm({
  questions,
  sessionId,
  generationToken,
  onQuestionsAnswered,
  onBack,
}: ClarifyingQuestionsFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (let i = 0; i < questions.length; i++) {
      initial[String(i)] = '';
    }
    return initial;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const formRef = useRef<HTMLFormElement>(null);

  // Compute whether there are any validation errors (for disabling Continue)
  const hasValidationErrors = questions.some((question, index) => {
    const key = String(index);
    const optional = isQuestionOptional(question);
    const validationError = validateAnswer(answers[key] || '', optional);
    return validationError !== null;
  });

  const handleAnswerChange = useCallback((index: number, value: string) => {
    const key = String(index);
    setAnswers((prev) => ({ ...prev, [key]: value }));

    // Clear field error on input change if field was touched
    setFieldErrors((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });

    // Clear global error on any user input
    setError(null);
  }, []);

  const handleFieldBlur = useCallback((index: number) => {
    const key = String(index);
    setTouchedFields((prev) => ({ ...prev, [key]: true }));

    // Validate on blur
    const question = questions[index];
    const optional = isQuestionOptional(question);
    const validationError = validateAnswer(answers[key] || '', optional);

    if (validationError) {
      setFieldErrors((prev) => ({ ...prev, [key]: validationError }));
    } else {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    }
  }, [answers, questions]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate all fields
    const newFieldErrors: Record<string, string> = {};
    let firstInvalidIndex: number | null = null;

    for (let i = 0; i < questions.length; i++) {
      const key = String(i);
      const optional = isQuestionOptional(questions[i]);
      const validationError = validateAnswer(answers[key] || '', optional);
      if (validationError) {
        newFieldErrors[key] = validationError;
        if (firstInvalidIndex === null) {
          firstInvalidIndex = i;
        }
      }
    }

    // Mark all fields as touched on submit
    const allTouched: Record<string, boolean> = {};
    for (let i = 0; i < questions.length; i++) {
      allTouched[String(i)] = true;
    }
    setTouchedFields(allTouched);

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      // Focus first invalid field
      if (firstInvalidIndex !== null && formRef.current) {
        const invalidField = formRef.current.querySelector<HTMLTextAreaElement>(
          `#question-input-${firstInvalidIndex}`
        );
        invalidField?.focus();
      }
      return;
    }

    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      // Build answers Record<string, string> with trimmed values
      const trimmedAnswers: Record<string, string> = {};
      for (let i = 0; i < questions.length; i++) {
        const key = String(i);
        trimmedAnswers[key] = (answers[key] || '').trim();
      }

      const response = await apiClient.answers(sessionId, generationToken, trimmedAnswers);
      onQuestionsAnswered(response.context);
    } catch (err) {
      if (err instanceof APIError) {
        if (err.code === 0) {
          // Network error (APIClient wraps TypeError as code 0)
          setError('Network error. Please check your connection and retry.');
        } else if (err.code === 400) {
          setError('Invalid answers. Please check your responses and try again.');
        } else if (err.code === 403) {
          setError('Your session has expired. Please start over.');
        } else if (err.code === 404) {
          setError('Session not found. Please refresh and try again.');
        } else if (err.code >= 500) {
          setError('Processing error. Please try again.');
        } else {
          setError('Something went wrong. Please try again.');
        }
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [answers, questions, sessionId, generationToken, onQuestionsAnswered]);

  return (
    <div className={cls(styles, 'container')}>
      <div className={cls(styles, 'header')}>
        <h2 className={cls(styles, 'title')}>
          Answer a few quick questions
        </h2>
        <p className={cls(styles, 'subtitle')}>
          Your answers help us understand your business better and generate a more accurate canvas.
        </p>
      </div>

      <p className={cls(styles, 'progressIndicator')}>
        Step 2 of 3: Clarifying questions
      </p>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={cls(styles, 'form')}
        noValidate
      >
        {questions.map((question, index) => {
          const key = String(index);
          const optional = isQuestionOptional(question);
          const currentValue = answers[key] || '';
          const trimmedLength = currentValue.trim().length;
          const fieldError = touchedFields[key] ? fieldErrors[key] : undefined;
          const fieldErrorId = `question-error-${index}`;
          const counterId = `question-counter-${index}`;

          // Determine counter display class
          let counterClass = cls(styles, 'counter');
          if (trimmedLength > MAX_ANSWER_CHARS) {
            counterClass = `${cls(styles, 'counter')} ${cls(styles, 'counterError')}`;
          } else if (trimmedLength > 0 && trimmedLength < MIN_ANSWER_CHARS) {
            counterClass = `${cls(styles, 'counter')} ${cls(styles, 'counterWarning')}`;
          }

          // Determine textarea class
          let textareaClass = cls(styles, 'textarea');
          if (fieldError) {
            textareaClass = `${cls(styles, 'textarea')} ${cls(styles, 'textareaError')}`;
          }

          return (
            <div key={index} className={cls(styles, 'fieldGroup')}>
              <label
                htmlFor={`question-input-${index}`}
                className={cls(styles, 'label')}
              >
                {index + 1}. {question}
                {optional ? (
                  <span className={cls(styles, 'optionalIndicator')}>(optional)</span>
                ) : (
                  <span className={cls(styles, 'requiredIndicator')}>(required)</span>
                )}
              </label>

              <textarea
                id={`question-input-${index}`}
                className={textareaClass}
                value={currentValue}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                onBlur={() => handleFieldBlur(index)}
                disabled={loading}
                placeholder={optional ? 'Optional - leave blank to skip' : 'Type your answer here...'}
                aria-required={!optional}
                aria-describedby={
                  fieldError
                    ? `${fieldErrorId} ${counterId}`
                    : counterId
                }
                aria-invalid={fieldError ? true : undefined}
              />

              <div className={cls(styles, 'counterContainer')}>
                <span
                  id={counterId}
                  className={counterClass}
                  aria-live="polite"
                  aria-atomic="true"
                  aria-label={`${trimmedLength} of ${MAX_ANSWER_CHARS} characters`}
                >
                  {trimmedLength}/{MAX_ANSWER_CHARS} characters
                </span>
              </div>

              {fieldError && (
                <p
                  id={fieldErrorId}
                  className={cls(styles, 'fieldError')}
                  role="alert"
                >
                  {fieldError}
                </p>
              )}
            </div>
          );
        })}

        {/* Global Error Message */}
        {error && (
          <div
            className={cls(styles, 'errorMessage')}
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        {/* Button Group */}
        <div className={cls(styles, 'buttonGroup')}>
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className={cls(styles, 'backButton')}
            aria-label="Go back to idea input"
          >
            &larr; Back
          </button>

          <button
            type="submit"
            disabled={loading || hasValidationErrors}
            className={cls(styles, 'continueButton')}
            aria-label={loading ? 'Submitting your answers...' : 'Continue to generation'}
          >
            {loading ? (
              <span className={cls(styles, 'loadingContainer')}>
                <span className={cls(styles, 'spinner')} aria-hidden="true" />
                Submitting...
              </span>
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
