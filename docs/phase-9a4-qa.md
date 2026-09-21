# Phase 9A.4 — New Resource Creation & Audit

Status: implementation and simulated regression tests complete; live Grist DEV acceptance pending.

## Scope

Create an approved Resource with a reference to an existing Provider; assign a plain Resource_ID or respect an existing Grist ID formula/trigger; link the submission; verify values; record a successful Create audit; complete and lock the submission. Existing Update behavior remains supported. No change, Reject and Verification required finalization remain outside this release.

## Safety and recovery

Creation requires a fresh 9A.4 saved draft, explicit approval and complete approval stamps. It checks for an existing linked Resource, the same normalized Resource name at the same Provider, and successful/partial audit entries for the submission. Checks run again after confirmation. The name check is not fuzzy entity resolution; reviewers must search existing Resources as well.

Creation, a Partial audit, and the submission link are submitted together using explicit vacant row IDs. Final verification updates that audit to Success and the submission to Completed. Partial results are locked and expose read-only Resource/audit details. Do not clear their link or create again; inspect and reconcile the existing Resource/audit before resuming. No automatic retries or automatic deletion/rollback of created Resources.

The client checks do not provide a server-side uniqueness constraint against arbitrary external writers. Use one promotion operator during DEV QA. Concurrent multi-operator production promotion requires a server-side uniqueness/locking gate before external rollout.

No schema migration is made. Grist metadata must be readable; Resources must have the documented fields and Resource_ID. Formula-owned supplied fields stop creation instead of being overwritten.

## Automated checks

Run `node tests/resource-status.cjs` and `node tests/resource-create.cjs` from the repository. These run actual widget JavaScript with a mocked DOM and Grist API. They cover successful creation, exact audit and links, plain/formula IDs, reference/list/date conversion, cancellation, repeat/double clicks, duplicate arrival during confirmation, revoked approval, legacy drafts, existing links, invalid fields, write failures and lost responses. They do not replace Grist DEV acceptance or verify live server transaction behavior.

## DEV acceptance walkthrough

1. Confirm the widget heading is **Phase 9A.4 · New Resource Creation & Audit**. Keep completed RSUB-00004 intact.
2. Add a fresh row in Resource_Submissions (not a copy of an approved/completed row). Let Grist assign Submission_ID if configured. If it is a plain manual field, enter an unused ID such as `RSUB-QA-9A4-001` after checking it does not already exist. Record the actual ID for the audit check.
3. Enter the following staging values:

| Field | Value |
| --- | --- |
| Provider_Name | AngelSense |
| Existing_Provider | Select the existing AngelSense reference |
| Existing_Resource | Leave blank |
| Resource_Name | ADry QA 9A.4 — Visual Schedule |
| Resource_Type | App |
| Resource_Summary | Synthetic QA record for Phase 9A.4. Not a real product or recommendation. |
| Website | https://example.com/adry-qa-9a4 |
| Notes | Phase 9A.4 QA — synthetic test only; exclude from pilot data. |
| Review_Status | New |
| Resource_Action | Create |

If Resource_Type is a restricted choice and App is unavailable, use an existing appropriate choice; do not add a new choice for this test. Leave approval/application fields untouched. Optional fields can stay blank. If the intake schema uses a different summary field name, enter the exact summary in the widget's Suggested / Final Resource_Summary instead.

4. Select the fresh submission in Resource Review & Promote. In Suggested / Final, confirm the values above and Provider = AngelSense. Set Information_Source = Other and Confidence_Status = Unverified lead if these fields are editable, so the synthetic example makes no verification claim. Save Resource Review Draft.
5. Confirm readiness passes, Mark Ready to Promote, then Record Human Approval. Verify the canonical Resources table has not gained a row yet.
6. Click Promote Approved Resource; the dialog must say Create and show the correct name/Provider. Cancel once. Confirm no new Resource or audit entry was created and the submission remains approved.
7. Click Promote Approved Resource again and confirm. Expect one new Resource, Existing_Resource linked to it, Promotion_Result = Success, Review_Status = Completed, and a green Resource created successfully message. Do not assume the assigned Resource_ID.
8. View Resource: check name, Provider reference, summary, Website and Notes. View audit record: check your actual submission ID, Action = Create, Result = Success, matching Canonical ID/row, Previous Values = {}, applied values, readable approval/application stamps, and Implementation_Version = 9A.4 in KB_Promotion_Log.
9. Refresh and reselect the completed submission. It stays locked; the create/promotion button stays hidden. Resource and audit counts do not increase.
10. Duplicate guard: use a second fresh submission with the same Provider and exact Resource_Name. Save, mark ready and approve. Attempt promotion. Expect a message identifying the existing Resource and no additional Resource/success audit. Keep the blocked test row as QA evidence.
11. Regression: return to RSUB-00004. Its green completed Update result, Notes = Phase 9A.1 QA, and historical audit remain intact.

Stop if any step differs, particularly a Partial/uncertain result. Capture the message, source submission ID, linked Resource ID and audit record; do not retry creation or manually reset approval/link fields.
