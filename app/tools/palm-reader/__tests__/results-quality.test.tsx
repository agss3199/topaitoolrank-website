import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('ResultsView XSS prevention', () => {
  it('renders HTML tags as literal text, not executed', async () => {
    const ResultsView = (await import('../components/ResultsView')).default;
    const maliciousResults = {
      is_palm: true as const,
      confidence: 0.9,
      lines: {
        life: { description: '<script>alert("xss")</script>', interpretation: '<img onerror="alert(1)" src="x">' },
        heart: { description: 'normal', interpretation: 'normal' },
        head: { description: '', interpretation: '' },
        fate: { description: '', interpretation: '' },
        sun: { description: '', interpretation: '' },
      },
      overall_reading: '<div onmouseover="alert(2)">hover me</div>',
      tip: '<a href="javascript:void(0)">click</a>',
    };

    const { container } = render(
      <ResultsView results={maliciousResults} onRetry={vi.fn()} onHome={vi.fn()} />
    );

    // Script tag should appear as escaped text, not as an element
    expect(container.innerHTML).toContain('&lt;script&gt;');
    expect(container.querySelector('script')).toBeNull();
    expect(container.innerHTML).toContain('&lt;img');
    expect(container.querySelector('img')).toBeNull();
    expect(container.innerHTML).toContain('&lt;div');
    expect(container.innerHTML).toContain('&lt;a');
  });

  it('renders all palm line sections with correct borders', async () => {
    const ResultsView = (await import('../components/ResultsView')).default;
    const results = {
      is_palm: true as const,
      confidence: 0.95,
      lines: {
        life: { description: 'Life desc', interpretation: 'Life interp' },
        heart: { description: 'Heart desc', interpretation: 'Heart interp' },
        head: { description: 'Head desc', interpretation: 'Head interp' },
        fate: { description: 'Fate desc', interpretation: 'Fate interp' },
        sun: { description: 'Sun desc', interpretation: 'Sun interp' },
      },
      overall_reading: 'Overall text',
      tip: 'Tip text',
    };

    render(<ResultsView results={results} onRetry={vi.fn()} onHome={vi.fn()} />);

    expect(screen.getByText(/Life Line/)).toBeTruthy();
    expect(screen.getByText(/Heart Line/)).toBeTruthy();
    expect(screen.getByText(/Head Line/)).toBeTruthy();
    expect(screen.getByText(/Fate Line/)).toBeTruthy();
    expect(screen.getByText(/Sun Line/)).toBeTruthy();
    expect(screen.getByText('Overall text')).toBeTruthy();
    expect(screen.getByText('Tip text')).toBeTruthy();
  });

  it('hides lines with no content', async () => {
    const ResultsView = (await import('../components/ResultsView')).default;
    const results = {
      is_palm: true as const,
      confidence: 0.9,
      lines: {
        life: { description: 'Present', interpretation: 'Yes' },
        heart: { description: '', interpretation: '' },
        head: { description: '', interpretation: '' },
        fate: { description: '', interpretation: '' },
        sun: { description: '', interpretation: '' },
      },
      overall_reading: '',
      tip: '',
    };

    render(<ResultsView results={results} onRetry={vi.fn()} onHome={vi.fn()} />);

    expect(screen.getByText(/Life Line/)).toBeTruthy();
    expect(screen.queryByText(/Heart Line/)).toBeNull();
  });

  it('renders retry and home buttons', async () => {
    const ResultsView = (await import('../components/ResultsView')).default;
    const onRetry = vi.fn();
    const onHome = vi.fn();
    const results = {
      is_palm: true as const,
      confidence: 0.9,
      lines: {
        life: { description: 'a', interpretation: 'b' },
        heart: { description: '', interpretation: '' },
        head: { description: '', interpretation: '' },
        fate: { description: '', interpretation: '' },
        sun: { description: '', interpretation: '' },
      },
      overall_reading: '',
      tip: '',
    };

    render(<ResultsView results={results} onRetry={onRetry} onHome={onHome} />);

    const { fireEvent } = await import('@testing-library/react');
    fireEvent.click(screen.getByText('Read Another Palm'));
    expect(onRetry).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByText('Home'));
    expect(onHome).toHaveBeenCalledOnce();
  });
});

describe('QualityMeter', () => {
  it('renders quality percentage', async () => {
    const QualityMeter = (await import('../components/QualityMeter')).default;
    render(<QualityMeter quality={85} />);
    expect(screen.getByText('Quality: 85%')).toBeTruthy();
  });

  it('clamps quality to 0-100 range', async () => {
    const QualityMeter = (await import('../components/QualityMeter')).default;
    const { rerender } = render(<QualityMeter quality={150} />);
    expect(screen.getByText('Quality: 100%')).toBeTruthy();

    rerender(<QualityMeter quality={-20} />);
    expect(screen.getByText('Quality: 0%')).toBeTruthy();
  });

  it('renders progress bar with correct width', async () => {
    const QualityMeter = (await import('../components/QualityMeter')).default;
    const { container } = render(<QualityMeter quality={75} />);
    const bar = container.querySelector('[style*="width"]');
    expect(bar).toBeTruthy();
    expect(bar?.getAttribute('style')).toContain('75%');
  });
});
