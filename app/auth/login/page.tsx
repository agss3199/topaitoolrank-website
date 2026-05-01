'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, FormField, Card } from '@/app/components';

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
    <div className="min-h-screen w-full bg-white flex flex-col lg:flex-row">
      {/* Left Column: Brand Messaging (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center lg:px-12 lg:py-12 bg-var(--color-bg-light)">
        <div className="max-w-md">
          <h1
            className="text-[var(--font-size-h2)] font-[var(--font-weight-headline)] text-[var(--color-black)] mb-6 leading-[var(--line-height-headline)]"
            style={{
              fontSize: 'var(--font-size-h2)',
              fontWeight: 'var(--font-weight-headline)',
              color: 'var(--color-black)',
            }}
          >
            Sign in to WA Sender
          </h1>
          <p
            className="text-[var(--font-size-body)] leading-[var(--line-height-body)] text-[var(--color-gray-500)]"
            style={{
              fontSize: 'var(--font-size-body)',
              color: 'var(--color-gray-500)',
            }}
          >
            Send bulk WhatsApp and email messages with ease. Track delivery, manage schedules, and reach your audience efficiently with our simple, powerful platform.
          </p>
        </div>
      </div>

      {/* Right Column: Form (Full width on mobile/tablet, 50% on desktop) */}
      <div
        className="flex-1 flex items-center justify-center px-[var(--spacing-lg)] py-12 lg:px-12"
        style={{ paddingLeft: 'var(--spacing-lg)', paddingRight: 'var(--spacing-lg)', paddingTop: '3rem', paddingBottom: '3rem' }}
      >
        <Card className="w-full max-w-md" padding="lg" hover={false}>
          {/* Error Banner */}
          {error && (
            <div
              className="mb-6 p-4 rounded-lg border-l-4 border-[var(--color-error)] bg-red-50"
              role="alert"
              aria-live="assertive"
              style={{
                borderLeftColor: 'var(--color-error)',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
              }}
            >
              <p className="text-[var(--color-error)] text-sm font-medium" style={{ color: 'var(--color-error)' }}>
                {error}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Mobile/Tablet heading */}
            <div className="lg:hidden mb-8">
              <h1
                className="text-[var(--font-size-h2)] font-[var(--font-weight-headline)] text-[var(--color-black)]"
                style={{
                  fontSize: 'var(--font-size-h2)',
                  fontWeight: 'var(--font-weight-headline)',
                  color: 'var(--color-black)',
                }}
              >
                Welcome back
              </h1>
            </div>

            {/* Email Field */}
            <FormField
              id="email"
              name="email"
              type="email"
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
            />

            {/* Password Field */}
            <FormField
              id="password"
              name="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
            />

            {/* Submit Button */}
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={loading}
              loading={loading}
              className="w-full"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-[var(--color-gray-500)]" style={{ color: 'var(--color-gray-500)' }}>
              Don't have an account?{' '}
              <Link
                href="/auth/signup"
                className="font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
                style={{ color: 'var(--color-accent)' }}
              >
                Sign up
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
