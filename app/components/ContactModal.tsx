'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import debounce from 'lodash/debounce';
import './ContactModal.css';

interface Contact {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  company?: string;
  created_at?: string;
}

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (contacts: Contact[]) => void;
}

const CONTACTS_PER_PAGE = 50;

export function ContactModal({ open, onClose, onSelect }: ContactModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string, pageNum: number) => {
        setLoading(true);
        setError(null);
        try {
          const params = new URLSearchParams();
          if (query) params.append('search', query);
          params.append('page', String(pageNum));
          params.append('limit', String(CONTACTS_PER_PAGE));

          const response = await fetch(
            `/api/wa-sender/contacts?${params.toString()}`
          );
          if (!response.ok) {
            throw new Error(`Failed to fetch contacts: ${response.statusText}`);
          }

          const data = await response.json();
          setContacts(data.contacts || []);
          setTotalCount(data.total || 0);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Unknown error loading contacts';
          setError(message);
        } finally {
          setLoading(false);
        }
      }, 500),
    []
  );

  // Fetch contacts on search or page change
  useEffect(() => {
    if (!open) return;
    setPage(1);
    debouncedSearch(search, 1);
  }, [search, open, debouncedSearch]);

  useEffect(() => {
    if (!open) return;
    debouncedSearch(search, page);
  }, [page, open, debouncedSearch]);

  const handleToggleContact = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleUseSelected = () => {
    const selectedContacts = contacts.filter((c) => selectedIds.has(c.id));
    onSelect(selectedContacts);
    onClose();
  };

  const selectedCount = selectedIds.size;
  const totalPages = Math.ceil(totalCount / CONTACTS_PER_PAGE);
  const startIndex = (page - 1) * CONTACTS_PER_PAGE + 1;
  const endIndex = Math.min(page * CONTACTS_PER_PAGE, totalCount);

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Select Contacts">
      <div className="contact-modal-container">
        {/* Search Bar */}
        <div className="contact-modal-search">
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input contact-modal-search-input"
            aria-label="Search contacts"
          />
        </div>

        {/* Selected Badge */}
        {selectedCount > 0 && (
          <div className="contact-modal-selected-badge">
            <Badge>{selectedCount} selected</Badge>
          </div>
        )}

        {/* Error Message */}
        {error && <div className="contact-modal-error">{error}</div>}

        {/* Loading State */}
        {loading && (
          <div className="contact-modal-loading">
            <span className="contact-modal-spinner" />
            Loading contacts...
          </div>
        )}

        {/* Contact List */}
        {!loading && contacts.length > 0 && (
          <div className="contact-modal-list">
            <div className="contact-modal-table-wrapper">
              <table className="contact-modal-table">
                <thead>
                  <tr>
                    <th className="contact-modal-checkbox-cell">
                      <input
                        type="checkbox"
                        checked={
                          contacts.length > 0 &&
                          contacts.every((c) => selectedIds.has(c.id))
                        }
                        onChange={() => {
                          const allIds = new Set(contacts.map((c) => c.id));
                          if (selectedIds.size === contacts.length) {
                            setSelectedIds(new Set());
                          } else {
                            setSelectedIds(allIds);
                          }
                        }}
                        aria-label="Toggle all contacts on this page"
                      />
                    </th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Company</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr key={contact.id}>
                      <td className="contact-modal-checkbox-cell">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(contact.id)}
                          onChange={() => handleToggleContact(contact.id)}
                          aria-label={`Select ${contact.name || contact.phone}`}
                        />
                      </td>
                      <td>{contact.name || '—'}</td>
                      <td>{contact.phone || '—'}</td>
                      <td>{contact.email || '—'}</td>
                      <td>{contact.company || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && contacts.length === 0 && !error && (
          <div className="contact-modal-empty">
            <p>No contacts found</p>
            {totalCount === 0 && (
              <p className="contact-modal-empty-hint">
                You haven&apos;t imported any contacts yet.{' '}
                <Link href="/tools/wa-sender/contacts/import" className="contact-modal-import-link">
                  Import contacts
                </Link>
              </p>
            )}
          </div>
        )}

        {/* Pagination Info */}
        {totalCount > 0 && (
          <div className="contact-modal-pagination-info">
            Showing {startIndex}–{endIndex} of {totalCount} contacts
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="contact-modal-pagination">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || loading}
              aria-label="Previous page"
            >
              ← Previous
            </Button>
            <span className="contact-modal-page-indicator">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || loading}
              aria-label="Next page"
            >
              Next →
            </Button>
          </div>
        )}

        {/* Footer Links */}
        <div className="contact-modal-footer">
          <Link
            href="/tools/wa-sender/contacts/import"
            className="contact-modal-import-link"
          >
            Or import new contacts
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="contact-modal-actions">
          <Button
            variant="secondary"
            onClick={onClose}
            aria-label="Cancel and close modal"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUseSelected}
            disabled={selectedCount === 0}
            aria-label={`Use ${selectedCount} selected contacts`}
          >
            Use Selected ({selectedCount})
          </Button>
        </div>
      </div>
    </Modal>
  );
}
