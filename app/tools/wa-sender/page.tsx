"use client";

export const dynamicParams = false;

'use client';

import { useState, useRef, useCallback, useEffect, useMemo, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { useAuth } from '@/lib/useAuth';
import { Button } from '@/app/components/Button';
import { Modal } from '@/app/components/Modal';
import { Badge } from '@/app/components/Badge';
import { WASenderTemplate } from '@/app/lib/types/wa-sender';
import { substituteVariables } from '@/app/lib/templates';
import { useWASender } from '@/app/tools/wa-sender/context';
import './wa-sender.css';

// Lazy-load TemplateModal and ContactModal since they're only used when user clicks button
const TemplateModal = lazy(() =>
  import('@/app/components/TemplateModal').then((m) => ({ default: m.TemplateModal }))
);

const ContactModal = lazy(() =>
  import('@/app/components/ContactModal').then((m) => ({ default: m.ContactModal }))
);

type SendMode = 'whatsapp' | 'email';

interface SheetConfig {
  name: string;
  headers: string[];
  phoneCol: string;
  emailCol: string;
  enabled: boolean;
  contacts: string[];
}

interface PhoneEntry {
  kind: 'whatsapp';
  rowNum: number;
  raw: string;
  normalized: string;
  sheetName: string;
  countryCode: string;
  isSent: boolean;
}

interface EmailEntry {
  kind: 'email';
  rowNum: number;
  raw: string;
  email: string;
  sheetName: string;
  isSent: boolean;
}

type RecipientEntry = PhoneEntry | EmailEntry;
type Notice = { text: string; kind: 'error' | 'success' | 'info' };

function normalizePhone(raw: unknown, countryCode: string): string | null {
  if (raw === null || raw === undefined) return null;
  const str = String(raw).trim();
  if (!str) return null;
  const hasPlus = str.startsWith('+');
  const digits = str.replace(/[\s\-().,]/g, '').replace(/\D/g, '');
  if (!digits || digits.length < 7) return null;
  if (hasPlus) return digits;
  if (digits.startsWith('00') && digits.length > 6) return digits.slice(2);
  const cc = countryCode.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length <= 11) return cc + digits.slice(1);
  if (digits.length === 10) return cc + digits;
  return digits;
}

function normalizeEmail(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const value = String(raw).trim().toLowerCase();
  if (!value) return null;
  const cleaned = value.replace(/^mailto:/i, '');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(cleaned) ? cleaned : null;
}

function detectPhoneColumn(data: Record<string, unknown>[]): string | null {
  if (!data.length) return null;
  const headers = Object.keys(data[0]);
  const sample = data.slice(0, Math.min(10, data.length));
  let bestCol: string | null = null;
  let bestScore = 0;
  for (const header of headers) {
    let score = 0;
    const h = header.toLowerCase();
    if (/phone|mobile|number|cell|contact|whatsapp|tel|ph|no\.?$/.test(h)) score += 15;
    for (const row of sample) {
      const val = String(row[header] ?? '').replace(/[\s\-().,+]/g, '');
      if (/^\d{7,15}$/.test(val)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCol = header;
    }
  }
  return bestCol;
}

function detectEmailColumn(data: Record<string, unknown>[]): string | null {
  if (!data.length) return null;
  const headers = Object.keys(data[0]);
  const sample = data.slice(0, Math.min(10, data.length));
  let bestCol: string | null = null;
  let bestScore = 0;
  for (const header of headers) {
    let score = 0;
    const h = header.toLowerCase();
    if (/email|e-mail|mail|email id|email address/.test(h)) score += 15;
    for (const row of sample) {
      const val = normalizeEmail(row[header]);
      if (val) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCol = header;
    }
  }
  return bestCol;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

interface ColumnConfirmModalProps {
  open: boolean;
  detectedPhoneCol: string | null;
  detectedEmailCol: string | null;
  allHeaders: string[];
  mode: SendMode;
  onConfirm: (phoneCol: string, emailCol: string) => void;
  onCancel: () => void;
}

function ColumnConfirmationModal({
  open,
  detectedPhoneCol,
  detectedEmailCol,
  allHeaders,
  mode,
  onConfirm,
  onCancel,
}: ColumnConfirmModalProps) {
  const [selectedPhone, setSelectedPhone] = useState(detectedPhoneCol || '');
  const [selectedEmail, setSelectedEmail] = useState(detectedEmailCol || '');

  if (!open) return null;

  const isConfirmDisabled = mode === 'whatsapp'
    ? !selectedPhone && !detectedPhoneCol
    : !selectedEmail && !detectedEmailCol;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Column Detection"
      maxWidth={480}
      footer={
        <div className="wa-modal-footer">
          <Button
            variant="secondary"
            onClick={onCancel}
            aria-label="Cancel column selection"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              const phoneCol = mode === 'whatsapp' ? (selectedPhone || detectedPhoneCol || '') : '';
              const emailCol = mode === 'email' ? (selectedEmail || detectedEmailCol || '') : '';
              onConfirm(phoneCol, emailCol);
            }}
            disabled={isConfirmDisabled}
            aria-label="Confirm column selection"
          >
            Confirm
          </Button>
        </div>
      }
    >
      <p className="wa-modal-description">Confirm which columns contain your data:</p>

      <div className="wa-modal-fields">
        {mode === 'whatsapp' && (
          <div className="wa-form-group">
            <label htmlFor="phone-col-select" className="wa-label">
              Phone Number Column
            </label>
            <select
              id="phone-col-select"
              value={selectedPhone}
              onChange={(e) => setSelectedPhone(e.target.value)}
              className="input wa-select"
              aria-label="Select phone number column"
            >
              <option value="">Select column...</option>
              {allHeaders.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            {detectedPhoneCol && (
              <p className="wa-hint">Auto-detected: <span className="wa-hint-bold">{detectedPhoneCol}</span></p>
            )}
          </div>
        )}

        {mode === 'email' && (
          <div className="wa-form-group">
            <label htmlFor="email-col-select" className="wa-label">
              Email Column
            </label>
            <select
              id="email-col-select"
              value={selectedEmail}
              onChange={(e) => setSelectedEmail(e.target.value)}
              className="input wa-select"
              aria-label="Select email column"
            >
              <option value="">Select column...</option>
              {allHeaders.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            {detectedEmailCol && (
              <p className="wa-hint">Auto-detected: <span className="wa-hint-bold">{detectedEmailCol}</span></p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function WASenderPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const ctx = useWASender();

  // Get file/columns/numbers/recipients from context for persistence across navigation
  const { file, setFile, columns, setColumns, numbers, setNumbers, recipients: contextRecipients, setRecipients } = ctx;

  const [mode, setMode] = useState<SendMode>('whatsapp');
  const [sheets, setSheets] = useState<SheetConfig[]>([]);
  const [countryCode, setCountryCode] = useState<string>('+91');
  const [message, setMessage] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [goToInput, setGoToInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sentStatus, setSentStatus] = useState<Record<string, boolean>>({});
  const [columnConfirmModal, setColumnConfirmModal] = useState<{
    open: boolean;
    data: {
      rows: Record<string, unknown>[];
      headers: string[];
      detectedPhoneCol: string | null;
      detectedEmailCol: string | null;
      workbook: XLSX.WorkBook;
      fileName: string;
    } | null;
  }>({ open: false, data: null });

  // Auth check — check localStorage as fallback for race condition where
  // useAuth hasn't finished reading localStorage yet but tokens exist
  useEffect(() => {
    if (!loading && !session) {
      const token = localStorage.getItem('wa-sender-access-token');
      if (!token) {
        router.push('/auth/login');
      }
      // If token exists, useAuth is still loading it — don't redirect
    }
  }, [session, loading, router]);

  // Load session from Supabase on mount
  useEffect(() => {
    if (session?.userId) {
      loadSessionFromSupabase();
    }
  }, [session?.userId]);

  const loadSessionFromSupabase = async () => {
    const userId = session!.userId;
    const localStorageKey = `wa-sender-session-${userId}`;

    try {
      const res = await fetch(`/api/sheets/load?userId=${userId}`);
      const data = await res.json();

      if (!res.ok) {
        console.warn('Load session failed:', data.error);
        // Try localStorage fallback
        const cached = localStorage.getItem(localStorageKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            applySessionData(parsed);
          } catch (e) {
            console.warn('Failed to parse cached session:', e);
          }
        }
        return;
      }

      if (data.ok && data.session) {
        applySessionData(data.session);
        // Cache to localStorage for offline access
        localStorage.setItem(localStorageKey, JSON.stringify(data.session));
      } else if (data.ok && !data.session) {
        // Supabase has no session for this user (new user or not yet saved)
        // Try localStorage as fallback (debounce might still be in flight)
        const cached = localStorage.getItem(localStorageKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            applySessionData(parsed);
          } catch (e) {
            console.warn('Failed to parse cached session:', e);
          }
        }
      }
    } catch (err) {
      console.error('Load session exception:', err);
      // Try localStorage fallback on network error
      const cached = localStorage.getItem(localStorageKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          applySessionData(parsed);
        } catch (e) {
          console.warn('Failed to parse cached session:', e);
        }
      }
    }
  };

  const applySessionData = (s: Record<string, unknown>) => {
    const sheetData = ((s.sheet_data as unknown[]) || []).map((sh: unknown) => {
      const shObj = sh as Record<string, unknown>;
      return {
        ...shObj,
        contacts: shObj.contacts || [],
      } as SheetConfig;
    });
    setSheets(sheetData);
    setMode((s.send_mode || 'whatsapp') as SendMode);
    setCountryCode((s.country_code || '+91') as string);
    setMessage((s.message_template || '') as string);
    setEmailSubject((s.email_subject || '') as string);
    setEmailBody((s.email_body || '') as string);
    setCurrentIndex((s.current_index || 0) as number);
    setSentStatus((s.sent_status || {}) as Record<string, boolean>);
  };

  const saveSession = useCallback(
    async (newSheets: SheetConfig[], newMode: SendMode, newCountryCode: string, newMessage: string, newEmailSubject: string, newEmailBody: string, newIndex: number, newSentStatus: Record<string, boolean>) => {
      if (!session?.userId || isSaving) return;

      setIsSaving(true);

      const sessionData = {
        userId: session.userId,
        sheet_data: newSheets,
        send_mode: newMode,
        country_code: newCountryCode,
        message_template: newMessage,
        email_subject: newEmailSubject,
        email_body: newEmailBody,
        current_sheet_name: newSheets.length > 0 ? newSheets[0].name : '',
        current_index: newIndex,
        sent_status: newSentStatus,
      };

      // Save to localStorage immediately for offline access and refresh persistence
      const localStorageKey = `wa-sender-session-${session.userId}`;
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(sessionData));
      } catch (err) {
        console.warn('Failed to save session to localStorage:', err);
      }

      try {
        const payload = JSON.stringify(sessionData);

        const payloadSizeBytes = new Blob([payload]).size;
        if (payloadSizeBytes > 4 * 1024 * 1024) {
          setNotice({
            text: `Payload too large (${(payloadSizeBytes / (1024 * 1024)).toFixed(1)}MB). Try a smaller file or fewer contacts.`,
            kind: 'error',
          });
          setIsSaving(false);
          return;
        }

        const res = await fetch('/api/sheets/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Save session failed:', errorData);
          // Still continue - localStorage has the data
        }
      } catch (err) {
        console.error('Save session error:', err);
        // Still continue - localStorage has the data
      } finally {
        setIsSaving(false);
      }
    },
    [session?.userId, isSaving]
  );

  const handleContactsSelect = useCallback(
    (contacts: any[]) => {
      setSelectedContacts(contacts);
      // Populate recipients from selected contacts
      const newSheets: SheetConfig[] = [{
        name: 'Selected Contacts',
        headers: ['name', 'phone', 'email', 'company'],
        phoneCol: 'phone',
        emailCol: 'email',
        enabled: true,
        contacts: contacts.map(c => mode === 'whatsapp' ? c.phone : c.email).filter(Boolean),
      }];
      setSheets(newSheets);
      setCurrentIndex(0);
      setSentStatus({});
      setNotice({
        text: `${contacts.length} contact${contacts.length > 1 ? 's' : ''} selected`,
        kind: 'success',
      });
    },
    [mode]
  );

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setNotice(null);
      setSelectedContacts([]);

      const reader = new FileReader();
      reader.onload = (evt) => {
        // Move heavy parsing to a setTimeout to prevent UI blocking
        setTimeout(() => {
          try {
            const workbook = XLSX.read(evt.target?.result, { type: 'binary' });

            if (!workbook.SheetNames.length) {
              setNotice({ text: 'The workbook contains no sheets.', kind: 'error' });
              setIsLoading(false);
              return;
            }

            const firstSheetName = workbook.SheetNames[0];
            const ws = workbook.Sheets[firstSheetName];

            // Parse only the first sheet for the modal (faster)
            const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
              defval: '',
              raw: false,
            });

            if (rows.length === 0) {
              setNotice({ text: 'All sheets appear to be empty.', kind: 'error' });
              setIsLoading(false);
              return;
            }

            const headers = Object.keys(rows[0]);
            const detectedPhoneCol = detectPhoneColumn(rows) || headers[0];
            const detectedEmailCol = detectEmailColumn(rows) || headers[0];

            setColumnConfirmModal({
              open: true,
              data: {
                rows,
                headers,
                detectedPhoneCol,
                detectedEmailCol,
                workbook,
                fileName: file.name,
              },
            });

            setIsLoading(false);
          } catch (err) {
            setNotice({ text: 'Could not parse the file. Please upload a valid .xlsx or .xls.', kind: 'error' });
            setIsLoading(false);
          } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        }, 0);
      };

      reader.readAsBinaryString(file);
    },
    []
  );

  const handleColumnConfirm = useCallback(
    (phoneCol: string, emailCol: string) => {
      const { workbook } = columnConfirmModal.data!;
      const cc = countryCode.replace(/\D/g, '');

      const parsed: SheetConfig[] = workbook.SheetNames.map((name: string) => {
        const ws = workbook.Sheets[name];
        const sheetRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
          defval: '',
          raw: false,
        });

        const contacts: string[] = [];
        for (const row of sheetRows) {
          if (mode === 'whatsapp' && phoneCol) {
            const normalized = normalizePhone(row[phoneCol], cc);
            if (normalized) contacts.push(normalized);
          } else if (mode === 'email' && emailCol) {
            const email = normalizeEmail(row[emailCol]);
            if (email) contacts.push(email);
          }
        }

        return {
          name,
          headers: Object.keys(sheetRows[0] || {}),
          phoneCol,
          emailCol,
          enabled: sheetRows.length > 0,
          contacts,
        };
      });

      setSheets(parsed);
      setCurrentIndex(0);
      setSentStatus({});
      setGoToInput('');
      saveSession(parsed, mode, countryCode, message, emailSubject, emailBody, 0, {});

      setColumnConfirmModal({ open: false, data: null });

      const totalContacts = parsed.reduce((s, sh) => s + sh.contacts.length, 0);
      setNotice({
        text: `${parsed.length} sheet${parsed.length > 1 ? 's' : ''} loaded — ${totalContacts} contacts extracted`,
        kind: 'success',
      });
    },
    [columnConfirmModal.data, mode, countryCode, message, emailSubject, emailBody, saveSession]
  );

  // Export sheets with sent status column
  const handleExportWithStatus = useCallback(() => {
    if (sheets.length === 0) {
      setNotice({ text: 'No sheets to export', kind: 'error' });
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();

      for (const sheet of sheets) {
        // Reconstruct rows with sent status column
        const exportRows: Record<string, unknown>[] = sheet.contacts.map((contact, idx) => {
          const key = `${sheet.name}-${idx}`;
          const isSent = !!sentStatus[key];
          return {
            [sheet.phoneCol || 'Phone']: contact,
            'Sent': isSent ? '✓' : '',
          };
        });

        // Create worksheet and add to workbook
        const ws = XLSX.utils.json_to_sheet(exportRows, {
          header: [sheet.phoneCol || 'Phone', 'Sent'],
        });
        XLSX.utils.book_append_sheet(workbook, ws, sheet.name);
      }

      // Download the file
      const filename = `wa-sender-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, filename);

      setNotice({
        text: `Exported ${sheets.length} sheet${sheets.length > 1 ? 's' : ''} with send status`,
        kind: 'success',
      });
    } catch (error) {
      console.error('Export failed:', error);
      setNotice({
        text: 'Export failed. Please try again.',
        kind: 'error',
      });
    }
  }, [sheets, sentStatus]);

  const recipients = useMemo<RecipientEntry[]>(() => {
    const result: RecipientEntry[] = [];

    for (const sheet of sheets) {
      if (!sheet.enabled || !sheet.contacts.length) continue;

      for (let i = 0; i < sheet.contacts.length; i++) {
        const contact = sheet.contacts[i];
        const key = `${sheet.name}-${i}`;

        if (mode === 'whatsapp') {
          result.push({
            kind: 'whatsapp',
            rowNum: i + 1,
            raw: contact,
            normalized: contact,
            sheetName: sheet.name,
            countryCode: countryCode.replace(/\D/g, ''),
            isSent: !!sentStatus[key],
          });
        } else {
          result.push({
            kind: 'email',
            rowNum: i + 1,
            raw: contact,
            email: contact,
            sheetName: sheet.name,
            isSent: !!sentStatus[key],
          });
        }
      }
    }

    return result;
  }, [sheets, mode, countryCode, sentStatus]);

  const current = recipients[currentIndex] ?? null;

  const openWhatsApp = useCallback(() => {
    if (!current || current.kind !== 'whatsapp') return;
    const key = `${current.sheetName}-${current.rowNum - 1}`;

    // Substitute variables if a template is selected
    let finalMessage = message.trim();
    if (selectedTemplate) {
      // For now, use available data: phone number
      const contactData = {
        phone: current.raw,
        name: '',
        email: '',
        company: '',
      };
      finalMessage = substituteVariables(finalMessage, contactData);
    }

    const encoded = encodeURIComponent(finalMessage);
    window.open(`https://wa.me/${current.normalized}?text=${encoded}`, '_blank');
    setSentStatus(prev => ({ ...prev, [key]: true }));
    saveSession(sheets, mode, countryCode, message, emailSubject, emailBody, currentIndex, { ...sentStatus, [key]: true });

    // Fire-and-forget: log message to history (non-blocking)
    fetch('/api/wa-sender/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        recipient_phone: current.normalized,
        content: finalMessage,
        template_id: selectedTemplate?.id || null,
        channel: 'whatsapp',
      }),
    }).catch(err => console.error('Failed to log message:', err));
  }, [current, message, emailSubject, emailBody, sheets, mode, countryCode, currentIndex, sentStatus, saveSession, selectedTemplate]);

  const openGmailCompose = useCallback(() => {
    if (!current || current.kind !== 'email') return;
    const key = `${current.sheetName}-${current.rowNum - 1}`;

    // Substitute variables in subject and body if a template is selected
    let finalSubject = emailSubject.trim();
    let finalBody = emailBody.trim();
    if (selectedTemplate) {
      const contactData = {
        email: current.email,
        phone: '',
        name: '',
        company: '',
      };
      finalSubject = substituteVariables(finalSubject, contactData);
      finalBody = substituteVariables(finalBody, contactData);
    }

    const subject = encodeURIComponent(finalSubject);
    const body = encodeURIComponent(finalBody);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${current.email}&su=${subject}&body=${body}`, '_blank');
    setSentStatus(prev => ({ ...prev, [key]: true }));
    saveSession(sheets, mode, countryCode, message, emailSubject, emailBody, currentIndex, { ...sentStatus, [key]: true });

    // Fire-and-forget: log message to history (non-blocking)
    // Combine subject and body for the message content
    const emailContent = `Subject: ${finalSubject}\n\n${finalBody}`;
    fetch('/api/wa-sender/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        recipient_email: current.email,
        content: emailContent,
        template_id: selectedTemplate?.id || null,
        channel: 'email',
      }),
    }).catch(err => console.error('Failed to log message:', err));
  }, [current, emailSubject, emailBody, sheets, mode, countryCode, message, currentIndex, sentStatus, saveSession, selectedTemplate]);

  const nextRecipient = useCallback(() => {
    setCurrentIndex(prev => clamp(prev + 1, 0, recipients.length - 1));
    setGoToInput('');
  }, [recipients.length]);

  const goTo = useCallback(() => {
    const n = parseInt(goToInput, 10);
    if (isNaN(n) || n < 1 || n > recipients.length) {
      setNotice({ text: `Enter a number between 1 and ${recipients.length}.`, kind: 'error' });
      return;
    }
    setCurrentIndex(n - 1);
    setGoToInput('');
  }, [goToInput, recipients.length]);

  const total = recipients.length;
  const position = total > 0 ? currentIndex + 1 : 0;
  const sentCount = Object.values(sentStatus).filter(Boolean).length;

  // Auto-save with 500ms debounce
  useEffect(() => {
    if (sheets.length === 0) return;
    const timer = setTimeout(() => {
      saveSession(sheets, mode, countryCode, message, emailSubject, emailBody, currentIndex, sentStatus);
    }, 500);
    return () => clearTimeout(timer);
  }, [sheets, mode, countryCode, message, emailSubject, emailBody, currentIndex, sentStatus]);

  if (loading) return <div className="wa-loading">Loading...</div>;
  if (!session) return null;

  return (
    <div className="wa-page">
      {/* Background animations */}
      <div className="wa-bg-effects">
        <div className="wa-bg-blob wa-bg-blob--blue" />
        <div className="wa-bg-blob wa-bg-blob--purple" />
      </div>

      <div className="wa-container">
        {/* Header */}
        <div className="wa-header">
          <div className="wa-header-icon">
            <span className="wa-header-emoji">💬</span>
          </div>
          <h1 className="wa-title">WA Sender</h1>
          <p className="wa-subtitle">Bulk messaging made simple</p>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              localStorage.clear();
              router.push('/auth/login');
            }}
            aria-label="Sign out and return to login"
            className="wa-signout-btn"
          >
            Sign Out
          </Button>
        </div>

        {/* Notifications */}
        {notice && (
          <div className={`wa-notice wa-notice--${notice.kind}`} role="alert">
            <span className="wa-notice-icon">
              {notice.kind === 'error' ? '!' : notice.kind === 'success' ? '✓' : 'i'}
            </span>
            <span className="wa-notice-text">{notice.text}</span>
          </div>
        )}

        {/* File Upload */}
        <div className="wa-upload-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <label className="wa-step-label">
              Step 1: Upload Your Data
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowContactModal(true)}
                aria-label="Select contacts from your library"
              >
                Select Contacts
              </Button>
              {selectedContacts.length > 0 && (
                <>
                  <Badge>{selectedContacts.length} selected</Badge>
                  <button
                    onClick={() => {
                      setSelectedContacts([]);
                      setSheets([]);
                      setCurrentIndex(0);
                      setSentStatus({});
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc3545',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      padding: '0.25rem 0.5rem',
                      textDecoration: 'underline',
                    }}
                    aria-label="Clear selected contacts"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Show loaded sheet names when sheets exist */}
          {sheets.length > 0 && (
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--color-bg-gradient-lighter)',
              borderLeft: '4px solid var(--color-accent)',
              borderRadius: '0.375rem',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  Loaded Sheets
                </p>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-headline)' }}>
                  {sheets.map(s => s.name).join(', ')}
                </p>
              </div>
              <button
                onClick={() => {
                  setSheets([]);
                  setCurrentIndex(0);
                  setSentStatus({});
                  setSelectedContacts([]);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc3545',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  padding: '0.5rem 0.75rem',
                  textDecoration: 'underline',
                  whiteSpace: 'nowrap',
                }}
                aria-label="Delete loaded sheet and allow re-upload"
              >
                Delete Sheet
              </button>
            </div>
          )}

          {/* Only show upload UI when no sheets are loaded */}
          {sheets.length === 0 && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                id="file-upload"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="wa-file-input"
                aria-label="Upload Excel file with contacts"
              />
              <label
                htmlFor="file-upload"
                className="wa-upload-dropzone"
              >
                <div className="wa-upload-icon">📁</div>
                <p className="wa-upload-title">Drop your Excel file here</p>
                <p className="wa-upload-desc">or click to select — .xlsx, .xls, .csv</p>
                <p className="wa-upload-note">Max 50MB - Phone and Email columns auto-detected</p>
              </label>
            </>
          )}
        </div>

        {sheets.length > 0 && (
          <div className="wa-content">
            {/* Stats Bar */}
            <div className="wa-stats-bar">
              <div className="wa-stats-row">
                <div className="wa-stats-info">
                  <p className="wa-stats-label">Progress</p>
                  <p className="wa-stats-value">
                    {total > 0 ? `${position}/${total}` : '0'}
                  </p>
                  {sentCount > 0 && (
                    <Badge variant="sent">{sentCount} sent</Badge>
                  )}
                </div>
                {total > 0 && (
                  <div className="wa-progress-container">
                    <div className="wa-progress-track">
                      <div
                        className="wa-progress-fill"
                        style={{ width: `${(sentCount / total) * 100}%` }}
                      />
                    </div>
                    <p className="wa-progress-label">{Math.round((sentCount / total) * 100)}% complete</p>
                  </div>
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="wa-settings">
              <div>
                <label className="wa-step-label">
                  Step 2: Choose Your Channel
                </label>
                <div className="wa-mode-toggle">
                  <Button
                    variant={mode === 'whatsapp' ? 'primary' : 'secondary'}
                    size="lg"
                    onClick={() => setMode('whatsapp')}
                    aria-label="Send via WhatsApp"
                    aria-pressed={mode === 'whatsapp'}
                    className="wa-mode-btn"
                  >
                    WhatsApp
                  </Button>
                  <Button
                    variant={mode === 'email' ? 'primary' : 'secondary'}
                    size="lg"
                    onClick={() => setMode('email')}
                    aria-label="Send via Email"
                    aria-pressed={mode === 'email'}
                    className="wa-mode-btn"
                  >
                    Email
                  </Button>
                </div>
              </div>

              {mode === 'whatsapp' ? (
                <>
                  <div className="wa-card">
                    <label htmlFor="country-code" className="wa-label">
                      Default Country Code
                    </label>
                    <input
                      id="country-code"
                      name="country-code"
                      type="text"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="input"
                      placeholder="+91"
                      aria-label="Default country code for phone numbers"
                    />
                    <p className="wa-hint">Used for contacts without country code</p>
                  </div>
                  <div className="wa-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label htmlFor="wa-message" className="wa-label">
                        Your Message
                      </label>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowTemplateModal(true)}
                      >
                        Select Template
                      </Button>
                    </div>
                    <textarea
                      id="wa-message"
                      name="wa-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="input wa-textarea"
                      placeholder="Type your message here..."
                      aria-label="WhatsApp message template"
                    />
                    {selectedTemplate && (
                      <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: '#f0fdf4', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#166534', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Using template: <strong>{selectedTemplate.name}</strong></span>
                        <button
                          onClick={() => setSelectedTemplate(null)}
                          style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', fontSize: '1.25rem', padding: '0' }}
                          aria-label="Deselect template"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <p className="wa-hint">{message.length} characters</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="wa-card">
                    <label htmlFor="email-subject" className="wa-label">
                      Email Subject
                    </label>
                    <input
                      id="email-subject"
                      name="email-subject"
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="input"
                      placeholder="Your email subject..."
                      aria-label="Email subject line"
                    />
                  </div>
                  <div className="wa-card">
                    <label htmlFor="email-body" className="wa-label">
                      Email Body
                    </label>
                    <textarea
                      id="email-body"
                      name="email-body"
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="input wa-textarea"
                      placeholder="Your email body..."
                      aria-label="Email body content"
                    />
                    <p className="wa-hint">{emailBody.length} characters</p>
                  </div>
                </>
              )}
            </div>

            {/* Current Contact Card */}
            {current && (
              <div className={`wa-contact-card ${current.isSent ? 'wa-contact-card--sent' : ''}`}>
                <div className="wa-contact-icon">
                  {current.kind === 'whatsapp' ? '📱' : '📧'}
                </div>
                {current.isSent && (
                  <Badge variant="sent" className="wa-contact-badge">Already sent</Badge>
                )}
                <p className="wa-contact-value">
                  {current.kind === 'whatsapp' ? current.normalized : current.email}
                </p>
                <p className="wa-contact-meta">
                  Row {current.rowNum} - {current.sheetName}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="wa-actions">
              <Button
                variant="primary"
                size="lg"
                onClick={mode === 'whatsapp' ? openWhatsApp : openGmailCompose}
                disabled={!current}
                aria-label={mode === 'whatsapp' ? 'Open WhatsApp for current contact' : 'Open Gmail for current contact'}
                className="wa-action-primary"
              >
                {mode === 'whatsapp' ? 'Open WhatsApp' : 'Open Gmail'}
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={nextRecipient}
                disabled={currentIndex >= recipients.length - 1}
                aria-label="Go to next contact"
                className="wa-action-secondary"
              >
                Next Contact
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={handleExportWithStatus}
                disabled={sheets.length === 0}
                aria-label="Export sheets with sent status column"
                className="wa-action-secondary"
              >
                📥 Export with Status
              </Button>
            </div>

            {/* Go To Input */}
            <div className="wa-goto">
              <input
                id="goto-input"
                name="goto-input"
                type="number"
                min={1}
                max={total}
                value={goToInput}
                onChange={(e) => setGoToInput(e.target.value)}
                placeholder="Jump to #..."
                className="input wa-goto-input"
                aria-label={`Jump to contact number, 1 to ${total}`}
              />
              <Button
                variant="secondary"
                size="md"
                onClick={goTo}
                aria-label="Jump to specified contact number"
              >
                Jump
              </Button>
            </div>

            {isSaving && (
              <div className="wa-saving" role="status" aria-live="polite">
                <span className="wa-saving-dot" />
                Saving session...
              </div>
            )}
          </div>
        )}
      </div>

      {columnConfirmModal.open && columnConfirmModal.data && (
        <ColumnConfirmationModal
          open={columnConfirmModal.open}
          detectedPhoneCol={columnConfirmModal.data.detectedPhoneCol}
          detectedEmailCol={columnConfirmModal.data.detectedEmailCol}
          allHeaders={columnConfirmModal.data.headers}
          mode={mode}
          onConfirm={handleColumnConfirm}
          onCancel={() => setColumnConfirmModal({ open: false, data: null })}
        />
      )}

      {showTemplateModal && (
        <Suspense fallback={<div>Loading...</div>}>
          <TemplateModal
            open={showTemplateModal}
            onClose={() => setShowTemplateModal(false)}
            onSelect={(template: WASenderTemplate) => {
              setSelectedTemplate(template);
              setMessage(template.content);
            }}
          />
        </Suspense>
      )}

      {showContactModal && (
        <Suspense fallback={<div>Loading...</div>}>
          <ContactModal
            open={showContactModal}
            onClose={() => setShowContactModal(false)}
            onSelect={handleContactsSelect}
          />
        </Suspense>
      )}
    </div>
  );
}
