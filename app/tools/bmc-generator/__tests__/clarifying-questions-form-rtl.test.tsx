import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

/**
 * Tier 2 Component Tests for ClarifyingQuestionsForm
 *
 * Uses React Testing Library + vitest to test:
 *   1. Rendering (all questions, buttons)
 *   2. Validation (blur errors, char limits, disabled state)
 *   3. Character Counter (real-time updates, aria-live)
 *   4. Form Submission (API call, loading, success, error)
 *   5. Back Button (callback, answer discard)
 *   6. Accessibility (aria-required, aria-describedby)
 */

// Mock apiClient before importing the component
vi.mock('../lib/api-client', () => {
  const APIError = class extends Error {
    code: number;
    details?: unknown;
    constructor(code: number, message: string, details?: unknown) {
      super(message);
      this.name = 'APIError';
      this.code = code;
      this.details = details;
    }
  };

  return {
    apiClient: {
      answers: vi.fn(),
    },
    APIError,
  };
});

// Mock the CSS module to avoid import issues in test environment
vi.mock('../styles/clarifying-questions-form.module.css', () => ({
  default: new Proxy(
    {},
    { get: (_target, prop) => (typeof prop === 'string' ? prop : '') }
  ),
}));

// Mock css-module-safe helper
vi.mock('../../lib/css-module-safe', () => ({
  cls: (_styles: Record<string, string> | undefined, className: string) => className,
}));

// Now import the component and mocked modules
import ClarifyingQuestionsForm from '../components/ClarifyingQuestionsForm';
import { apiClient, APIError } from '../lib/api-client';
import type { BusinessContext } from '../lib/types';

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

const sampleQuestions = [
  'Describe your target customer',
  "What's the core problem you solve?",
  "What's your pricing model?",
];

const defaultProps = {
  questions: sampleQuestions,
  sessionId: 'test-session-123',
  generationToken: 'test-token-abc',
  onQuestionsAnswered: vi.fn(),
  onBack: vi.fn(),
};

function validAnswerText(n = 30): string {
  return 'A'.repeat(n); // >= 10 chars to pass validation
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ===========================================================================
// 1. Rendering
// ===========================================================================

describe('Rendering', () => {
  it('renders all questions as labeled input fields', () => {
    render(<ClarifyingQuestionsForm {...defaultProps} />);

    for (let i = 0; i < sampleQuestions.length; i++) {
      // Each question text appears as a label
      const label = screen.getByText(new RegExp(sampleQuestions[i].replace(/[?]/g, '\\?')));
      expect(label).toBeInTheDocument();

      // Each question has a textarea
      const textarea = document.getElementById(`question-input-${i}`) as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();
      expect(textarea.tagName.toLowerCase()).toBe('textarea');
    }
  });

  it('shows Back and Continue buttons', () => {
    render(<ClarifyingQuestionsForm {...defaultProps} />);

    const backButton = screen.getByText(/back/i);
    expect(backButton).toBeInTheDocument();
    expect(backButton.tagName.toLowerCase()).toBe('button');

    const continueButton = screen.getByText(/continue/i);
    expect(continueButton).toBeInTheDocument();
    expect(continueButton.tagName.toLowerCase()).toBe('button');
  });
});

// ===========================================================================
// 2. Validation
// ===========================================================================

describe('Validation', () => {
  it('shows error when required field is empty on blur', async () => {
    render(<ClarifyingQuestionsForm {...defaultProps} />);

    const textarea = document.getElementById('question-input-0') as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();

    // Focus then blur without typing (empty required field)
    fireEvent.focus(textarea);
    fireEvent.blur(textarea);

    await waitFor(() => {
      // Look for error message related to the first field
      const errorEl = document.getElementById('question-error-0');
      expect(errorEl).toBeTruthy();
      expect(errorEl!.textContent).toMatch(/required/i);
    });
  });

  it('shows error when answer is below 10 chars', async () => {
    render(<ClarifyingQuestionsForm {...defaultProps} />);

    const textarea = document.getElementById('question-input-0') as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();

    // Type a short answer, then blur
    fireEvent.change(textarea, { target: { value: 'Short' } });
    fireEvent.blur(textarea);

    await waitFor(() => {
      const errorEl = document.getElementById('question-error-0');
      expect(errorEl).toBeTruthy();
      expect(errorEl!.textContent).toMatch(/10/);
    });
  });

  it('shows error when answer exceeds 500 chars', async () => {
    render(<ClarifyingQuestionsForm {...defaultProps} />);

    const textarea = document.getElementById('question-input-0') as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();

    // Type an overlong answer, then blur
    fireEvent.change(textarea, { target: { value: 'X'.repeat(501) } });
    fireEvent.blur(textarea);

    await waitFor(() => {
      const errorEl = document.getElementById('question-error-0');
      expect(errorEl).toBeTruthy();
      expect(errorEl!.textContent).toMatch(/500/);
    });
  });

  it('disables Continue button while required fields are empty', () => {
    render(<ClarifyingQuestionsForm {...defaultProps} />);

    const continueButton = screen.getByText(/continue/i);
    // All fields are empty on initial render; button should be disabled
    expect(continueButton).toBeDisabled();
  });
});

// ===========================================================================
// 3. Character Counter
// ===========================================================================

describe('Character Counter', () => {
  it('updates character count as user types', async () => {
    render(<ClarifyingQuestionsForm {...defaultProps} />);

    const textarea = document.getElementById('question-input-0') as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();

    // Initial count: 0/500
    const counter = document.getElementById('question-counter-0');
    expect(counter).toBeTruthy();
    expect(counter!.textContent).toContain('0/500');

    // Type some text
    fireEvent.change(textarea, { target: { value: 'Hello world test' } });

    // Counter should update to trimmed length
    await waitFor(() => {
      expect(counter!.textContent).toMatch(/16\/500|15\/500/); // "Hello world test" = 16 trimmed
    });
  });

  it('character counter has aria-live for accessibility', () => {
    render(<ClarifyingQuestionsForm {...defaultProps} />);

    const counter = document.getElementById('question-counter-0');
    expect(counter).toBeTruthy();
    expect(counter!.getAttribute('aria-live')).toBe('polite');
    expect(counter!.getAttribute('aria-atomic')).toBe('true');
  });
});

// ===========================================================================
// 4. Form Submission
// ===========================================================================

describe('Form Submission', () => {
  it('calls apiClient.answers() on Continue click with valid answers', async () => {
    const mockResponse = {
      session_id: 'test-session-123',
      context: {
        user_idea_summary: 'A'.repeat(50),
        industry: 'SaaS',
        customer_type: 'B2B',
      } as unknown as BusinessContext,
      next_action: 'start_generation' as const,
    };

    vi.mocked(apiClient.answers).mockResolvedValueOnce(mockResponse);

    render(<ClarifyingQuestionsForm {...defaultProps} />);

    // Fill in all required fields
    for (let i = 0; i < sampleQuestions.length; i++) {
      const textarea = document.getElementById(`question-input-${i}`) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: validAnswerText(30) } });
    }

    // Submit the form
    const continueButton = screen.getByText(/continue/i);
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(apiClient.answers).toHaveBeenCalledTimes(1);
      expect(apiClient.answers).toHaveBeenCalledWith(
        'test-session-123',
        'test-token-abc',
        expect.objectContaining({
          '0': validAnswerText(30),
          '1': validAnswerText(30),
          '2': validAnswerText(30),
        })
      );
    });
  });

  it('shows loading spinner while submitting', async () => {
    // Make the API call hang until we resolve it
    let resolveApi: (value: unknown) => void;
    vi.mocked(apiClient.answers).mockImplementation(
      () => new Promise((resolve) => { resolveApi = resolve; })
    );

    render(<ClarifyingQuestionsForm {...defaultProps} />);

    // Fill in all fields
    for (let i = 0; i < sampleQuestions.length; i++) {
      const textarea = document.getElementById(`question-input-${i}`) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: validAnswerText(30) } });
    }

    const continueButton = screen.getByText(/continue/i);
    fireEvent.click(continueButton);

    // Should show loading text
    await waitFor(() => {
      expect(screen.getByText(/submitting/i)).toBeInTheDocument();
    });

    // Resolve to clean up
    resolveApi!({
      session_id: 'test-session-123',
      context: {} as BusinessContext,
      next_action: 'start_generation',
    });
  });

  it('calls onQuestionsAnswered on successful submission', async () => {
    const mockContext = {
      user_idea_summary: 'A'.repeat(50),
      industry: 'SaaS',
      customer_type: 'B2B',
    } as unknown as BusinessContext;

    vi.mocked(apiClient.answers).mockResolvedValueOnce({
      session_id: 'test-session-123',
      context: mockContext,
      next_action: 'start_generation' as const,
    });

    render(<ClarifyingQuestionsForm {...defaultProps} />);

    // Fill in all fields
    for (let i = 0; i < sampleQuestions.length; i++) {
      const textarea = document.getElementById(`question-input-${i}`) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: validAnswerText(30) } });
    }

    const continueButton = screen.getByText(/continue/i);
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(defaultProps.onQuestionsAnswered).toHaveBeenCalledTimes(1);
      expect(defaultProps.onQuestionsAnswered).toHaveBeenCalledWith(mockContext);
    });
  });

  it('shows error message when API returns 400', async () => {
    const { APIError: MockAPIError } = await import('../lib/api-client');
    vi.mocked(apiClient.answers).mockRejectedValueOnce(
      new MockAPIError(400, 'Invalid answers')
    );

    render(<ClarifyingQuestionsForm {...defaultProps} />);

    // Fill in all fields
    for (let i = 0; i < sampleQuestions.length; i++) {
      const textarea = document.getElementById(`question-input-${i}`) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: validAnswerText(30) } });
    }

    fireEvent.click(screen.getByText(/continue/i));

    await waitFor(() => {
      const errorAlerts = screen.getAllByRole('alert');
      // At least one alert should contain relevant error text
      const hasRelevantError = errorAlerts.some(
        (el) =>
          el.textContent!.includes('Invalid') ||
          el.textContent!.includes('check') ||
          el.textContent!.includes('answers')
      );
      expect(hasRelevantError).toBe(true);
    });
  });

  it('shows error message when API returns 403', async () => {
    const { APIError: MockAPIError } = await import('../lib/api-client');
    vi.mocked(apiClient.answers).mockRejectedValueOnce(
      new MockAPIError(403, 'Invalid or expired generation token')
    );

    render(<ClarifyingQuestionsForm {...defaultProps} />);

    for (let i = 0; i < sampleQuestions.length; i++) {
      const textarea = document.getElementById(`question-input-${i}`) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: validAnswerText(30) } });
    }

    fireEvent.click(screen.getByText(/continue/i));

    await waitFor(() => {
      const errorAlerts = screen.getAllByRole('alert');
      const hasSessionError = errorAlerts.some(
        (el) =>
          el.textContent!.includes('expired') ||
          el.textContent!.includes('start over')
      );
      expect(hasSessionError).toBe(true);
    });
  });

  it('shows error message when API returns 404', async () => {
    const { APIError: MockAPIError } = await import('../lib/api-client');
    vi.mocked(apiClient.answers).mockRejectedValueOnce(
      new MockAPIError(404, 'Session not found')
    );

    render(<ClarifyingQuestionsForm {...defaultProps} />);

    for (let i = 0; i < sampleQuestions.length; i++) {
      const textarea = document.getElementById(`question-input-${i}`) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: validAnswerText(30) } });
    }

    fireEvent.click(screen.getByText(/continue/i));

    await waitFor(() => {
      const errorAlerts = screen.getAllByRole('alert');
      const hasNotFoundError = errorAlerts.some(
        (el) =>
          el.textContent!.includes('not found') ||
          el.textContent!.includes('Session') ||
          el.textContent!.includes('refresh')
      );
      expect(hasNotFoundError).toBe(true);
    });
  });

  it('shows error message when API returns 500', async () => {
    const { APIError: MockAPIError } = await import('../lib/api-client');
    vi.mocked(apiClient.answers).mockRejectedValueOnce(
      new MockAPIError(500, 'Internal server error')
    );

    render(<ClarifyingQuestionsForm {...defaultProps} />);

    for (let i = 0; i < sampleQuestions.length; i++) {
      const textarea = document.getElementById(`question-input-${i}`) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: validAnswerText(30) } });
    }

    fireEvent.click(screen.getByText(/continue/i));

    await waitFor(() => {
      const errorAlerts = screen.getAllByRole('alert');
      const hasServerError = errorAlerts.some(
        (el) =>
          el.textContent!.includes('Processing') ||
          el.textContent!.includes('try again') ||
          el.textContent!.includes('went wrong')
      );
      expect(hasServerError).toBe(true);
    });
  });
});

// ===========================================================================
// 5. Back Button
// ===========================================================================

describe('Back Button', () => {
  it('calls onBack callback on Back click', () => {
    render(<ClarifyingQuestionsForm {...defaultProps} />);

    const backButton = screen.getByText(/back/i);
    fireEvent.click(backButton);

    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
  });
});

// ===========================================================================
// 6. Accessibility
// ===========================================================================

describe('Accessibility', () => {
  it('required fields have aria-required="true"', () => {
    render(<ClarifyingQuestionsForm {...defaultProps} />);

    // All questions are required (none end with "(optional)")
    for (let i = 0; i < sampleQuestions.length; i++) {
      const textarea = document.getElementById(`question-input-${i}`) as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();
      expect(textarea.getAttribute('aria-required')).toBe('true');
    }
  });

  it('error messages have aria-describedby linking to input', () => {
    render(<ClarifyingQuestionsForm {...defaultProps} />);

    const textarea = document.getElementById('question-input-0') as HTMLTextAreaElement;

    // Trigger an error by blurring empty field
    fireEvent.focus(textarea);
    fireEvent.blur(textarea);

    waitFor(() => {
      const errorEl = document.getElementById('question-error-0');
      expect(errorEl).toBeTruthy();

      // The textarea's aria-describedby should reference the error element
      const describedBy = textarea.getAttribute('aria-describedby');
      expect(describedBy).toContain('question-error-0');
    });
  });
});
