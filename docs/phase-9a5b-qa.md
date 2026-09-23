# Phase 9A.5b privacy mapping

Resources canonical column confirmed by user: Privacy_Safety_Considerations (Text). Resource_Submissions intake field remains Privacy_Safety_Information. FIELD_DEFS now uses the canonical key with the intake name as a submission alias. Reads, writes, baseline comparisons and audit field names use the canonical key.

Editable legacy drafts preserve nonempty entered privacy values, fall back to submitted/current values for old blanks, and require saving again. Legacy approved drafts are blocked from create/update until reopened, saved and approved again. Legacy partial creations are blocked for administrator review; no duplicate creation or silent evidence migration. Historical source drafts and audit records are not rewritten.

Five mocked DOM/Grist suites pass: resource-create, resource-status, resource-disposition, resource-draft-target and resource-privacy. Privacy suite checks actual row rendering, canonical fallback, intentional current-format blank, populated create/update writes and audit, Website preservation, and legacy create blocking/editable refresh. These are automated fixtures, not live Grist verification.

Live QA pending: fresh synthetic submission with populated Privacy_Safety_Information; confirm review shows submitted text and canonical Privacy_Safety_Considerations. Save/approve/promote only the intended delta, inspect canonical data and audit, and reload. Provider/Program widget unchanged.
