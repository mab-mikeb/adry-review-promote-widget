const fixtureSource=require('fs').readFileSync(require('path').join(__dirname,'resource-create.cjs'),'utf8').split('(async()=>{')[0];
const fixture=new Function('require','__dirname',fixtureSource+'; return fixture;')(require,__dirname);
const assert=require('assert/strict');
(async()=>{
const f=fixture(),s=f.db.Resource_Submissions[0];
Object.assign(s,{Promotion_Approved:false,Review_Status:'In Review',Resource_Action:'Update',Existing_Resource:1});
f.run("source.Resource_Review_Draft=JSON.stringify({action:'Update',fields:{Website:'',Notes:'Old draft'},baseline:null});var captured;buildRows=(record,resource,providers,fields)=>{captured=fields;};");
await f.run('render(source)');
assert.equal(f.run('Object.keys(captured).length'),0);
assert.equal(f.run('isDirty'),true);
assert(f.el('saveStatus').textContent.includes('rebuilt'));
assert.equal(f.calls,0);
// A draft saved for this target retains intentional edits, including clearing.
f.run("source.Resource_Review_Draft=JSON.stringify({action:'Update',fields:{Website:'',Notes:'Intentional'},baseline:{__row_id:1}})");
await f.run('render(source)');assert.equal(f.run('captured.Notes'),'Intentional');assert.equal(f.run('isDirty'),false);
// Approved and completed evidence must never be silently rebuilt.
f.run("source.Promotion_Approved=true;source.Resource_Review_Draft=JSON.stringify({action:'Update',fields:{Notes:'Approved'},baseline:null})");
await f.run('render(source)');assert.equal(f.run('captured.Notes'),'Approved');assert.equal(f.el('promoteApproved').disabled,true);
f.run("source.Review_Status='Completed';source.Promotion_Result='Success'");
await f.run('render(source)');assert.equal(f.run('captured.Notes'),'Approved');
// Target changed during save: no write, refresh instead.
f.run("source.Review_Status='In Review';source.Promotion_Result='';source.Promotion_Approved=false;currentRecord=source;currentResource=null;setControl('resourceAction','Update')");
await f.run('saveDraft()');assert.equal(f.calls,0);assert(f.el('saveStatus').textContent.includes('changed while saving'));
assert.equal(f.run("draftTargetChanged({fields:{},baseline:{__row_id:1}}, {id:2})"),true);
assert.equal(f.run("draftTargetChanged({fields:{},baseline:{__row_id:1}}, null)"),true);
console.log('PASS: draft target rebuild, dirty gate, same-target edits, locked evidence, and target change during save.');
})().catch(e=>{console.error(e);process.exit(1)});
