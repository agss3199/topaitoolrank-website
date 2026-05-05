# 12-micro-dashboard-context-refactor

**Implements**: specs/wa-sender-core.md § State Management  
**Depends On**: 11-wa-sender-toolshell (layout + context provider must exist)  
**Capacity**: ~300 LOC refactoring / 6 invariants (file state, columns, numbers, recipients, message, send mode) / 3 call-graph hops (Dashboard → useWASender → context) / Replace local useState calls in Dashboard with context calls for file, columns, numbers, recipients to enable state persistence across route navigation.  
**Status**: ACTIVE (deferred from todo 12 to maintain stability)

## Context

Todo 12 created sub-routes and the context infrastructure, but the Dashboard still uses local state. This deferred micro-todo replaces the Dashboard's useState calls with context calls to complete the refactoring.

This was separated to reduce risk: the 937-line Dashboard refactoring benefits from focused attention in a separate session rather than being rushed as part of the larger todo 12.

## Scope

**DO:**
- In `app/tools/wa-sender/page.tsx`, replace these useState calls with context equivalents:
  - `[file, setFile]` → `useWASender().file` / `.setFile()`
  - `[columns, setColumns]` → `useWASender().columns` / `.setColumns()`
  - `[numbers, setNumbers]` → `useWASender().numbers` / `.setNumbers()`
  - `[recipients, setRecipients]` → `useWASender().recipients` / `.setRecipients()`
- Leave local state for send-workflow-specific UI (mode, message, emailSubject, etc.)
- Verify all existing functionality still works (file upload, column detection, send preview, export)

**DO NOT:**
- Refactor message, emailSubject, emailBody, sentStatus — these are send-workflow transient state
- Change the send workflow logic itself
- Break existing tests

## Deliverables

**Refactor:**
- `app/tools/wa-sender/page.tsx` — replace file/columns/numbers/recipients state with context calls

**Tests:**
- Update existing Dashboard tests to verify context integration (if any)

## Testing

**Manual checks:**
- Upload file in Dashboard → columns and recipients appear
- Navigate to Templates → navigate back to Dashboard → file and columns still visible
- Send workflow works end-to-end (send via WhatsApp or Email)
- Export results with full recipient list

## Implementation Notes

- State variable mapping:
  ```
  // REPLACE (local state)
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  
  // WITH (context)
  const ctx = useWASender();
  // ctx.file, ctx.setFile, ctx.columns, ctx.setColumns
  ```
- Use search-and-replace carefully; not all "setFile" or "file" are the Dashboard state
- Test after each replacement to catch regressions

## Notes

- This deferred micro-todo unblocks todo 13 (session persistence end-to-end validation)
- Session auto-save (todo 10) already works; this just wires the Dashboard to it
