'use client';

import Link from 'next/link';

export default function TemplatesPage() {
  return (
    <div
      style={{
        padding: '2rem',
        maxWidth: '600px',
        margin: '0 auto',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#0f1419' }}>
        Templates Coming Soon
      </h1>
      <p
        style={{
          fontSize: '1.1rem',
          color: '#64748b',
          marginBottom: '2rem',
          lineHeight: 1.6,
        }}
      >
        Save and manage reusable WhatsApp and Email templates. This feature will be available in the next release.
      </p>
      <p
        style={{
          fontSize: '0.95rem',
          color: '#94a3b8',
          marginBottom: '2rem',
        }}
      >
        For now, you can compose messages directly in the Dashboard and send them right away.
      </p>
      <Link
        href="/tools/wa-sender"
        style={{
          display: 'inline-block',
          padding: '0.75rem 2rem',
          backgroundColor: '#4f46e5',
          color: 'white',
          borderRadius: '0.5rem',
          textDecoration: 'none',
          fontWeight: 500,
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#4338ca';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#4f46e5';
        }}
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
