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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Confirm Column Selection</h2>
        <p className="text-sm text-gray-600 mb-6">Please confirm which columns contain your contact information:</p>

        <div className="space-y-4">
          {mode === 'whatsapp' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number Column</label>
              <select
                value={selectedPhone}
                onChange={(e) => setSelectedPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select...</option>
                {allHeaders.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              {detectedPhoneCol && (
                <p className="text-xs text-gray-500 mt-1">🔍 Auto-detected: {detectedPhoneCol}</p>
              )}
            </div>
          )}

          {mode === 'email' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Column</label>
              <select
                value={selectedEmail}
                onChange={(e) => setSelectedEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select...</option>
                {allHeaders.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              {detectedEmailCol && (
                <p className="text-xs text-gray-500 mt-1">🔍 Auto-detected: {detectedEmailCol}</p>
              )}
            </div>
          )}

          {mode === 'whatsapp' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country Code Column (Optional)</label>
              <select
                value={selectedCC}
                onChange={(e) => setSelectedCC(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">None - Use default for all rows</option>
                {allHeaders.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              {detectedCountryCodeCol && (
                <p className="text-xs text-gray-500 mt-1">🔍 Auto-detected: {detectedCountryCodeCol}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-blue-600">WA Sender</h1>
            <button
              onClick={() => {
                localStorage.clear();
                router.push('/auth/login');
              }}
              className="text-sm text-gray-600 hover:text-red-600"
            >
              Logout
            </button>
          </div>

          {notice && (
            <div className={`mb-4 p-4 rounded ${notice.kind === 'error' ? 'bg-red-100 text-red-700' : notice.kind === 'success' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
              {notice.text}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Excel File</label>
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
              className="block border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition"
            >
              <p className="text-gray-700 font-medium">Tap to upload .xlsx or .xls</p>
            </label>
          </div>

          {sheets.length > 0 && (
            <>
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  {total > 0 ? `Recipient ${position} of ${total} (${sentCount} sent)` : 'No valid recipients'}
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as SendMode)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                  </select>
                </div>

                {mode === 'whatsapp' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Default Country Code</label>
                      <input
                        type="text"
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="+91"
                      />
                      <p className="text-xs text-gray-500 mt-1">Used for rows without a country code column</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                      <textarea
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24"
                      />
                    </div>
                  </>
                )}
              </div>

              {current && (
                <div className={`mb-6 p-4 rounded-lg ${current.isSent ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {current.kind === 'whatsapp' ? `📱 ${current.normalized}` : `📧 ${current.email}`}
                    {current.isSent && <span className="ml-2 text-green-600 font-semibold">✓ Sent</span>}
                  </p>
                  <p className="text-xs text-gray-500">
                    Row {current.rowNum} · {current.sheetName}
                  </p>
                </div>
              )}

              <div className="flex gap-3 mb-6">
                <button
                  onClick={mode === 'whatsapp' ? openWhatsApp : openGmailCompose}
                  disabled={!current}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {mode === 'whatsapp' ? 'Open WhatsApp' : 'Open Gmail'}
                </button>
                <button
                  onClick={nextRecipient}
                  disabled={currentIndex >= recipients.length - 1}
                  className="flex-1 bg-cyan-600 text-white py-2 rounded-lg font-medium hover:bg-cyan-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max={total}
                  value={goToInput}
                  onChange={(e) => setGoToInput(e.target.value)}
                  placeholder="Go to #"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={goTo}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Go
                </button>
              </div>

              {isSaving && <p className="text-xs text-gray-500 text-center mt-4">Saving...</p>}
            </>
          )}
        </div>
      </div>

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
