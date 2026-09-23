# Phase 9A.5a Resource draft safeguards

## Reason
A draft saved before Existing_Resource was linked retained blank final values when a Resource was later selected. Live test RSUB-00011 updated RES-005 with audit PROM-00037 Success, but changed Website to blank as well as Notes. This failed the notes-only acceptance test. The user confirmed restoring the Website directly; historical submission/audit evidence remains intact.

## Behaviour
For editable reviews, changing the linked Resource relative to the saved baseline rebuilds Suggested / Final from submission values with current canonical values as fallback. Old draft edits must be re-entered. The widget explains this and requires a fresh save before approval. Same-target drafts preserve intentional edits and blanks. Approved, held, completed and promotion-outcome records are not silently rebuilt. A target change detected during saving stops the write and refreshes the review. Update confirmation now displays Resource ID and before/after values, explicitly marking empty applied values as [CLEAR VALUE].

## Validation
All four mocked DOM/Grist suites pass: resource-create.cjs, resource-status.cjs, resource-disposition.cjs, resource-draft-target.cjs. The new suite covers rebuilding, dirty-state approval gate, same-target edits, locked evidence and link changes during save. Live Desktop regression passed on 2026-09-23: RSUB-00012 linked to RES-005, populated canonical fallback automatically, detected Notes-only change, confirmed before/after values, and promoted with PROM-00038 Update/Success and Changed_Fields Notes only. Resources screenshot retained Website; user confirmed Completed/read-only persisted after reload.

## Existing live evidence
RSUB-00007 No change and RSUB-00008 Reject completed with decision history. RSUB-00009 held/resumed and ultimately rejected with retained history. RSUB-00010 created RES-005 with PROM-00036 Create/Success; user confirmed completed/read-only state persisted after reload. None of these results establish full schema or live participant approval.

## Next live test
Use Resource Review & Promote in DEV. Confirm Phase 9A.5a. Create a fresh synthetic Update submission for RES-005, save before linking, then link RES-005. Confirm existing Website and other non-submitted fields populate automatically, and the rebuilt-draft notice requires a fresh save. Set Notes only, save, confirm the delta is Notes only, approve and promote. Check the confirmation and audit contain Notes only, Website is preserved, and Completed/read-only persists after reload.

## Architecture alignment
ADRY-ARCH-001 v1.6 section 16 requires approved field-delta writes and protection against changed canonical baselines. This patch is limited to the knowledge widget. Identity and case trust domains and ADRY-057/059 live-data gates remain outside this change. Provider/Program index.html is unchanged.
