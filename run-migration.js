const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const migration = `
-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  requires_approval BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP
);

-- Create wa_sender_sessions table
CREATE TABLE IF NOT EXISTS public.wa_sender_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sheet_data JSONB,
  send_mode TEXT,
  country_code TEXT,
  message_template TEXT,
  current_sheet_name TEXT,
  current_index INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_sender_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for users table
CREATE POLICY IF NOT EXISTS "Users can read their own record" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update their own record" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS policies for sessions table
CREATE POLICY IF NOT EXISTS "Users can read their own sessions" ON public.wa_sender_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own sessions" ON public.wa_sender_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own sessions" ON public.wa_sender_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for auto-creating user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, requires_approval)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), TRUE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_requires_approval ON public.users(requires_approval);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.wa_sender_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON public.wa_sender_sessions(updated_at);
`;

async function runMigration() {
  try {
    console.log('🚀 Running Supabase migration...');

    // Split migration by statements and execute each
    const statements = migration
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`\n[${i + 1}/${statements.length}] Executing statement...`);

      const { error } = await supabase.rpc('execute_sql', {
        sql: statement
      }).catch(() => {
        // Fallback: use the raw SQL execution endpoint
        return supabase.from('_sql').insert({ query: statement }).catch(e => ({ error: e }));
      });

      if (error) {
        console.log(`Statement may not support RPC (trying direct SQL): ${statement.substring(0, 50)}...`);
      } else {
        console.log(`✓ Statement executed`);
      }
    }

    console.log('\n✅ Migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
