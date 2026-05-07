'use client';

import Link from 'next/link';
import styles from './Footer.module.css';

const topTools = [
  { name: 'JSON Formatter', path: '/tools/json-formatter' },
  { name: 'Word Counter', path: '/tools/word-counter' },
  { name: 'Email Subject Tester', path: '/tools/email-subject-tester' },
  { name: 'UTM Link Builder', path: '/tools/utm-link-builder' },
  { name: 'SEO Analyzer', path: '/tools/seo-analyzer' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.toolFooter}>
      {/* Branding Column */}
      <div className={styles.toolFooterColumn}>
        <div className={styles.toolFooterBrand}>
          <span className={styles.toolFooterLogo}>⚡</span>
          <div className={styles.toolFooterBrandText}>
            <h2 className={styles.toolFooterBrandName}>Top AI Tool Rank</h2>
            <p className={styles.toolFooterBrandDesc}>Free AI tools for productivity and SEO</p>
          </div>
        </div>
      </div>

      {/* Tools Column */}
      <div className={styles.toolFooterColumn}>
        <h3 className={styles.toolFooterColumnTitle}>Tools</h3>
        {topTools.map(tool => (
          <Link key={tool.path} href={tool.path} className={styles.toolFooterLink}>
            {tool.name}
          </Link>
        ))}
        <Link href="/tools" className={styles.toolFooterLink}>
          View all tools
        </Link>
      </div>

      {/* Resources Column */}
      <div className={styles.toolFooterColumn}>
        <h3 className={styles.toolFooterColumnTitle}>Resources</h3>
        <Link href="/blogs" className={styles.toolFooterLink}>
          Blog
        </Link>
        <a href="#" className={styles.toolFooterLink}>
          Documentation
        </a>
        <a href="#" className={styles.toolFooterLink}>
          API Docs
        </a>
      </div>

      {/* Legal Column */}
      <div className={styles.toolFooterColumn}>
        <h3 className={styles.toolFooterColumnTitle}>Legal</h3>
        <Link href="/privacy" className={styles.toolFooterLink}>
          Privacy Policy
        </Link>
        <Link href="/terms" className={styles.toolFooterLink}>
          Terms of Service
        </Link>
        <Link href="/#contact" className={styles.toolFooterLink}>
          Contact
        </Link>
        <Link href="/sitemap.xml" className={styles.toolFooterLink}>
          Sitemap
        </Link>
      </div>

      {/* Copyright */}
      <div className={styles.toolFooterCopyright}>
        <p>&copy; {currentYear} Top AI Tool Rank. All rights reserved.</p>
      </div>
    </footer>
  );
}
