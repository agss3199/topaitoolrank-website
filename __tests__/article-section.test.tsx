import { render, screen } from '@testing-library/react';
import { ArticleSection } from '@/app/tools/lib/ArticleSection';
import { describe, it, expect } from 'vitest';

describe('ArticleSection Component', () => {
  describe('Markdown Rendering', () => {
    it('converts headers to HTML', () => {
      const content = '## My Header\n\nParagraph text';
      render(<ArticleSection content={content} />);
      expect(screen.getByText('My Header')).toBeInTheDocument();
    });

    it('converts links to anchor tags', () => {
      const content = 'Check out [the tool](/tools/json-formatter)';
      render(<ArticleSection content={content} />);
      const link = screen.getByRole('link', { name: /the tool/i });
      expect(link).toHaveAttribute('href', '/tools/json-formatter');
    });

    it('converts bold text to strong', () => {
      const content = 'This is **bold text** here';
      const { container } = render(<ArticleSection content={content} />);
      expect(container.querySelector('strong')).toBeInTheDocument();
    });

    it('converts italic text to em', () => {
      const content = 'This is _italic text_ here';
      const { container } = render(<ArticleSection content={content} />);
      expect(container.querySelector('em')).toBeInTheDocument();
    });

    it('wraps paragraphs in p tags', () => {
      const content = 'First paragraph.\n\nSecond paragraph.';
      const { container } = render(<ArticleSection content={content} />);
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('XSS Prevention', () => {
    it('escapes HTML tags in content', () => {
      const content = 'This is <script>alert("xss")</script> text';
      const { container } = render(<ArticleSection content={content} />);
      // Should not contain actual script tag
      expect(container.querySelector('script')).not.toBeInTheDocument();
    });

    it('escapes onclick handlers', () => {
      const content = '<img src=x onerror="alert(\'xss\')" />';
      const { container } = render(<ArticleSection content={content} />);
      // Should escape the tag entirely
      expect(container.querySelector('img')).not.toBeInTheDocument();
    });

    it('rejects javascript: URLs', () => {
      const content = '[click me](javascript:alert("xss"))';
      render(<ArticleSection content={content} />);
      const link = screen.getByRole('link');
      // Should not have javascript: scheme
      expect(link).not.toHaveAttribute('href', /^javascript:/i);
    });

    it('rejects data: URLs', () => {
      const content = '[click me](data:text/html,<script>alert("xss")</script>)';
      render(<ArticleSection content={content} />);
      const link = screen.getByRole('link');
      // Should not have data: scheme
      expect(link).not.toHaveAttribute('href', /^data:/i);
    });

    it('allows safe URLs', () => {
      const content = '[link](/tools/json-formatter)';
      render(<ArticleSection content={content} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/tools/json-formatter');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty content', () => {
      const { container } = render(<ArticleSection content="" />);
      expect(container.querySelector('article')).toBeInTheDocument();
    });

    it('handles content with special characters', () => {
      const content = 'Text with & < > " \' characters';
      const { container } = render(<ArticleSection content={content} />);
      // Should render without errors
      expect(container).toBeInTheDocument();
    });

    it('preserves multiple newlines as paragraph breaks', () => {
      const content = 'Para 1\n\nPara 2\n\nPara 3';
      const { container } = render(<ArticleSection content={content} />);
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <ArticleSection content="test" className="custom-class" />
      );
      const article = container.querySelector('article');
      expect(article).toHaveClass('custom-class');
    });
  });
});
