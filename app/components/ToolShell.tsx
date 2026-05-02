'use client';

import React, { useState } from 'react';
import styles from './ToolShell.module.css';

/** Session type stub — will be replaced by auth-implementer */
export interface ToolShellSession {
  user?: { name?: string; email?: string };
}

export interface ToolShellNavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export interface ToolShellProps {
  /** Display name of the tool */
  toolName: string;
  /** Unique identifier for the tool */
  toolId: string;
  /** Current auth session (stubbed until auth-implementer delivers) */
  session?: ToolShellSession | null;
  /** Navigation items for sidebar/top nav */
  navigation?: ToolShellNavItem[];
  /** Active navigation href for highlighting */
  activeHref?: string;
  /** Main content */
  children: React.ReactNode;
}

/**
 * ToolShell provides a consistent layout wrapper for all tools:
 * header with tool name, responsive navigation (sidebar on desktop,
 * top nav on mobile/tablet), main content area, and footer.
 */
export function ToolShell({
  toolName,
  toolId,
  session,
  navigation = [],
  activeHref,
  children,
}: ToolShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const renderNavLinks = (extraClass?: string) =>
    navigation.map((item) => {
      const isActive = activeHref === item.href;
      const className = [
        styles.navLink,
        isActive ? styles.navLinkActive : '',
        extraClass || '',
      ]
        .filter(Boolean)
        .join(' ');

      return (
        <a key={item.href} href={item.href} className={className}>
          {item.icon && <span aria-hidden="true">{item.icon}</span>}
          {item.label}
        </a>
      );
    });

  return (
    <div className={styles.shell} data-tool-id={toolId}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.toolName}>{toolName}</h1>

        {/* Top nav for tablet/mobile */}
        {navigation.length > 0 && (
          <nav className={styles.nav} aria-label={`${toolName} navigation`}>
            {renderNavLinks()}
          </nav>
        )}

        {/* Mobile hamburger (visible below 1024px when nav exists) */}
        {navigation.length > 0 && (
          <button
            className={styles.mobileNavToggle}
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label="Toggle navigation"
            aria-expanded={mobileNavOpen}
          >
            &#9776;
          </button>
        )}
      </header>

      {/* Body: sidebar + main */}
      <div className={styles.body}>
        {/* Desktop sidebar */}
        {navigation.length > 0 && (
          <aside className={styles.sidebar} aria-label={`${toolName} sidebar`}>
            <nav className={styles.sidebarNav}>{renderNavLinks()}</nav>
          </aside>
        )}

        {/* Main content */}
        <main className={styles.main}>{children}</main>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <span>{toolName}</span>
      </footer>
    </div>
  );
}

ToolShell.displayName = 'ToolShell';
