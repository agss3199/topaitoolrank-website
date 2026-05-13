'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = false;

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cls } from '../lib/css-module-safe';
import styles from './styles/page.module.css';
import Header from '@/app/components/Header';
import Footer from '../lib/Footer';
import BreadcrumbSchema from '../lib/BreadcrumbSchema';
import CameraView from './components/CameraView';
import ResultsView from './components/ResultsView';
import type { PalmReadingResponse, PalmReadingApiResult } from './lib/types';

type ViewState = 'camera' | 'results';

/** Generic error message shown to users on API failure. */
const API_ERROR_MESSAGE = 'Something went wrong analyzing your palm. Please try again.';

export default function PalmReaderPage() {
  const router = useRouter();
  const [view, setView] = useState<ViewState>('camera');
  const [results, setResults] = useState<PalmReadingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = useCallback(async (imageData: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tools/palm-reader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      });

      const result: PalmReadingApiResult = await response.json();

      if (!response.ok || !result.success || !result.data) {
        setError(API_ERROR_MESSAGE);
        setLoading(false);
        return;
      }

      if (!result.data.is_palm) {
        setError('No palm detected in the image. Please try again with your palm clearly visible.');
        setLoading(false);
        return;
      }

      setResults(result.data);
      setView('results');
    } catch {
      setError(API_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRetry = useCallback(() => {
    setView('camera');
    setResults(null);
    setError(null);
  }, []);

  const handleHome = useCallback(() => {
    router.push('/tools');
  }, [router]);

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://topaitoolrank.com' },
          { name: 'Tools', url: 'https://topaitoolrank.com/tools' },
          { name: 'Palm Reader', url: 'https://topaitoolrank.com/tools/palm-reader' },
        ]}
      />
      <Header />
      <main className={cls(styles, 'page')}>
        <div className={cls(styles, 'page-inner')}>
          <h1 className={cls(styles, 'title')}>
            Palm Reader
          </h1>

          {/* Loading overlay */}
          {loading && (
            <div className={cls(styles, 'loading-overlay')}>
              <div className={cls(styles, 'loading-card')}>
                <div className={cls(styles, 'loading-spinner')} />
                <p className={cls(styles, 'loading-text')}>
                  Analyzing palm...
                </p>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && !loading && (
            <div className={cls(styles, 'error-message')}>
              <p className={cls(styles, 'error-text')}>{error}</p>
              {view === 'camera' && (
                <button
                  onClick={() => setError(null)}
                  type="button"
                  className={cls(styles, 'error-retry')}
                >
                  Dismiss
                </button>
              )}
            </div>
          )}

          {/* Camera view */}
          {view === 'camera' && (
            <CameraView onCapture={handleCapture} onHome={handleHome} />
          )}

          {/* Results view */}
          {view === 'results' && results && (
            <ResultsView
              results={results}
              onRetry={handleRetry}
              onHome={handleHome}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
