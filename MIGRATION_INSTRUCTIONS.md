# Database Migration Instructions

Your sheet data is not persisting because the database tables haven't been created yet. Follow these steps to fix this:

## Step 1: Go to Supabase Dashboard

1. Open: https://app.supabase.com
2. Select your project: **tdedjksugbqgkxsrzzjo**
3. Navigate to **SQL Editor** (left sidebar)

## Step 2: Execute Migration 1 (Create Tables)

1. Click **New Query** 
2. Copy and paste the SQL from: `migrations/001_create_auth_tables.sql`
3. Click **Run** (or press Cmd+Enter / Ctrl+Enter)
4. You should see "✓ Success" message

**Expected output:**
- Tables created: `users`, `wa_sender_sessions`
- RLS (Row-Level Security) policies enabled
- Trigger created for new user signup

## Step 3: Execute Migration 2 (Add Email Fields)

1. Click **New Query**
2. Copy and paste the SQL from: `migrations/002_add_email_fields_to_wa_sender_sessions.sql`
3. Click **Run**
4. Verify success

**Expected columns added:**
- `email_subject`
- `email_body`

## Step 4: Execute Migration 3 (Add Sent Status)

1. Click **New Query**
2. Copy and paste the SQL from: `migrations/003_add_sent_status_column.sql`
3. Click **Run**
4. Verify success

**Expected column added:**
- `sent_status` (JSONB)

## Step 5: Verify Tables Were Created

In the left sidebar under **Database**, expand **Tables** and confirm:
- ✅ `public.users`
- ✅ `public.wa_sender_sessions`

Both should have all columns from the migrations.

## Step 6: Test Data Persistence

1. Go to your app: https://topaitoolrank.com/tools/wa-sender
2. Upload a spreadsheet
3. Select a column for phone numbers
4. **Close the browser tab completely**
5. Open a new tab to https://topaitoolrank.com/tools/wa-sender
6. The sheet should be loaded automatically

**If it works:**
- ✅ Data persists on refresh
- ✅ RLS policies are correct
- ✅ API can read/write to the database

## SQL Files Location

All migrations are in the `migrations/` directory:
- `001_create_auth_tables.sql` — Core schema + RLS policies
- `002_add_email_fields_to_wa_sender_sessions.sql` — Email support columns
- `003_add_sent_status_column.sql` — Message tracking

## If You Get Errors

**"Table already exists"**
- This is OK! It means the migration already ran.
- You can continue to the next migration.

**"Permission denied"**
- Make sure you're logged in as the project owner in Supabase.
- Service role key must have full database access.

**"Column already exists"**
- OK! Move to the next migration.

**Other errors:**
- Copy the full error message
- Share it and I can diagnose the issue

## After Migrations Are Complete

Your app will work as intended:
- Sheets persist in the database on page refresh
- 500ms debounce reduces API calls
- Export with sent status works
- Modal layout is fixed

No code changes needed — just database schema.
