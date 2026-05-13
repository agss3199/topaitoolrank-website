import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Tier 1 (Unit) tests for the IdeaInputForm component.
 *
 * These tests verify the source code structure to ensure accessibility,
 * validation, and UX requirements are met through structural verification.
 * Full render tests with user interaction require a React test renderer,
 * which is reserved for E2E testing.
 *
 * Using source-grep approach per testing.md for structural verification.
 */

const componentPath = join(
  __dirname,
  '..',
  'components',
  'IdeaInputForm.tsx'
);

const stylesPath = join(
  __dirname,
  '..',
  'styles',
  'idea-input-form.module.css'
);

const componentSource = readFileSync(componentPath, 'utf-8');
const stylesSource = readFileSync(stylesPath, 'utf-8');

describe('IdeaInputForm Component (structural verification)', () => {
  describe('Component Structure', () => {
    it('is a client component', () => {
      expect(componentSource).toContain("'use client'");
    });

    it('imports API client correctly', () => {
      expect(componentSource).toContain("import { apiClient, APIError }");
      expect(componentSource).toContain("from '../lib/api-client'");
    });

    it('imports CSS module', () => {
      expect(componentSource).toContain("import styles from '../styles/idea-input-form.module.css'");
    });

    it('accepts onQuestionsReceived callback prop', () => {
      expect(componentSource).toContain('interface IdeaInputFormProps');
      expect(componentSource).toContain('onQuestionsReceived:');
      expect(componentSource).toContain('sessionId: string');
      expect(componentSource).toContain('questions: string[]');
      expect(componentSource).toContain('generationToken: string');
      expect(componentSource).toContain('estimatedCost: number');
      expect(componentSource).toContain('estimatedLatencySeconds: number');
    });

    it('uses React hooks (useState, useCallback, useMemo)', () => {
      expect(componentSource).toContain('useState');
      expect(componentSource).toContain('useCallback');
      expect(componentSource).toContain('useMemo');
    });
  });

  describe('Validation Logic', () => {
    it('defines MIN_CHARS as 50', () => {
      expect(componentSource).toContain('const MIN_CHARS = 50');
    });

    it('defines MAX_CHARS as 500', () => {
      expect(componentSource).toContain('const MAX_CHARS = 500');
    });

    it('trims idea before validation', () => {
      expect(componentSource).toContain('trimmedIdea = idea.trim()');
    });

    it('validates minimum character count', () => {
      expect(componentSource).toContain('charCount >= MIN_CHARS');
    });

    it('validates maximum character count', () => {
      expect(componentSource).toContain('charCount <= MAX_CHARS');
    });

    it('disables submit button based on validation', () => {
      expect(componentSource).toContain('disabled={!isValidLength');
    });

    it('displays character counter with max (0/500 format)', () => {
      expect(componentSource).toContain('{charCount}/{MAX_CHARS} characters');
    });
  });

  describe('Form Elements & Accessibility', () => {
    it('renders textarea with id="idea-input"', () => {
      expect(componentSource).toContain('id="idea-input"');
    });

    it('textarea has aria-label="Business idea"', () => {
      expect(componentSource).toContain('aria-label="Business idea"');
    });

    it('textarea has placeholder text', () => {
      expect(componentSource).toContain('placeholder=');
    });

    it('character counter has aria-live="polite"', () => {
      expect(componentSource).toContain('aria-live="polite"');
    });

    it('character counter has aria-atomic="true"', () => {
      expect(componentSource).toContain('aria-atomic="true"');
    });

    it('textarea is linked to error message via aria-describedby', () => {
      expect(componentSource).toContain('aria-describedby={error ? \'idea-error\'');
    });

    it('error message has role="alert"', () => {
      expect(componentSource).toContain('role="alert"');
    });

    it('error message has id="idea-error"', () => {
      expect(componentSource).toContain('id="idea-error"');
    });

    it('label is associated with textarea via htmlFor', () => {
      expect(componentSource).toContain('htmlFor="idea-input"');
    });

    it('submit button has aria-label', () => {
      expect(componentSource).toContain('aria-label={');
    });

    it('clear button has aria-label', () => {
      expect(componentSource).toContain('aria-label="Clear the input field"');
    });
  });

  describe('Error Handling', () => {
    it('catches APIError and displays generic message', () => {
      expect(componentSource).toContain('catch (err)');
      expect(componentSource).toContain('APIError');
    });

    it('shows different message for 4xx vs 5xx errors', () => {
      expect(componentSource).toContain('err.code >= 400 && err.code < 500');
    });

    it('displays generic error for 5xx', () => {
      expect(componentSource).toContain('Please try again. Contact support');
    });

    it('displays friendly error for 4xx', () => {
      expect(componentSource).toContain('Please check your input and try again');
    });

    it('clears error when user starts typing', () => {
      expect(componentSource).toContain('if (error) setError');
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner during submission', () => {
      expect(componentSource).toContain('spinner');
      expect(componentSource).toContain('Analyzing...');
    });

    it('disables submit button while loading', () => {
      expect(componentSource).toContain('disabled={!isValidLength || loading}');
    });

    it('disables textarea while loading', () => {
      expect(componentSource).toContain('disabled={loading}');
    });

    it('disables clear button while loading', () => {
      expect(componentSource).toContain('disabled={loading || charCount === 0}');
    });
  });

  describe('Callback Invocation', () => {
    it('calls onQuestionsReceived with all required parameters', () => {
      expect(componentSource).toContain('onQuestionsReceived(');
      expect(componentSource).toContain('response.session_id');
      expect(componentSource).toContain('response.questions');
      expect(componentSource).toContain('response.generation_token');
      expect(componentSource).toContain('response.estimated_cost');
      expect(componentSource).toContain('response.estimated_latency_seconds');
    });
  });

  describe('CSS Module Usage', () => {
    it('applies container class', () => {
      expect(componentSource).toContain("cls(styles, 'container')");
    });

    it('applies header class', () => {
      expect(componentSource).toContain("cls(styles, 'header')");
    });

    it('applies textarea class', () => {
      expect(componentSource).toContain("cls(styles, 'textarea')");
    });

    it('applies error message class', () => {
      expect(componentSource).toContain("cls(styles, 'errorMessage')");
    });

    it('applies submit button class', () => {
      expect(componentSource).toContain("cls(styles, 'submitButton')");
    });

    it('applies loading spinner class', () => {
      expect(componentSource).toContain("cls(styles, 'spinner')");
    });

    it('applies clear button class', () => {
      expect(componentSource).toContain("cls(styles, 'clearButton')");
    });

    it('applies character counter error class conditionally', () => {
      expect(componentSource).toContain('charCounterError');
    });
  });
});

describe('IdeaInputForm Styles (CSS Module)', () => {
  describe('Layout & Structure', () => {
    it('has container with max-width', () => {
      expect(stylesSource).toContain('.container');
      expect(stylesSource).toContain('max-width: 700px');
    });

    it('has form with flex layout', () => {
      expect(stylesSource).toContain('.form');
      expect(stylesSource).toContain('display: flex');
      expect(stylesSource).toContain('flex-direction: column');
    });
  });

  describe('Textarea Styling', () => {
    it('has textarea class with proper sizing', () => {
      expect(stylesSource).toContain('.textarea');
      expect(stylesSource).toContain('min-height: 120px');
    });

    it('textarea has focus state with blue border', () => {
      expect(stylesSource).toContain('.textarea:focus');
      expect(stylesSource).toContain('border-color: #3b82f6');
    });

    it('textarea has disabled state', () => {
      expect(stylesSource).toContain('.textarea:disabled');
      expect(stylesSource).toContain('cursor: not-allowed');
    });
  });

  describe('Character Counter', () => {
    it('has charCounterError class for over-limit styling', () => {
      expect(stylesSource).toContain('.charCounterError');
    });
  });

  describe('Error Message Styling', () => {
    it('has errorMessage class with red background', () => {
      expect(stylesSource).toContain('.errorMessage');
      expect(stylesSource).toContain('#fef2f2'); // light red
      expect(stylesSource).toContain('#dc2626'); // dark red
    });
  });

  describe('Button Styling', () => {
    it('has submitButton class', () => {
      expect(stylesSource).toContain('.submitButton');
    });

    it('submitButton is disabled styling', () => {
      expect(stylesSource).toContain('.submitButton:disabled');
    });

    it('has clearButton class', () => {
      expect(stylesSource).toContain('.clearButton');
    });

    it('has spinner animation', () => {
      expect(stylesSource).toContain('.spinner');
      expect(stylesSource).toContain('@keyframes spin');
      expect(stylesSource).toContain('animation: spin');
    });
  });

  describe('Responsive Design', () => {
    it('has mobile breakpoint at 600px', () => {
      expect(stylesSource).toContain('@media (max-width: 600px)');
    });

    it('has tablet breakpoint at 601-1024px', () => {
      expect(stylesSource).toContain('@media (min-width: 601px) and (max-width: 1024px)');
    });

    it('mobile adjusts padding', () => {
      expect(stylesSource).toContain('@media (max-width: 600px)');
      expect(stylesSource).toMatch(/@media \(max-width: 600px\)[\s\S]*\.container[\s\S]*padding:/);
    });

    it('mobile adjusts textarea height', () => {
      expect(stylesSource).toMatch(/@media \(max-width: 600px\)[\s\S]*\.textarea/);
    });
  });

  describe('Accessibility Features', () => {
    it('has high contrast mode support', () => {
      expect(stylesSource).toContain('@media (prefers-contrast: more)');
    });

    it('has reduced motion support', () => {
      expect(stylesSource).toContain('@media (prefers-reduced-motion: reduce)');
    });

    it('reduced motion disables spinner animation', () => {
      expect(stylesSource).toContain('@media (prefers-reduced-motion: reduce)');
      expect(stylesSource).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.spinner[\s\S]*animation: none/);
    });
  });

  describe('Info Section', () => {
    it('has infoSection class with blue styling', () => {
      expect(stylesSource).toContain('.infoSection');
      expect(stylesSource).toContain('#f0f9ff'); // light blue
      expect(stylesSource).toContain('#bfdbfe'); // medium blue
    });

    it('has infoText class', () => {
      expect(stylesSource).toContain('.infoText');
    });

    it('has highlight class for emphasis', () => {
      expect(stylesSource).toContain('.highlight');
      expect(stylesSource).toContain('font-weight: 700');
    });
  });
});
