'use client';

import { useState, useEffect } from 'react';
import { Heading } from '@/app/lib/blog-types';
import './TableOfContents.css';

interface TableOfContentsProps {
  headings: Heading[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Track which heading is in view
    const handleScroll = () => {
      const headingElements = headings.map(h => ({
        id: h.id,
        el: document.getElementById(h.id),
        level: h.level,
      }));

      let current = '';
      for (const heading of headingElements) {
        if (!heading.el) continue;
        const rect = heading.el.getBoundingClientRect();
        // If heading is near the top of viewport, mark as active
        if (rect.top < window.innerHeight / 3) {
          current = heading.id;
        } else {
          break;
        }
      }
      setActiveId(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Set initial active heading
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false);
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="toc-mobile-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle table of contents"
      >
        <span className="toc-mobile-toggle-icon">≡</span>
      </button>

      {/* TOC Container */}
      <nav className={`toc ${isOpen ? 'toc-open' : ''}`}>
        <h3 className="toc-title">On This Page</h3>
        <ul className="toc-list">
          {headings.map((heading) => (
            <li
              key={heading.id}
              className={`toc-item toc-level-${heading.level}`}
            >
              <button
                className={`toc-link ${activeId === heading.id ? 'toc-active' : ''}`}
                onClick={() => handleClick(heading.id)}
              >
                {heading.text}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
