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
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden flex items-center justify-center px-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Grid pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Top accent bar */}
        <div className="absolute -top-12 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl p-8 hover:border-white/30 transition-all duration-500">
          {/* Logo & Brand */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4 shadow-lg shadow-blue-500/50">
              <span className="text-2xl">💬</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              WA Sender
            </h1>
            <p className="text-white/50 text-sm">Bulk messaging made simple</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-sm backdrop-blur animation-fadeIn">
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">✕</span>
                <div>{error}</div>
              </div>
            </div>
          )}

          {/* Feature List */}
          <div className="mb-8 space-y-3 p-5 rounded-2xl bg-white/[0.03] border border-white/10">
            {[
              { icon: '📊', text: 'Auto-detect Excel columns' },
              { icon: '🚀', text: 'Send at your own pace' },
              { icon: '📱', text: 'WhatsApp & Email support' },
              { icon: '💾', text: 'Progress auto-saved' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-lg">{item.icon}</span>
                <span className="text-white/70">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-2 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400/50 focus:bg-white/15 focus:shadow-lg focus:shadow-blue-500/20 transition-all duration-300"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-2 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400/50 focus:bg-white/15 focus:shadow-lg focus:shadow-blue-500/20 transition-all duration-300"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 via-blue-500 to-cyan-500 text-white font-semibold py-3.5 px-4 rounded-xl hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all duration-300 mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Signing in...
                </span>
              ) : (
                'Sign In →'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-white/0 via-white/10 to-white/0"></div>
            <span className="text-white/30 text-xs font-medium">OR</span>
            <div className="flex-1 h-px bg-gradient-to-r from-white/0 via-white/10 to-white/0"></div>
          </div>

          {/* Sign up CTA */}
          <p className="text-center text-white/60 text-sm">
            New here?{' '}
            <Link href="/auth/signup" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors hover:underline decoration-2 underline-offset-2">
              Create account
            </Link>
          </p>

          {/* Security note */}
          <p className="text-center text-white/40 text-xs mt-6 flex items-center justify-center gap-1.5">
            <span>🔐</span>
            <span>End-to-end encrypted and secure</span>
          </p>
        </div>

        {/* Bottom accent */}
        <div className="absolute -bottom-12 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animation-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
