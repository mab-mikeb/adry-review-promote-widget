# Phase 9A.5 — Resource review dispositions

Non-promotion decisions follow the Provider/Program convention: no writes to Resources and no entries in KB_Promotion_Log. Decision history is retained in Resource_Review_Draft.decision_history with event, reason, reviewer (self-entered, not authenticated identity), UTC timestamp, status, linked row and implementation version. Completed reviews are locked in the widget. Grist table permissions remain responsible for direct-table edit control.

No change requires a matched Resource and a current saved baseline. Reject and No change finish as Completed. Verification required finishes as Verification Required; Resume review records another history event and returns to In Review. Each action requires explicit confirmation and checks fresh source data again after confirmation. Partial/failed promotions and existing promotion audits are blocked. This remains single-operator DEV; client checks are not a server concurrency lock.

## Previous live QA confirmed by user
9A.4b recovery: RSUB-00005 / RES-003 / PROM-00034. Fresh create: RSUB-00006 / RES-004; successful Create audit, Completed persisted on reload, read-only, one Resource and one successful Create audit. Cancellation outcome was not independently documented.

## Live QA — pending
Preserve completed QA records. Use separate synthetic Resource_Submissions for these checks. Let Submission_ID generate normally; do not manually assign it. Reviewer: enter your actual name.

1. No change: Resource_Name `ADry QA 9A.5 — No change`; Existing_Provider AngelSense; Existing_Resource select `ADry QA 9A.4b — Fresh Create 01` (RES-004); Resource_Action No change. Reason: `Phase 9A.5 QA — current Resource is correct; no changes needed.` Save draft. Record decision, first Cancel; expect unchanged status and no history event. Record again and confirm; expect Completed, green no-changes message, read-only. View decision history; verify reason, reviewer, time and decision. Verify RES-004 unchanged and no promotion log for this submission.
2. Reject: new submission named `ADry QA 9A.5 — Reject`; Existing_Provider AngelSense; Existing_Resource blank; action Reject. Reason: `Phase 9A.5 QA — synthetic submission rejected; exclude from pilot data.` Save, Record decision, confirm. Expect Completed, neutral rejection message, recorded history; no Resource or promotion log created.
3. Verification: new submission named `ADry QA 9A.5 — Verification`; Existing_Provider AngelSense; Existing_Resource blank; action Verification required. Reason: `Phase 9A.5 QA — confirm the provider website before continuing.` Save and Record decision. Expect Verification Required, amber hold, locked fields and Resume review. Reload: hold persists. Resume and confirm: In Review, editable, history retains hold and resume. Change action to Reject, enter reason `Phase 9A.5 QA — follow-up finished; close synthetic test.`, save and record. Expect Completed with all history entries retained.
4. Reload completed dispositions and confirm read-only history persists. Run existing Create/Update regression with fresh synthetic submissions before full page sign-off.

## Automated validation
Run node tests/resource-create.cjs, node tests/resource-status.cjs and node tests/resource-disposition.cjs. These execute actual widget JavaScript with mocked DOM/Grist; they are not live Grist tests.
