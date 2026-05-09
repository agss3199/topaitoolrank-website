import React from 'react';

interface ArticleSectionProps {
  content: string;
  className?: string;
}

/**
 * Renders article markdown content as HTML
 * Converts basic markdown to HTML while preventing XSS
 */
export function ArticleSection({ content, className }: ArticleSectionProps) {
  // Escape HTML entities to prevent XSS
  const escapeHtml = (text: string): string => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  };

  // Simple markdown to HTML converter (safe against XSS)
  const renderMarkdown = (text: string) => {
    // First escape all HTML to prevent injection
    let html = escapeHtml(text);

    // Convert markdown links [text](url) to <a> tags
    // We need to unescape the link text and URL since they were escaped
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
      // Decode the escaped entities in link text
      const decodedText = linkText
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      // Validate that URL doesn't contain javascript: or data: schemes
      const decodedUrl = url
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      if (decodedUrl.match(/^(javascript:|data:|vbscript:)/i)) {
        return match; // Don't convert dangerous URLs
      }
      return `<a href="${decodedUrl}" class="article__link">${decodedText}</a>`;
    });

    // Convert headers (## and ###)
    html = html.replace(/^### (.+)$/gm, (match, text) => {
      const decodedText = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      return `<h3 class="article__h3">${decodedText}</h3>`;
    });
    html = html.replace(/^## (.+)$/gm, (match, text) => {
      const decodedText = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      return `<h2 class="article__h2">${decodedText}</h2>`;
    });
    html = html.replace(/^# (.+)$/gm, (match, text) => {
      const decodedText = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      return `<h1 class="article__h1">${decodedText}</h1>`;
    });

    // Convert bold **text** to <strong>
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Convert italic _text_ to <em>
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Convert paragraphs (double newline)
    const paragraphs = html.split(/\n\n+/);
    html = paragraphs
      .map((p) => {
        p = p.trim();
        if (!p) return '';
        if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<ol') || p.startsWith('<a')) {
          return p;
        }
        return `<p class="article__paragraph">${p}</p>`;
      })
      .join('\n');

    return html;
  };

  const articleHTML = renderMarkdown(content);

  return (
    <article className={`article ${className || ''}`}>
      <div
        className="article__body"
        dangerouslySetInnerHTML={{ __html: articleHTML }}
      />
    </article>
  );
}
