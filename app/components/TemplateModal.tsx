'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/app/components/Modal';
import { WASenderTemplate } from '@/app/lib/types/wa-sender';

interface TemplateModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (template: WASenderTemplate) => void;
}

/**
 * TemplateModal — Lazily-loaded modal showing template list
 * Fetches templates from /api/wa-sender/templates on open
 * Shows name, category, and first 100 chars of content
 * Single-click to select and close
 */
export const TemplateModal: React.FC<TemplateModalProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  const [templates, setTemplates] = useState<WASenderTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch templates when modal opens
  useEffect(() => {
    if (!open) return;

    setLoading(true);
    setError(null);
    setTemplates([]);

    fetch('/api/wa-sender/templates')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch templates: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setTemplates(data.templates || []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unknown error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open]);

  const handleSelectTemplate = (template: WASenderTemplate) => {
    onSelect(template);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Select Template" maxWidth={600}>
      <div style={{ padding: '1rem' }}>
        {loading && <p style={{ color: '#64748b' }}>Loading templates...</p>}

        {error && (
          <p style={{ color: '#dc2626' }}>
            Error loading templates: {error}
          </p>
        )}

        {!loading && !error && templates.length === 0 && (
          <p style={{ color: '#64748b' }}>No templates found. Create one first.</p>
        )}

        {!loading && templates.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                style={{
                  padding: '1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.375rem',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'white';
                }}
              >
                <div style={{ fontWeight: '500', color: '#1e293b', marginBottom: '0.25rem' }}>
                  {template.name}
                </div>
                {template.category && (
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                    {template.category}
                  </div>
                )}
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  {template.content.substring(0, 100)}
                  {template.content.length > 100 ? '...' : ''}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

TemplateModal.displayName = 'TemplateModal';
