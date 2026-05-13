import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Tier 1 (Unit) tests for the ClarifyingQuestionsForm component.
 *
 * Verifies source code structure for accessibility, validation,
 * form state management, and UX requirements.
 *
 * Using source-grep approach per testing.md for structural verification.
 */

const componentPath = join(
  __dirname,
  '..',
  'components',
  'ClarifyingQuestionsForm.tsx'
);

const stylesPath = join(
  __dirname,
  '..',
  'styles',
  'clarifying-questions-form.module.css'
);

const componentSource = readFileSync(componentPath, 'utf-8');
const stylesSource = readFileSync(stylesPath, 'utf-8');

describe('ClarifyingQuestionsForm Component (structural verification)', () => {
  describe('Component Structure', () => {
    it('is a client component', () => {
      expect(componentSource).toContain("'use client'");
    });

    it('imports API client correctly', () => {
      expect(componentSource).toContain("import { apiClient, APIError }");
      expect(componentSource).toContain("from '../lib/api-client'");
    });

    it('imports CSS module', () => {
      expect(componentSource).toContain(
        "import styles from '../styles/clarifying-questions-form.module.css'"
      );
    });

    it('exports default function ClarifyingQuestionsForm', () => {
      expect(componentSource).toContain(
        'export default function ClarifyingQuestionsForm'
      );
    });

    it('accepts required props: questions, sessionId, generationToken, onQuestionsAnswered, onBack', () => {
      expect(componentSource).toContain('questions:');
      expect(componentSource).toContain('sessionId:');
      expect(componentSource).toContain('generationToken:');
      expect(componentSource).toContain('onQuestionsAnswered:');
      expect(componentSource).toContain('onBack:');
    });

    it('defines ClarifyingQuestionsFormProps interface', () => {
      expect(componentSource).toContain('interface ClarifyingQuestionsFormProps');
    });

    it('uses React hooks (useState, useCallback)', () => {
      expect(componentSource).toContain('useState');
      expect(componentSource).toContain('useCallback');
    });
  });

  describe('Question Rendering', () => {
    it('maps over questions array to render inputs', () => {
      expect(componentSource).toContain('questions.map');
    });

    it('renders a textarea or input for each question', () => {
      expect(componentSource).toMatch(/textarea|<input/);
    });

    it('associates label with each question field', () => {
      expect(componentSource).toContain('htmlFor=');
    });

    it('uses question index or id as key', () => {
      expect(componentSource).toMatch(/key=\{/);
    });
  });

  describe('Validation Logic', () => {
    it('defines MIN_ANSWER_CHARS as 10', () => {
      expect(componentSource).toContain('MIN_ANSWER_CHARS = 10');
    });

    it('defines MAX_ANSWER_CHARS as 500', () => {
      expect(componentSource).toContain('MAX_ANSWER_CHARS = 500');
    });

    it('validates required answers have minimum length', () => {
      expect(componentSource).toContain('MIN_ANSWER_CHARS');
    });

    it('validates answers do not exceed maximum length', () => {
      expect(componentSource).toContain('MAX_ANSWER_CHARS');
    });

    it('tracks validation errors per field', () => {
      expect(componentSource).toMatch(/errors|validationErrors|fieldErrors/);
    });

    it('displays per-field validation error messages', () => {
      expect(componentSource).toMatch(/error.*message|errorMessage|fieldError/i);
    });
  });

  describe('Form State Management', () => {
    it('tracks answers as a record/object state', () => {
      expect(componentSource).toMatch(/useState.*Record|useState.*\{/);
      expect(componentSource).toMatch(/answers|formData/);
    });

    it('updates specific answer by question identifier', () => {
      expect(componentSource).toMatch(/\[.*\]:.*|\.\.\.answers|\.\.\.prev/);
    });
  });

  describe('Form Elements & Accessibility', () => {
    it('renders Back button', () => {
      expect(componentSource).toMatch(/Back|Go Back/i);
    });

    it('renders Continue/Submit button', () => {
      expect(componentSource).toMatch(/Continue|Submit/);
    });

    it('has aria-required on required fields', () => {
      expect(componentSource).toContain('aria-required');
    });

    it('has proper labels for each question input', () => {
      expect(componentSource).toContain('<label');
    });

    it('error messages use role="alert" or aria-live', () => {
      expect(componentSource).toMatch(/role="alert"|aria-live/);
    });

    it('submit button has aria-label for loading state', () => {
      expect(componentSource).toMatch(/aria-label=.*\{/);
    });
  });

  describe('Button Behavior', () => {
    it('Back button calls onBack prop', () => {
      expect(componentSource).toContain('onBack');
    });

    it('Continue button triggers form submission', () => {
      expect(componentSource).toMatch(/type="submit"|handleSubmit/);
    });

    it('Continue button is disabled during loading', () => {
      expect(componentSource).toMatch(/disabled.*loading|disabled=\{.*loading/);
    });

    it('Back button is disabled during loading', () => {
      expect(componentSource).toMatch(/disabled.*loading/);
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator during submission', () => {
      expect(componentSource).toMatch(/spinner|loading|Submitting/);
    });

    it('disables form inputs while loading', () => {
      expect(componentSource).toContain('disabled={loading}');
    });
  });

  describe('API Integration', () => {
    it('calls apiClient.answers() on submit', () => {
      expect(componentSource).toContain('apiClient.answers');
    });

    it('passes sessionId to apiClient.answers', () => {
      expect(componentSource).toContain('sessionId');
    });

    it('passes generationToken to apiClient.answers', () => {
      expect(componentSource).toContain('generationToken');
    });

    it('passes answers record to apiClient.answers', () => {
      expect(componentSource).toMatch(/apiClient\.answers\(/);
    });

    it('calls onQuestionsAnswered with response on success', () => {
      expect(componentSource).toContain('onQuestionsAnswered');
    });
  });

  describe('Error Handling', () => {
    it('catches APIError from api call', () => {
      expect(componentSource).toContain('catch');
      expect(componentSource).toContain('APIError');
    });

    it('displays generic error message for API errors', () => {
      expect(componentSource).toMatch(/setError|setApiError/);
    });

    it('shows different message for 4xx vs 5xx', () => {
      expect(componentSource).toMatch(/err\.code|error\.code/);
    });

    it('clears error when user modifies answers', () => {
      expect(componentSource).toMatch(/setError\(null\)|setError\(''\)|setError\(""\)/);
    });
  });

  describe('CSS Module Usage (cls() helper pattern)', () => {
    it('imports cls helper for safe CSS Module access', () => {
      expect(componentSource).toContain("import { cls }");
      expect(componentSource).toContain("css-module-safe");
    });

    it('applies container class via cls()', () => {
      expect(componentSource).toContain("cls(styles, 'container')");
    });

    it('applies question field class via cls()', () => {
      expect(componentSource).toContain("cls(styles, 'fieldGroup')");
    });

    it('applies button classes via cls()', () => {
      expect(componentSource).toContain("cls(styles, 'continueButton')");
      expect(componentSource).toContain("cls(styles, 'backButton')");
    });

    it('applies error class via cls()', () => {
      expect(componentSource).toMatch(/cls\(styles, 'errorMessage'\)|cls\(styles, 'fieldError'\)/);
    });

    it('does NOT use direct styles["className"] access', () => {
      // Per css-module-safety.md: all CSS Module accesses must use cls()
      expect(componentSource).not.toMatch(/styles\["[a-zA-Z]/);
    });
  });
});

describe('ClarifyingQuestionsForm Styles (CSS Module)', () => {
  describe('Layout & Structure', () => {
    it('has container with max-width', () => {
      expect(stylesSource).toContain('.container');
      expect(stylesSource).toContain('max-width');
    });

    it('has form layout with flex/grid', () => {
      expect(stylesSource).toMatch(/display:\s*(flex|grid)/);
    });
  });

  describe('Question Input Styling', () => {
    it('has textarea/input styles with proper sizing', () => {
      expect(stylesSource).toMatch(/\.textarea|\.input|\.answerInput/);
      expect(stylesSource).toContain('min-height');
    });

    it('has focus state styling', () => {
      expect(stylesSource).toMatch(/:focus/);
    });

    it('has disabled state', () => {
      expect(stylesSource).toMatch(/:disabled/);
    });
  });

  describe('Error Styling', () => {
    it('has error message class with red/danger color', () => {
      expect(stylesSource).toMatch(/\.error|\.fieldError/);
      expect(stylesSource).toMatch(/#dc2626|#ef4444|#fef2f2|red|danger/);
    });
  });

  describe('Button Styling', () => {
    it('has continue/submit button class', () => {
      expect(stylesSource).toMatch(/\.continueButton|\.submitButton/);
    });

    it('has back button class', () => {
      expect(stylesSource).toContain('.backButton');
    });

    it('has disabled button styling', () => {
      expect(stylesSource).toMatch(/:disabled/);
    });

    it('has spinner/loading animation', () => {
      expect(stylesSource).toMatch(/\.spinner|@keyframes/);
    });
  });

  describe('Responsive Design', () => {
    it('has mobile breakpoint', () => {
      expect(stylesSource).toMatch(/@media.*max-width/);
    });

    it('adjusts layout for mobile', () => {
      expect(stylesSource).toContain('@media');
    });
  });

  describe('Accessibility Features', () => {
    it('has reduced motion support', () => {
      expect(stylesSource).toContain('prefers-reduced-motion');
    });
  });
});
