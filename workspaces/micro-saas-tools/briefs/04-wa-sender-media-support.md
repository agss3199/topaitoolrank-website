# Brief: Add Image & PDF Support to WA-Sender

**Date**: 2026-05-08  
**Feature**: Media attachments in WhatsApp messages  
**Scope**: Extend wa-sender tool to support sending images and PDFs alongside text

## User Request

"In the wa-sender tool, is it possible to add image/pdf as well to the messages?"

## Initial Context

The wa-sender tool currently supports:
- ✅ Text messages via WhatsApp
- ✅ Template substitution and variables
- ✅ Message logging/history
- ❌ Media attachments (images, PDFs)

## Key Questions

1. **Technical feasibility**: Does WhatsApp API support file attachments?
2. **File types**: Which formats? (JPEG, PNG, PDF, DOCX, etc.)
3. **File size limits**: WhatsApp/server constraints?
4. **Storage**: Where do uploaded files live? (S3, Supabase, local?)
5. **UX**: How do users select/preview files before sending?
6. **Integration**: How does this affect template system? Can templates reference media?
7. **Cost**: What are the implications? (storage, bandwidth, API charges)
8. **Scope**: Is this for wa-sender only, or all 9 tools?

## Success Criteria

- Users can upload images/PDFs to wa-sender dashboard
- Files are sent successfully via WhatsApp API
- Files are logged in message history with preview/download
- File size/type validation prevents invalid uploads
- User experience is intuitive (drag-drop or file picker)

## Constraints (If Any)

- Keep feature within micro-SaaS scope (self-service, no backend infrastructure)
- Respect WhatsApp API rate limits and cost
- Don't require database schema changes if possible
- Maintain CSS isolation in tool

---

**Status**: ANALYSIS PENDING
