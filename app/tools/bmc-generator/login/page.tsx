'use client';

/**
 * BMC Generator Login Page
 *
 * Route: GET /tools/bmc-generator/login
 *
 * Simple username/password form that submits to POST /api/bmc-generator/login.
 * On success, redirects to /tools/bmc-generator/.
 * On failure, displays generic error message (prevents user enumeration).
 *
 * Accessibility:
 * - Labels associated with inputs via htmlFor
 * - Error messages have role="alert"
 * - Password field masked (type="password")
 * - Mobile-responsive (full-width inputs on <600px)
 */

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { cls } from '@/app/tools/lib/css-module-safe';
import styles from '../styles/login.module.css';

export const dynamic = 'force-dynamic';

export default function BMCGeneratorLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/bmc-generator/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Redirect to main BMC Generator page
        router.push(data.redirect || '/tools/bmc-generator/');
      } else {
        // Display error message from server
        setError(data.error || 'Login failed. Please try again.');
      }
    } catch {
      setError('Unable to connect. Please check your network and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cls(styles, 'loginContainer')}>
      <div className={cls(styles, 'loginCard')}>
        <header className={cls(styles, 'header')}>
          <h1 className={cls(styles, 'title')}>BMC Generator</h1>
          <p className={cls(styles, 'subtitle')}>Sign in to continue</p>
        </header>

        <form
          className={cls(styles, 'form')}
          onSubmit={handleSubmit}
          noValidate
        >
          <div className={cls(styles, 'fieldGroup')}>
            <label htmlFor="bmc-username" className={cls(styles, 'label')}>
              Username
            </label>
            <input
              id="bmc-username"
              name="username"
              type="text"
              autoComplete="username"
              required
              minLength={3}
              maxLength={20}
              className={cls(styles, 'input')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>

          <div className={cls(styles, 'fieldGroup')}>
            <label htmlFor="bmc-password" className={cls(styles, 'label')}>
              Password
            </label>
            <input
              id="bmc-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              maxLength={64}
              className={cls(styles, 'input')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>

          {error && (
            <div
              id="login-error"
              className={cls(styles, 'errorMessage')}
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className={cls(styles, 'submitButton')}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
