# Risk: Export Feature Untested

**Date:** 2026-05-01  
**Type:** RISK  
**Severity:** MEDIUM  
**Status:** IDENTIFIED (Not blocking deployment)  

---

## Risk Description

The new export feature (`handleExportWithStatus()`) was added in commit 395cad9 to resolve the red team finding: "Missing export with sent status column."

**What:** Export function creates XLSX workbook with sent status column and downloads to user's computer.

**Why it's a risk:** No automated tests verify XLSX generation works correctly in edge cases:
- What if sentStatus is empty?
- What if sheet names contain special characters?
- What if contact strings are very long?
- What if XLSX library version changes?

**Impact:** Export could fail silently or produce malformed files, damaging user trust.

---

## Mitigation In Place

1. **Code Review:** Implementation inspected and validated
2. **Error Handling:** Try-catch with user-friendly error message
3. **Library Trust:** XLSX library is mature and well-tested
4. **User Notification:** Success/error messages show status
5. **Browser Download:** Handled by browser (not custom code)

---

## Recommendation

### Immediate (Safe for Deployment)
- Ship as-is with monitoring
- Monitor error logs for export failures
- Early user feedback on file quality

### Short-Term (Within 1 week)
- Write Tier 1 unit test for `handleExportWithStatus`
- Test edge cases (empty status, special characters, long strings)
- Verify XLSX file can be re-imported

### Long-Term (Future Enhancement)
- Add E2E test (export → re-import → verify status preserved)
- Consider adding validation before download
- Add file preview before download

---

## Decision

**Decision:** Deploy with monitoring  
**Rationale:** Export feature has fallback error handling; XLSX library is production-grade; risk is LOW-MEDIUM and easily addressed post-launch.

**Monitoring Points:**
- Error logs: `Export failed` messages
- User feedback: File corruption reports
- Usage: Export click rate vs success rate

---

**Identified by:** Red Team Validation Round 2  
**Status:** Monitoring recommended; not blocking deployment
