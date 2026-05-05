# WA Sender Message History & Analytics

## Overview

Message history tracks every send: who it was sent to, when, what was sent, and the delivery status. This provides an audit trail and enables basic analytics.

## Message Log Schema

Stored in Supabase `wa_sender_messages` table:

```sql
CREATE TABLE wa_sender_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES wa_sender_contacts(id),
  recipient_phone VARCHAR(20),
  recipient_email VARCHAR(100),
  content TEXT NOT NULL,
  template_id UUID REFERENCES wa_sender_templates(id),
  channel VARCHAR(20),  -- 'whatsapp', 'email'
  status VARCHAR(20),  -- 'sent', 'failed', 'pending', 'read'
  sent_at TIMESTAMP NOT NULL,
  read_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_wa_messages_user ON wa_sender_messages(user_id);
CREATE INDEX idx_wa_messages_contact ON wa_sender_messages(contact_id);
CREATE INDEX idx_wa_messages_sent_at ON wa_sender_messages(user_id, sent_at);
```

## Message Structure

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "contact_id": "uuid",
  "recipient_phone": "+1-555-123-4567",
  "recipient_email": "alice@company.com",
  "content": "Hi Alice, we have a special offer for TechCorp. Use code SAVE20 for 20% off.",
  "template_id": "uuid",
  "channel": "whatsapp",
  "status": "sent",
  "sent_at": "2026-05-04T10:30:00Z",
  "read_at": null,
  "error_message": null,
  "created_at": "2026-05-04T10:30:00Z",
  "updated_at": "2026-05-04T10:30:00Z"
}
```

## Status Values

- `pending` — Enqueued, not yet sent
- `sent` — Successfully sent via WhatsApp Web / Gmail
- `failed` — Send failed (connection error, recipient unavailable, etc)
- `read` — Message was read by recipient (WhatsApp only, manual tracking)

## API Endpoints

### GET /api/wa-sender/messages

List message history with pagination and filtering.

**Query params:**
- `page` (default: 1)
- `limit` (default: 50, max: 500)
- `status` (optional) — filter by status: sent | failed | pending | read
- `channel` (optional) — filter by: whatsapp | email
- `start_date` (optional) — ISO timestamp, messages sent after this date
- `end_date` (optional) — ISO timestamp, messages sent before this date
- `template_id` (optional) — filter by template
- `search` (optional) — search recipient name/phone/email

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "recipient_name": "Alice Johnson",
      "recipient_phone": "+1-555-123-4567",
      "recipient_email": "alice@company.com",
      "template_name": "Weekly Promo",
      "channel": "whatsapp",
      "status": "sent",
      "sent_at": "2026-05-04T10:30:00Z",
      "read_at": null
    }
  ],
  "total": 1500,
  "page": 1,
  "limit": 50,
  "stats": {
    "sent_count": 1200,
    "failed_count": 150,
    "pending_count": 50,
    "read_count": 300
  }
}
```

### POST /api/wa-sender/messages

Log a message send during the send workflow.

**Request:**
```json
{
  "contact_id": "uuid",
  "recipient_phone": "+1-555-123-4567",
  "recipient_email": "alice@company.com",
  "content": "Hi Alice, ...",
  "template_id": "uuid",
  "channel": "whatsapp",
  "status": "sent",
  "sent_at": "2026-05-04T10:30:00Z"
}
```

**Validation:**
- Either contact_id or (recipient_phone or recipient_email) required
- content required, max 10000 chars (covers long messages)
- channel required: whatsapp | email
- status required: pending | sent | failed

**Response (201):**
```json
{
  "id": "uuid",
  "contact_id": "uuid",
  "channel": "whatsapp",
  "status": "sent",
  "sent_at": "2026-05-04T10:30:00Z"
}
```

### GET /api/wa-sender/messages/:id

Fetch a single message by ID.

**Response (200):** Full message object

### PUT /api/wa-sender/messages/:id

Update message status (e.g., mark as read).

**Request:**
```json
{
  "status": "read",
  "read_at": "2026-05-04T10:35:00Z"
}
```

**Validation:**
- status and read_at only updatable fields
- read_at required if status is "read"

**Response (200):** Updated message object

## UI: Send History Page

Located at `app/tools/wa-sender/messages/page.tsx`

### Features

1. **Message List** — Paginated table with filtering
   - Columns: recipient (name or phone), channel, status, sent_at, actions
   - Filter by: status, channel, date range, template
   - Search by: recipient name/phone/email
   - Sort by: sent_at (default desc), status, channel
   - Row click: expand to show full message content

2. **Analytics Summary** (top of page)
   - Cards showing:
     - Total sent (this session or all-time)
     - Failed count + % failure rate
     - Read count (if tracking)
     - Average send time (if bulk send)

3. **Export** — Download filtered results as CSV
   - Includes: recipient, channel, status, sent_at, read_at, content

4. **Message Detail Modal** — Click row to view
   - Full message content
   - Recipient details (if contact_id exists)
   - Template used (if template_id exists)
   - Timestamps: sent_at, read_at
   - Status with error message if failed

### Workflow Integration

During the send process in Dashboard, each successful send:
1. Calls POST /api/wa-sender/messages to log
2. On error, sets status to "failed" with error_message
3. User can review failed sends in the Messages tab
4. Option to retry failed sends or manually resend

## Analytics Calculations

Available on the Messages page:

```
Total Sent: COUNT(*) WHERE status IN ('sent', 'read')
Failure Rate: COUNT(*) WHERE status = 'failed' / TOTAL
Read Rate: COUNT(*) WHERE status = 'read' / TOTAL
Success Rate: 100% - Failure Rate

Average Message Length: AVG(LENGTH(content))
Peak Send Time: HOUR with most sends
Template Usage: COUNT(*) GROUP BY template_id
```

These are calculated server-side in the GET /api/wa-sender/messages endpoint (stats field).

## Security & Permissions

### RLS Policies

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

### Payload Validation

- Max content length: 10,000 chars
- Max error_message: 500 chars
- Phone/email validation: must be valid format or null

## Message Lifecycle

### Send Flow

1. **Dashboard workflow**: User uploads file, selects template, reviews recipients, clicks "Send"
2. **Per recipient**:
   - Create message record with status "pending"
   - Attempt send (wa.me link or Gmail compose)
   - On success: update status to "sent"
   - On error: update status to "failed", set error_message
3. **After bulk send**:
   - Display summary: X sent, Y failed
   - User can view failures in Messages tab

### Retry Flow

1. User navigates to Messages tab
2. Filters by status: "failed"
3. Selects message(s)
4. Clicks "Retry"
5. Attempts resend
6. Updates status to "sent" on success or keeps "failed" on error

## Limitations & Assumptions

- **WhatsApp Web**: Status tracking is client-initiated. No automated webhook. User must manually mark as "read" if desired. "Sent" status only means the link was generated; delivery is not confirmed.
- **Gmail**: No delivery confirmation either. "Sent" status means the compose window was opened.
- **No push notifications**: History is passive, reviewed in Messages tab.

Future enhancements (Phase 3):
- WhatsApp Business API integration for real delivery status
- Webhook support for automated status updates
- Real-time notifications on delivery failures

## Implementation Notes

- Message logging happens AFTER user confirms send (not before)
- Bulk sends log all messages in the same second (sent_at is the same for all)
- Date range filters use UTC timestamps (convert FE timezone to UTC)
- Search is case-insensitive across name, phone, email
- Export excludes user_id and error details for privacy
