-- Add email_subject and email_body fields to wa_sender_sessions table
ALTER TABLE public.wa_sender_sessions
ADD COLUMN email_subject TEXT,
ADD COLUMN email_body TEXT;

-- Create index on updated_at for performance
CREATE INDEX IF NOT EXISTS idx_wa_sender_sessions_updated_at
ON public.wa_sender_sessions(updated_at DESC);
