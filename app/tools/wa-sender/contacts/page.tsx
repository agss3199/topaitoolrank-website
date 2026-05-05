'use client';

import { useState, useEffect } from 'react';
import { WASenderContact, PaginatedContacts } from '@/app/lib/types/wa-sender';
import styles from './contacts.module.css';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<WASenderContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<WASenderContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedContact, setSelectedContact] = useState<WASenderContact | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const LIMIT = 50;

  // Fetch contacts from API
  const fetchContacts = async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/wa-sender/contacts?page=${pageNum}&limit=${LIMIT}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch contacts: ${response.statusText}`);
      }
      const data: PaginatedContacts = await response.json();
      setContacts(data.contacts);
      setFilteredContacts(data.contacts);
      setPage(pageNum);
      setTotalPages(Math.ceil(data.total / LIMIT));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts(1);
  }, []);

  // Client-side search filtering
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    if (!query) {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter((contact) => {
        const name = contact.name?.toLowerCase() || '';
        const phone = contact.phone?.toLowerCase() || '';
        const email = contact.email?.toLowerCase() || '';
        const company = contact.company?.toLowerCase() || '';

        return name.includes(query) || phone.includes(query) || email.includes(query) || company.includes(query);
      });
      setFilteredContacts(filtered);
    }
  }, [searchQuery, contacts]);

  // Export CSV
  const handleExportCsv = async () => {
    try {
      const response = await fetch(`/api/wa-sender/contacts/export?format=csv`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to export contacts');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contacts.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Delete contact
  const handleDeleteContact = async () => {
    if (!selectedContact) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/wa-sender/contacts/${selectedContact.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete contact');
      }

      // Remove from list
      setContacts(contacts.filter((c) => c.id !== selectedContact.id));
      setSelectedContact(null);
      setShowDeleteConfirm(false);

      // Show success message
      console.log('Contact deleted successfully');
    } catch (err) {
      alert(`Delete failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDeleting(false);
    }
  };

  if (loading && contacts.length === 0) {
    return (
      <div className={styles.container}>
        <p>Loading contacts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Error: {error}</p>
          <button onClick={() => fetchContacts(1)}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Contacts</h1>
        <div className={styles.headerActions}>
          <a href="/tools/wa-sender/contacts/import" className={styles.button}>
            Import Contacts
          </a>
          <button onClick={handleExportCsv} className={styles.button}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search by name, phone, email, or company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Contacts Table */}
      {filteredContacts.length === 0 ? (
        <div className={styles.emptyState}>
          {searchQuery ? (
            <p>No contacts match your search.</p>
          ) : (
            <>
              <p>No contacts yet.</p>
              <a href="/tools/wa-sender/contacts/import">Import your first contacts</a>
            </>
          )}
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <tr key={contact.id}>
                    <td>{contact.name || '-'}</td>
                    <td>{contact.phone || '-'}</td>
                    <td>{contact.email || '-'}</td>
                    <td>{contact.company || '-'}</td>
                    <td>{new Date(contact.created_at).toLocaleDateString()}</td>
                    <td>
                      <button onClick={() => setSelectedContact(contact)} className={styles.actionButton}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={styles.pagination}>
            <button onClick={() => fetchContacts(page - 1)} disabled={page === 1} className={styles.paginationButton}>
              ← Previous
            </button>
            <span className={styles.pageInfo}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => fetchContacts(page + 1)}
              disabled={page === totalPages}
              className={styles.paginationButton}
            >
              Next →
            </button>
          </div>
        </>
      )}

      {/* View Modal */}
      {selectedContact && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{selectedContact.name || 'Contact'}</h2>
              <button onClick={() => setSelectedContact(null)} className={styles.closeButton}>
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label>Name:</label>
                <p>{selectedContact.name || '-'}</p>
              </div>
              <div className={styles.field}>
                <label>Phone:</label>
                <p>{selectedContact.phone || '-'}</p>
              </div>
              <div className={styles.field}>
                <label>Email:</label>
                <p>{selectedContact.email || '-'}</p>
              </div>
              <div className={styles.field}>
                <label>Company:</label>
                <p>{selectedContact.company || '-'}</p>
              </div>

              {selectedContact.custom_fields && Object.keys(selectedContact.custom_fields).length > 0 && (
                <div className={styles.customFields}>
                  <label>Custom Fields:</label>
                  <div className={styles.customFieldsList}>
                    {Object.entries(selectedContact.custom_fields).map(([key, value]) => (
                      <div key={key} className={styles.customField}>
                        <span className={styles.customFieldKey}>{key}:</span>
                        <span className={styles.customFieldValue}>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              {showDeleteConfirm ? (
                <>
                  <p className={styles.confirmText}>Are you sure you want to delete this contact?</p>
                  <button
                    onClick={handleDeleteContact}
                    disabled={deleting}
                    className={styles.buttonDanger}
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className={styles.buttonSecondary}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setShowDeleteConfirm(true)} className={styles.buttonDanger}>
                    Delete
                  </button>
                  <button onClick={() => setSelectedContact(null)} className={styles.buttonSecondary}>
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
