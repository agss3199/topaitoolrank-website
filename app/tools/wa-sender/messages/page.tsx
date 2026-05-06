'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { PaginatedMessages, WASenderTemplate, WASenderMessage } from '@/app/lib/types/wa-sender';

export default function MessagesPage() {
  const [messages, setMessages] = useState<WASenderMessage[]>([]);
  const [stats, setStats] = useState({ sent_count: 0, failed_count: 0, pending_count: 0, read_count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Filters
  const [status, setStatus] = useState<string>('');
  const [channel, setChannel] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [templateId, setTemplateId] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Templates for filter dropdown
  const [templates, setTemplates] = useState<WASenderTemplate[]>([]);

  // UI state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [retryModal, setRetryModal] = useState<WASenderMessage | null>(null);

  // Load templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch('/api/wa-sender/templates');
        const data = await response.json();
        if (data.templates) {
          setTemplates(data.templates);
        }
      } catch (err) {
        console.error('Failed to load templates:', err);
      }
    };
    loadTemplates();
  }, []);

  // Fetch messages when filters change
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', '50');
        if (status) params.set('status', status);
        if (channel) params.set('channel', channel);
        if (startDate) params.set('start_date', startDate);
        if (endDate) params.set('end_date', endDate);
        if (templateId) params.set('template_id', templateId);
        if (search) params.set('search', search);

        const response = await fetch(`/api/wa-sender/messages?${params}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          setError(errorData.error || 'Failed to fetch messages');
          setMessages([]);
          setStats({ sent_count: 0, failed_count: 0, pending_count: 0, read_count: 0 });
        } else {
          const data: PaginatedMessages = await response.json();
          setMessages(data.messages);
          setTotal(data.total);
          setStats(data.stats);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch messages';
        setError(message);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [status, channel, startDate, endDate, templateId, search, page]);

  // Calculate metrics
  const totalMessages = useMemo(() => {
    return stats.sent_count + stats.failed_count + stats.pending_count + stats.read_count;
  }, [stats]);

  const failureRate = useMemo(() => {
    const total = stats.sent_count + stats.failed_count + stats.read_count + stats.pending_count;
    if (total === 0) return '0%';
    return `${((stats.failed_count / total) * 100).toFixed(1)}%`;
  }, [stats]);

  const handleRetry = useCallback((message: WASenderMessage) => {
    setRetryModal(message);
  }, []);

  const handleResend = useCallback(async (message: WASenderMessage) => {
    if (!retryModal) return;

    try {
      // Create new message log entry
      const createResponse = await fetch('/api/wa-sender/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contact_id: message.contact_id,
          recipient_phone: message.recipient_phone,
          recipient_email: message.recipient_email,
          content: message.content,
          template_id: message.template_id,
          channel: message.channel,
        }),
      });

      if (!createResponse.ok) {
        setError('Failed to log retry message');
        return;
      }

      // Close modal and refresh
      setRetryModal(null);
      setPage(1); // Reset to first page to see new entry
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend message');
    }
  }, [retryModal]);

  const handleExportCSV = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('limit', '500');
      if (status) params.set('status', status);
      if (channel) params.set('channel', channel);
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);
      if (templateId) params.set('template_id', templateId);
      if (search) params.set('search', search);

      const response = await fetch(`/api/wa-sender/messages?${params}`);
      const data: PaginatedMessages = await response.json();

      // Convert messages to CSV
      const headers = ['Recipient', 'Channel', 'Status', 'Sent At', 'Content'];
      const rows = data.messages.map((m) => [
        m.recipient_phone || m.recipient_email || 'Unknown',
        m.channel,
        m.status,
        new Date(m.sent_at).toLocaleString(),
        `"${m.content.replace(/"/g, '""')}"`,
      ]);

      const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `messages-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export CSV');
    }
  }, [status, channel, startDate, endDate, templateId, search]);

  const pageCount = Math.ceil(total / 50);

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', color: '#0f1419', margin: 0 }}>Message History</h1>
        <Link
          href="/tools/wa-sender"
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#e2e8f0',
            color: '#0f1419',
            borderRadius: '0.375rem',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          Back
        </Link>
      </div>

      {/* Analytics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #dcfce7',
            borderRadius: '0.5rem',
          }}
        >
          <div style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Sent</div>
          <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#16a34a' }}>{stats.sent_count}</div>
        </div>
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fee2e2',
            borderRadius: '0.5rem',
          }}
        >
          <div style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Failed ({failureRate})</div>
          <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#dc2626' }}>{stats.failed_count}</div>
        </div>
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: '#eff6ff',
            border: '1px solid #dbeafe',
            borderRadius: '0.5rem',
          }}
        >
          <div style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Read</div>
          <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#2563eb' }}>{stats.read_count}</div>
        </div>
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: '#fef3c7',
            border: '1px solid #fde68a',
            borderRadius: '0.5rem',
          }}
        >
          <div style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Pending</div>
          <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#d97706' }}>{stats.pending_count}</div>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          padding: '1.5rem',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Status
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
              }}
            >
              <option value="">All</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="read">Read</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Channel
            </label>
            <select
              value={channel}
              onChange={(e) => {
                setChannel(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
              }}
            >
              <option value="">All</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Template
            </label>
            <select
              value={templateId}
              onChange={(e) => {
                setTemplateId(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
              }}
            >
              <option value="">All Templates</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Phone or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
              }}
            />
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          Export CSV
        </button>
      </div>

      {/* Messages Table */}
      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            borderRadius: '0.375rem',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading messages...</div>
      ) : messages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No messages found</div>
      ) : (
        <>
          <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#0f1419' }}>Recipient</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#0f1419' }}>Channel</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#0f1419' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#0f1419' }}>Sent</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#0f1419' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => (
                  <tbody key={msg.id}>
                    <tr
                      onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                      style={{
                        borderBottom: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        backgroundColor: expandedId === msg.id ? '#f0fdf4' : 'white',
                      }}
                    >
                      <td style={{ padding: '1rem' }}>
                        {msg.recipient_phone || msg.recipient_email || 'Unknown'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: msg.channel === 'whatsapp' ? '#dbeafe' : '#fef3c7',
                            color: msg.channel === 'whatsapp' ? '#0284c7' : '#92400e',
                          }}
                        >
                          {msg.channel.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor:
                              msg.status === 'sent'
                                ? '#dcfce7'
                                : msg.status === 'failed'
                                  ? '#fee2e2'
                                  : msg.status === 'read'
                                    ? '#dbeafe'
                                    : '#fef3c7',
                            color:
                              msg.status === 'sent'
                                ? '#166534'
                                : msg.status === 'failed'
                                  ? '#991b1b'
                                  : msg.status === 'read'
                                    ? '#0c4a6e'
                                    : '#78350f',
                          }}
                        >
                          {msg.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                        {new Date(msg.sent_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {msg.status === 'failed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetry(msg);
                            }}
                            style={{
                              padding: '0.25rem 0.75rem',
                              backgroundColor: '#f97316',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                            }}
                          >
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedId === msg.id && (
                      <tr style={{ backgroundColor: '#f0fdf4', borderBottom: '1px solid #e2e8f0' }}>
                        <td colSpan={5} style={{ padding: '1rem' }}>
                          <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '0.375rem' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600 }}>
                              Message Content
                            </h4>
                            <p style={{ margin: '0 0 1rem 0', color: '#475569', lineHeight: 1.6 }}>
                              {msg.content}
                            </p>
                            {msg.error_message && (
                              <>
                                <h4 style={{ margin: '1rem 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#dc2626' }}>
                                  Error
                                </h4>
                                <p style={{ margin: '0', color: '#7f1d1d', fontSize: '0.875rem' }}>
                                  {msg.error_message}
                                </p>
                              </>
                            )}
                            {msg.read_at && (
                              <>
                                <h4 style={{ margin: '1rem 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600 }}>
                                  Read At
                                </h4>
                                <p style={{ margin: '0', fontSize: '0.875rem', color: '#475569' }}>
                                  {new Date(msg.read_at).toLocaleString()}
                                </p>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pageCount > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: page === 1 ? '#e2e8f0' : '#f1f5f9',
                  color: page === 1 ? '#94a3b8' : '#0f1419',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.375rem',
                  cursor: page === 1 ? 'default' : 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Previous
              </button>
              <span style={{ padding: '0.5rem 1rem', color: '#64748b', fontSize: '0.875rem' }}>
                Page {page} of {pageCount}
              </span>
              <button
                onClick={() => setPage(Math.min(pageCount, page + 1))}
                disabled={page === pageCount}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: page === pageCount ? '#e2e8f0' : '#f1f5f9',
                  color: page === pageCount ? '#94a3b8' : '#0f1419',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.375rem',
                  cursor: page === pageCount ? 'default' : 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Retry Modal */}
      {retryModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setRetryModal(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 600 }}>Retry Message</h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>
                Recipient
              </h3>
              <p style={{ margin: '0', color: '#0f1419' }}>
                {retryModal.recipient_phone || retryModal.recipient_email}
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>
                Message Content
              </h3>
              <p style={{ margin: '0', color: '#0f1419', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {retryModal.content}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setRetryModal(null)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#e2e8f0',
                  color: '#0f1419',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleResend(retryModal)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Resend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
