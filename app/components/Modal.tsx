'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import './Modal.css';

export interface ModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Modal title (used for aria-labelledby) */
  title: string;
  /** Modal content */
  children: React.ReactNode;
  /** Optional footer content (usually buttons) */
  footer?: React.ReactNode;
  /** Max width of modal content */
  maxWidth?: number;
}

/**
 * Modal dialog component with full accessibility.
 *
 * Features:
 * - Focus trap (Tab cycles within modal)
 * - Escape key to close
 * - Click overlay to close
 * - Body scroll locked when open
 * - Full ARIA support (dialog, aria-modal, aria-labelledby)
 * - Fade-in animation (respects prefers-reduced-motion)
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 * <Modal open={open} onClose={() => setOpen(false)} title="Settings">
 *   <p>Modal content here</p>
 *   <Modal.Footer>
 *     <Button onClick={() => setOpen(false)}>Cancel</Button>
 *     <Button variant="primary">Save</Button>
 *   </Modal.Footer>
 * </Modal>
 * ```
 */
export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ open, onClose, title, children, footer, maxWidth = 600 }, ref) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const titleId = `modal-title-${Math.random().toString(36).slice(2, 9)}`;

    // Lock body scroll when modal opens
    useEffect(() => {
      if (open) {
        document.body.style.overflow = 'hidden';
        return () => {
          document.body.style.overflow = '';
        };
      }
    }, [open]);

    // Handle Escape key
    useEffect(() => {
      if (!open) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    // Focus trap: Tab cycles within modal
    useEffect(() => {
      if (!open || !contentRef.current) return;

      // Get all focusable elements in the modal
      const focusableElements = contentRef.current.querySelectorAll(
        'button, input, [href], [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      // Focus the first element when modal opens
      if (firstElement) {
        firstElement.focus();
      }

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      };

      document.addEventListener('keydown', handleTabKey);
      return () => document.removeEventListener('keydown', handleTabKey);
    }, [open]);

    // Handle overlay click
    const handleOverlayClick = useCallback(() => {
      onClose();
    }, [onClose]);

    // Handle content click to prevent overlay close
    const handleContentClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
    }, []);

    if (!open) return null;

    return (
      <div className="modal">
        <div
          className="modal-overlay"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />

        <div
          ref={ref || contentRef}
          className="modal-content"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          style={{ maxWidth: `${maxWidth}px` }}
          onClick={handleContentClick}
        >
          <div className="modal-header">
            <h2 id={titleId} className="modal-title">{title}</h2>
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="Close dialog"
              type="button"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="modal-body">{children}</div>

          {footer && <div className="modal-footer">{footer}</div>}
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';
