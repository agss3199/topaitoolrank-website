# Supabase Setup Instructions

## Step 1: Run Migration in Supabase SQL Editor

1. Go to https://supabase.com → Login → Select your project
2. Go to **SQL Editor** → **New Query**
3. Copy contents of `migrations/001_create_auth_tables.sql`
4. Paste into SQL editor and click **Run**

This creates:
- `public.users` table (for user info + approval status)
- `public.wa_sender_sessions` table (for sheet data + session state)
- RLS policies (Row Level Security)
- Triggers (auto-insert user into public.users on signup)

## Step 2: Enable Email Provider (Manual)

1. Go to **Authentication** → **Providers**
2. Enable **Email** (should be enabled by default)
3. Set **Email Confirmation** to OFF (for testing; enable for production)

## Step 3: Verify .env

Confirm `.env` has:
```
NEXT_PUBLIC_SUPABASE_URL=https://tdedjksugbqgkxsrzzjo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DISCORD_WEBHOOK_URL=...
```

## Step 4: Install Supabase Package

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

## Step 5: Create Auth Helper

Already created in `lib/supabase.ts`

## Step 6: Deploy

```bash
git add -A && git commit -m "feat: add auth + persistence with Supabase"
git push origin master
vercel deploy --prod --yes
```

## Admin Approval Workflow

1. User signs up with email+password
2. Discord notification sent to you
3. Log in to Supabase → **Table Editor** → `users`
4. Find the user, set `requires_approval = FALSE` and `approved_at = NOW()`
5. User can now log in

## Testing

1. Visit https://topaitoolrank.com/auth/signup
2. Sign up with test email
3. Check Discord for notification
4. Try to log in (should fail with "pending approval")
5. Approve user in Supabase
6. Log in again (should succeed)
