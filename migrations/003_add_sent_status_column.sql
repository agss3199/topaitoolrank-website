-- Add sent_status column to track which messages have been sent
ALTER TABLE public.wa_sender_sessions
ADD COLUMN IF NOT EXISTS sent_status JSONB DEFAULT '{}'::jsonb;
