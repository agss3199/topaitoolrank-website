# Database Schema

## Overview

Supabase PostgreSQL database with Row Level Security (RLS) policies for multi-user safety. This spec documents all tables, relationships, and security policies.

## Phase 1 Tables (Existing)

### auth.users (Managed by Supabase)

User accounts managed by Supabase Auth.

```sql
id UUID PRIMARY KEY
email VARCHAR(255) UNIQUE NOT NULL
created_at TIMESTAMP
updated_at TIMESTAMP
```

### wa_sender_sessions

User's current send workflow state (Phase 1).

```sql
CREATE TABLE wa_sender_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_data JSONB,  -- Parsed Excel data
  columns JSONB,  -- ["Name", "Phone", "Email", "Company"]
  numbers JSONB,  -- Normalized phone numbers
  message_content TEXT,
  sent_status JSONB,  -- {"alice@company.com": "sent", "bob@company.com": "pending"}
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT check_user_id CHECK (user_id IS NOT NULL)
);

CREATE INDEX idx_wa_sessions_user ON wa_sender_sessions(user_id);
```

RLS Policy:
```sql
CREATE POLICY "users can read own sessions" ON wa_sender_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users can update own sessions" ON wa_sender_sessions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users can delete own sessions" ON wa_sender_sessions
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "users can insert own sessions" ON wa_sender_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Phase 2 Tables (New)

### wa_sender_templates

Message templates with variable placeholders.

```sql
CREATE TABLE wa_sender_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50),
  variables JSON,  -- Extracted at save time
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT unique_user_template UNIQUE(user_id, name),
  CONSTRAINT check_name_length CHECK (LENGTH(name) > 0 AND LENGTH(name) <= 100),
  CONSTRAINT check_content_length CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 1000)
);

CREATE INDEX idx_wa_templates_user ON wa_sender_templates(user_id);
CREATE INDEX idx_wa_templates_category ON wa_sender_templates(user_id, category);
```

RLS Policies:
```sql
CREATE POLICY "users can read own templates" ON wa_sender_templates
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users can insert own templates" ON wa_sender_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can update own templates" ON wa_sender_templates
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users can delete own templates" ON wa_sender_templates
  FOR DELETE USING (auth.uid() = user_id);
```

### wa_sender_contacts

Persistent contact database.

```sql
CREATE TABLE wa_sender_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  company VARCHAR(100),
  custom_fields JSONB,
  import_session_id UUID REFERENCES wa_sender_imports(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT check_phone_or_email CHECK (phone IS NOT NULL OR email IS NOT NULL)
);

CREATE INDEX idx_wa_contacts_user ON wa_sender_contacts(user_id);
CREATE INDEX idx_wa_contacts_phone ON wa_sender_contacts(user_id, phone);
CREATE INDEX idx_wa_contacts_email ON wa_sender_contacts(user_id, email);
CREATE INDEX idx_wa_contacts_import ON wa_sender_contacts(import_session_id);
```

RLS Policies:
```sql
CREATE POLICY "users can read own contacts" ON wa_sender_contacts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users can insert own contacts" ON wa_sender_contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can update own contacts" ON wa_sender_contacts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users can delete own contacts" ON wa_sender_contacts
  FOR DELETE USING (auth.uid() = user_id);
```

### wa_sender_messages

Send history and message log.

```sql
CREATE TABLE wa_sender_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES wa_sender_contacts(id) ON DELETE SET NULL,
  recipient_phone VARCHAR(20),
  recipient_email VARCHAR(100),
  content TEXT NOT NULL,
  template_id UUID REFERENCES wa_sender_templates(id) ON DELETE SET NULL,
  channel VARCHAR(20) NOT NULL,  -- 'whatsapp', 'email'
  status VARCHAR(20) NOT NULL,  -- 'sent', 'failed', 'pending', 'read'
  sent_at TIMESTAMP NOT NULL,
  read_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT check_channel CHECK (channel IN ('whatsapp', 'email')),
  CONSTRAINT check_status CHECK (status IN ('sent', 'failed', 'pending', 'read')),
  CONSTRAINT check_content_length CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 10000)
);

CREATE INDEX idx_wa_messages_user ON wa_sender_messages(user_id);
CREATE INDEX idx_wa_messages_contact ON wa_sender_messages(contact_id);
CREATE INDEX idx_wa_messages_sent_at ON wa_sender_messages(user_id, sent_at DESC);
CREATE INDEX idx_wa_messages_status ON wa_sender_messages(user_id, status);
CREATE INDEX idx_wa_messages_template ON wa_sender_messages(template_id);
```

RLS Policies:
```sql
CREATE POLICY "users can read own messages" ON wa_sender_messages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users can insert own messages" ON wa_sender_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can update own messages" ON wa_sender_messages
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users can delete own messages" ON wa_sender_messages
  FOR DELETE USING (auth.uid() = user_id);
```

### wa_sender_imports

Import session metadata for contact rollback tracking.

```sql
CREATE TABLE wa_sender_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name VARCHAR(255),
  total_rows INT NOT NULL,
  imported_count INT NOT NULL,
  duplicate_count INT NOT NULL,
  error_count INT NOT NULL,
  error_summary JSONB,  -- [{"row": 5, "error": "Invalid email"}]
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_wa_imports_user ON wa_sender_imports(user_id);
```

RLS Policies:
```sql
CREATE POLICY "users can read own imports" ON wa_sender_imports
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users can create imports" ON wa_sender_imports
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## User Preferences (Optional, Phase 2+)

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  default_country_code VARCHAR(2),
  auto_detect_columns JSONB,  -- {"phone": ["contains", "phone"], ...}
  export_format VARCHAR(10),  -- 'csv' or 'xlsx'
  session_autosave_interval_ms INT DEFAULT 500,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

RLS Policies:
```sql
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users can create preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users can delete own preferences" ON user_preferences
  FOR DELETE USING (auth.uid() = user_id);
```

## Migration Strategy

All new tables are created in a single migration to maintain consistency.

**File**: `supabase/migrations/[timestamp]_phase_2_wa_sender_tables.sql`

```sql
-- Phase 2: WA Sender Templates, Contacts, Messages
-- Migration: Add tables for message templates, contacts, send history

-- Enable RLS
ALTER TABLE wa_sender_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_sender_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_sender_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_sender_imports ENABLE ROW LEVEL SECURITY;

-- Create all tables (SQL statements above)
-- Create all indexes (SQL statements above)
-- Create all RLS policies (SQL statements above)
```

Run migrations:
```bash
supabase migration up
```

## Data Integrity

### Constraints

- **Referential integrity**: Foreign keys to auth.users with ON DELETE CASCADE
- **Check constraints**: Status values, channel values, length limits
- **Unique constraints**: Template names per user, contact phone/email per user
- **NOT NULL constraints**: user_id, essential fields

### Indexing Strategy

All tables indexed on `user_id` (query filter in RLS policies).
Additional indexes on foreign keys and sort fields:
- `sent_at DESC` for messages (common sort)
- `phone` + `email` for contacts (common filters)
- `category` for templates (optional filter)

## Security Considerations

### Row Level Security (RLS)

All tables have RLS enabled. Every SELECT/INSERT/UPDATE/DELETE is filtered by `auth.uid()`.

**No user can:**
- Read another user's data
- Modify another user's data
- Bypass auth checks (enforced at database level)

### Audit Logging (Optional, Phase 3)

Future enhancement:
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  table_name VARCHAR(50),
  operation VARCHAR(10),  -- INSERT, UPDATE, DELETE
  changed_fields JSONB,
  created_at TIMESTAMP DEFAULT now()
);
```

Would trigger on every DML operation via Postgres triggers.

## Performance Considerations

- Indexes on `user_id` cover most queries (filtered by RLS)
- `sent_at DESC` index enables efficient chronological queries
- JSONB columns for flexible custom fields (templates, contacts)
- No full-text search needed (client-side fuzzy search via Fuse.js)

## Backup & Recovery

Supabase handles:
- Daily automated backups
- Point-in-time recovery (up to 7 days)
- Replication to standby (automatic failover)

No application-level backup logic needed.
