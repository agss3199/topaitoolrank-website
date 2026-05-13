"use client";

import { useEffect, useRef } from "react";
import styles from "./Header.module.css";

export default function Header() {
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const navMenuRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const hamburger = hamburgerRef.current;
    const navMenu = navMenuRef.current;

    if (hamburger && navMenu) {
      const handleHamburgerClick = () => {
        hamburger.classList.toggle(styles.hamburgerActive);
        navMenu.classList.toggle(styles.active);
        const isExpanded = hamburger.classList.contains(styles.hamburgerActive);
        hamburger.setAttribute("aria-expanded", String(isExpanded));
        hamburger.setAttribute(
          "aria-label",
          isExpanded ? "Close menu" : "Open menu"
        );
      };

      const handleNavLinkClick = () => {
        hamburger.classList.remove(styles.hamburgerActive);
        navMenu.classList.remove(styles.active);
      };

      hamburger.addEventListener("click", handleHamburgerClick);

      const navLinks = navMenu.querySelectorAll(`.${styles.navLink}`);
      navLinks.forEach((link) => {
        link.addEventListener("click", handleNavLinkClick);
      });

      return () => {
        hamburger.removeEventListener("click", handleHamburgerClick);
        navLinks.forEach((link) => {
          link.removeEventListener("click", handleNavLinkClick);
        });
      };
    }
  }, []);

  return (
    <nav className={styles.navbar} aria-label="Main navigation">
      <div className={`container ${styles.navContainer}`}>
        <div className={styles.logo}>
          <a href="#home">Top AI Tool Rank</a>
        </div>

        <ul className={styles.navMenu} id="navMenu" ref={navMenuRef}>
          <li>
            <a href="#home" className={styles.navLink}>
              Home
            </a>
          </li>
          <li>
            <a href="#services" className={styles.navLink}>
              Services
            </a>
          </li>

          <li className={styles.navItemDropdown}>
            <a href="#tools" className={styles.navLink}>
              Tools
            </a>
            <ul className={styles.dropdown}>
              <li>
                <a href="/tools/whatsapp-message-formatter" rel="noopener">
                  WhatsApp Message Formatter
                </a>
              </li>
              <li>
                <a href="/tools/whatsapp-link-generator" rel="noopener">
                  WhatsApp Link Generator
                </a>
              </li>
              <li>
                <a href="/tools/word-counter" rel="noopener">
                  Word Counter
                </a>
              </li>
              <li>
                <a href="/tools/ai-prompt-generator" rel="noopener">
                  AI Prompt Generator
                </a>
              </li>
              <li>
                <a href="/tools/email-subject-tester" rel="noopener">
                  Email Subject Tester
                </a>
              </li>
              <li>
                <a href="/tools/utm-link-builder" rel="noopener">
                  UTM Link Builder
                </a>
              </li>
              <li>
                <a href="/tools/json-formatter" rel="noopener">
                  JSON Formatter
                </a>
              </li>
              <li>
                <a href="/tools/invoice-generator" rel="noopener">
                  Invoice Generator
                </a>
              </li>
              <li>
                <a href="/tools/seo-analyzer" rel="noopener">
                  SEO Analyzer
                </a>
              </li>
              <li>
                <a href="/tools/palm-reader" rel="noopener">
                  Palm Reader
                </a>
              </li>
              <li>
                <a href="/tools/wa-sender" rel="noopener">
                  WA Sender
                </a>
              </li>
            </ul>
          </li>

          <li>
            <a href="/blogs/" className={styles.navLink}>
              Blogs
            </a>
          </li>
          <li>
            <a href="#contact" className={`${styles.navLink} ${styles.navPill}`}>
              Contact
            </a>
          </li>
        </ul>

        <button
          type="button"
          className={styles.hamburger}
          id="hamburger"
          ref={hamburgerRef}
          aria-label="Open menu"
          aria-expanded="false"
          aria-controls="navMenu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
}
