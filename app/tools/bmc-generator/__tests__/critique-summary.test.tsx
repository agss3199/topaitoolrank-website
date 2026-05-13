import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import CritiqueSummary from '../components/CritiqueSummary';
import type { FinalBMC } from '../lib/types';

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------
function makeCritiqueSummary(
  overrides: Partial<FinalBMC['critique_summary']> = {}
): FinalBMC['critique_summary'] {
  return {
    high_risk_items: [
      'Revenue model depends heavily on a single customer segment',
      'Competition in this space is intensifying rapidly',
      'Customer acquisition cost may exceed LTV in early stages',
    ],
    medium_risk_items: [
      'Scaling manufacturing requires significant capital',
      'Regulatory uncertainty in target markets',
    ],
    areas_of_strength: [
      'Clear target customer with validated pain point',
      'Defensible IP position through proprietary ML models',
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('CritiqueSummary', () => {
  it('groups findings by severity (HIGH / MEDIUM / STRENGTH)', () => {
    const summary = makeCritiqueSummary();
    render(<CritiqueSummary critiqueSummary={summary} />);

    // Three groups present
    expect(screen.getByText(/High-Risk Items \(3\)/)).toBeDefined();
    expect(screen.getByText(/Medium-Risk Items \(2\)/)).toBeDefined();
    expect(screen.getByText(/Strengths \(2\)/)).toBeDefined();

    // Individual items rendered
    expect(screen.getByText(/Revenue model depends/)).toBeDefined();
    expect(screen.getByText(/Scaling manufacturing/)).toBeDefined();
    expect(screen.getByText(/Clear target customer/)).toBeDefined();
  });

  it('shows max 5 items per category', () => {
    const summary = makeCritiqueSummary({
      high_risk_items: [
        'Risk 1', 'Risk 2', 'Risk 3', 'Risk 4', 'Risk 5',
      ],
      medium_risk_items: [
        'Med 1', 'Med 2', 'Med 3', 'Med 4', 'Med 5',
      ],
      areas_of_strength: [
        'Str 1', 'Str 2', 'Str 3', 'Str 4', 'Str 5',
      ],
    });
    render(<CritiqueSummary critiqueSummary={summary} />);

    // Count shows 5
    expect(screen.getByText(/High-Risk Items \(5\)/)).toBeDefined();

    // All 5 rendered (max)
    const highList = screen.getByRole('list', { name: /High risk findings/ });
    expect(highList.children).toHaveLength(5);
  });

  it('renders severity icons correctly', () => {
    const summary = makeCritiqueSummary();
    render(<CritiqueSummary critiqueSummary={summary} />);

    // Icons via role="img" with aria-labels
    expect(screen.getByRole('img', { name: 'High risk' })).toBeDefined();
    expect(screen.getByRole('img', { name: 'Medium risk' })).toBeDefined();
    expect(screen.getByRole('img', { name: 'Strength' })).toBeDefined();
  });

  it('has proper accessibility: aria-labels and list semantics', () => {
    const summary = makeCritiqueSummary();
    render(<CritiqueSummary critiqueSummary={summary} />);

    // Region with label
    expect(screen.getByRole('region', { name: 'Red Team Assessment' })).toBeDefined();

    // Heading
    expect(screen.getByRole('heading', { name: 'Red Team Assessment' })).toBeDefined();

    // Lists with aria-labels
    expect(screen.getByRole('list', { name: /High risk findings/ })).toBeDefined();
    expect(screen.getByRole('list', { name: /Medium risk findings/ })).toBeDefined();
    expect(screen.getByRole('list', { name: /Strength findings/ })).toBeDefined();
  });

  it('renders nothing when all findings arrays are empty', () => {
    const summary = makeCritiqueSummary({
      high_risk_items: [],
      medium_risk_items: [],
      areas_of_strength: [],
    });
    const { container } = render(<CritiqueSummary critiqueSummary={summary} />);

    // Component returns null — nothing rendered
    expect(container.innerHTML).toBe('');
  });
});
