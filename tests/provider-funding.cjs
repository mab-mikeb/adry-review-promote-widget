const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert/strict');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const match = html.match(/<script>\s*([\s\S]*?)<\/script>/);
assert(match, 'index.html must contain an inline script');
assert.doesNotThrow(() => new vm.Script(match[1]), 'widget script must parse');

const fundingFields = [
  'Program_Category',
  'Funding_Type',
  'Funding_Maximum',
  'Application_Status',
  'Application_Deadline',
  'Means_Tested',
  'Reimbursement_Based',
  'Last_Verified_On'
];

for (const field of fundingFields) {
  assert(
    html.includes(field),
    'widget must include funding field ' + field
  );
}

const controlIds = [
  'g_final_category',
  'g_final_fundingtype',
  'g_final_fundingmaximum',
  'g_final_applicationstatus',
  'g_final_applicationdeadline',
  'g_final_meanstested',
  'g_final_reimbursement',
  'g_final_lastverified'
];
for (const id of controlIds) {
  assert(html.includes('id="' + id + '"'), 'missing review control ' + id);
}

assert(
  !html.includes("put('g_sub_category', null, 'Not collected as canonical category')"),
  'Program_Category must come from the submission'
);

for (const field of [
  'Funding_Type',
  'Funding_Maximum',
  'Application_Status',
  'Application_Deadline',
  'Means_Tested',
  'Reimbursement_Based',
  'Last_Verified_On'
]) {
  assert(
    html.includes(field + ": getControl('g_final_"),
    'Program_Review_Draft must capture ' + field
  );
}

assert(
  html.includes("if (providerAction === 'No change' && programAction === 'Create')"),
  'dispatcher must support existing Provider + new Program'
);
assert(
  html.includes('async function promoteExistingProviderCreateProgram()'),
  'existing Provider + new Program promotion function is required'
);
assert(
  html.includes("Funding administrator may be national/provincial; Provider municipality is optional."),
  'funding administrator municipality rule is required'
);
assert(
  html.includes("Funding Program has a Last Verified date."),
  'funding Program verification-date readiness rule is required'
);
assert(
  html.includes("programFields.Last_Verified_On = dateOnlySeconds"),
  'canonical create must write Last_Verified_On as a Grist Date value'
);
assert(
  html.includes("Funding_Type: scalarCompare(g.Funding_Type)"),
  'matched update path must include funding fields'
);
assert(
  html.includes("Submission_Source") &&
  html.includes("Research_Run_ID") &&
  html.includes("Research_Source_Notes"),
  'review UI must surface Muse provenance'
);
assert(
  html.includes("defaultInformationSource = museResearch ? 'Synaptree research' : 'Provider submitted'"),
  'Muse submissions must not be mislabeled as provider-submitted'
);


assert(
  html.includes("Canonical promotion completed successfully."),
  'completed promotions must short-circuit duplicate-readiness warnings'
);
assert(
  html.includes("existingProviderCreateProgram"),
  '8D.5 gating must recognize existing Provider + Create Program'
);
assert(
  html.includes("Approved new Program is ready to be created under the matched existing Provider."),
  'approved existing-provider/new-program status must be explicit'
);

console.log('PASS: funding review fields, draft persistence, completed-state handling, create/update promotion, provenance, and No change/Create gates are wired.');
