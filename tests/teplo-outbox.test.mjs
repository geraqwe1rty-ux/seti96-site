import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,appendFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createTeploOutbox} from '../teplo-outbox.mjs';
import {readTeploLeads,validateTeploLead} from '../teplo-leads.mjs';

const base=()=>({requestId:randomUUID(),phone:'+79990000000',clientType:'Частный дом',consent:true,name:'Изолированный тест',topic:'Стены и окна'});
const response=()=>({code:200,data:null,set(){},status(code){this.code=code;return this;},json(data){this.data=data;return this;}});
async function run(fn){const dir=await mkdtemp(path.join(tmpdir(),'teplo-outbox-'));try{await fn(dir);}finally{await rm(dir,{recursive:true,force:true});}}
async function submit(outbox,body){const res=response();await outbox.handler({hostname:'teplo.seti96.ru',body},res,()=>{throw Error('unexpected pass-through');});return res;}

test('server records before sending; concurrent requests and restart retry do not resend confirmed lead',()=>run(async dir=>{
 let sends=0;const body=base();
 const send=async()=>{sends++;assert.equal((await readTeploLeads(dir)).length,1);return{ok:true};};
 const box=createTeploOutbox({dataDir:dir,deliverDirect:send});
 const results=await Promise.all(Array.from({length:5},()=>submit(box,body)));
 assert.ok(results.every(r=>r.data.delivery==='confirmed'));assert.equal(sends,1);
 const restart=createTeploOutbox({dataDir:dir,deliverDirect:send});await submit(restart,body);await restart.drain();assert.equal(sends,1);
 assert.equal((await submit(restart,{...body,name:'changed'})).code,409);
}));
test('failed delivery remains queued and resumes after restart without a browser',()=>run(async dir=>{
 let time=100000;const body=base();
 const first=createTeploOutbox({dataDir:dir,now:()=>time,deliverDirect:async()=>({ok:false})});
 const saved=await submit(first,body);assert.equal(saved.code,202);assert.equal(saved.data.delivery,'queued');
 let sends=0;const restart=createTeploOutbox({dataDir:dir,now:()=>time,deliverDirect:async()=>{sends++;return{ok:true};}});
 await restart.drain();assert.equal(sends,0);
 time+=31000;await Promise.all([restart.drain(),restart.drain()]);assert.equal(sends,1);
 const row=(await readTeploLeads(dir))[0];assert.equal(row.delivery_attempts,2);assert.equal(row.next_attempt_at,null);assert.match(row.telegram_status,/^доставлено/);
}));
test('browser flags cannot fake delivery or prevent server sending',()=>run(async dir=>{
 let sends=0;const box=createTeploOutbox({dataDir:dir,deliverDirect:async()=>{sends++;return{ok:false};}});
 const res=await submit(box,{...base(),archiveOnly:true,clientRelayDelivered:true,browserRelayReceipt:true});
 assert.equal(sends,1);assert.equal(res.data.delivery,'queued');assert.doesNotMatch((await readTeploLeads(dir))[0].telegram_status,/^доставлено/);
}));
test('storage failure never returns an accepted request and does not send',()=>run(async dir=>{
 let sends=0;const box=createTeploOutbox({dataDir:path.join(dir,'missing'),deliverDirect:async()=>{sends++;return{ok:true};}});
 const res=await submit(box,base());assert.equal(res.code,503);assert.equal(res.data.ok,undefined);assert.equal(sends,0);
}));
test('worker does not replay historical browser delivery records',()=>run(async dir=>{
 const {lead}=validateTeploLead(base());lead.telegram_status='подтверждено браузером, сервером не проверено';
 await appendFile(path.join(dir,'teplo-leads.ndjson'),JSON.stringify(lead)+'\n');
 const box=createTeploOutbox({dataDir:dir,deliverDirect:()=>{throw Error('must not replay old lead');}});await box.drain();
 assert.equal((await readTeploLeads(dir))[0].telegram_status,lead.telegram_status);
}));
