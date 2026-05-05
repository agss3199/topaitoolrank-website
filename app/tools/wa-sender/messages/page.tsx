'use client';

import Link from 'next/link';

export default function MessagesPage() {
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
        Message History Coming Soon
      </h1>
      <p
        style={{
          fontSize: '1.1rem',
          color: '#64748b',
          marginBottom: '2rem',
          lineHeight: 1.6,
        }}
      >
        View and analyze the history of all WhatsApp and Email campaigns you've sent. This feature will be available in the next release.
      </p>
      <p
        style={{
          fontSize: '0.95rem',
          color: '#94a3b8',
          marginBottom: '2rem',
        }}
      >
        Track delivery status, open rates, and replies from your contacts.
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
