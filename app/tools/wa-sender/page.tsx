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
  enabled: boolean;
}

interface PhoneEntry {
  kind: 'whatsapp';
  rowNum: number;
  raw: string;
  normalized: string;
  sheetName: string;
}

interface EmailEntry {
  kind: 'email';
  rowNum: number;
  raw: string;
  email: string;
  sheetName: string;
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
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    }
  };

  // Save session to Supabase after changes
  const saveSession = useCallback(
    async (newSheets: SheetConfig[], newMode: SendMode, newCountryCode: string, newMessage: string, newIndex: number) => {
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

          const parsed: SheetConfig[] = workbook.SheetNames.map((name) => {
            const ws = workbook.Sheets[name];
            const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
              defval: '',
              raw: false,
            });

            const headers = rows.length ? Object.keys(rows[0]) : [];
            const phoneCol = detectPhoneColumn(rows) ?? headers[0] ?? '';
            const emailCol = detectEmailColumn(rows) ?? headers[0] ?? '';

            return {
              name,
              rows,
              headers,
              phoneCol,
              emailCol,
              enabled: rows.length > 0,
            };
          });

          const totalRows = parsed.reduce((s, sh) => s + sh.rows.length, 0);
          if (totalRows === 0) {
            setNotice({ text: 'All sheets appear to be empty.', kind: 'error' });
            setIsLoading(false);
            return;
          }

          // FIX: Clear old data completely and reset to beginning
          setSheets(parsed);
          setCurrentIndex(0);
          setGoToInput('');

          // Save to Supabase
          saveSession(parsed, mode, countryCode, message, 0);

          const summary = parsed.map(s => `${s.name} (${s.rows.length.toLocaleString()})`).join(' · ');
          setNotice({
            text: `${parsed.length} sheet${parsed.length > 1 ? 's' : ''} loaded — ${summary}`,
            kind: 'success',
          });
        } catch {
          setNotice({ text: 'Could not parse the file. Please upload a valid .xlsx or .xls.', kind: 'error' });
        } finally {
          setIsLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };

      reader.readAsBinaryString(file);
    },
    [mode, countryCode, message, saveSession]
  );

  const recipients = useMemo<RecipientEntry[]>(() => {
    const result: RecipientEntry[] = [];

    for (const sheet of sheets) {
      if (!sheet.enabled || !sheet.rows.length) continue;

      if (mode === 'whatsapp') {
        if (!sheet.phoneCol) continue;
        for (let i = 0; i < sheet.rows.length; i++) {
          const raw = String(sheet.rows[i][sheet.phoneCol] ?? '');
          const normalized = normalizePhone(sheet.rows[i][sheet.phoneCol], countryCode);
          if (normalized) {
            result.push({
              kind: 'whatsapp',
              rowNum: i + 1,
              raw,
              normalized,
              sheetName: sheet.name,
            });
          }
        }
      } else {
        if (!sheet.emailCol) continue;
        for (let i = 0; i < sheet.rows.length; i++) {
          const raw = String(sheet.rows[i][sheet.emailCol] ?? '');
          const email = normalizeEmail(sheet.rows[i][sheet.emailCol]);
          if (email) {
            result.push({
              kind: 'email',
              rowNum: i + 1,
              raw,
              email,
              sheetName: sheet.name,
            });
          }
        }
      }
    }

    return result;
  }, [sheets, mode, countryCode]);

  const current = recipients[currentIndex] ?? null;

  const openWhatsApp = useCallback(() => {
    if (!current || current.kind !== 'whatsapp') return;
    const encoded = encodeURIComponent(message.trim());
    window.open(`https://wa.me/${current.normalized}?text=${encoded}`, '_blank');
  }, [current, message]);

  const openGmailCompose = useCallback(() => {
    if (!current || current.kind !== 'email') return;
    const subject = encodeURIComponent(emailSubject.trim());
    const body = encodeURIComponent(emailBody.trim());
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${current.email}&su=${subject}&body=${body}`, '_blank');
  }, [current, emailSubject, emailBody]);

  const nextRecipient = useCallback(() => {
    setCurrentIndex(prev => clamp(prev + 1, 0, recipients.length - 1));
    setGoToInput('');
    saveSession(sheets, mode, countryCode, message, currentIndex + 1);
  }, [current, recipients.length, openWhatsApp, openGmailCompose, sheets, mode, countryCode, message, currentIndex, saveSession]);

  const goTo = useCallback(() => {
    const n = parseInt(goToInput, 10);
    if (isNaN(n) || n < 1 || n > recipients.length) {
      setNotice({ text: `Enter a number between 1 and ${recipients.length}.`, kind: 'error' });
      return;
    }
    setCurrentIndex(n - 1);
    setGoToInput('');
    saveSession(sheets, mode, countryCode, message, n - 1);
  }, [goToInput, recipients.length, sheets, mode, countryCode, message, saveSession]);

  const total = recipients.length;
  const position = total > 0 ? currentIndex + 1 : 0;

  // Auto-save on state changes
  useEffect(() => {
    saveSession(sheets, mode, countryCode, message, currentIndex);
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
                  {total > 0 ? `Recipient ${position} of ${total}` : 'No valid recipients'}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country Code</label>
                      <input
                        type="text"
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="+91"
                      />
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
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    {current.kind === 'whatsapp' ? `📱 ${current.normalized}` : `📧 ${current.email}`}
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
    </div>
  );
}
