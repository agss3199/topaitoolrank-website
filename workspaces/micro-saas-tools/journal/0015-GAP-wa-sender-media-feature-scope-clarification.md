# GAP: Media Feature Scope — Link-in-Message vs. Business API

**Date**: 2026-05-08  
**Phase**: `/analyze` for wa-sender expansion  
**Status**: Clarification needed before `/todos`

## The Gap

The question "Is it possible to add image/PDF to the messages?" has TWO valid answers depending on the desired UX:

### Answer 1: Yes, Link-in-Message (Recommended)
- Upload files to Supabase Storage
- Insert public URL into message text
- Send via `wa.me` as normal
- **Recipient sees**: Text message with a clickable link
- **Implementation**: 1-2 sessions
- **Cost**: $0 (free tier)
- **Tradeoff**: Not inline media, but simple and free

### Answer 2: Yes, WhatsApp Business API (Complex)
- Implement full Meta API integration
- Send media messages with native WhatsApp preview
- Requires business verification and per-message costs
- **Recipient sees**: Inline image/document preview in WhatsApp
- **Implementation**: 3-5 sessions + calendar-bound Meta approval
- **Cost**: $0.01-$0.07 per message
- **Tradeoff**: Rich features, but setup friction and costs

## What's Missing

The user request doesn't specify which UX is acceptable. The analysis provides both options, but **a product decision is needed**:

### Decision Points

1. **Is URL-in-message good enough?**
   - "Yes, users can download files via URL" → Choose Link-in-Message
   - "No, we need inline image previews" → Choose Business API

2. **What's the cost tolerance?**
   - "We want to stay free" → Link-in-Message only
   - "We can accept per-message costs" → Business API viable

3. **What's the urgency?**
   - "We need this fast" → Link-in-Message (1-2 sessions)
   - "We can wait for approval" → Business API (3-5+ sessions)

4. **What file types matter most?**
   - "Just images" → Both paths support it
   - "Images and PDFs and Office docs" → Link-in-Message is simpler (Business API has different handling for different types)

5. **Do we need delivery tracking?**
   - "Just a simple tool" → Link-in-Message fine
   - "We need to know if message was delivered/read" → Requires Business API

## Recommendation Until Clarified

**Proceed with Link-in-Message as Phase 1**:
- Delivers immediate value
- No business verification blocker
- Zero cost
- User can upgrade to Business API later if needed

This way:
- Phase 1 (now): Users can share files via URLs
- Phase 2 (future): Upgrade to Business API for inline media if ROI justifies it

---

## Unanswered Questions for User

1. What UX would your users prefer?
   - A) Click link to download file (simple, free)
   - B) Inline image/document preview in WhatsApp (complex, costs money)

2. What file types do you need?
   - A) Just images
   - B) Images + PDFs
   - C) Full range (Office docs, videos, audio, etc.)

3. Is cost a constraint?
   - A) Must be free
   - B) Can accept per-message costs ($0.01-0.07/message)

4. What's your timeline?
   - A) ASAP (1-2 weeks)
   - B) Flexible (can wait for Meta verification, 2-4 weeks)

---

**Status**: ⚠️ **Awaiting Product Clarification**

Once these questions are answered, the path forward is clear. The analysis is complete; the decision is now product-level.

