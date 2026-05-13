import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import RecommendationsPanel from '../components/RecommendationsPanel';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const RECOMMENDATIONS = [
  'Validate key assumptions around customer willingness to pay',
  'Develop partnerships with established distribution channels',
  'Plan for regulatory compliance early',
];

const NEXT_STEPS = [
  'Create detailed financial projections',
  'Identify and contact 10 potential customers',
  'Research competitor pricing strategies',
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('RecommendationsPanel', () => {
  it('shows strategic recommendations as an ordered list', () => {
    render(<RecommendationsPanel recommendations={RECOMMENDATIONS} nextSteps={[]} />);

    expect(screen.getByRole('heading', { name: 'Strategic Recommendations' })).toBeDefined();

    const list = screen.getByRole('list', { name: /Strategic recommendations list/ });
    expect(list.tagName).toBe('OL');
    expect(list.children).toHaveLength(3);

    expect(screen.getByText(/Validate key assumptions/)).toBeDefined();
    expect(screen.getByText(/Develop partnerships/)).toBeDefined();
    expect(screen.getByText(/Plan for regulatory/)).toBeDefined();
  });

  it('shows next steps as a checklist', () => {
    render(<RecommendationsPanel recommendations={[]} nextSteps={NEXT_STEPS} />);

    expect(screen.getByRole('heading', { name: 'Next Steps' })).toBeDefined();

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);

    // All unchecked initially
    checkboxes.forEach((cb) => {
      expect((cb as HTMLInputElement).checked).toBe(false);
    });
  });

  it('toggles checkboxes on click (client-side state only)', () => {
    render(<RecommendationsPanel recommendations={[]} nextSteps={NEXT_STEPS} />);

    const checkboxes = screen.getAllByRole('checkbox');

    // Check first item
    fireEvent.click(checkboxes[0]);
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
    expect((checkboxes[1] as HTMLInputElement).checked).toBe(false);

    // Uncheck first item
    fireEvent.click(checkboxes[0]);
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(false);
  });

  it('has proper accessibility: labels and ARIA', () => {
    render(
      <RecommendationsPanel recommendations={RECOMMENDATIONS} nextSteps={NEXT_STEPS} />
    );

    // Region with label
    expect(
      screen.getByRole('region', { name: 'Strategic Recommendations' })
    ).toBeDefined();

    // Each checkbox has an aria-label
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((cb) => {
      expect(cb.getAttribute('aria-label')).toBeTruthy();
    });

    // Labels wrap checkboxes for click targeting
    const labels = screen.getAllByText(/Create detailed|Identify and contact|Research competitor/);
    expect(labels).toHaveLength(3);
  });

  it('renders nothing when both recommendations and next steps are empty', () => {
    const { container } = render(
      <RecommendationsPanel recommendations={[]} nextSteps={[]} />
    );

    expect(container.innerHTML).toBe('');
  });
});
