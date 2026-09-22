# Phase 9A.4a — schema validation and partial recovery

Live Grist acceptance remains pending. Node VM tests exercise the actual widget with a simulated DOM and Grist API; they do not prove live Grist behavior.

## Changes

Resource column metadata determines Choice, ChoiceList, Text, Date and Provider-reference conversion. Single choices use strings; blank lists use null. Configured choices are visible in dropdowns. Unsupported types or choices block readiness and canonical writes. No column choices or schema are automatically changed.

Partial creations show a recovery action instead of normal promotion controls and contradictory duplicate guidance. Recovery checks the saved approval, linked record, unique Resource ID, matching partial audit and every approved value. Only the known empty-list-in-single-choice defect is eligible for automatic correction. Unrelated differences stop recovery. Explicit confirmation and a second read precede writes. The original audit row is retained inside the recovery details before its result is finalized. No AddRecord operation is performed during recovery.

## Existing DEV incident: RSUB-00005 / RES-003

1. In Resources, select Resource_Type and open Column settings. Intentionally add `App` to Choices while retaining `Assistive technology device`. This expands the supported resource vocabulary; do not change the column type or substitute another resource type.
2. Refresh the Resource Review & Promote widget and verify Phase 9A.4a in the header.
3. Select RSUB-00005. Click Check and recover creation. If another unsupported choice is reported, stop and review that configured vocabulary; do not guess replacements.
4. The confirmation must identify RES-003 and restoration of the approved blank Purchase_Model. Confirm. No new Resource should be created.
5. Verify Completed / Success, Purchase_Model blank without a red outline, Resource_Type App valid, and the existing Create audit successful with original-attempt evidence in Error_Detail.
6. Reload: completion persists, no additional Resource or creation audit appears. Verify RSUB-00004 remains a completed Update.

## Fresh validation QA

On an unapproved draft, verify dropdowns match Grist choices. Unsupported submitted or legacy values remain visibly marked as not configured and block readiness. Verify optional single-choice blanks and multi-choice selections. Run Create cancellation, successful creation, duplicate prevention and refresh checks from phase-9a4-qa.md using configured choices. Update regression must preserve untouched fields. Do not use unsupported sample values from older QA guidance.

## Limits

Recovery does not replace unrelated edited values or bypass approval. It does not auto-expand choice vocabularies. Client-side checks still assume one DEV promotion operator; they do not supply a server-side concurrency lock. A live Grist run is required before signoff.
