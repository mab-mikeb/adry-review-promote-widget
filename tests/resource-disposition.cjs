const fixtureSource=require('fs').readFileSync(require('path').join(__dirname,'resource-create.cjs'),'utf8').split('(async()=>{')[0];
const fixture=new Function('require','__dirname',fixtureSource+'; return fixture;')(require,__dirname);
const assert=require('assert/strict');
function setup(action='Reject',options={}){
 const f=fixture(options),s=f.db.Resource_Submissions[0];
 Object.assign(s,{Promotion_Approved:false,Promotion_Result:'',Review_Status:'In Review',Resource_Action:action,Existing_Resource:action==='No change'?1:0});
 f.run("currentResource=source.Existing_Resource?{id:1,Resource_ID:'RES-001',Resource_Name:'Existing',Provider:1}:null");
 f.run(`source.Resource_Review_Draft=JSON.stringify({action:${JSON.stringify(action)},fields:{},decision_reason:'Synthetic QA decision',decision_reviewer:'QA reviewer',baseline:buildResourceBaseline(currentResource,window.__resourceProvidersById)});setControl('resourceAction',source.Resource_Action);setControl('dispositionReason','Synthetic QA decision');setControl('dispositionReviewer','QA reviewer');`);
 return f;
}
(async()=>{
 for(const action of ['Reject','No change','Verification required']){
  const f=setup(action),before=JSON.stringify(f.db.Resources);
  await f.run('finalizeDisposition()');
  assert.equal(f.db.Resource_Submissions[0].Review_Status,action==='Verification required'?'Verification Required':'Completed');
  assert.equal(JSON.stringify(f.db.Resources),before);assert.equal(f.db.KB_Promotion_Log.length,0);
  assert.equal(JSON.parse(f.db.Resource_Submissions[0].Resource_Review_Draft).decision_history.length,1);
  const calls=f.calls;await f.run('finalizeDisposition()');assert.equal(f.calls,calls);
  if(action==='Verification required'){
   assert.equal(f.el('resourceAction').disabled,true);
   await f.run('finalizeDisposition(true)');assert.equal(f.db.Resource_Submissions[0].Review_Status,'In Review');
   assert.equal(JSON.parse(f.db.Resource_Submissions[0].Resource_Review_Draft).decision_history.length,2);
  }
 }
 let f=setup('Reject',{cancel:true});await f.run('finalizeDisposition()');assert.equal(f.calls,0);
 f=setup('Reject',{mutateOnConfirm:db=>db.Resource_Submissions[0].Review_Status='Completed'});await f.run('finalizeDisposition()');assert.equal(f.calls,0);
 f=setup('No change');f.db.Resources[0].Notes='Concurrent edit';await f.run('finalizeDisposition()');assert.equal(f.calls,0);
 f=setup();f.db.Resource_Submissions[0].Promotion_Result='Partial';await f.run('finalizeDisposition()');assert.equal(f.calls,0);
 f=setup();f.db.Resource_Submissions[0].Promotion_Approved=true;await f.run('finalizeDisposition()');assert.equal(f.calls,0);
 f=setup();const d=JSON.parse(f.db.Resource_Submissions[0].Resource_Review_Draft);d.decision_reason='';f.db.Resource_Submissions[0].Resource_Review_Draft=JSON.stringify(d);await f.run('finalizeDisposition()');assert.equal(f.calls,0);
 f=setup('Reject',{failCall:1});await f.run('finalizeDisposition()');assert.equal(f.db.Resource_Submissions[0].Review_Status,'In Review');
 f=setup('Reject',{loseResponse:1});await f.run('finalizeDisposition()');assert.equal(f.db.Resource_Submissions[0].Review_Status,'Completed');await f.run('finalizeDisposition()');assert.equal(f.calls,1);
 f=setup();await Promise.all([f.run('finalizeDisposition()'),f.run('finalizeDisposition()')]);assert.equal(f.calls,1);
 console.log('PASS: disposition close/hold/resume/history, no canonical or promotion log writes, cancel, repeat, double-click, stale resource, concurrent review change, approval/partial/missing reason gates, write failure and lost response.');
})().catch(e=>{console.error(e);process.exit(1)});
