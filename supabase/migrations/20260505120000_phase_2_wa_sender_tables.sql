-- Phase 2: WA Sender Templates, Contacts, Messages, Imports
-- Migration: Add tables for message templates, contact management, send history, and import tracking

-- Table 1: wa_sender_imports (no FK dependencies except auth.users)
CREATE TABLE IF NOT EXISTS wa_sender_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name VARCHAR(255),
  total_rows INT NOT NULL,
  imported_count INT NOT NULL,
  duplicate_count INT NOT NULL,
  error_count INT NOT NULL,
  error_summary JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wa_imports_user ON wa_sender_imports(user_id);

ALTER TABLE wa_sender_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own imports" ON wa_sender_imports
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users can create imports" ON wa_sender_imports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Table 2: wa_sender_templates
CREATE TABLE IF NOT EXISTS wa_sender_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50),
  variables JSON,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT unique_user_template UNIQUE(user_id, name),
  CONSTRAINT check_name_length CHECK (LENGTH(name) > 0 AND LENGTH(name) <= 100),
  CONSTRAINT check_content_length CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 1000)
);

CREATE INDEX IF NOT EXISTS idx_wa_templates_user ON wa_sender_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_wa_templates_category ON wa_sender_templates(user_id, category);

ALTER TABLE wa_sender_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own templates" ON wa_sender_templates
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users can insert own templates" ON wa_sender_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can update own templates" ON wa_sender_templates
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users can delete own templates" ON wa_sender_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Table 3: wa_sender_contacts (depends on wa_sender_imports)
CREATE TABLE IF NOT EXISTS wa_sender_contacts (
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

CREATE INDEX IF NOT EXISTS idx_wa_contacts_user ON wa_sender_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_wa_contacts_phone ON wa_sender_contacts(user_id, phone);
CREATE INDEX IF NOT EXISTS idx_wa_contacts_email ON wa_sender_contacts(user_id, email);
CREATE INDEX IF NOT EXISTS idx_wa_contacts_import ON wa_sender_contacts(import_session_id);

ALTER TABLE wa_sender_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own contacts" ON wa_sender_contacts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users can insert own contacts" ON wa_sender_contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can update own contacts" ON wa_sender_contacts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users can delete own contacts" ON wa_sender_contacts
  FOR DELETE USING (auth.uid() = user_id);

-- Table 4: wa_sender_messages (depends on wa_sender_contacts and wa_sender_templates)
CREATE TABLE IF NOT EXISTS wa_sender_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES wa_sender_contacts(id) ON DELETE SET NULL,
  recipient_phone VARCHAR(20),
  recipient_email VARCHAR(100),
  content TEXT NOT NULL,
  template_id UUID REFERENCES wa_sender_templates(id) ON DELETE SET NULL,
  channel VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  sent_at TIMESTAMP NOT NULL,
  read_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  CONSTRAINT check_channel CHECK (channel IN ('whatsapp', 'email')),
  CONSTRAINT check_status CHECK (status IN ('sent', 'failed', 'pending', 'read')),
  CONSTRAINT check_content_length CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 10000)
);

CREATE INDEX IF NOT EXISTS idx_wa_messages_user ON wa_sender_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_wa_messages_contact ON wa_sender_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_wa_messages_sent_at ON wa_sender_messages(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_wa_messages_status ON wa_sender_messages(user_id, status);
CREATE INDEX IF NOT EXISTS idx_wa_messages_template ON wa_sender_messages(template_id);

ALTER TABLE wa_sender_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own messages" ON wa_sender_messages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users can insert own messages" ON wa_sender_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can update own messages" ON wa_sender_messages
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users can delete own messages" ON wa_sender_messages
  FOR DELETE USING (auth.uid() = user_id);

-- Table 5: user_preferences (Phase 2+)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  default_country_code VARCHAR(2),
  auto_detect_columns JSONB,
  export_format VARCHAR(10),
  session_autosave_interval_ms INT DEFAULT 500,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users can create preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users can delete own preferences" ON user_preferences
  FOR DELETE USING (auth.uid() = user_id);
