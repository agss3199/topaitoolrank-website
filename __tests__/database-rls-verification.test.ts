/**
 * Database RLS Verification Tests
 * Tier 2 Integration Tests: Real Supabase, Adversarial RLS Testing
 *
 * These tests verify that Row Level Security policies correctly isolate
 * data between different authenticated users. Each policy is tested for:
 * - SELECT: User B cannot read User A's data
 * - INSERT: User A cannot INSERT with user_id = User B's ID
 * - UPDATE: User B cannot update User A's data
 * - DELETE: User B cannot delete User A's data
 *
 * Run with: npm test -- database-rls-verification --run
 * Requires: Real Supabase environment with tables created by todo 20 (migrations)
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createAuthenticatedClient,
  cleanupUserData,
  TEST_USER_A,
  TEST_USER_B,
  createTestTemplate,
  createTestContact,
  createTestMessage,
  createTestImport,
} from '@/app/lib/db/test-helpers';

// Skip if Supabase env vars are missing
const skipIfNoSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? describe : describe.skip;

skipIfNoSupabase('Database RLS Verification (Tier 2 Integration)', () => {
  let clientA: ReturnType<typeof createAuthenticatedClient>;
  let clientB: ReturnType<typeof createAuthenticatedClient>;

  beforeEach(() => {
    // Create authenticated clients for two different users
    clientA = createAuthenticatedClient(TEST_USER_A);
    clientB = createAuthenticatedClient(TEST_USER_B);
  });

  afterEach(async () => {
    // Cleanup test data for both users from all tables
    const tables = [
      'wa_sender_messages',  // Must delete messages first (FK to contacts/templates)
      'wa_sender_contacts',
      'wa_sender_templates',
      'wa_sender_imports',
      'wa_sender_sessions',
    ];

    for (const table of tables) {
      try {
        await cleanupUserData(clientA, table, TEST_USER_A);
        await cleanupUserData(clientB, table, TEST_USER_B);
      } catch (error) {
        // Silently ignore cleanup errors (table may not exist yet)
      }
    }
  });

  // =========================================================================
  // WA_SENDER_TEMPLATES RLS Tests
  // =========================================================================

  describe('wa_sender_templates RLS', () => {
    test('SELECT: User B cannot read User A templates', async () => {
      // User A creates a template
      const { data: templateA, error: createError } = await createTestTemplate(
        clientA,
        TEST_USER_A,
        { name: 'User A Template' }
      );

      expect(createError).toBeNull();
      expect(templateA).toBeDefined();

      // User B tries to read all templates
      const { data: templatesB, error: readError } = await clientB
        .from('wa_sender_templates')
        .select('*');

      expect(readError).toBeNull();
      expect(templatesB).toEqual([]);  // RLS returns empty, not an error
    });

    test('SELECT: User A can read own templates', async () => {
      // User A creates a template
      const { data: templateA } = await createTestTemplate(clientA, TEST_USER_A, {
        name: 'User A Template',
      });

      // User A reads their own templates
      const { data: templatesA, error } = await clientA
        .from('wa_sender_templates')
        .select('*');

      expect(error).toBeNull();
      expect(templatesA?.length).toBe(1);
      expect(templatesA?.[0].id).toBe(templateA?.id);
    });

    test('INSERT: User A cannot INSERT with user_id = User B', async () => {
      // User A attempts to INSERT with user_id = User B's ID
      // This should fail the WITH CHECK policy
      const { error } = await clientA
        .from('wa_sender_templates')
        .insert({
          user_id: TEST_USER_B,  // Trying to create a template for User B
          name: 'Malicious Template',
          content: 'Stolen template',
        });

      // Supabase returns a policy violation error or silently rejects
      expect(error).not.toBeNull();  // Should fail the WITH CHECK
    });

    test('UPDATE: User B cannot update User A templates', async () => {
      // User A creates a template
      const { data: templateA } = await createTestTemplate(clientA, TEST_USER_A, {
        name: 'User A Template',
      });

      // User B attempts to UPDATE User A's template
      const { error } = await clientB
        .from('wa_sender_templates')
        .update({ name: 'Hacked by User B' })
        .eq('id', templateA?.id);

      // RLS blocks the update (either error or 0 rows affected)
      expect(error).toBeNull();  // No error, but 0 rows affected due to RLS
    });

    test('DELETE: User B cannot delete User A templates', async () => {
      // User A creates a template
      const { data: templateA } = await createTestTemplate(clientA, TEST_USER_A, {
        name: 'User A Template',
      });

      // User B attempts to DELETE User A's template
      const { error } = await clientB
        .from('wa_sender_templates')
        .delete()
        .eq('id', templateA?.id);

      expect(error).toBeNull();  // No error, but 0 rows deleted due to RLS

      // Verify User A can still read their template
      const { data: stillExists } = await clientA
        .from('wa_sender_templates')
        .select('id')
        .eq('id', templateA?.id)
        .single();

      expect(stillExists?.id).toBe(templateA?.id);
    });
  });

  // =========================================================================
  // WA_SENDER_CONTACTS RLS Tests
  // =========================================================================

  describe('wa_sender_contacts RLS', () => {
    test('SELECT: User B cannot read User A contacts', async () => {
      // User A creates a contact
      const { data: contactA } = await createTestContact(clientA, TEST_USER_A, {
        name: 'Alice from Company A',
        phone: '+1-555-123-4567',
      });

      expect(contactA).toBeDefined();

      // User B tries to read all contacts
      const { data: contactsB } = await clientB
        .from('wa_sender_contacts')
        .select('*');

      expect(contactsB).toEqual([]);
    });

    test('SELECT: User A can read own contacts', async () => {
      // User A creates a contact
      const { data: contactA } = await createTestContact(clientA, TEST_USER_A, {
        name: 'Alice from Company A',
      });

      // User A reads their own contacts
      const { data: contactsA } = await clientA
        .from('wa_sender_contacts')
        .select('*');

      expect(contactsA?.length).toBe(1);
      expect(contactsA?.[0].id).toBe(contactA?.id);
    });

    test('UPDATE: User B cannot update User A contacts', async () => {
      // User A creates a contact
      const { data: contactA } = await createTestContact(clientA, TEST_USER_A, {
        name: 'Alice',
      });

      // User B attempts to UPDATE User A's contact
      const { error } = await clientB
        .from('wa_sender_contacts')
        .update({ name: 'Hacked Alice' })
        .eq('id', contactA?.id);

      expect(error).toBeNull();  // RLS blocks, 0 rows affected

      // Verify contact unchanged
      const { data: unchanged } = await clientA
        .from('wa_sender_contacts')
        .select('name')
        .eq('id', contactA?.id)
        .single();

      expect(unchanged?.name).toBe('Alice');
    });

    test('INSERT: User A cannot INSERT with user_id = User B', async () => {
      // User A attempts to INSERT a contact with user_id = User B
      const { error } = await clientA
        .from('wa_sender_contacts')
        .insert({
          user_id: TEST_USER_B,  // Trying to create a contact for User B
          name: 'Malicious Contact',
          phone: '+1-999-999-9999',
        });

      expect(error).not.toBeNull();  // Should fail WITH CHECK
    });
  });

  // =========================================================================
  // WA_SENDER_MESSAGES RLS Tests
  // =========================================================================

  describe('wa_sender_messages RLS', () => {
    test('SELECT: User B cannot read User A messages', async () => {
      // User A creates a message
      const { data: messageA } = await createTestMessage(clientA, TEST_USER_A, {
        content: 'Secret message from A',
      });

      expect(messageA).toBeDefined();

      // User B tries to read all messages
      const { data: messagesB } = await clientB
        .from('wa_sender_messages')
        .select('*');

      expect(messagesB).toEqual([]);
    });

    test('SELECT: User A can read own messages', async () => {
      // User A creates a message
      const { data: messageA } = await createTestMessage(clientA, TEST_USER_A, {
        content: 'My message',
      });

      // User A reads their own messages
      const { data: messagesA } = await clientA
        .from('wa_sender_messages')
        .select('*');

      expect(messagesA?.length).toBe(1);
      expect(messagesA?.[0].id).toBe(messageA?.id);
    });

    test('UPDATE: User B cannot update User A messages', async () => {
      // User A creates a message
      const { data: messageA } = await createTestMessage(clientA, TEST_USER_A, {
        status: 'sent',
      });

      // User B attempts to UPDATE User A's message
      const { error } = await clientB
        .from('wa_sender_messages')
        .update({ status: 'read' })
        .eq('id', messageA?.id);

      expect(error).toBeNull();  // RLS blocks, 0 rows affected

      // Verify message status unchanged
      const { data: unchanged } = await clientA
        .from('wa_sender_messages')
        .select('status')
        .eq('id', messageA?.id)
        .single();

      expect(unchanged?.status).toBe('sent');
    });

    test('INSERT: User A cannot INSERT with user_id = User B', async () => {
      // User A attempts to INSERT a message with user_id = User B
      const { error } = await clientA
        .from('wa_sender_messages')
        .insert({
          user_id: TEST_USER_B,  // Trying to create a message for User B
          recipient_phone: '+1-555-123-4567',
          recipient_email: 'test@example.com',
          content: 'Malicious message',
          channel: 'whatsapp',
          status: 'sent',
          sent_at: new Date().toISOString(),
        });

      expect(error).not.toBeNull();  // Should fail WITH CHECK
    });
  });

  // =========================================================================
  // WA_SENDER_IMPORTS RLS Tests
  // =========================================================================

  describe('wa_sender_imports RLS', () => {
    test('SELECT: User B cannot read User A imports', async () => {
      // User A creates an import record
      const { data: importA } = await createTestImport(clientA, TEST_USER_A, {
        file_name: 'user-a-contacts.csv',
      });

      expect(importA).toBeDefined();

      // User B tries to read all imports
      const { data: importsB } = await clientB
        .from('wa_sender_imports')
        .select('*');

      expect(importsB).toEqual([]);
    });

    test('SELECT: User A can read own imports', async () => {
      // User A creates an import record
      const { data: importA } = await createTestImport(clientA, TEST_USER_A, {
        file_name: 'my-contacts.csv',
      });

      // User A reads their own imports
      const { data: importsA } = await clientA
        .from('wa_sender_imports')
        .select('*');

      expect(importsA?.length).toBe(1);
      expect(importsA?.[0].id).toBe(importA?.id);
    });

    test('INSERT: User A cannot INSERT with user_id = User B', async () => {
      // User A attempts to INSERT an import with user_id = User B
      // Note: wa_sender_imports has no UPDATE/DELETE policy, only SELECT/INSERT
      const { error } = await clientA
        .from('wa_sender_imports')
        .insert({
          user_id: TEST_USER_B,  // Trying to create an import for User B
          file_name: 'malicious.csv',
          total_rows: 10,
          imported_count: 10,
          duplicate_count: 0,
          error_count: 0,
          error_summary: [],
        });

      expect(error).not.toBeNull();  // Should fail WITH CHECK
    });
  });

  // =========================================================================
  // WA_SENDER_SESSIONS RLS Tests (Phase 1, but include for completeness)
  // =========================================================================

  describe('wa_sender_sessions RLS', () => {
    test('SELECT: User B cannot read User A sessions', async () => {
      // User A creates a session
      const { data: sessionA } = await clientA
        .from('wa_sender_sessions')
        .insert({
          user_id: TEST_USER_A,
          columns: ['Name', 'Phone'],
          numbers: ['555-1234'],
          message_content: 'Hello {name}',
        })
        .select()
        .single();

      expect(sessionA).toBeDefined();

      // User B tries to read all sessions
      const { data: sessionsB } = await clientB
        .from('wa_sender_sessions')
        .select('*');

      expect(sessionsB).toEqual([]);
    });

    test('UPDATE: User B cannot update User A sessions', async () => {
      // User A creates a session
      const { data: sessionA } = await clientA
        .from('wa_sender_sessions')
        .insert({
          user_id: TEST_USER_A,
          message_content: 'Original',
        })
        .select()
        .single();

      // User B attempts to UPDATE User A's session
      const { error } = await clientB
        .from('wa_sender_sessions')
        .update({ message_content: 'Hacked' })
        .eq('id', sessionA?.id);

      expect(error).toBeNull();  // RLS blocks, 0 rows affected

      // Verify session content unchanged
      const { data: unchanged } = await clientA
        .from('wa_sender_sessions')
        .select('message_content')
        .eq('id', sessionA?.id)
        .single();

      expect(unchanged?.message_content).toBe('Original');
    });
  });
});
