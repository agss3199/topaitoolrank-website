import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import BMCCanvasDisplay from '../components/BMCCanvasDisplay';
import type { FinalBMC, BMCSection } from '../lib/types';

// ---------------------------------------------------------------------------
// Mock html2pdf.js — Tier 1 mock allowed per testing rules
// ---------------------------------------------------------------------------
const mockSave = vi.fn();
const mockFrom = vi.fn(() => ({ save: mockSave }));
const mockSet = vi.fn(() => ({ from: mockFrom }));
const mockHtml2pdf = vi.fn(() => ({ set: mockSet }));

vi.mock('html2pdf.js', () => ({
  default: () => mockHtml2pdf(),
}));

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------
function makeFullCanvas(): FinalBMC['canvas'] {
  return {
    customer_segments: 'Small business owners aged 25-45 in urban areas',
    value_propositions: 'AI-powered financial planning that saves 10 hours/week',
    channels: 'Direct sales, app store, partnerships with accounting firms',
    customer_relationships: 'Self-service with premium support tier',
    revenue_streams: 'SaaS subscription $29/mo, enterprise tier $99/mo',
    key_resources: 'ML models, financial data APIs, engineering team',
    key_activities: 'Model training, customer acquisition, compliance',
    key_partners: 'Cloud providers, data vendors, regulatory consultants',
    cost_structure: 'Cloud hosting 40%, salaries 35%, marketing 15%, ops 10%',
  };
}

function makeAgentOutputs(count: number): BMCSection[] {
  const names = [
    'customer_segments',
    'value_propositions',
    'key_resources',
    'revenue_streams',
  ] as const;
  return names.slice(0, count).map((name) => ({
    section_name: name,
    content: {
      points: [`Point 1 for ${name}`, `Point 2 for ${name}`],
      reasoning: 'A'.repeat(50),
      assumptions: ['assumption 1'],
      confidence_level: 'high' as const,
    },
    metadata: {
      agent_name: `${name}_agent`,
      tokens_used: { input: 100, output: 50 },
      latency_ms: 1200,
      timestamp: '2026-05-13T00:00:00Z',
    },
  }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('BMCCanvasDisplay', () => {
  const mockWriteText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard API — use defineProperty since clipboard is a getter
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });
  });

  it('renders a 3x3 grid with 9 sections when canvas is fully complete', () => {
    const canvas = makeFullCanvas();
    render(<BMCCanvasDisplay canvas={canvas} />);

    // All 9 section labels present
    expect(screen.getByText('Customer Segments')).toBeDefined();
    expect(screen.getByText('Value Propositions')).toBeDefined();
    expect(screen.getByText('Channels')).toBeDefined();
    expect(screen.getByText('Customer Relationships')).toBeDefined();
    expect(screen.getByText('Revenue Streams')).toBeDefined();
    expect(screen.getByText('Key Resources')).toBeDefined();
    expect(screen.getByText('Key Activities')).toBeDefined();
    expect(screen.getByText('Key Partners')).toBeDefined();
    expect(screen.getByText('Cost Structure')).toBeDefined();

    // Grid has role="table"
    expect(screen.getByRole('table')).toBeDefined();

    // 9 cells with role="cell"
    const cells = screen.getAllByRole('cell');
    expect(cells).toHaveLength(9);
  });

  it('shows all green (complete) cells when all sections have content', () => {
    const canvas = makeFullCanvas();
    const { container } = render(<BMCCanvasDisplay canvas={canvas} />);

    // No "[Unavailable]" text anywhere
    expect(screen.queryByText('[Unavailable]')).toBeNull();

    // All cells should have content
    const cells = screen.getAllByRole('cell');
    cells.forEach((cell) => {
      const paragraphs = cell.querySelectorAll('p');
      paragraphs.forEach((p) => {
        expect(p.textContent).not.toBe('[Unavailable]');
      });
    });
  });

  it('shows partial completion with gray unavailable sections', () => {
    // Canvas with some sections empty (simulated via undefined canvas + partial agents)
    render(
      <BMCCanvasDisplay
        agentOutputs={makeAgentOutputs(4)}
        timedOut={true}
        timeoutElapsedMs={98000}
        costCharged={0.16}
      />
    );

    // Fallback mode shows available sections
    expect(screen.getByText('Customer Segments')).toBeDefined();
    expect(screen.getByText('Value Propositions')).toBeDefined();

    // Missing sections listed
    expect(screen.getByText(/Missing sections:/)).toBeDefined();

    // Timeout banner
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText(/timed out at 98 seconds/)).toBeDefined();
    expect(screen.getByText(/Showing 4 of 9 sections/)).toBeDefined();
  });

  it('shows agent-only fallback with markdown blocks when no canvas provided', () => {
    const agents = makeAgentOutputs(3);
    render(<BMCCanvasDisplay agentOutputs={agents} />);

    // Fallback container present, not a grid table
    expect(screen.getByRole('region', { name: 'Partial BMC results' })).toBeDefined();
    expect(screen.queryByRole('table')).toBeNull();

    // Each agent output rendered as a section
    expect(screen.getByText('Customer Segments')).toBeDefined();
    expect(screen.getByText('Value Propositions')).toBeDefined();
    expect(screen.getByText('Key Resources')).toBeDefined();
  });

  it('copies canvas to clipboard when copy button is clicked', async () => {
    const canvas = makeFullCanvas();
    render(<BMCCanvasDisplay canvas={canvas} />);

    const copyBtn = screen.getByRole('button', { name: /copy canvas to clipboard/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledTimes(1);
    });

    const copiedText = mockWriteText.mock.calls[0][0];
    expect(copiedText).toContain('# Business Model Canvas');
    expect(copiedText).toContain('## Customer Segments');
    expect(copiedText).toContain('## Value Propositions');

    // Toast appears
    expect(screen.getByText('Copied to clipboard!')).toBeDefined();
  });

  it('triggers html2pdf download when PDF button is clicked', async () => {
    const canvas = makeFullCanvas();
    render(<BMCCanvasDisplay canvas={canvas} />);

    const pdfBtn = screen.getByRole('button', { name: /download canvas as pdf/i });
    fireEvent.click(pdfBtn);

    await waitFor(() => {
      expect(mockHtml2pdf).toHaveBeenCalled();
    });
  });

  it('renders responsive layout with grid for desktop', () => {
    const canvas = makeFullCanvas();
    const { container } = render(<BMCCanvasDisplay canvas={canvas} />);

    // Grid element exists with 9 children
    const grid = screen.getByRole('table');
    expect(grid.children).toHaveLength(9);
  });

  it('uses semantic HTML and ARIA labels for accessibility', () => {
    const canvas = makeFullCanvas();
    render(<BMCCanvasDisplay canvas={canvas} />);

    // Region with label
    expect(screen.getByRole('region', { name: 'Business Model Canvas' })).toBeDefined();

    // Table with label
    expect(screen.getByRole('table', { name: 'BMC 3x3 grid' })).toBeDefined();

    // Each cell has aria-label
    const cells = screen.getAllByRole('cell');
    cells.forEach((cell) => {
      expect(cell.getAttribute('aria-label')).toBeTruthy();
    });

    // Buttons have aria-labels
    expect(screen.getByRole('button', { name: /copy canvas to clipboard/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /download canvas as pdf/i })).toBeDefined();
  });
});
