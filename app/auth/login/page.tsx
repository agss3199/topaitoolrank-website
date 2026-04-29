'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      // Store session
      localStorage.setItem('wa-sender-access-token', data.session.accessToken);
      localStorage.setItem('wa-sender-refresh-token', data.session.refreshToken);
      localStorage.setItem('wa-sender-user-id', data.session.userId);
      localStorage.setItem('wa-sender-user-email', data.session.email);

      router.push('/tools/wa-sender');
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2 text-center text-blue-600">WA Sender</h1>
        <p className="text-center text-gray-600 mb-6">Send bulk WhatsApp & Email messages from Excel</p>

        {/* Instructions Section */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-sm font-semibold text-blue-900 mb-3">How to Use:</h2>
          <ol className="text-xs text-gray-700 space-y-2 list-decimal list-inside">
            <li><strong>Prepare Excel file:</strong> Include a column with phone numbers or emails. Headers like "Phone", "Mobile", "Number", "Email" are auto-detected.</li>
            <li><strong>Upload file:</strong> After login, click the upload area and select your .xlsx or .xls file.</li>
            <li><strong>Verify columns:</strong> Confirm which column has phone/email numbers. You can override if needed.</li>
            <li><strong>Set country code:</strong> Choose the default country code (e.g., +91 for India). Row-specific codes in Excel will override this.</li>
            <li><strong>Write message:</strong> Enter your WhatsApp message or email subject/body.</li>
            <li><strong>Send:</strong> Click "Open WhatsApp" or "Open Gmail" for each contact. Already-sent contacts are skipped automatically.</li>
          </ol>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          No account yet?{' '}
          <Link href="/auth/signup" className="text-blue-600 hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
