'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { useAuth } from '@/lib/useAuth';

type SendMode = 'whatsapp' | 'email';

interface SheetConfig {
  name: string;
  rows: Record<string, unknown>[];
  headers: string[];
  phoneCol: string;
  emailCol: string;
  countryCodeCol?: string;
  enabled: boolean;
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

function detectCountryCodeColumn(data: Record<string, unknown>[]): string | null {
  if (!data.length) return null;
  const headers = Object.keys(data[0]);
  const sample = data.slice(0, Math.min(30, data.length));
  let bestCol: string | null = null;
  let bestScore = 0;
  for (const header of headers) {
    let score = 0;
    const h = header.toLowerCase();
    if (/country|code|cc|country_code|country code|dial/.test(h)) score += 15;
    for (const row of sample) {
      const val = String(row[header] ?? '').trim();
      if (/^\+?\d{1,3}$/.test(val)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCol = header;
    }
  }
  return bestScore > 0 ? bestCol : null;
}

function normalizeCountryCode(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const str = String(raw).trim();
  if (!str) return null;
  const cc = str.replace(/\D/g, '');
  if (!cc || cc.length < 1 || cc.length > 3) return null;
  return cc;
}

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
  const sample = data.slice(0, Math.min(30, data.length));
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
  const sample = data.slice(0, Math.min(30, data.length));
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

interface ColumnConfirmModal {
  open: boolean;
  detectedPhoneCol: string | null;
  detectedEmailCol: string | null;
  detectedCountryCodeCol: string | null;
  allHeaders: string[];
  mode: SendMode;
  onConfirm: (phoneCol: string, emailCol: string, ccCol: string | null) => void;
  onCancel: () => void;
}

function ColumnConfirmationModal({
  open,
  detectedPhoneCol,
  detectedEmailCol,
  detectedCountryCodeCol,
  allHeaders,
  mode,
  onConfirm,
  onCancel,
}: ColumnConfirmModal & { mode: SendMode; onConfirm: (p: string, e: string, c: string | null) => void; onCancel: () => void }) {
  const [selectedPhone, setSelectedPhone] = useState(detectedPhoneCol || '');
  const [selectedEmail, setSelectedEmail] = useState(detectedEmailCol || '');
  const [selectedCC, setSelectedCC] = useState(detectedCountryCodeCol || '');

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20 rounded-2xl shadow-2xl max-w-md w-full p-8">
        <h2 className="text-2xl font-bold text-white mb-2">Column Detection</h2>
        <p className="text-white/60 text-sm mb-6">Confirm which columns contain your data:</p>

        <div className="space-y-5">
          {mode === 'whatsapp' && (
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">📱 Phone Number Column</label>
              <select
                value={selectedPhone}
                onChange={(e) => setSelectedPhone(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:bg-white/20 transition-all"
              >
                <option value="">Select column...</option>
                {allHeaders.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              {detectedPhoneCol && (
                <p className="text-xs text-blue-300 mt-2">✨ Auto-detected: <span className="font-semibold">{detectedPhoneCol}</span></p>
              )}
            </div>
          )}

          {mode === 'email' && (
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">📧 Email Column</label>
              <select
                value={selectedEmail}
                onChange={(e) => setSelectedEmail(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:bg-white/20 transition-all"
              >
                <option value="">Select column...</option>
                {allHeaders.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              {detectedEmailCol && (
                <p className="text-xs text-blue-300 mt-2">✨ Auto-detected: <span className="font-semibold">{detectedEmailCol}</span></p>
              )}
            </div>
          )}

          {mode === 'whatsapp' && (
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">🌐 Country Code Column <span className="text-white/40 font-normal">(optional)</span></label>
              <select
                value={selectedCC}
                onChange={(e) => setSelectedCC(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:bg-white/20 transition-all"
              >
                <option value="">Use default for all rows</option>
                {allHeaders.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              {detectedCountryCodeCol && (
                <p className="text-xs text-blue-300 mt-2">✨ Auto-detected: <span className="font-semibold">{detectedCountryCodeCol}</span></p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-white/20 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const phoneCol = mode === 'whatsapp' ? (selectedPhone || detectedPhoneCol || '') : '';
              const emailCol = mode === 'email' ? (selectedEmail || detectedEmailCol || '') : '';
              const ccCol = mode === 'whatsapp' ? (selectedCC || detectedCountryCodeCol || null) : null;
              onConfirm(phoneCol, emailCol, ccCol);
            }}
            disabled={mode === 'whatsapp' ? !selectedPhone && !detectedPhoneCol : !selectedEmail && !detectedEmailCol}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WASenderPage() {
  const router = useRouter();
  const { session, loading } = useAuth();

  const [mode, setMode] = useState<SendMode>('whatsapp');
  const [sheets, setSheets] = useState<SheetConfig[]>([]);
  const [countryCode, setCountryCode] = useState<string>('+91');
  const [message, setMessage] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [goToInput, setGoToInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sentStatus, setSentStatus] = useState<Record<string, boolean>>({});
  const [columnConfirmModal, setColumnConfirmModal] = useState({ open: false, data: null as any });

  // Auth check
  useEffect(() => {
    if (!loading && !session) {
      router.push('/auth/login');
    }
  }, [session, loading, router]);

  // Load session from Supabase on mount
  useEffect(() => {
    if (session?.userId) {
      loadSessionFromSupabase();
    }
  }, [session?.userId]);

  const loadSessionFromSupabase = async () => {
    try {
      const res = await fetch(`/api/sheets/load?userId=${session!.userId}`);
      const data = await res.json();
      if (data.ok && data.session) {
        const s = data.session;
        setSheets(s.sheet_data || []);
        setMode(s.send_mode || 'whatsapp');
        setCountryCode(s.country_code || '+91');
        setMessage(s.message_template || '');
        setCurrentIndex(s.current_index || 0);
        setSentStatus(s.sent_status || {});
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    }
  };

  const saveSession = useCallback(
    async (newSheets: SheetConfig[], newMode: SendMode, newCountryCode: string, newMessage: string, newIndex: number, newSentStatus: Record<string, boolean>) => {
      if (!session?.userId || isSaving) return;

      setIsSaving(true);
      try {
        await fetch('/api/sheets/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: session.userId,
            sheet_data: newSheets,
            send_mode: newMode,
            country_code: newCountryCode,
            message_template: newMessage,
            current_sheet_name: newSheets.length > 0 ? newSheets[0].name : '',
            current_index: newIndex,
            sent_status: newSentStatus,
          }),
        });
      } catch (err) {
        console.error('Failed to save session:', err);
      } finally {
        setIsSaving(false);
      }
    },
    [session?.userId, isSaving]
  );

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setNotice(null);

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const workbook = XLSX.read(evt.target?.result, { type: 'binary' });

          if (!workbook.SheetNames.length) {
            setNotice({ text: 'The workbook contains no sheets.', kind: 'error' });
            setIsLoading(false);
            return;
          }

          const firstSheetName = workbook.SheetNames[0];
          const ws = workbook.Sheets[firstSheetName];
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
          const detectedCountryCodeCol = detectCountryCodeColumn(rows);

          // Show confirmation modal
          setColumnConfirmModal({
            open: true,
            data: {
              rows,
              headers,
              detectedPhoneCol,
              detectedEmailCol,
              detectedCountryCodeCol,
              workbook,
              fileName: file.name,
            },
          });

          setIsLoading(false);
        } catch {
          setNotice({ text: 'Could not parse the file. Please upload a valid .xlsx or .xls.', kind: 'error' });
          setIsLoading(false);
        } finally {
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };

      reader.readAsBinaryString(file);
    },
    []
  );

  const handleColumnConfirm = useCallback(
    (phoneCol: string, emailCol: string, ccCol: string | null) => {
      const { rows, headers, workbook } = columnConfirmModal.data;

      const parsed: SheetConfig[] = workbook.SheetNames.map((name: string) => {
        const ws = workbook.Sheets[name];
        const sheetRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
          defval: '',
          raw: false,
        });

        return {
          name,
          rows: sheetRows,
          headers: Object.keys(sheetRows[0] || {}),
          phoneCol,
          emailCol,
          countryCodeCol: ccCol,
          enabled: sheetRows.length > 0,
        };
      });

      setSheets(parsed);
      setCurrentIndex(0);
      setSentStatus({});
      setGoToInput('');
      saveSession(parsed, mode, countryCode, message, 0, {});

      setColumnConfirmModal({ open: false, data: null });

      const totalRows = parsed.reduce((s, sh) => s + sh.rows.length, 0);
      setNotice({
        text: `${parsed.length} sheet${parsed.length > 1 ? 's' : ''} loaded — ${totalRows} total rows`,
        kind: 'success',
      });
    },
    [columnConfirmModal.data, mode, countryCode, message, saveSession]
  );

  const recipients = useMemo<RecipientEntry[]>(() => {
    const result: RecipientEntry[] = [];

    for (const sheet of sheets) {
      if (!sheet.enabled || !sheet.rows.length) continue;

      if (mode === 'whatsapp') {
        if (!sheet.phoneCol) continue;
        for (let i = 0; i < sheet.rows.length; i++) {
          const key = `${sheet.name}-${i}`;
          const rowCountryCode = sheet.countryCodeCol
            ? normalizeCountryCode(sheet.rows[i][sheet.countryCodeCol])
            : null;
          const effectiveCC = rowCountryCode || countryCode.replace(/\D/g, '');
          const raw = String(sheet.rows[i][sheet.phoneCol] ?? '');
          const normalized = normalizePhone(sheet.rows[i][sheet.phoneCol], effectiveCC);
          if (normalized) {
            result.push({
              kind: 'whatsapp',
              rowNum: i + 1,
              raw,
              normalized,
              sheetName: sheet.name,
              countryCode: effectiveCC,
              isSent: !!sentStatus[key],
            });
          }
        }
      } else {
        if (!sheet.emailCol) continue;
        for (let i = 0; i < sheet.rows.length; i++) {
          const key = `${sheet.name}-${i}`;
          const raw = String(sheet.rows[i][sheet.emailCol] ?? '');
          const email = normalizeEmail(sheet.rows[i][sheet.emailCol]);
          if (email) {
            result.push({
              kind: 'email',
              rowNum: i + 1,
              raw,
              email,
              sheetName: sheet.name,
              isSent: !!sentStatus[key],
            });
          }
        }
      }
    }

    return result;
  }, [sheets, mode, countryCode, sentStatus]);

  const current = recipients[currentIndex] ?? null;

  const openWhatsApp = useCallback(() => {
    if (!current || current.kind !== 'whatsapp') return;
    const key = `${current.sheetName}-${current.rowNum - 1}`;
    const encoded = encodeURIComponent(message.trim());
    window.open(`https://wa.me/${current.normalized}?text=${encoded}`, '_blank');
    // Mark as sent
    setSentStatus(prev => ({ ...prev, [key]: true }));
    saveSession(sheets, mode, countryCode, message, currentIndex, { ...sentStatus, [key]: true });
  }, [current, message, sheets, mode, countryCode, currentIndex, sentStatus, saveSession]);

  const openGmailCompose = useCallback(() => {
    if (!current || current.kind !== 'email') return;
    const key = `${current.sheetName}-${current.rowNum - 1}`;
    const subject = encodeURIComponent(emailSubject.trim());
    const body = encodeURIComponent(emailBody.trim());
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${current.email}&su=${subject}&body=${body}`, '_blank');
    // Mark as sent
    setSentStatus(prev => ({ ...prev, [key]: true }));
    saveSession(sheets, mode, countryCode, message, currentIndex, { ...sentStatus, [key]: true });
  }, [current, emailSubject, emailBody, sheets, mode, countryCode, message, currentIndex, sentStatus, saveSession]);

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

  // Auto-save on state changes
  useEffect(() => {
    saveSession(sheets, mode, countryCode, message, currentIndex, sentStatus);
  }, [mode, countryCode, message, currentIndex]);

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 px-4 sm:px-6">
      {/* Background animations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto py-12 flex flex-col items-center">
        {/* Header - Centered */}
        <div className="text-center mb-12 w-full">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4 shadow-lg shadow-blue-500/50">
            <span className="text-4xl">💬</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            WA Sender
          </h1>
          <p className="text-white/50 text-lg mb-6">Bulk messaging made simple</p>

          <button
            onClick={() => {
              localStorage.clear();
              router.push('/auth/login');
            }}
            className="inline-block px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 hover:text-white transition-all duration-200 text-sm font-medium"
          >
            ← Sign Out
          </button>
        </div>

        {/* Notifications */}
        {notice && (
          <div className={`mb-6 p-4 rounded-lg backdrop-blur border transition-all duration-300 ${
            notice.kind === 'error'
              ? 'bg-red-500/20 border-red-500/50 text-red-200'
              : notice.kind === 'success'
              ? 'bg-green-500/20 border-green-500/50 text-green-200'
              : 'bg-blue-500/20 border-blue-500/50 text-blue-200'
          }`}>
            <div className="flex items-start gap-3">
              <span className="text-lg">{notice.kind === 'error' ? '⚠️' : notice.kind === 'success' ? '✅' : 'ℹ️'}</span>
              <span className="flex-1">{notice.text}</span>
            </div>
          </div>
        )}

        {/* File Upload - Centered */}
        <div className="mb-12 w-full max-w-2xl mx-auto">
          <label className="block text-sm font-semibold text-white/70 mb-4 uppercase tracking-wider text-center">
            📊 Step 1: Upload Your Data
          </label>
          <input
            ref={fileInputRef}
            type="file"
            id="file-upload"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            disabled={isLoading}
            className="hidden"
          />
          <label
            htmlFor="file-upload"
            className="block border-2 border-dashed border-blue-500/40 hover:border-blue-500/80 rounded-2xl p-16 text-center cursor-pointer hover:bg-blue-500/10 transition-all duration-300 group bg-white/[0.02]"
          >
            <div className="text-6xl mb-4 group-hover:scale-125 group-hover:-translate-y-2 transition-all duration-300">📁</div>
            <p className="text-white font-semibold mb-2 text-lg">Drop your Excel file here</p>
            <p className="text-white/50 text-sm">or click to select — .xlsx, .xls, .csv</p>
            <p className="text-white/30 text-xs mt-3">Max 50MB • Phone and Email columns auto-detected</p>
          </label>
        </div>

        {sheets.length > 0 && (
          <div className="w-full max-w-4xl mx-auto">
            {/* Stats Bar - Centered */}
            <div className="mb-12 p-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl backdrop-blur">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="text-center sm:text-left">
                    <p className="text-white/60 text-sm font-medium uppercase tracking-wider mb-1">Progress</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      {total > 0 ? `${position}/${total}` : '0'}
                    </p>
                    {sentCount > 0 && (
                      <p className="text-green-400 font-semibold text-lg mt-1">✓ {sentCount} sent</p>
                    )}
                  </div>
                  {total > 0 && (
                    <div className="w-full sm:w-48">
                      <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-cyan-500 transition-all duration-500 rounded-full"
                          style={{ width: `${(sentCount / total) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-white/50 text-xs mt-2 text-center">{Math.round((sentCount / total) * 100)}% complete</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Settings Grid - Centered */}
            <div className="grid grid-cols-1 gap-8 mb-12">
              <div>
                <label className="block text-sm font-semibold text-white/70 mb-4 uppercase tracking-wider">
                  📤 Step 2: Choose Your Channel
                </label>
                <div className="flex gap-3">
                  {['whatsapp', 'email'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setMode(opt as SendMode)}
                      className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all duration-300 text-center ${
                        mode === opt
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-white/10 border border-white/20 text-white/60 hover:bg-white/15 hover:border-white/30'
                      }`}
                    >
                      {opt === 'whatsapp' ? '💬 WhatsApp' : '📧 Email'}
                    </button>
                  ))}
                </div>
              </div>

              {mode === 'whatsapp' ? (
                <>
                  <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/10">
                    <label className="block text-sm font-semibold text-white/70 mb-3 uppercase tracking-wider">Default Country Code</label>
                    <input
                      type="text"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400/50 focus:bg-white/15 focus:shadow-lg focus:shadow-blue-500/20 transition-all"
                      placeholder="+91"
                    />
                    <p className="text-xs text-white/50 mt-2">Used for contacts without country code</p>
                  </div>
                  <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/10">
                    <label className="block text-sm font-semibold text-white/70 mb-3 uppercase tracking-wider">Your Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400/50 focus:bg-white/15 focus:shadow-lg focus:shadow-blue-500/20 transition-all h-28 resize-none"
                      placeholder="Type your message here..."
                    />
                    <p className="text-xs text-white/50 mt-2">{message.length} characters</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/10">
                    <label className="block text-sm font-semibold text-white/70 mb-3 uppercase tracking-wider">Email Subject</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400/50 focus:bg-white/15 focus:shadow-lg focus:shadow-blue-500/20 transition-all"
                      placeholder="Your email subject..."
                    />
                  </div>
                  <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/10">
                    <label className="block text-sm font-semibold text-white/70 mb-3 uppercase tracking-wider">Email Body</label>
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400/50 focus:bg-white/15 focus:shadow-lg focus:shadow-blue-500/20 transition-all h-28 resize-none"
                      placeholder="Your email body..."
                    />
                    <p className="text-xs text-white/50 mt-2">{emailBody.length} characters</p>
                  </div>
                </>
              )}
            </div>

            {/* Current Contact Card - Centered */}
            {current && (
              <div className={`mb-12 p-8 rounded-2xl backdrop-blur border transition-all duration-300 text-center ${
                current.isSent
                  ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/40'
                  : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/40'
              }`}>
                <div className="flex justify-center mb-4">
                  <div className="text-6xl">{current.kind === 'whatsapp' ? '📱' : '📧'}</div>
                </div>
                {current.isSent && (
                  <div className="inline-block px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-full mb-4">
                    <div className="text-green-400 font-semibold text-sm">✓ Already sent</div>
                  </div>
                )}
                <p className="text-white text-2xl font-semibold mb-2 break-all">
                  {current.kind === 'whatsapp' ? current.normalized : current.email}
                </p>
                <p className="text-white/60 text-sm">Row {current.rowNum} • <span className="font-medium">{current.sheetName}</span></p>
              </div>
            )}

            {/* Action Buttons - Centered */}
            <div className="space-y-3 mb-8">
              <button
                onClick={mode === 'whatsapp' ? openWhatsApp : openGmailCompose}
                disabled={!current}
                className="w-full bg-gradient-to-r from-blue-500 via-blue-500 to-cyan-500 text-white font-semibold py-4 px-6 rounded-xl hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all duration-300 flex items-center justify-center gap-2 text-lg"
              >
                {mode === 'whatsapp' ? '📤 Open WhatsApp' : '📤 Open Gmail'}
              </button>

              <button
                onClick={nextRecipient}
                disabled={currentIndex >= recipients.length - 1}
                className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:border-white/40"
              >
                ⬇️ Next Contact
              </button>
            </div>

            {/* Go To Input - Centered */}
            <div className="flex gap-3 mb-8 max-w-md mx-auto">
              <input
                type="number"
                min="1"
                max={total}
                value={goToInput}
                onChange={(e) => setGoToInput(e.target.value)}
                placeholder="Jump to #..."
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400/50 focus:bg-white/15 focus:shadow-lg focus:shadow-blue-500/20 transition-all text-center"
              />
              <button
                onClick={goTo}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-medium transition-all hover:border-white/40"
              >
                Jump
              </button>
            </div>

              {isSaving && (
                <div className="text-center text-white/50 text-sm flex items-center justify-center gap-2">
                  <span className="inline-block w-3 h-3 bg-white/50 rounded-full animate-pulse"></span>
                  Saving session...
                </div>
              )}
            </>
          )}
          </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>

      {columnConfirmModal.open && columnConfirmModal.data && (
        <ColumnConfirmationModal
          open={columnConfirmModal.open}
          detectedPhoneCol={columnConfirmModal.data.detectedPhoneCol}
          detectedEmailCol={columnConfirmModal.data.detectedEmailCol}
          detectedCountryCodeCol={columnConfirmModal.data.detectedCountryCodeCol}
          allHeaders={columnConfirmModal.data.headers}
          mode={mode}
          onConfirm={handleColumnConfirm}
          onCancel={() => setColumnConfirmModal({ open: false, data: null })}
        />
      )}
    </div>
  );
}
