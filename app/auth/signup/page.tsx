'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Signup failed');
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 2000);
    } catch (err) {
      setError('Signup failed. Please try again.');
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
        <div className="absolute -top-12 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl p-8 hover:border-white/30 transition-all duration-500">
          {/* Logo & Brand */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4 shadow-lg shadow-purple-500/50">
              <span className="text-2xl">🚀</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Join WA Sender
            </h1>
            <p className="text-white/50 text-sm">Create your account</p>
          </div>

          {/* Success Banner */}
          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/40 rounded-xl text-green-200 text-sm backdrop-blur animation-fadeIn">
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">✓</span>
                <div>Signup successful! Please wait for admin approval.</div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-sm backdrop-blur animation-fadeIn">
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">✕</span>
                <div>{error}</div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-2 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-300"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-2 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-300"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-2 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-300"
                placeholder="••••••••"
              />
              <p className="text-xs text-white/40 mt-2">Minimum 8 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 via-purple-500 to-pink-500 text-white font-semibold py-3.5 px-4 rounded-xl hover:shadow-lg hover:shadow-purple-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all duration-300 mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Creating account...
                </span>
              ) : (
                'Create Account →'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-white/0 via-white/10 to-white/0"></div>
            <span className="text-white/30 text-xs font-medium">OR</span>
            <div className="flex-1 h-px bg-gradient-to-r from-white/0 via-white/10 to-white/0"></div>
          </div>

          {/* Sign in CTA */}
          <p className="text-center text-white/60 text-sm">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors hover:underline decoration-2 underline-offset-2">
              Sign in
            </Link>
          </p>

          {/* Security note */}
          <p className="text-center text-white/40 text-xs mt-6 flex items-center justify-center gap-1.5">
            <span>🔐</span>
            <span>Secure & encrypted</span>
          </p>
        </div>

        {/* Bottom accent */}
        <div className="absolute -bottom-12 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
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
