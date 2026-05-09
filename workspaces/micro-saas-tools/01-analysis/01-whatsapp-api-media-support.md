# Research: WhatsApp API Media Support & Current Architecture

**Date**: 2026-05-08  
**Research Focus**: File attachment capabilities and API integration options  
**Status**: COMPLETE

## Critical Finding: Current Architecture Uses wa.me Deep Links, NOT Business API

The wa-sender tool does **NOT** use the WhatsApp Business Cloud API. Instead, it uses `wa.me` deep links:

```typescript
// From app/tools/wa-sender/page.tsx line 675
window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
```

This opens WhatsApp Web or the app with a pre-filled text message. The `WHATSAPP_API_KEY` and `WHATSAPP_BUSINESS_ACCOUNT_ID` declared in `tool.manifest.json` are **never consumed** — these do not exist in `.env` and are never referenced in code.

**Implication**: The `wa.me` protocol supports **text only**. No media parameters exist. No file attachments are possible without switching to the WhatsApp Business Cloud API.

---

## Option 1: WhatsApp Business Cloud API (Full Integration)

### What It Supports

**Supported file types and limits:**
| Type | Format | Max Size | Notes |
|------|--------|----------|-------|
| Images | JPEG, PNG | 5 MB | Inline preview in WhatsApp |
| Documents | PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT | 100 MB | Recipients can download directly |
| Audio | AAC, MP4, MPEG, AMR, OGG | 16 MB | Plays inline |
| Video | MP4, 3GPP | 16 MB | Plays inline |
| Stickers | WebP | 100 KB static, 500 KB animated | Native sticker integration |

### API Contract

**Two-step process:**

1. **Upload media** (get media ID):
```bash
POST https://graph.facebook.com/v21.0/<PHONE_NUMBER_ID>/media
Content-Type: multipart/form-data
Authorization: Bearer <ACCESS_TOKEN>

Body:
  file: <binary file data>
  type: <MIME type>
  messaging_product: whatsapp

Response:
  {
    "id": "123456789"  # Media ID for next step
  }
```

2. **Send message with media**:
```bash
POST https://graph.facebook.com/v21.0/<PHONE_NUMBER_ID>/messages
Authorization: Bearer <ACCESS_TOKEN>

Body:
  {
    "messaging_product": "whatsapp",
    "to": "<RECIPIENT_PHONE>",
    "type": "image",  # or "document", "audio", "video", "sticker"
    "image": {
      "id": "<MEDIA_ID>",  # from step 1
      "caption": "optional caption"
    }
  }

Response:
  {
    "messages": [
      {
        "id": "wamid.xxxxx"
      }
    ]
  }
```

### Cost Model

| Item | Cost |
|------|------|
| First 1,000 conversations/month | Free |
| Business-initiated conversation | $0.0147 - $0.0745 per conversation (varies by country) |
| Service conversations (customer-initiated) | Free |
| Webhook delivery receipts | Included |
| Rate limit | 80 msg/sec (standard), 1,000 msg/sec (high-volume) |

**Context**: A "conversation" is a 24-hour window with a customer. Sending 10 messages to the same person in one day = 1 conversation. Sending to a new person = new conversation.

For a micro-SaaS tool, this means **every message to every unique contact triggers the $0.0147+ charge**. A user sending to 100 contacts costs $1.47-$7.45 per month.

### Access Requirements

| Requirement | Timeline | Notes |
|-------------|----------|-------|
| Meta Business account | Immediate | Create at business.facebook.com |
| WhatsApp Business Platform account | Immediate | Create in Meta Business |
| Dedicated phone number | Immediate | Register one or more phone numbers |
| Business verification | 1-7 days | Meta reviews business entity documents |
| WhatsApp approval | 24-72 hours | Meta reviews WhatsApp use case |
| Rate limit approval | 2-4 weeks | If high-volume tier needed |

**API credentials needed**:
- `WHATSAPP_BUSINESS_ACCOUNT_ID` (existing in manifest, not in `.env`)
- `WHATSAPP_PHONE_NUMBER_ID` (phone number's unique ID)
- `ACCESS_TOKEN` (generated via OAuth from Meta, expires in 60 days)

---

## Option 2: Link-in-Message Approach (Recommended Phase 1)

### How It Works

1. User selects an image/PDF in the wa-sender dashboard
2. File uploads to **Supabase Storage** (not WhatsApp)
3. Supabase returns a public URL: `https://<supabase-project>.supabase.co/storage/v1/object/public/wa-media/<user-id>/<filename.pdf>`
4. URL is appended to the message text: `"Hi {name}, here's your document: https://..."`
5. `wa.me` opens WhatsApp with the URL in the text
6. Recipient receives the message and clicks the link to view/download

### Advantages

- ✅ **No WhatsApp API needed** — uses existing `wa.me` deep links
- ✅ **No per-message cost** — only storage costs (negligible)
- ✅ **No Meta verification** — no business account or compliance review needed
- ✅ **Works immediately** — no waiting for approval
- ✅ **Works with email too** — same link-in-body approach for Gmail
- ✅ **Simple infrastructure** — Supabase Storage is already configured

### Disadvantages

- ⚠️ **Not inline media** — recipients see a URL, not an embedded image
- ⚠️ **Link trust** — some users may not click unfamiliar links
- ⚠️ **Storage costs** — 1GB free tier may run out (but unlikely for typical usage)
- ⚠️ **URL visibility** — file URLs appear in message history and may be forwarded

### Storage Options

**Supabase Storage (Recommended)**
- Already in use (auth, data)
- Free tier: 1GB storage, 2GB bandwidth/month
- Pricing: Pro plan $25/month for 100GB storage
- RLS policies align with existing auth model
- Client SDK already installed

**Vercel Blob (Alternative)**
- Native Vercel integration, auto-CDN
- Free tier: 1GB storage, 1GB bandwidth
- Pricing: $0.15/GB/month storage + $0.30/GB bandwidth
- Simpler API but less integrated with auth

**S3 / CloudFlare R2 (Not recommended for Phase 1)**
- Overkill for initial rollout
- Requires new infrastructure setup
- Higher management overhead

---

## Key Metrics Comparison

| Metric | wa.me + Link-in-Message | WhatsApp Business API |
|--------|------------------------|----------------------|
| **Setup time** | 1-2 hours | 3-5 days + external approval |
| **Per-message cost** | $0 | $0.0147-$0.0745 |
| **Storage cost** | $0 (free tier) or $25/mo (Pro) | Included in API |
| **Media delivery** | Via URL link | Inline in WhatsApp |
| **User experience** | Click link to view | Native preview |
| **Implementation effort** | 1-2 sessions | 3-5 sessions + ops |
| **Compliance complexity** | Low | High (Meta verification) |

---

## Recommendation

**Phase 1 (Immediate)**: Implement Link-in-Message approach
- Unblocks file sharing immediately
- Zero API costs and setup friction
- Can upgrade to Business API later if needed

**Phase 2 (Optional, Future)**: WhatsApp Business API integration
- Only if inline media is a must-have
- Requires business verification and per-message cost acceptance
- Unlocks delivery receipts, read receipts, and template media headers

---

## Open Questions for User

1. Is the "URL in message" approach acceptable for initial launch, or is inline media a hard requirement?
2. What file types matter most? Images, PDFs, or both?
3. Are users comfortable clicking URLs, or is UX friction a deal-breaker?
4. If WhatsApp Business API were chosen, would users accept per-message costs?
5. Should this feature be WhatsApp-only, or extend to email as well?

