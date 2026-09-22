const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync(require('path').join(__dirname, '../resource.html'),'utf8');
const script=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
const nodes=new Map();
function node(){return {textContent:'',value:'',hidden:false,disabled:false,dataset:{},children:[],classList:{toggle(){},add(){},remove(){}},style:{},appendChild(n){this.children.push(n)},replaceChildren(){this.children=[]},addEventListener(){},setAttribute(){}}}
const el=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)};
const ctx=vm.createContext({console,Intl,Date,Map,document:{getElementById:el,querySelector:el,querySelectorAll:()=>[],createElement:node},window:{},grist:{ready(){},onRecord(){},docApi:{fetchTable:async()=>({id:[]})}}});
vm.runInContext(script,ctx);
vm.runInContext("resourceSchema = new Map(FIELD_DEFS.map(d => [d.key,{colId:d.key,type:'Text',isFormula:false}]));",ctx);
function run(code){return vm.runInContext(code,ctx)}
function state(opts={}){
ctx.opts=opts;
run(`currentResource={id:1,Resource_ID:'RES-001',Resource_Name:'Test',Notes:'Before'};
window.__resourceProvidersById=new Map();
FIELD_DEFS.forEach(d=>setControl('r_final_'+d.key, currentResource[d.key]||''));
setControl('r_final_Notes',opts.same?'Before':'After');
setControl('resourceAction','Update');
const base=buildResourceBaseline(currentResource,new Map());if(opts.stale)base.Notes='Older';
currentRecord={id:4,Submission_ID:'RSUB-00004',Existing_Resource:1,Review_Status:opts.completed?'Completed':opts.approved?'Ready to Promote':'In Review',Promotion_Approved:!!opts.approved,Approved_By:'Reviewer',Approved_On:1789944163.192,Promotion_Result:opts.failed?'Failed':opts.completed?'Success':'',Promotion_Error:opts.failed?'Verification failed':'',Resource_Review_Draft:JSON.stringify({action:'Update',fields:{},...(opts.legacy?{}:{baseline:base})})};
isDirty=!!opts.dirty;if(opts.missing)setControl('r_final_Resource_Name','');updateReadiness();` .replace('const base=', 'var base='));
return {tone:el('readinessPanel').dataset.tone,title:el('readinessHeadline').textContent,disabled:el('promoteApproved').disabled,hidden:el('promoteApproved').hidden};
}
(async()=>{
let s=state({completed:true,approved:true,same:true});assert.equal(s.tone,'success');assert(s.hidden);assert.equal(el('readinessList').children.length,0);assert(!el('approvalStatus').textContent.includes('1789944163'));
s=state({same:true});assert.equal(s.tone,'info');assert(s.disabled&&!s.hidden);assert(!el('saveDraft').hidden);
s=state({approved:true});assert(!s.disabled);
s=state({approved:true,legacy:true});assert.equal(s.tone,'warning');assert(s.disabled);
s=state({approved:true,stale:true});assert.equal(s.tone,'warning');assert(s.disabled);
s=state({failed:true,approved:true,stale:true});assert.equal(s.tone,'error');assert(s.disabled);
s=state({missing:true});assert.equal(s.tone,'warning');assert(el('readinessList').children.some(x=>x.textContent.includes('Enter a Resource Name')));
s=state({dirty:true});assert.equal(s.tone,'warning');assert(s.disabled);
state({completed:true,approved:true,same:true});
ctx.grist.docApi.fetchTable=async table=>table==='KB_Promotion_Log'?{id:[33,34],Source_Submission_ID:['RSUB-00004','OTHER'],Entity_Type:['Resource','Resource'],Result:['Success','Failed']}:{id:[1],Resource_ID:['RES-001']};
await run("showCompletedDetails('audit')");assert(el('recordDetailsBody').textContent.includes('Success'));assert(!el('recordDetailsBody').textContent.includes('OTHER'));
await run("showCompletedDetails('resource')");assert(el('recordDetailsBody').textContent.includes('RES-001'));
ctx.grist.docApi.fetchTable=async()=>{throw new Error('Unavailable')};await run("showCompletedDetails('audit')");assert(el('recordDetailsBody').textContent.includes('Could not load'));
console.log('PASS: 11 status/date/detail scenarios using the actual widget JavaScript with a mocked DOM and Grist API.');
})().catch(e=>{console.error(e);process.exit(1)});
