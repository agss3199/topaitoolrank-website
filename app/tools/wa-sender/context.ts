'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useRef, createElement } from 'react';

// TODO: Replace with imports from app/lib/types/wa-sender.ts once types module exists (todo 20)
// For now, using any with descriptive comments to indicate placeholder status
type WASenderSession = any; // Represents Supabase wa_sender_sessions record
type PhoneNumber = any; // Represents normalized phone number with metadata
type Recipient = any; // Represents parsed recipient (phone or email)
type Template = any; // Represents saved message template
type Contact = any; // Represents saved contact record

export interface WASenderContextType {
  // Session management
  session: WASenderSession | null;
  loadSession: (sessionId: string) => Promise<void>;
  saveSession: () => Promise<void>;

  // Send workflow state
  file: File | null;
  setFile: (file: File | null) => void;
  columns: string[];
  setColumns: (cols: string[]) => void;
  numbers: PhoneNumber[];
  setNumbers: (nums: PhoneNumber[]) => void;
  recipients: Recipient[];
  setRecipients: (recipients: Recipient[]) => void;

  // Selection state (wired in later todos)
  selectedTemplate: Template | null;
  setSelectedTemplate: (template: Template | null) => void;
  selectedContacts: Contact[];
  setSelectedContacts: (contacts: Contact[]) => void;

  // UI state
  loading: boolean;
  error: string | null;
  setError: (err: string | null) => void;
}

/**
 * WASenderContext holds shared state for all WA Sender sub-routes.
 * Initialized as null to require Provider wrapping.
 */
export const WASenderContext = createContext<WASenderContextType | null>(null);

/**
 * useWASender hook provides access to the WASender context.
 * Throws if used outside WASenderProvider.
 */
export function useWASender(): WASenderContextType {
  const ctx = useContext(WASenderContext);
  if (!ctx) {
    throw new Error('useWASender must be used within WASenderProvider');
  }
  return ctx;
}

interface WASenderProviderProps {
  children: ReactNode;
  userId: string | undefined;
}

/**
 * WASenderProvider wraps the WA Sender tool subtree.
 * - Loads session from localStorage on mount (backwards compatibility)
 * - Auto-saves context state to server every 500ms
 * - Maintains all send workflow + selection state
 */
export function WASenderProvider({ children, userId }: WASenderProviderProps): ReactNode {
  // Session state
  const [session, setSession] = useState<WASenderSession | null>(null);

  // Send workflow state
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);

  // Selection state
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-save debounce timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  /**
   * loadSession fetches session data from Supabase by session ID.
   * Called on mount if localStorage contains a session ID.
   */
  const loadSession = async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Call Supabase client directly or via /api/wa-sender/sessions/:id
      // For now, placeholder that will be wired in when Supabase integration is available
      const response = await fetch(`/api/wa-sender/sessions/${sessionId}`);
      if (!response.ok) {
        throw new Error(`Failed to load session: ${response.status}`);
      }
      const data = await response.json();
      setSession(data);
      // Populate context state from loaded session
      if (data.columns) setColumns(data.columns);
      if (data.recipients) setRecipients(data.recipients);
      if (data.numbers) setNumbers(data.numbers);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error loading session';
      setError(message);
      console.error('loadSession error:', message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * saveSession persists the current context state to the server.
   * Called by auto-save debounce (500ms after state change).
   */
  const saveSession = async () => {
    if (!session?.id) {
      // Session not loaded yet; skip save
      return;
    }
    try {
      const payload = {
        columns,
        recipients,
        numbers,
        selectedTemplate,
        selectedContacts,
        // Note: file is not persisted (too large), only metadata
      };
      const response = await fetch(`/api/wa-sender/sessions/${session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`Failed to save session: ${response.status}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error saving session';
      console.error('saveSession error:', message);
      // Do not set error state for auto-save failures (non-critical)
    }
  };

  /**
   * Load session on mount if user has a saved session.
   * Backwards compatibility: localStorage key is `wa-sender-session-${userId}`.
   */
  useEffect(() => {
    if (!userId) return;
    const sessionId = localStorage.getItem(`wa-sender-session-${userId}`);
    if (sessionId) {
      loadSession(sessionId).catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load session');
      });
    }
  }, [userId]);

  /**
   * Auto-save: debounce context changes and save to server every 500ms.
   * Clears pending timer on unmount.
   */
  useEffect(() => {
    // Clear any pending timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer only if session is loaded
    if (session?.id) {
      autoSaveTimerRef.current = setTimeout(() => {
        saveSession();
      }, 500);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [session?.id, columns, recipients, numbers, selectedTemplate, selectedContacts]);

  const value: WASenderContextType = {
    session,
    loadSession,
    saveSession,
    file,
    setFile,
    columns,
    setColumns,
    numbers,
    setNumbers,
    recipients,
    setRecipients,
    selectedTemplate,
    setSelectedTemplate,
    selectedContacts,
    setSelectedContacts,
    loading,
    error,
    setError,
  };

  return createElement(WASenderContext.Provider, { value }, children);
}
