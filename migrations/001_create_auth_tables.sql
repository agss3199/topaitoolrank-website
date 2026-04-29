-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  requires_approval BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wa_sender_sessions table
CREATE TABLE IF NOT EXISTS public.wa_sender_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sheet_data JSONB,
  send_mode TEXT DEFAULT 'whatsapp',
  country_code TEXT DEFAULT '+1',
  message_template TEXT,
  current_sheet_name TEXT,
  current_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_sender_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read their own user record"
ON public.users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own user record"
ON public.users FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for wa_sender_sessions table
CREATE POLICY "Users can read their own sessions"
ON public.wa_sender_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
ON public.wa_sender_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
ON public.wa_sender_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
ON public.wa_sender_sessions FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_requires_approval ON public.users(requires_approval);
CREATE INDEX idx_wa_sender_sessions_user_id ON public.wa_sender_sessions(user_id);
CREATE INDEX idx_wa_sender_sessions_updated_at ON public.wa_sender_sessions(updated_at DESC);

-- Function to auto-insert user into public.users when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, requires_approval)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    TRUE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.handle_new_user();
