# UX Flow: Media Attachment in WA-Sender

**Date**: 2026-05-08  
**Scope**: User-visible experience for image/PDF upload and send  
**Goal**: Intuitive file attachment workflow matching industry standards

---

## User Journey: "Send Message with Photo"

### Scenario
Sarah wants to send a WhatsApp message to a customer with a product photo attached.

---

### Step 1: File Selection

**Current state**: wa-sender dashboard open, recipient selected, message typed

**User action**: Clicks "Attach File" button

**UI**:
```
┌─────────────────────────────────────────┐
│ Message Template: [Select Template ▼]   │
│                                         │
│ [To: +1234567890]                      │
│                                         │
│ Message:                                │
│ ┌─────────────────────────────────────┐ │
│ │ Hi {name}, check out our new        │ │
│ │ product!                            │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Attach File ▼] [Emoji 😊]             │
│                                         │
│ [Open WhatsApp] [Clear] [Send & Log]  │
└─────────────────────────────────────────┘
```

**Attach File button opens file picker**:
```
┌─────────────────────────────────────────┐
│  Open File                              │
├─────────────────────────────────────────┤
│ Accepted types:                         │
│  - Images: JPEG, PNG, GIF, WebP        │
│  - Documents: PDF                      │
│  - Max size: 5MB (images), 10MB (PDF)  │
│                                         │
│ [📁 Select file from computer]          │
│  OR drag & drop above                  │
└─────────────────────────────────────────┘
```

---

### Step 2: File Upload & Progress

**User action**: Selects `product-photo.jpg` (2.3 MB)

**System action**: Begins upload to Supabase Storage

**UI** (appears below message textarea):
```
┌─────────────────────────────────────────┐
│ 📤 Uploading...                         │
├─────────────────────────────────────────┤
│ product-photo.jpg (2.3 MB)              │
│                                         │
│ ████████████░░░░░░░░░░░░░░ 52%         │
│                                         │
│ [Cancel]                                │
└─────────────────────────────────────────┘
```

**Timeline**: Upload takes 2-5 seconds (depends on file size and network)

---

### Step 3: Preview & Metadata

**System action**: Upload completes, preview renders

**UI** (replaces progress):
```
┌─────────────────────────────────────────┐
│ ✅ File uploaded successfully            │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │  ┌──────────────────────────────┐  │ │
│ │  │                              │  │ │
│ │  │     [PHOTO THUMBNAIL]        │  │ │
│ │  │                              │  │ │
│ │  │  (200px × 133px)             │  │ │
│ │  └──────────────────────────────┘  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ product-photo.jpg                       │
│ 🖼️ Image (JPEG) • 2.3 MB • 4000×2667   │
│                                         │
│ [Copy Link] [Replace] [Remove]         │
│                                         │
│ Expires: 2026-06-08 (30 days)          │
└─────────────────────────────────────────┘
```

**For PDF**: 
```
┌─────────────────────────────────────────┐
│ ✅ File uploaded successfully            │
├─────────────────────────────────────────┤
│                                         │
│ 📄 invoice.pdf                          │
│ Document (PDF) • 1.2 MB • 5 pages       │
│                                         │
│ [Copy Link] [Replace] [Remove]         │
│                                         │
│ Expires: 2026-06-08 (30 days)          │
└─────────────────────────────────────────┘
```

**User note**: File is stored in Supabase with a public URL. User can copy the link and paste it anywhere.

---

### Step 4: Message Composition with File

**Current state**: File uploaded, message ready, file preview visible

**Options**:

#### Option A: Auto-Append (Default)
Message text remains unchanged. File URL is automatically appended when sending:
```
Original message: "Hi {name}, check out our new product!"

Final message sent:
"Hi {name}, check out our new product!
https://project.supabase.co/storage/v1/object/public/wa-media/user-123/product-photo.jpg"
```

**User sees warning** (if applicable):
```
ℹ️  The file URL will be added to the end of your message.
    The recipient can click the link to view the photo.
```

#### Option B: Template Variable
Message includes `{attachment_url}` placeholder:
```
Hi {name}, check out our new product!
{attachment_url}
```

**System substitutes** `{attachment_url}` → the file URL

#### Option C: Manual Copy & Paste
User clicks "Copy Link" button on file preview, manually pastes URL into message:
```
User clicks [Copy Link]
  ↓
Clipboard now contains: "https://project.supabase.co/storage/v1/object/public/wa-media/..."
  ↓
User edits message to: "Here's the photo: [paste URL here]"
  ↓
Message: "Here's the photo: https://..."
```

**All three are supported.** The default (Option A) is simplest; templates (Option B) are for advanced users.

---

### Step 5: Send via WhatsApp

**Current state**: Message ready, file attached, preview visible

**User action**: Clicks "Open WhatsApp"

**System action**:
1. Combines message text + file URL
2. Encodes as URL parameter
3. Opens `wa.me` with pre-filled message

**UI**:
```
┌─────────────────────────────────────────┐
│ [Open WhatsApp] [Clear] [Send & Log]  │
└─────────────────────────────────────────┘
  ↓ User clicks "Open WhatsApp"
  ↓
WhatsApp Web opens in new tab:

┌─────────────────────────────────────────┐
│ WhatsApp Web                            │
├─────────────────────────────────────────┤
│                                         │
│ [Select a chat...]                      │
│                                         │
│ 📋 Message input field (pre-filled):   │
│ "Hi Sarah, check out our new product!  │
│  https://project.supabase.co/..."      │
│                                         │
│ [Send]                                  │
│                                         │
└─────────────────────────────────────────┘
```

**What happens next**:
1. User (Sarah) manually clicks "Send" in WhatsApp
2. Message is delivered to recipient with the file URL
3. Recipient clicks the link to view the photo in browser

---

### Step 6: Message Logging

**System action**: After send (fire-and-forget)

**Backend logs** (to `wa_sender_messages` table):
```json
{
  "id": "msg_abc123",
  "user_id": "user_123",
  "recipient_phone": "+1234567890",
  "content": "Hi Sarah, check out our new product!\nhttps://project.supabase.co/storage/v1/object/public/wa-media/user-123/product-photo.jpg",
  "channel": "whatsapp",
  "status": "sent",
  "sent_at": "2026-05-08T21:30:00Z",
  "media_url": "https://project.supabase.co/storage/v1/object/public/wa-media/user-123/product-photo.jpg",
  "media_type": "image/jpeg",
  "media_filename": "product-photo.jpg",
  "media_size_bytes": 2400000,
  "created_at": "2026-05-08T21:30:00Z"
}
```

---

### Step 7: History View

**User action**: Clicks "History" tab to see sent messages

**UI**:
```
┌─────────────────────────────────────────┐
│ Message History                         │
├─────────────────────────────────────────┤
│                                         │
│ 📄 Sarah Chen (+1234567890)             │
│    2026-05-08 21:30 • WhatsApp ✓        │
│                                         │
│    "Hi Sarah, check out our new..."     │
│                                         │
│    Attachments:                         │
│    ┌──────────────────────────────────┐│
│    │ ┌─────────────────────────────┐ ││
│    │ │                             │ ││
│    │ │    [PHOTO THUMBNAIL]        │ ││
│    │ │                             │ ││
│    │ │  (100px × 67px)             │ ││
│    │ │  product-photo.jpg          │ ││
│    │ │  2.3 MB                     │ ││
│    │ │  [Download] [Preview]       │ ││
│    │ │                             │ ││
│    │ └─────────────────────────────┘ ││
│    └──────────────────────────────────┘│
│                                         │
│ [Edit] [Resend] [Delete]               │
│                                         │
└─────────────────────────────────────────┘
```

**User can**:
- **Download**: Save the file locally
- **Preview**: Open the file in a lightbox or new tab
- **View metadata**: Click file to see size, upload date, expiry

---

## Error Scenarios

### Scenario 1: File Too Large

**User uploads** a 7MB photo

**System response**:
```
❌ File size exceeds limit
   Maximum: 5MB for images
   Your file: 7.2MB
   
   [Try another file]
   [Compress and retry]
   [Learn more about limits]
```

### Scenario 2: Invalid File Type

**User uploads** an `.exe` or `.docx` file

**System response**:
```
❌ File type not supported
   Accepted: JPEG, PNG, GIF, WebP, PDF
   Your file: .exe
   
   [Try another file]
```

### Scenario 3: Storage Quota Exceeded

**User attempts upload** after 80% of quota used

**System warning** (pre-upload):
```
⚠️  Storage quota nearly full
   Used: 40 MB / 50 MB
   Available: 10 MB
   
   Your file: 12 MB
   
   Options:
   [Still upload] [Cancel] [Manage files]
```

**If user proceeds with a file > 10MB**:
```
❌ Storage quota exceeded
   Available: 10 MB
   Your file: 12 MB
   
   Old files are automatically deleted after 30 days.
   
   [View files to delete] [Cancel]
```

### Scenario 4: Upload Timeout

**Upload stalls** (network issue)

**System response** (after 30 seconds):
```
❌ Upload failed (timeout)
   Network error or file too large
   
   [Retry] [Cancel]
```

---

## Accessibility (WCAG 2.1 AA)

- **File picker**: Keyboard accessible (Tab, Enter)
- **Progress bar**: ARIA live region announces progress
- **Errors**: Error messages linked to form fields with `aria-describedby`
- **Preview**: Image alt text: "Uploaded photo: product-photo.jpg"
- **Links**: File download links have descriptive labels: "Download product-photo.jpg (2.3 MB)"

---

## Mobile Responsiveness

**Layout adjusts for small screens**:
- Preview card is full-width on mobile
- Buttons stack vertically if space is tight
- File picker opens native file browser (OS-level, optimized for mobile)
- Thumbnail max-width: 100% of container (scales down gracefully)

---

## Summary

This UX prioritizes:
1. **Simplicity**: One-click file selection, auto-append URL
2. **Feedback**: Progress bar, preview, success/error messages
3. **Control**: Users can copy links manually, edit messages before send
4. **Safety**: Size limits, quota warnings, clear file metadata
5. **Accessibility**: Keyboard nav, ARIA labels, descriptive errors

The flow mirrors common file-sharing patterns (email attachments, Slack file uploads) so users intuitively understand how it works.

