'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function SettingsPage() {
  const [countryCode, setCountryCode] = useState('+91');
  const [exportFormat, setExportFormat] = useState('csv');
  const [autoSaveInterval, setAutoSaveInterval] = useState(500);
  const [showSaveMessage, setShowSaveMessage] = useState(false);

  const handleSave = () => {
    setShowSaveMessage(true);
    setTimeout(() => {
      setShowSaveMessage(false);
    }, 2000);
  };

  return (
    <div
      style={{
        padding: '2rem',
        maxWidth: '500px',
        margin: '0 auto',
      }}
    >
      <h1 style={{ fontSize: '1.8rem', marginBottom: '2rem', color: '#0f1419' }}>
        Settings
      </h1>

      <div style={{ marginBottom: '2rem' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 500,
            color: '#334155',
          }}
        >
          Default Country Code
        </label>
        <input
          type="text"
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #cbd5e1',
            borderRadius: '0.375rem',
            fontSize: '1rem',
            boxSizing: 'border-box',
          }}
          placeholder="+91"
        />
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>
          Used to normalize phone numbers without country code (e.g., 9876543210 → +919876543210)
        </p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 500,
            color: '#334155',
          }}
        >
          Export Format
        </label>
        <select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #cbd5e1',
            borderRadius: '0.375rem',
            fontSize: '1rem',
            boxSizing: 'border-box',
          }}
        >
          <option value="csv">CSV</option>
          <option value="xlsx">Excel</option>
          <option value="json">JSON</option>
        </select>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>
          Format for exporting send results and recipient lists
        </p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 500,
            color: '#334155',
          }}
        >
          Auto-Save Interval (ms)
        </label>
        <input
          type="number"
          value={autoSaveInterval}
          onChange={(e) => setAutoSaveInterval(Number(e.target.value))}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #cbd5e1',
            borderRadius: '0.375rem',
            fontSize: '1rem',
            boxSizing: 'border-box',
          }}
          min="100"
          max="10000"
          step="100"
        />
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>
          How often to save your progress (500ms = 0.5 seconds)
        </p>
      </div>

      {showSaveMessage && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#d1fae5',
            borderLeft: '4px solid #10b981',
            borderRadius: '0.375rem',
            marginBottom: '1.5rem',
            color: '#047857',
            fontSize: '0.95rem',
          }}
        >
          Settings saved (persistence coming soon)
        </div>
      )}

      <button
        onClick={handleSave}
        style={{
          width: '100%',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#4f46e5',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          fontSize: '1rem',
          fontWeight: 500,
          cursor: 'pointer',
          marginBottom: '1rem',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#4338ca';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#4f46e5';
        }}
      >
        Save Settings
      </button>

      <Link
        href="/tools/wa-sender"
        style={{
          display: 'inline-block',
          color: '#4f46e5',
          textDecoration: 'none',
          fontSize: '0.95rem',
          fontWeight: 500,
        }}
      >
        ← Back to Dashboard
      </Link>
    </div>
  );
}
