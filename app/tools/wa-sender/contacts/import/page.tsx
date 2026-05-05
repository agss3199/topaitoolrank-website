'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import styles from './import.module.css';

interface FilePreviewRow {
  [key: string]: string;
}

interface ColumnMapping {
  [columnIndex: string]: string;
}

interface ImportResult {
  import_session_id: string;
  total_rows: number;
  imported_count: number;
  duplicate_count: number;
  error_count: number;
  error_summary?: Array<{ row: number; error: string }>;
}

const FIELD_NAMES = ['Name', 'Phone', 'Email', 'Company'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function ImportContactsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<FilePreviewRow[]>([]);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [deduplicateEnabled, setDeduplicateEnabled] = useState(true);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect column mapping
  const autoDetectMapping = (columns: string[]) => {
    const mapping: ColumnMapping = {};
    const phoneKeywords = ['phone', 'mobile', 'cell', 'contact'];
    const emailKeywords = ['email', 'mail'];
    const nameKeywords = ['name', 'first name', 'full name'];
    const companyKeywords = ['company', 'organization', 'org'];

    columns.forEach((col, idx) => {
      const lower = col.toLowerCase();
      if (phoneKeywords.some((k) => lower.includes(k))) {
        mapping[idx] = 'Phone';
      } else if (emailKeywords.some((k) => lower.includes(k))) {
        mapping[idx] = 'Email';
      } else if (nameKeywords.some((k) => lower.includes(k))) {
        mapping[idx] = 'Name';
      } else if (companyKeywords.some((k) => lower.includes(k))) {
        mapping[idx] = 'Company';
      } else {
        mapping[idx] = 'Custom';
      }
    });
    return mapping;
  };

  // Handle file selection
  const handleFileSelect = async (selectedFile: File) => {
    setError(null);

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File exceeds 5MB limit. Size: ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    // Validate file type
    const fileName = selectedFile.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
      setError('File must be Excel (.xlsx, .xls) or CSV (.csv)');
      return;
    }

    setFile(selectedFile);

    // Parse and preview
    const buffer = await selectedFile.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    let rows: FilePreviewRow[] = [];
    let columns: string[] = [];

    try {
      if (fileName.endsWith('.csv')) {
        const text = new TextDecoder().decode(uint8Array);
        const lines = text.trim().split('\n');
        columns = lines[0].split(',').map((h) => h.trim());
        for (let i = 1; i < Math.min(6, lines.length); i++) {
          const values = lines[i].split(',').map((v) => v.trim());
          const row: FilePreviewRow = {};
          columns.forEach((col, idx) => {
            row[col] = values[idx] || '';
          });
          rows.push(row);
        }
      } else {
        const workbook = XLSX.read(uint8Array, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const allRows = XLSX.utils.sheet_to_json(worksheet);
        columns = Object.keys(allRows[0] || {});
        rows = allRows.slice(0, 5) as FilePreviewRow[];
      }

      setPreview(rows);
      setPreviewColumns(columns);

      // Auto-detect column mapping
      const mapping = autoDetectMapping(columns);
      setColumnMapping(mapping);
    } catch (err) {
      setError(`Failed to parse file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Handle column mapping change
  const handleMappingChange = (columnIndex: string, fieldName: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [columnIndex]: fieldName,
    }));
  };

  // Check if import is enabled
  const isImportEnabled = () => {
    if (!file || preview.length === 0) return false;

    const hasPhone = Object.values(columnMapping).includes('Phone');
    const hasEmail = Object.values(columnMapping).includes('Email');
    return hasPhone || hasEmail;
  };

  // Simulate progress
  const simulateProgress = async () => {
    for (let i = 0; i < 90; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setProgress(i);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);
    setResult(null);

    // Start progress simulation
    simulateProgress();

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('column_mapping', JSON.stringify(columnMapping));
      formData.append('deduplicate', String(deduplicateEnabled));

      const response = await fetch('/api/wa-sender/contacts/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Import failed: ${response.statusText}`);
      }

      const importResult: ImportResult = await response.json();
      setProgress(100);
      setResult(importResult);
      setFile(null);
      setPreview([]);
      setPreviewColumns([]);
      setColumnMapping({});
    } catch (err) {
      setError(`Import error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Import Contacts</h1>
        <Link href="/tools/wa-sender/contacts" className={styles.backLink}>
          ← Back to Contacts
        </Link>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {!result ? (
        <>
          {/* File Upload Section */}
          <div className={styles.uploadSection}>
            <h2>1. Upload File</h2>
            <div
              className={styles.dropZone}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className={styles.dropZoneContent}>
                <p>Drag and drop your Excel or CSV file here</p>
                <p className={styles.orText}>or</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={styles.browseButton}
                >
                  Browse Files
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                hidden
              />
            </div>
            {file && <p className={styles.fileInfo}>📄 {file.name}</p>}
          </div>

          {/* File Preview Section */}
          {preview.length > 0 && (
            <div className={styles.previewSection}>
              <h2>2. Preview & Map Columns</h2>

              <div className={styles.previewTable}>
                <table>
                  <thead>
                    <tr>
                      {previewColumns.map((col, idx) => (
                        <th key={idx}>
                          <div className={styles.columnHeader}>
                            <span className={styles.columnName}>{col}</span>
                            <select
                              value={columnMapping[idx] || ''}
                              onChange={(e) => handleMappingChange(String(idx), e.target.value)}
                              className={styles.mappingSelect}
                            >
                              <option value="">-- Not mapped --</option>
                              {FIELD_NAMES.map((field) => (
                                <option key={field} value={field}>
                                  {field}
                                </option>
                              ))}
                              <option value="Custom">Custom Field</option>
                            </select>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        {previewColumns.map((col, colIdx) => (
                          <td key={`${rowIdx}-${colIdx}`}>{row[col]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Deduplication Toggle */}
          {preview.length > 0 && (
            <div className={styles.deduplicationSection}>
              <h2>3. Options</h2>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={deduplicateEnabled}
                  onChange={(e) => setDeduplicateEnabled(e.target.checked)}
                />
                <span>Merge duplicate contacts (by phone)</span>
              </label>
              <p className={styles.tooltip}>
                If enabled, contacts with the same phone number will be merged. Otherwise, duplicates will be created.
              </p>
            </div>
          )}

          {/* Import Button & Progress */}
          {preview.length > 0 && (
            <div className={styles.importSection}>
              <button
                onClick={handleImport}
                disabled={!isImportEnabled() || importing}
                className={styles.importButton}
              >
                {importing ? 'Importing...' : 'Import Contacts'}
              </button>

              {importing && (
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Result Summary */
        <div className={styles.resultSection}>
          <h2>Import Complete</h2>

          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <span className={styles.label}>Total Rows:</span>
              <span className={styles.value}>{result.total_rows}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.label}>Imported:</span>
              <span className={styles.value}>{result.imported_count}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.label}>Duplicates Merged:</span>
              <span className={styles.value}>{result.duplicate_count}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.label}>Errors:</span>
              <span className={`${styles.value} ${result.error_count > 0 ? styles.error : ''}`}>
                {result.error_count}
              </span>
            </div>
          </div>

          {result.error_summary && result.error_summary.length > 0 && (
            <div className={styles.errorTable}>
              <h3>Errors</h3>
              <table>
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {result.error_summary.map((err, idx) => (
                    <tr key={idx}>
                      <td>{err.row}</td>
                      <td>{err.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className={styles.actions}>
            <Link href="/tools/wa-sender/contacts" className={styles.viewButton}>
              View Contacts
            </Link>
            <button
              onClick={() => {
                setResult(null);
                setError(null);
              }}
              className={styles.importAgainButton}
            >
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
