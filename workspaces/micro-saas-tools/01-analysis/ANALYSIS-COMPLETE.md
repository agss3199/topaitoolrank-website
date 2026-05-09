# Analysis Complete: Media Attachment Support for wa-sender

**Date**: 2026-05-08  
**Phase**: `/analyze` for wa-sender feature expansion  
**Status**: ✅ COMPLETE — Ready for Planning

---

## Research Summary

The analysis investigated the feasibility of adding image/PDF support to the wa-sender tool. Key findings:

### Discovery 1: Current Architecture (wa.me Deep Links)
- wa-sender does **NOT** use WhatsApp Business API
- Uses `wa.me` deep links instead: `https://wa.me/<phone>?text=<message>`
- The `wa.me` protocol supports **text only** — no media parameters exist
- Manifest declares WhatsApp API credentials, but they are never used in code

### Discovery 2: Two Viable Paths
| Path | Complexity | Cost | Timeline | Inline Media |
|------|-----------|------|----------|--------------|
| **Link-in-Message** | Moderate | $0 (free tier) | 1-2 sessions | ❌ No (URL link) |
| **WhatsApp Business API** | High | $0.01-$0.07/msg | 3-5 sessions + approval | ✅ Yes |

### Discovery 3: Recommended Approach (Phase 1)
**Link-in-Message** is the optimal path for initial launch:
- Upload files to Supabase Storage (already in use)
- Generate public URL
- Append URL to message text
- Send via existing `wa.me` flow
- No WhatsApp API integration needed
- No per-message costs
- No Meta business verification required

### Discovery 4: Implementation Scope
Three implementation shards (1-2 autonomous sessions total):
1. Upload infrastructure (Supabase Storage + API route)
2. File upload UI + message composition
3. Data persistence & history logging

### Discovery 5: Data Model Changes
Minimal: Add 4 optional fields to `WASenderMessage`:
- `media_url` — public file URL
- `media_type` — MIME type
- `media_filename` — original filename
- `media_size_bytes` — file size for quota tracking

### Discovery 6: Key Constraints
- **Storage**: Supabase free tier = 1GB (adequate for micro-SaaS)
- **File types**: Images (JPEG, PNG, GIF, WebP), Documents (PDF)
- **File sizes**: 5MB max for images, 10MB for PDFs
- **Availability**: Files expire after 30 days (auto-cleanup)
- **UX tradeoff**: Recipients get a clickable link, not inline preview

---

## Documentation Produced

### Analysis Files
1. **`01-whatsapp-api-media-support.md`** (4.2 KB)
   - WhatsApp Business API capabilities and costs
   - Link-in-Message approach details
   - Comparison of options
   - Storage solution evaluation

2. **`02-implementation-approach.md`** (6.8 KB)
   - Architecture overview
   - Data model changes (with SQL)
   - 3 implementation shards with code examples
   - Testing strategy (Tier 1/2/3)
   - Risk mitigation
   - Deployment checklist

3. **`03-ux-flow.md`** (5.1 KB)
   - Step-by-step user journey
   - UI mockups (ASCII)
   - Error scenarios
   - Accessibility (WCAG 2.1 AA)
   - Mobile responsiveness

### Analysis File Structure
```
workspaces/micro-saas-tools/
├── 01-analysis/
│   ├── 01-whatsapp-api-media-support.md
│   ├── 02-implementation-approach.md
│   ├── 03-ux-flow.md
│   └── ANALYSIS-COMPLETE.md  ← this file
├── briefs/
│   └── 04-wa-sender-media-support.md  ← user request
└── (02-plans/, 03-user-flows/ created during /todos phase if approved)
```

---

## Key Questions Answered

| Question | Answer |
|----------|--------|
| **Is it possible?** | ✅ Yes, via two paths (Link-in-Message or Business API) |
| **Which path is recommended?** | Link-in-Message (faster, zero cost, simpler) |
| **What infrastructure is needed?** | Supabase Storage (already in use) |
| **How long would it take?** | 1-2 autonomous sessions (~4-8 hours) |
| **Would it cost money?** | No (free tier adequate for initial rollout) |
| **What's the UX like?** | File → upload → URL → message → send (3 extra clicks) |
| **Would inline media be possible?** | Yes, but requires WhatsApp Business API (3-5 sessions, per-msg cost) |

---

## Recommendations

### For Phase 1 (Immediate)
✅ **Proceed with Link-in-Message approach**
- Unblocks file sharing immediately
- Minimal implementation effort
- Zero cost and setup friction
- Sufficient for typical use cases

**Prerequisite**: User confirms that "URL in message" UX is acceptable

### For Phase 2 (Optional, Future)
⚠️ **Consider WhatsApp Business API only if**:
- Inline media becomes a must-have feature
- Users are willing to accept per-message costs ($0.01-$0.07)
- Business verification is feasible
- User volume justifies API complexity

### For Phase 1.5 (Hardening, if needed)
⚠️ **Add robustness features** (optional post-launch):
- Per-user storage quotas with enforcement
- Auto-cleanup of old files (30-day TTL via Supabase)
- Antivirus scanning for uploaded files
- Rate limiting on upload endpoint

---

## Open Questions for Product Decision

Before proceeding to `/todos` phase, clarify:

1. **UX Acceptance**: Is "URL in message" acceptable, or is inline media required?
2. **Storage**: Are you okay with the Supabase free tier (1GB), or should we budget for Pro?
3. **File Retention**: Should files auto-delete after 30 days, or keep indefinitely?
4. **Scope**: Should email mode also support file attachments (same link approach)?
5. **Templates**: Can templates have default attachments?

---

## Risk Summary

| Risk | Mitigation |
|------|-----------|
| Storage quota exhausted | Per-user quota (50MB), auto-cleanup after 30 days |
| Users upload malware | MIME validation, restrict to images/PDFs |
| File URLs are guessable | Use UUID paths, consider signed URLs |
| WhatsApp blocks message links | Use custom domain instead of raw Supabase URL |
| Upload abuse | Auth-gated, rate limiting, daily quota |

---

## Cross-Reference to Specs

This analysis affects:
- **wa-sender feature**: Extended with media attachment capability
- **Data model**: `WASenderMessage` type gains 4 optional fields
- **Storage infrastructure**: Supabase Storage bucket required
- **API surface**: New `POST /api/wa-sender/media/upload` route

No existing specs conflict. This is additive functionality.

---

## Success Criteria for Analysis Phase

- ✅ Feasibility confirmed (two implementation paths identified)
- ✅ Recommended approach documented (Link-in-Message)
- ✅ Implementation scope defined (3 shards, 1-2 sessions)
- ✅ UX flow detailed (user journey with mockups)
- ✅ Data model changes specified (4 fields, schema diff included)
- ✅ Risks identified and mitigated
- ✅ Open questions for product decision listed

---

## Next Steps

### If Approved
→ Proceed to `/todos` phase
- Break into implementation todos (3 shards)
- Define acceptance criteria for each shard
- Schedule 1-2 autonomous sessions for execution

### If Rejected
→ Archive analysis and move to other features

### If Deferred
→ Save analysis for future reference when prioritization changes

---

## Artifacts Delivered

| File | Size | Purpose |
|------|------|---------|
| `01-whatsapp-api-media-support.md` | 4.2 KB | API research, options comparison |
| `02-implementation-approach.md` | 6.8 KB | Technical architecture, 3 shards, tests |
| `03-ux-flow.md` | 5.1 KB | User journey, UI mockups, accessibility |
| `ANALYSIS-COMPLETE.md` | This file | Summary and next steps |

**Total analysis output**: ~22 KB of detailed research

---

**Status**: ✅ **ANALYSIS PHASE COMPLETE**

**Approval needed**: Confirm UX approach and storage strategy before proceeding to `/todos`

