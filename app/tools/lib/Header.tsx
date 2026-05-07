'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from './Header.module.css';

interface Tool {
  name: string;
  path: string;
  category: string;
}

const tools: Tool[] = [
  { name: 'JSON Formatter', path: '/tools/json-formatter', category: 'Featured' },
  { name: 'Word Counter', path: '/tools/word-counter', category: 'Featured' },
  { name: 'Email Subject Tester', path: '/tools/email-subject-tester', category: 'Featured' },
  { name: 'AI Prompt Generator', path: '/tools/ai-prompt-generator', category: 'Text & Language' },
  { name: 'UTM Link Builder', path: '/tools/utm-link-builder', category: 'Links & UTM' },
  { name: 'WhatsApp Link Generator', path: '/tools/whatsapp-link-generator', category: 'Links & UTM' },
  { name: 'Invoice Generator', path: '/tools/invoice-generator', category: 'Content' },
  { name: 'SEO Analyzer', path: '/tools/seo-analyzer', category: 'Content' },
  { name: 'WhatsApp Message Formatter', path: '/tools/whatsapp-message-formatter', category: 'Messaging' },
  { name: 'WA-Sender', path: '/wa-sender', category: 'Messaging' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);

  const groupedTools = tools.reduce(
    (acc, tool) => {
      const existing = acc.find(g => g.category === tool.category);
      if (existing) {
        existing.tools.push(tool);
      } else {
        acc.push({ category: tool.category, tools: [tool] });
      }
      return acc;
    },
    [] as Array<{ category: string; tools: Tool[] }>
  );

  return (
    <header className={styles.toolHeader}>
      <div className={styles.toolHeaderBrand}>
        <Link href="/" className={styles.toolHeaderBrandLink}>
          <span className={styles.toolHeaderLogo}>⚡</span>
          <span className={styles.toolHeaderSiteName}>Top AI Tool Rank</span>
        </Link>
      </div>

      {/* Desktop Navigation */}
      <nav className={styles.toolHeaderNav} aria-label="Main navigation">
        <div className={styles.toolsDropdownContainer}>
          <button
            className={styles.toolsDropdownBtn}
            onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
            aria-expanded={toolsDropdownOpen}
            aria-haspopup="true"
          >
            Tools
            <span className={styles.dropdownCaret}>▼</span>
          </button>
          {toolsDropdownOpen && (
            <div className={styles.toolsDropdown} role="menu">
              {groupedTools.map(group => (
                <div key={group.category} className={styles.toolsDropdownGroup}>
                  <div className={styles.toolsDropdownGroupTitle}>{group.category}</div>
                  {group.tools.map(tool => (
                    <Link
                      key={tool.path}
                      href={tool.path}
                      className={styles.toolsDropdownLink}
                      role="menuitem"
                      onClick={() => setToolsDropdownOpen(false)}
                    >
                      {tool.name}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        <Link href="/blogs" className={styles.toolHeaderNavLink}>
          Blog
        </Link>
        <Link href="/#about" className={styles.toolHeaderNavLink}>
          About
        </Link>
        <Link href="/#contact" className={styles.toolHeaderNavLink}>
          Contact
        </Link>
      </nav>

      {/* Mobile Hamburger */}
      <button
        className={styles.toolHeaderHamburger}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-expanded={mobileMenuOpen}
        aria-label="Toggle navigation menu"
      >
        <span className={styles.hamburgerLine}></span>
        <span className={styles.hamburgerLine}></span>
        <span className={styles.hamburgerLine}></span>
      </button>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav className={styles.toolHeaderMobileMenu} aria-label="Mobile navigation">
          <div className={styles.toolHeaderMobileMenuItem}>
            <button
              className={styles.toolHeaderMobileMenuBtn}
              onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
              aria-expanded={toolsDropdownOpen}
            >
              Tools
            </button>
            {toolsDropdownOpen && (
              <div className={styles.toolHeaderMobileSubMenu}>
                {groupedTools.map(group => (
                  <div key={group.category}>
                    <div className={styles.toolHeaderMobileSubMenuTitle}>{group.category}</div>
                    {group.tools.map(tool => (
                      <Link
                        key={tool.path}
                        href={tool.path}
                        className={styles.toolHeaderMobileSubMenuLink}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setToolsDropdownOpen(false);
                        }}
                      >
                        {tool.name}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          <Link
            href="/blogs"
            className={styles.toolHeaderMobileMenuItem}
            onClick={() => setMobileMenuOpen(false)}
          >
            Blog
          </Link>
          <Link
            href="/#about"
            className={styles.toolHeaderMobileMenuItem}
            onClick={() => setMobileMenuOpen(false)}
          >
            About
          </Link>
          <Link
            href="/#contact"
            className={styles.toolHeaderMobileMenuItem}
            onClick={() => setMobileMenuOpen(false)}
          >
            Contact
          </Link>
        </nav>
      )}
    </header>
  );
}
