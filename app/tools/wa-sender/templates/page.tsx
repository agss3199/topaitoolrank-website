'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Modal, Badge, Card, Input, Label, FormField } from '@/app/components';
import { WASenderTemplate, CreateTemplateInput, UpdateTemplateInput } from '@/app/lib/types/wa-sender';
import { extractVariables } from '@/app/lib/templates';
import './page.css';

/**
 * Templates Management Page
 * Full CRUD interface for message templates with:
 * - Paginated list view with filtering and sorting
 * - Create modal with live variable preview
 * - Edit modal
 * - Delete confirmation
 */

interface Toast {
  type: 'success' | 'error';
  message: string;
  id: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<WASenderTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Filter and sort state
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'created_at'>('created_at');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WASenderTemplate | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<WASenderTemplate | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateTemplateInput>({
    name: '',
    content: '',
    description: '',
    category: undefined,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [variables, setVariables] = useState<string[]>([]);
  const [invalidVariables, setInvalidVariables] = useState<string[]>([]);

  const ITEMS_PER_PAGE = 50;
  const CATEGORIES = ['greeting', 'promotional', 'support', 'notification', 'appointment', 'followup', 'other'];

  // Fetch templates
  const fetchTemplates = useCallback(async (category?: string) => {
    try {
      setLoading(true);
      setError(null);
      const url = new URL('/api/wa-sender/templates', window.location.origin);
      if (category) {
        url.searchParams.set('category', category);
      }
      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`Failed to fetch templates: ${res.status}`);
      }
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load templates';
      setError(msg);
      addToast('error', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTemplates(selectedCategory);
  }, [selectedCategory, fetchTemplates]);

  // Handle variable extraction live preview
  useEffect(() => {
    try {
      const vars = extractVariables(formData.content || '');
      setVariables(vars);

      // Check for invalid variables
      const allBraces = /\{([^}]+)\}/g;
      const allMatches = [...(formData.content || '').matchAll(allBraces)].map((m) => m[1]);
      const validIdentifierRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
      const invalid = allMatches.filter((m) => !validIdentifierRegex.test(m));
      setInvalidVariables(invalid);
    } catch (err) {
      setInvalidVariables(err instanceof Error ? [err.message] : []);
    }
  }, [formData.content]);

  // Toast notification
  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { type, message, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Form handlers
  const handleFormChange = (field: keyof CreateTemplateInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name?.trim()) {
      errors.name = 'Template name is required';
    }
    if (!formData.content?.trim()) {
      errors.content = 'Template content is required';
    }
    if (invalidVariables.length > 0) {
      errors.content = `Invalid variable syntax: {${invalidVariables.join('}, {')}}`;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateTemplate = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const res = await fetch('/api/wa-sender/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        const msg = errorData.error || `Failed to create template (${res.status})`;
        if (res.status === 409) {
          addToast('error', 'A template with this name already exists');
        } else {
          addToast('error', msg);
        }
        return;
      }

      const created = await res.json();
      setTemplates((prev) => [created, ...prev]);
      addToast('success', `Template "${created.name}" created`);
      handleCloseCreateModal();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create template';
      addToast('error', msg);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !validateForm()) {
      return;
    }

    try {
      const res = await fetch(`/api/wa-sender/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        const msg = errorData.error || `Failed to update template (${res.status})`;
        addToast('error', msg);
        return;
      }

      const updated = await res.json();
      setTemplates((prev) =>
        prev.map((t) => (t.id === editingTemplate.id ? updated : t))
      );
      addToast('success', `Template "${updated.name}" updated`);
      handleCloseEditModal();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update template';
      addToast('error', msg);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) {
      return;
    }

    try {
      const res = await fetch(`/api/wa-sender/templates/${templateToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        const msg = errorData.error || `Failed to delete template (${res.status})`;
        addToast('error', msg);
        return;
      }

      setTemplates((prev) => prev.filter((t) => t.id !== templateToDelete.id));
      addToast('success', `Template "${templateToDelete.name}" deleted`);
      setShowDeleteConfirm(false);
      setTemplateToDelete(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete template';
      addToast('error', msg);
    }
  };

  // Modal handlers
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setFormData({ name: '', content: '', description: '', category: undefined });
    setFormErrors({});
    setVariables([]);
    setInvalidVariables([]);
  };

  const handleOpenEditModal = (template: WASenderTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      description: template.description,
      category: template.category,
    });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingTemplate(null);
    setFormData({ name: '', content: '', description: '', category: undefined });
    setFormErrors({});
  };

  const handleOpenDeleteConfirm = (template: WASenderTemplate) => {
    setTemplateToDelete(template);
    setShowDeleteConfirm(true);
  };

  // Sorting and pagination
  const sortedTemplates = useMemo(() => {
    const sorted = [...templates];
    sorted.sort((a, b) => {
      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';
      return String(aVal).localeCompare(String(bVal));
    });
    return sorted;
  }, [templates, sortBy]);

  const paginatedTemplates = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedTemplates.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedTemplates, currentPage]);

  const totalPages = Math.ceil(sortedTemplates.length / ITEMS_PER_PAGE);

  // Template form component
  const TemplateForm = ({ isEditing = false }: { isEditing?: boolean }) => (
    <div className="wa-template-form">
      <div className="form-group">
        <Label htmlFor="template-name">Name *</Label>
        <Input
          id="template-name"
          name="name"
          value={formData.name}
          onChange={(e) => handleFormChange('name', e.target.value)}
          placeholder="e.g., Weekly Promotion"
          maxLength={100}
          error={formErrors.name}
        />
      </div>

      <div className="form-group">
        <Label htmlFor="template-content">Content * ({(formData.content || '').length}/1000)</Label>
        <textarea
          id="template-content"
          value={formData.content}
          onChange={(e) => handleFormChange('content', e.target.value)}
          placeholder="Hi {name}, welcome to {company}..."
          maxLength={1000}
          className={`template-textarea ${formErrors.content ? 'error' : ''}`}
          rows={6}
        />
        {formErrors.content && <p className="form-error">{formErrors.content}</p>}
        {variables.length > 0 && (
          <div className="variables-preview">
            <p className="variables-label">Variables:</p>
            <div className="variables-list">
              {variables.map((v) => (
                <Badge key={v} variant="info">
                  {v}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="form-group">
        <Label htmlFor="template-category">Category</Label>
        <select
          id="template-category"
          value={formData.category || ''}
          onChange={(e) => handleFormChange('category', e.target.value || undefined)}
          className="template-select"
        >
          <option value="">No category</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <Label htmlFor="template-description">Description</Label>
        <Input
          id="template-description"
          name="description"
          value={formData.description}
          onChange={(e) => handleFormChange('description', e.target.value)}
          placeholder="Describe when to use this template"
          maxLength={500}
        />
      </div>

      <div className="form-actions">
        <Button variant="secondary" onClick={isEditing ? handleCloseEditModal : handleCloseCreateModal}>
          Cancel
        </Button>
        <Button
          onClick={isEditing ? handleUpdateTemplate : handleCreateTemplate}
          disabled={!formData.name?.trim() || !formData.content?.trim()}
        >
          {isEditing ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="wa-templates-page">
      {/* Toast notifications */}
      <div className="toasts-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>

      {/* Page header */}
      <div className="page-header">
        <h1>Message Templates</h1>
        <p className="subtitle">Save and reuse message templates with variable placeholders</p>
      </div>

      {/* Controls */}
      <div className="controls-bar">
        <div className="filters">
          <select
            value={selectedCategory || ''}
            onChange={(e) => {
              setSelectedCategory(e.target.value || undefined);
              setCurrentPage(1);
            }}
            className="category-filter"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="sort-select"
          >
            <option value="created_at">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="category">Sort by Category</option>
          </select>
        </div>

        <Button onClick={() => setShowCreateModal(true)}>+ New Template</Button>
      </div>

      {/* Templates list */}
      <Card>
        {loading ? (
          <div className="loading-state">Loading templates...</div>
        ) : error ? (
          <div className="error-state">Error: {error}</div>
        ) : templates.length === 0 ? (
          <div className="empty-state">
            <p>No templates yet. Create your first template to get started.</p>
          </div>
        ) : paginatedTemplates.length === 0 ? (
          <div className="empty-state">
            <p>No templates match the selected filters.</p>
          </div>
        ) : (
          <div className="templates-table-container">
            <table className="templates-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Variables</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTemplates.map((t) => (
                  <tr key={t.id}>
                    <td className="template-name">{t.name}</td>
                    <td>
                      {t.category ? (
                        <Badge variant="info">{t.category}</Badge>
                      ) : (
                        <span className="no-category">—</span>
                      )}
                    </td>
                    <td className="variable-count">
                      {(t.variables || []).length} variable{(t.variables || []).length !== 1 ? 's' : ''}
                    </td>
                    <td className="created-date">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="actions">
                      <Button size="sm" variant="secondary" onClick={() => handleOpenEditModal(t)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleOpenDeleteConfirm(t)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <Button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  variant="secondary"
                  size="sm"
                >
                  ← Previous
                </Button>
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  variant="secondary"
                  size="sm"
                >
                  Next →
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Create template modal */}
      <Modal
        open={showCreateModal}
        onClose={handleCloseCreateModal}
        title="Create New Template"
        maxWidth={800}
      >
        <TemplateForm />
      </Modal>

      {/* Edit template modal */}
      <Modal
        open={showEditModal}
        onClose={handleCloseEditModal}
        title={`Edit Template: ${editingTemplate?.name || ''}`}
        maxWidth={800}
      >
        <TemplateForm isEditing />
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setTemplateToDelete(null);
        }}
        title="Delete Template"
      >
        <div className="delete-confirm-content">
          <p>Are you sure you want to delete "{templateToDelete?.name}"?</p>
          <p className="warning-text">This action cannot be undone.</p>
          <div className="delete-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteConfirm(false);
                setTemplateToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteTemplate}>
              Delete Template
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
