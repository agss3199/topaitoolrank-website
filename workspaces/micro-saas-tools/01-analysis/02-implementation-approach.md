# Implementation Approach: Link-in-Message Media Support for wa-sender

**Date**: 2026-05-08  
**Scope**: Phase 1 media attachment feature  
**Complexity**: Moderate (3 implementation shards, ~1-2 autonomous sessions)

---

## Architecture Overview

### Current Flow (Text Only)
```
User selects contact & types message
  ↓
Clicks "Open WhatsApp"
  ↓
window.open(`https://wa.me/${phone}?text=${encoded}`)
  ↓
WhatsApp Web opens with pre-filled message
  ↓
User clicks "Send" in WhatsApp
  ↓
Message logged to history via POST /api/wa-sender/messages
```

### Proposed Flow (With Media)
```
User selects contact & types message
  ↓
User selects image/PDF via file picker
  ↓
File uploads to Supabase Storage
  ↓
Public URL returned
  ↓
URL appended to message text (auto or via template variable)
  ↓
User clicks "Open WhatsApp"
  ↓
wa.me opens with message + URL
  ↓
User sends in WhatsApp
  ↓
Message + media metadata logged to history
```

---

## Data Model Changes

### Add Fields to `WASenderMessage`

**File**: `app/lib/types/wa-sender.ts`

```typescript
interface WASenderMessage {
  // ... existing fields ...
  id: string;
  user_id: string;
  contact_id?: string;
  recipient_phone?: string;
  recipient_email?: string;
  content: string;
  template_id?: string;
  channel: 'whatsapp' | 'email';
  status: 'sent' | 'failed' | 'pending' | 'read';
  sent_at: string;
  read_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;

  // NEW: Media fields
  media_url?: string;           // "https://supabase.../storage/.../<filename>"
  media_type?: string;          // "image/jpeg", "application/pdf", etc.
  media_filename?: string;      // Original filename for download
  media_size_bytes?: number;    // Size in bytes for quota tracking
}
```

### Add Fields to `CreateMessageInput`

**File**: `app/lib/db/wa-sender.ts`

```typescript
interface CreateMessageInput {
  user_id: string;
  recipient_phone?: string;
  recipient_email?: string;
  content: string;
  template_id?: string;
  channel: 'whatsapp' | 'email';

  // NEW: Media fields
  media_url?: string;
  media_type?: string;
  media_filename?: string;
  media_size_bytes?: number;
}
```

### Database Migration

**Supabase SQL**:
```sql
ALTER TABLE wa_sender_messages
ADD COLUMN media_url TEXT,
ADD COLUMN media_type TEXT,
ADD COLUMN media_filename TEXT,
ADD COLUMN media_size_bytes INTEGER;

CREATE INDEX idx_wa_messages_user_media ON wa_sender_messages(user_id, media_url) 
WHERE media_url IS NOT NULL;
```

**No breaking changes** — all columns are nullable, backward-compatible with existing rows.

---

## Implementation Shards

### Shard 1: Upload Infrastructure (Supabase Storage + API Route)

**Objective**: File upload endpoint with validation and storage

**Files to create/modify**:
1. **Create `app/api/wa-sender/media/upload/route.ts`** — POST handler
2. **Modify `lib/supabase.ts`** — Add storage bucket initialization (if needed)

**Contract: POST /api/wa-sender/media/upload**

Request:
```typescript
{
  "file": File,  // binary file from multipart form
  "user_id": string  // from session/auth
}
```

Response (success):
```json
{
  "url": "https://..../storage/v1/object/public/wa-media/user-xxx/image-123.jpg",
  "filename": "image-123.jpg",
  "type": "image/jpeg",
  "size_bytes": 245891,
  "expires_at": "2026-06-08T21:30:00Z"  // 30 days
}
```

Response (error):
```json
{
  "error": "File size exceeds 5MB limit",
  "code": "FILE_TOO_LARGE"
}
```

**Validation rules**:
- **Auth**: Must be authenticated (session required)
- **File type**: Only JPEG, PNG, GIF, WebP for images; PDF for documents
- **File size**: Max 5MB for images, 10MB for PDFs
- **MIME validation**: Server-side check (content-type header + magic bytes)
- **Filename sanitization**: Remove special characters, prevent directory traversal

**Implementation details**:
- Read multipart form data via `formidable` or `busboy` (or use Next.js built-in form parsing)
- Validate MIME type by reading magic bytes (not just file extension)
- Store in Supabase Storage under path: `wa-media/{user_id}/{uuid}-{filename}`
- Generate signed public URL (no expiry for now, or 30-day TTL via signed URL)
- Return URL, filename, type, and size to client
- Log upload event for quota tracking

**Error handling**:
- 400: Invalid file type, file too large, missing body
- 401: Not authenticated
- 413: Payload too large (request body limit)
- 500: Storage write error (Supabase down, quota exceeded)

**Session state**: No client-side storage needed; URL is used immediately in next step.

---

### Shard 2: File Upload UI + Message Composition

**Objective**: Frontend components for file selection, preview, and message text integration

**Files to create/modify**:
1. **Create `app/tools/wa-sender/components/FileUploadArea.tsx`** — File picker + preview
2. **Modify `app/tools/wa-sender/page.tsx`** — Wire upload button, URL insertion, send flow

**FileUploadArea Component**:

```tsx
// Props
interface FileUploadAreaProps {
  onUploadStart: () => void;
  onUploadComplete: (url: string, metadata: FileMetadata) => void;
  onUploadError: (error: string) => void;
  maxSize: number;  // bytes
  acceptedTypes: string[];  // MIME types
}

// State
{
  selectedFile: File | null,
  uploadProgress: number,  // 0-100
  isUploading: boolean,
  uploadedUrl: string | null,
  metadata: FileMetadata | null,
  error: string | null
}

// UI Elements
- Drag-drop zone or file input button
- File preview (thumbnail for images, icon for PDFs)
- Upload progress bar
- File metadata (filename, size, page count for PDFs)
- "Remove" / "Replace" buttons
- "Copy Link" button (copy URL to clipboard)
```

**Integration with message composition**:
- File URL is NOT auto-inserted into textarea
- Instead, a "Copy Link" button copies the URL to clipboard
- Template variable `{attachment_url}` can reference the uploaded file
- On send, if attachment exists but message doesn't mention the URL, warn user: "File uploaded but URL not included in message. Include the link or click 'Copy' to add it."

**Modified message send flow**:

```typescript
// Current code at page.tsx line 680
const openWhatsApp = async (current: Contact) => {
  const message = inputValue;  // text from textarea
  const encoded = encodeURIComponent(message);
  
  // NEW: Append media URL if present and not in message
  if (uploadedUrl && !message.includes(uploadedUrl)) {
    const finalMessage = message + '\n' + uploadedUrl;
    // Log with media metadata
    await logMessage({
      ...current,
      content: finalMessage,
      media_url: uploadedUrl,
      media_type: metadata.type,
      media_filename: metadata.filename,
      media_size_bytes: metadata.size
    });
  } else {
    await logMessage({
      ...current,
      content: message
    });
  }
  
  window.open(`https://wa.me/${encoded}?text=${finalEncoded}`, '_blank');
};
```

**Error handling**:
- Network error during upload → show retry button
- File validation error → show specific error message
- Storage quota exceeded → warn user and suggest cleanup
- Upload timeout → cancel and allow re-try

---

### Shard 3: Data Persistence & History Logging

**Objective**: Store media metadata and log to message history

**Files to modify**:
1. **Modify `app/lib/db/wa-sender.ts`** — `createMessage()` to accept media fields
2. **Modify `app/api/wa-sender/messages/route.ts`** — POST handler to persist media metadata
3. **Modify `app/tools/wa-sender/page.tsx`** — Pass media fields to `logMessage()`

**Database helpers**:

```typescript
// In app/lib/db/wa-sender.ts

export async function createMessage(input: CreateMessageInput): Promise<WASenderMessage> {
  const { data, error } = await supabase
    .from('wa_sender_messages')
    .insert({
      user_id: input.user_id,
      recipient_phone: input.recipient_phone,
      recipient_email: input.recipient_email,
      content: input.content,
      template_id: input.template_id,
      channel: input.channel,
      status: 'sent',
      sent_at: new Date().toISOString(),
      
      // NEW: Media metadata
      media_url: input.media_url,
      media_type: input.media_type,
      media_filename: input.media_filename,
      media_size_bytes: input.media_size_bytes
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as WASenderMessage;
}

// NEW: Track user storage usage
export async function getUserStorageUsage(user_id: string): Promise<number> {
  const { data, error } = await supabase
    .from('wa_sender_messages')
    .select('media_size_bytes')
    .eq('user_id', user_id)
    .not('media_url', 'is', null);
  
  if (error) throw error;
  return data.reduce((sum, msg) => sum + (msg.media_size_bytes || 0), 0);
}

// NEW: Enforce quota
export async function checkStorageQuota(
  user_id: string,
  newFileSize: number,
  quotaBytes: number = 50 * 1024 * 1024  // 50MB default
): Promise<{ ok: boolean; message?: string }> {
  const used = await getUserStorageUsage(user_id);
  const remaining = quotaBytes - used;
  
  if (newFileSize > remaining) {
    return {
      ok: false,
      message: `Storage quota exceeded. Used: ${used / 1024 / 1024}MB / ${quotaBytes / 1024 / 1024}MB`
    };
  }
  
  return { ok: true };
}
```

**API route changes**:

```typescript
// In app/api/wa-sender/messages/route.ts (POST handler)

export async function POST(request: Request) {
  const body = await request.json();
  
  // NEW: Accept media fields from request body
  const message = await createMessage({
    user_id: body.user_id,
    recipient_phone: body.recipient_phone,
    recipient_email: body.recipient_email,
    content: body.content,
    template_id: body.template_id,
    channel: body.channel,
    
    // NEW
    media_url: body.media_url,
    media_type: body.media_type,
    media_filename: body.media_filename,
    media_size_bytes: body.media_size_bytes
  });
  
  return Response.json({ success: true, message });
}
```

**History page updates**:

When displaying message history, show media metadata:
- Thumbnail for image files (lazy-load)
- PDF icon with filename for documents
- File size in human-readable format (e.g., "2.3 MB")
- Download link to the media URL

---

## Testing Strategy

### Unit Tests (Tier 1)

```typescript
// tests/tools/wa-sender/media-upload.test.ts

describe('Media Upload', () => {
  it('should validate file type', async () => {
    const file = new File(['data'], 'file.exe', { type: 'application/x-msdownload' });
    const error = await validateFile(file);
    expect(error).toContain('Invalid file type');
  });
  
  it('should reject files > 5MB', async () => {
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    const error = await validateFile(largeFile);
    expect(error).toContain('exceeds 5MB');
  });
  
  it('should enforce user quota', async () => {
    await createMessage({ user_id: 'user1', media_size_bytes: 40 * 1024 * 1024 });
    const { ok } = await checkStorageQuota('user1', 20 * 1024 * 1024);
    expect(ok).toBe(false);
  });
});
```

### Integration Tests (Tier 2)

```typescript
// tests/tools/wa-sender/media-integration.test.ts

describe('Media Upload Integration', () => {
  it('should upload file to Supabase Storage', async () => {
    const file = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
    const response = await POST(createRequest({ file }));
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.url).toContain('supabase.co');
    expect(data.filename).toBe('test.jpg');
  });
  
  it('should persist media metadata to database', async () => {
    const message = await createMessage({
      user_id: 'user1',
      content: 'See attached',
      media_url: 'https://...',
      media_type: 'image/jpeg',
      media_filename: 'photo.jpg',
      media_size_bytes: 102400
    });
    
    expect(message.media_url).toBe('https://...');
    expect(message.media_filename).toBe('photo.jpg');
  });
  
  it('should append media URL to message text', async () => {
    const url = await uploadFile(file);
    const message = 'Check this out';
    const final = insertMediaUrl(message, url);
    
    expect(final).toContain('Check this out');
    expect(final).toContain(url);
  });
});
```

### End-to-End Tests (Tier 3)

```typescript
// tests/tools/wa-sender/media-e2e.test.ts

describe('Media E2E', () => {
  it('should upload file and send via WhatsApp', async () => {
    // 1. User uploads file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('test.jpg');
    
    // 2. Preview appears
    const preview = await page.locator('[data-testid="file-preview"]');
    await expect(preview).toBeVisible();
    
    // 3. File is uploaded to storage
    const uploadRequest = await page.waitForResponse(
      resp => resp.url().includes('/api/wa-sender/media/upload')
    );
    expect(uploadRequest.status()).toBe(200);
    
    // 4. URL is copied to clipboard
    const copyBtn = await page.locator('[data-testid="copy-link"]');
    await copyBtn.click();
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain('supabase.co');
    
    // 5. Message is sent
    const sendBtn = await page.locator('[data-testid="open-whatsapp"]');
    const newPage = await context.waitForEvent('page');
    expect(newPage.url()).toContain('wa.me');
    expect(newPage.url()).toContain(encodeURIComponent(clipboard));
  });
});
```

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Storage quota exhausted (1GB free) | Medium | High | Per-user quota (50MB), auto-cleanup after 30 days |
| Users upload malware | Low | High | MIME validation, restrict to images/PDFs only |
| File URL guessing exposes private data | Low | High | Use UUID-based paths, consider signed URLs |
| Upload abuse (spam/DOS) | Medium | Medium | Rate limiting on upload endpoint, auth-gated |
| Supabase Storage down | Low | Medium | Graceful error, retry button |
| Large files block message send | Medium | Low | Show progress bar, allow background upload |

---

## Success Criteria

- [ ] User can select image/PDF via file picker
- [ ] File preview displays after upload
- [ ] Uploaded file accessible via public URL
- [ ] File URL appends to message text automatically or via template variable
- [ ] Message history displays media metadata (filename, size, thumbnail)
- [ ] Server-side validation rejects invalid files and oversized uploads
- [ ] Per-user storage quota enforced; warning at 80%
- [ ] Download link in history page
- [ ] No regression to text-only messaging
- [ ] Tests pass (Tier 1, 2, 3)

---

## Deployment Checklist

- [ ] Supabase Storage bucket `wa-media` created with public read access
- [ ] RLS policy configured: users can only access their own uploaded files
- [ ] Database migration applied: add media columns to `wa_sender_messages`
- [ ] Env var `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` verified
- [ ] Upload API route tested end-to-end
- [ ] FileUploadArea component integrated into page
- [ ] Message logging accepts and persists media metadata
- [ ] History page displays media metadata and download links
- [ ] Tests pass locally and in CI
- [ ] Type checking passes (`tsc --noEmit`)
- [ ] Lint passes (`eslint .`)

