const fixtureSource=require('fs').readFileSync(require('path').join(__dirname,'resource-create.cjs'),'utf8').split('(async()=>{')[0];
const fixture=new Function('require','__dirname',fixtureSource+'; return fixture;')(require,__dirname);
const assert=require('assert/strict');
const key='Privacy_Safety_Considerations';
function privacyRow(f){return f.el('resourceRows').children.filter(r=>r.children[0].textContent===key).at(-1);}
(async()=>{
// Actual rendered rows read the submission alias and canonical field separately.
let f=fixture();f.run("buildRows({Privacy_Safety_Information:'Submitted safety'}, {Privacy_Safety_Considerations:'Current safety'}, new Map(), {})");
let r=privacyRow(f);assert.equal(r.children[1].textContent,'Current safety');assert.equal(r.children[2].textContent,'Submitted safety');assert.equal(r.children[3].children[0].value,'Submitted safety');
f=fixture();f.run("buildRows({}, {Privacy_Safety_Considerations:'Keep current'}, new Map(), {})");assert.equal(privacyRow(f).children[3].children[0].value,'Keep current');
f=fixture();f.run("buildRows({}, {Privacy_Safety_Considerations:'Keep current'}, new Map(), {Privacy_Safety_Considerations:''})");assert.equal(privacyRow(f).children[3].children[0].value,'');
// Approved create writes and audits only the actual canonical column.
f=fixture();f.run("fields.Privacy_Safety_Considerations='Synthetic safety';source.Resource_Review_Draft=JSON.stringify({version:'9A.4',action:'Create',fields})");await f.run('promoteApprovedResource()');assert.equal(f.db.Resources[1][key],'Synthetic safety');assert(!('Privacy_Safety_Information' in f.db.Resources[1]));assert.equal(JSON.parse(f.db.KB_Promotion_Log[0].Applied_Values)[key],'Synthetic safety');
// Old approved drafts cannot silently omit or redirect their approved privacy value.
f=fixture();f.run("fields.Privacy_Safety_Information='Legacy safety';source.Resource_Review_Draft=JSON.stringify({version:'9A.4',action:'Create',fields})");await f.run('promoteApprovedResource()');assert.equal(f.calls,0);assert(f.alerts[0].includes('older privacy field mapping'));
// Editing an old draft preserves entered privacy text, requires a new save.
f=fixture();Object.assign(f.db.Resource_Submissions[0],{Promotion_Approved:false,Review_Status:'In Review',Existing_Resource:1,Resource_Action:'Update'});f.db.Resources[0][key]='Canonical safety';f.run("source.Resource_Review_Draft=JSON.stringify({fields:{Privacy_Safety_Information:'Legacy entered'},baseline:{__row_id:1},action:'Update'});");await f.run('render(source)');assert.equal(privacyRow(f).children[3].children[0].value,'Legacy entered');assert.equal(f.run('isDirty'),true);
f.run("source.Resource_Review_Draft=JSON.stringify({fields:{Privacy_Safety_Information:''},baseline:{__row_id:1},action:'Update'});");await f.run('render(source)');assert.equal(privacyRow(f).children[3].children[0].value,'Canonical safety');
// Approved update: populated privacy changes are written and audited; Website stays intact.
f=fixture();f.db.Resources[0][key]='Old safety';f.db.Resources[0].Website='https://example.com/keep';Object.assign(f.db.Resource_Submissions[0],{Existing_Resource:1,Resource_Action:'Update'});
f.run("var live={id:1,Resource_ID:'RES-001',Resource_Name:'Existing',Provider:1,Privacy_Safety_Considerations:'Old safety',Website:'https://example.com/keep'};var baseline={__row_id:1};var desired={};FIELD_DEFS.forEach(d=>{baseline[d.key]=normalizeCanonicalValue(d.key,live[d.key],window.__resourceProvidersById);desired[d.key]=baseline[d.key]});desired.Privacy_Safety_Considerations='New safety';source.Resource_Review_Draft=JSON.stringify({version:'9A.4',action:'Update',fields:desired,baseline});setControl('resourceAction','Update');");await f.run('promoteApprovedResource()');assert.equal(f.db.Resources[0][key],'New safety');assert.equal(f.db.Resources[0].Website,'https://example.com/keep');assert.equal(f.db.KB_Promotion_Log[0].Changed_Fields,key);
console.log('PASS: privacy submission alias, canonical read/write, preservation, explicit blank, legacy draft save/approval guard, create and update audit.');
})().catch(e=>{console.error(e);process.exit(1)});
