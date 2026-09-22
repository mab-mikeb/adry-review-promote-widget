const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const script=fs.readFileSync(require('path').join(__dirname, '../resource.html'),'utf8').match(/<script>\s*([\s\S]*?)<\/script>/)[1];
function fixture(options={}){
const nodes=new Map();function node(){return {get options(){return this.children},get selectedOptions(){return this.children.filter(n=>n.selected)},textContent:'',value:'',hidden:false,disabled:false,dataset:{},children:[],classList:{toggle(){},add(){},remove(){}},style:{},appendChild(n){this.children.push(n)},replaceChildren(){this.children=[]},addEventListener(){},setAttribute(){}}}
const el=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)};
const fields={Resource_Name:'ADry QA 9A.4 — Visual Schedule',Provider:'AngelSense',Resource_Type:'App',Resource_Summary:'Synthetic QA only.',Website:'https://example.com/adry-qa-9a4',Notes:'Phase 9A.4 QA',Last_Checked:'2026-09-21',Intended_User:'Adult, Teen'};
const source={id:5,Submission_ID:'RSUB-00005',Existing_Resource:0,Resource_Action:'Create',Review_Status:'Ready to Promote',Promotion_Approved:true,Approved_By:'Tester',Approved_By_Email:'tester@example.com',Approved_On:1789944163,Resource_Review_Draft:JSON.stringify({version:'9A.4',action:'Create',fields})};
let db={Resource_Submissions:[source],Resources:[{id:1,Resource_ID:'RES-001',Resource_Name:'Existing',Provider:1}],Providers:[{id:1,Provider_Name:'AngelSense'}],KB_Promotion_Log:[],_grist_Tables:[{id:10,tableId:'Resources'}],_grist_Tables_column:[]};
const table=rows=>{const keys=new Set(['id',...rows.flatMap(r=>Object.keys(r))]);return Object.fromEntries([...keys].map(k=>[k,rows.map(r=>r[k])]));};
let calls=0;const alerts=[];
const ctx=vm.createContext({console,Intl,Date,Map,URL,document:{getElementById:el,querySelector:el,querySelectorAll:()=>[],createElement:node},window:{confirm:()=>{if(options.mutateOnConfirm) options.mutateOnConfirm(db);return !options.cancel},alert:x=>alerts.push(x)},grist:{ready(){},onRecord(){},docApi:{fetchTable:async name=>table(db[name]),applyUserActions:async actions=>{
 calls++;
 if(options.failCall===calls)throw new Error('Simulated write failure');
 const next=structuredClone(db);
 for(const [action,name,id,values] of actions){if(action==='AddRecord'){if(next[name].some(r=>r.id===id))throw new Error('row already exists');next[name].push({id,...values});if(name==='Resources'&&options.formulaId)next[name].at(-1).Resource_ID='RES-'+String(id).padStart(3,'0');}
 else if(action==='UpdateRecord'){const row=next[name].find(r=>r.id===id);if(!row)throw new Error('missing row');Object.assign(row,values);}}
 db=next;
 if(options.loseResponse===calls)throw new Error('Response lost');
 return {};
}}}});
vm.runInContext(script,ctx);const run=code=>vm.runInContext(code,ctx);
const defs=run('FIELD_DEFS.map(d=>d.key)');
db._grist_Tables_column=['Resource_ID',...defs].map((colId,i)=>({id:i+1,parentId:10,colId,type:colId==='Provider'?'Ref:Providers':colId==='Last_Checked'?'Date':['Intended_User','Support_Need'].includes(colId)?'ChoiceList':['Resource_Type','Purchase_Model'].includes(colId)?'Choice':'Text',widgetOptions:JSON.stringify({choices:colId==='Resource_Type'?['App']:colId==='Purchase_Model'?['Subscription']:['Adult','Teen']}),isFormula:colId==='Resource_ID'&&!!options.formulaId,formula:colId==='Resource_ID'&&options.formulaId?'generated':''}));
ctx.columns=db._grist_Tables_column;run('resourceSchema=schemaMap([{id:10,tableId:"Resources"}],columns)');ctx.source=source;ctx.fields=fields;run("currentRecord=source;currentResource=null;window.__resourceProvidersById=new Map([[1,{id:1,Provider_Name:'AngelSense'}]]);setControl('resourceAction','Create');FIELD_DEFS.forEach(d=>setControl('r_final_'+d.key,fields[d.key]));isDirty=false;");
return {run,el,alerts,get db(){return db},get calls(){return calls}};
}
(async()=>{
let f=fixture();await f.run('promoteApprovedResource()');assert.equal(f.db.Resources.length,2);assert.equal(f.db.Resources[1].Resource_ID,'RES-002');assert.equal(f.db.Resource_Submissions[0].Existing_Resource,2);assert.equal(f.db.Resource_Submissions[0].Review_Status,'Completed');assert.equal(f.db.KB_Promotion_Log.length,1);assert.equal(f.db.KB_Promotion_Log[0].Result,'Success');assert.equal(f.db.KB_Promotion_Log[0].Action,'Create');assert.equal(f.db.KB_Promotion_Log[0].Previous_Values,'{}');assert.deepEqual(f.db.Resources[1].Intended_User,['L','Adult','Teen']);assert.equal(f.el('readinessHeadline').textContent,'✓ Resource created successfully');await f.run('promoteApprovedResource()');assert.equal(f.db.Resources.length,2);
f=fixture({cancel:true});await f.run('promoteApprovedResource()');assert.equal(f.calls,0);
f=fixture({formulaId:true});await f.run('promoteApprovedResource()');assert.equal(f.db.KB_Promotion_Log[0].Canonical_ID,'RES-002');
f=fixture({failCall:1});await f.run('promoteApprovedResource()');assert.equal(f.db.Resources.length,1);assert.equal(f.db.KB_Promotion_Log.length,0);
f=fixture({failCall:2});await f.run('promoteApprovedResource()');assert.equal(f.db.Resources.length,2);assert.equal(f.db.Resource_Submissions[0].Promotion_Result,'Partial');assert.equal(f.db.KB_Promotion_Log[0].Result,'Partial');assert.equal(f.el('reopenReview').disabled,true);await f.run('promoteApprovedResource()');assert.equal(f.db.Resources.length,2);
f=fixture({loseResponse:1});await f.run('promoteApprovedResource()');assert.equal(f.db.Resources.length,2);assert.equal(f.db.Resource_Submissions[0].Promotion_Result,'Partial');
f=fixture({loseResponse:2});await f.run('promoteApprovedResource()');assert.equal(f.db.Resource_Submissions[0].Promotion_Result,'Success');assert.equal(f.db.Resources.length,2);
f=fixture({mutateOnConfirm:db=>db.Resources.push({id:2,Resource_ID:'RES-002',Provider:1,Resource_Name:'  adry qa 9a.4 — visual schedule  '})});await f.run('promoteApprovedResource()');assert.equal(f.calls,0);assert(f.alerts[0].includes('already exists'));
f=fixture({mutateOnConfirm:db=>db.Resource_Submissions[0].Promotion_Approved=false});await f.run('promoteApprovedResource()');assert.equal(f.calls,0);
f=fixture();f.db.Resource_Submissions[0].Existing_Resource=1;await f.run('promoteApprovedResource()');assert.equal(f.calls,0);
f=fixture();f.db.Resource_Submissions[0].Resource_Review_Draft=JSON.stringify({version:'9A.3',action:'Create',fields:{}});await f.run('promoteApprovedResource()');assert.equal(f.calls,0);
f=fixture();f.run("fields.Website='javascript:alert(1)';fields.Last_Checked='2026-02-31';fields.Provider='Unknown';fields.Resource_Name='';");assert(f.run('createIssues(fields,window.__resourceProvidersById).length')>=4);
f=fixture();await Promise.all([f.run('promoteApprovedResource()'),f.run('promoteApprovedResource()')]);assert.equal(f.db.Resources.length,2);assert.equal(f.db.KB_Promotion_Log.length,1);

f=fixture();f.db._grist_Tables_column.find(c=>c.colId==='Resource_Type').widgetOptions=JSON.stringify({choices:['Assistive technology device']});await f.run('promoteApprovedResource()');assert.equal(f.calls,0);assert(f.alerts[0].includes('Resource_Type'));
f=fixture();await f.run('promoteApprovedResource()');assert.equal(f.db.Resources[1].Purchase_Model,'');
f=fixture({failCall:2});await f.run('promoteApprovedResource()');f.db.Resources[1].Purchase_Model='[]';await f.run('recoverPartialCreation()');assert.equal(f.db.Resources.length,2);assert.equal(f.db.Resources[1].Purchase_Model,'');assert.equal(f.db.Resource_Submissions[0].Promotion_Result,'Success');assert.equal(JSON.parse(f.db.KB_Promotion_Log[0].Error_Detail).original_attempt.Result,'Partial');await f.run('recoverPartialCreation()');assert.equal(f.db.Resources.length,2);
f=fixture({failCall:2});await f.run('promoteApprovedResource()');f.db.Resources[1].Notes='External change';await f.run('recoverPartialCreation()');assert.equal(f.db.Resource_Submissions[0].Promotion_Result,'Partial');assert.equal(f.db.Resources[1].Notes,'External change');
f=fixture({failCall:2});await f.run('promoteApprovedResource()');f.db._grist_Tables_column.find(c=>c.colId==='Resource_Type').widgetOptions=JSON.stringify({choices:[]});await f.run('recoverPartialCreation()');assert.equal(f.db.Resource_Submissions[0].Promotion_Result,'Partial');
f=fixture();assert.equal(f.run("canonicalWriteValue('Purchase_Model','',window.__resourceProvidersById)"),'');assert.equal(f.run("canonicalWriteValue('Support_Need','',window.__resourceProvidersById)"),null);assert.throws(()=>f.run("canonicalWriteValue('Purchase_Model','Other',window.__resourceProvidersById)"));
f=fixture({failCall:2});await f.run('promoteApprovedResource()');f.run('window.confirm=()=>false');const before=f.calls;await f.run('recoverPartialCreation()');assert.equal(f.calls,before);assert.equal(f.db.Resource_Submissions[0].Promotion_Result,'Partial');
console.log('PASS: schema types, choices, blank values, partial recovery, recovery repeat and external-change protection;  create, exact audit/link, ID allocation and formula ID, types, cancel, repeat/double click, duplicates at confirmation, approval revocation, legacy draft, linked resource, invalid data, first/final write failures, and lost responses.');
})().catch(e=>{console.error(e);process.exit(1)});
