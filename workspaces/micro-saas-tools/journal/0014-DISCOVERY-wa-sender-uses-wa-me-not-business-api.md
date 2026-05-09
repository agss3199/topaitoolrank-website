# DISCOVERY: wa-sender Uses wa.me Deep Links, Not WhatsApp Business API

**Date**: 2026-05-08  
**Phase**: `/analyze` for media attachment feature  
**Status**: Critical architectural finding

## Summary

The wa-sender tool uses `wa.me` deep links to open WhatsApp, not the WhatsApp Business Cloud API. This architectural choice fundamentally constrains what media attachments are possible.

## Finding Details

### Current Implementation (wa.me Deep Links)

```typescript
// From app/tools/wa-sender/page.tsx line 675
window.open(`https://wa.me/${current.normalized}?text=${encoded}`, '_blank');
```

The tool:
1. User enters message and selects contact
2. Clicks "Open WhatsApp"
3. Opens: `https://wa.me/+1234567890?text=Hi%20there`
4. WhatsApp Web or app opens with pre-filled message
5. User manually clicks "Send" in WhatsApp

**This is a browser-based flow, not an API-driven flow.**

### Impact on Media Attachments

The `wa.me` protocol supports only these query parameters:
- `text` — plain text message

**It does NOT support**:
- `image` or `media` parameters
- `attachment` parameters
- Any file/binary references

**Conclusion**: No way to attach media via `wa.me` deep links.

### Architectural Decision: Why wa.me?

The wa.me approach has these trade-offs:

**Pros**:
- ✅ Zero setup required — no API keys, no business verification
- ✅ Free — no per-message costs
- ✅ Works globally — no country restrictions
- ✅ User controls send — no automated sending
- ✅ Privacy-forward — no server-side access to messages
- ✅ Simple implementation — one line of code

**Cons**:
- ❌ Text-only — no media attachments
- ❌ No delivery confirmation — can't verify message was sent
- ❌ No read receipts — can't track if message was read
- ❌ No templates — can't use WhatsApp Business templates
- ❌ No automated sending — user must manually send each message

This choice was deliberate: **wa-sender prioritizes simplicity and zero-cost operation over rich features.**

## Manifest vs. Reality Inconsistency

The `tool.manifest.json` declares:

```json
{
  "environment_variables": {
    "WHATSAPP_API_KEY": {
      "required": true,
      "description": "WhatsApp Business API key"
    },
    "WHATSAPP_BUSINESS_ACCOUNT_ID": {
      "required": true,
      "description": "WhatsApp Business Account ID"
    }
  }
}
```

**But**:
- These variables do not exist in `.env`
- They are never imported or used in any code
- The tool functions perfectly without them

**Verdict**: The manifest is aspirational/stale documentation. It documents the *intended* integration that was never implemented.

## Implications for Media Attachment Feature

To add media attachments, there are two paths:

### Path 1: Migrate to WhatsApp Business API (Complex)
- Implement full API integration with Meta's `graph.facebook.com`
- Requires business verification (1-7 days)
- Requires phone number registration
- Costs $0.0147-$0.0745 per message
- Enables: Inline media, delivery receipts, templates, automated sending

### Path 2: Link-in-Message (Simple, Recommended)
- Keep `wa.me` as-is
- User uploads file to Supabase Storage
- Get public URL from Supabase
- Append URL to message text
- Send via `wa.me` as before
- Recipient clicks link to download file
- Costs: Only storage (free tier adequate)
- Timeline: 1-2 sessions

## Design Philosophy Observation

The current wa.me approach reflects a **micro-SaaS philosophy**:
- User-centric, not platform-centric
- Privacy-preserving (no server access to messages)
- Zero friction (no setup, no costs, no verification)
- Simple mental model (open WhatsApp → type → send)

Migrating to Business API would shift this to a **platform-centric model**:
- Server-side automation
- Rich features (templates, analytics, delivery tracking)
- Friction (verification, costs, setup)
- Trust model shift (server sees all messages)

The choice between these philosophies is a **product decision**, not a technical one.

## Recommendation

For media attachments, **keep the wa.me philosophy**:
- Use Link-in-Message approach (files as URLs)
- Maintains zero-friction, free operation
- Requires no architectural changes
- User still controls send (no surprise automated messages)
- Preserves privacy (server doesn't see message content)

Reserve WhatsApp Business API migration for a future phase if/when:
- Inline media becomes a hard requirement
- Users are willing to accept per-message costs
- Automation/delivery tracking become must-haves
- Business verification is feasible

---

**Status**: ✅ **Documented**

This finding is critical to understand when planning media attachment features. The architectural choice affects not just implementation, but product philosophy and cost model.

