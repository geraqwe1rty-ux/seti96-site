import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createTeploLeadHandler,readTeploLeads,validateTeploLead} from '../teplo-leads.mjs';

const base=()=>({requestId:randomUUID(),phone:'+79990000000',clientType:'Частный дом',consent:true,name:'Автотест',message:'Изолированный тест, без внешней отправки',topic:'Стены и окна'});
const response=()=>({code:200,data:null,set(){},status(code){this.code=code;return this;},json(data){this.data=data;return this;}});
const request=body=>({hostname:'teplo.seti96.ru',body});
async function sandbox(run){const dir=await mkdtemp(path.join(tmpdir(),'teplo-test-'));try{await run(dir);}finally{await rm(dir,{recursive:true,force:true});}}
const env={TELEGRAM_BOT_TOKEN:'test-only',TELEGRAM_CHAT_ID:'test-only'};

test('validates consent and contact; source and service cannot be forged',()=>{
 for(const patch of [{consent:false},{phone:'123'},{website:'spam'},{clientType:'unknown'},{requestId:'not-a-uuid'}])assert.ok(validateTeploLead({...base(),...patch}).error);
 const {lead}=validateTeploLead({...base(),source:'other.example',service:'spoof'});
 assert.equal(lead.source,'teplo.seti96.ru');assert.equal(lead.service,'Тепловизионное обследование');
});
test('other hosts pass through without creating or sending a lead',()=>sandbox(async dir=>{
 const handler=createTeploLeadHandler({dataDir:dir,deliverDirect:()=>{throw Error('unexpected send');}});let next=false;
 await handler({hostname:'seti96.ru',body:base()},response(),()=>{next=true;});assert.equal(next,true);assert.equal((await readTeploLeads(dir)).length,0);
}));
test('duplicate simultaneous requests and retries after restart send once',()=>sandbox(async dir=>{
 let sends=0;const deliverDirect=async()=>{sends++;return {ok:true};};const body=base();
 const handler=createTeploLeadHandler({dataDir:dir,env,deliverDirect});
 const responses=await Promise.all(Array.from({length:4},async()=>{const res=response();await handler(request(body),res,()=>{});return res;}));
 assert.ok(responses.every(r=>r.data.ok&&r.data.delivery==='confirmed'));assert.equal(sends,1);
 const restarted=createTeploLeadHandler({dataDir:dir,env,deliverDirect});const replay=response();await restarted(request(body),replay,()=>{});assert.equal(replay.data.ok,true);assert.equal(sends,1);
 const changed=response();await restarted(request({...body,phone:'+79990000001'}),changed,()=>{});assert.equal(changed.code,409);assert.equal(sends,1);
 assert.equal((await readTeploLeads(dir)).length,1);
}));
test('unconfirmed delivery stays saved and cannot be spoofed from browser',()=>sandbox(async dir=>{
 const handler=createTeploLeadHandler({dataDir:dir,env:{},deliverDirect:async()=>({ok:false}),fetchImpl:async()=>({ok:true,json:async()=>({ok:true})})});
 const res=response();await handler(request({...base(),clientRelayDelivered:true}),res,()=>{});
 assert.equal(res.code,502);assert.equal(res.data.ok,undefined);assert.equal(res.data.saved,true);assert.equal((await readTeploLeads(dir))[0].telegram_status,'доставка не подтверждена');
}));
test('browser relay archives first; a client receipt never becomes server-confirmed delivery',()=>sandbox(async dir=>{
 const handler=createTeploLeadHandler({dataDir:dir,env,deliverDirect:()=>{throw Error('archive must not send');},fetchImpl:()=>{throw Error('archive must not send');}});
 const body=base();const archived=response();await handler(request({...body,archiveOnly:true}),archived,()=>{});
 assert.equal(archived.code,202);assert.equal(archived.data.saved,true);assert.equal(archived.data.ok,undefined);
 const badReceipt=response();await handler(request({...body,browserRelayReceipt:true,receiptId:'unknown'}),badReceipt,()=>{});assert.equal(badReceipt.code,400);
 const receipt=response();await handler(request({...body,browserRelayReceipt:true,receiptId:archived.data.id}),receipt,()=>{});
 assert.equal(receipt.code,202);assert.equal(receipt.data.delivery,'browser-reported');assert.equal(receipt.data.ok,undefined);
 const rows=await readTeploLeads(dir);assert.equal(rows.length,1);assert.equal(rows[0].telegram_status,'подтверждено браузером, сервером не проверено');
}));
test('fallback relay preserves thermal request and campaign metadata',()=>sandbox(async dir=>{
 let payload;const handler=createTeploLeadHandler({dataDir:dir,env,deliverDirect:async()=>({ok:false}),fetchImpl:async(url,options)=>{assert.equal(url,'https://seti96-engineering.german123312.chatgpt.site/api/leads');payload=JSON.parse(options.body);return {ok:true,json:async()=>({ok:true,delivery:'доставлено'})};}});
 const res=response();await handler(request({...base(),utm_campaign:'thermal-test',yclid:'test-click',address:'Тестовый адрес'}),res,()=>{});
 assert.equal(res.data.delivery,'confirmed');assert.equal(payload.source,'teplo.seti96.ru');assert.equal(payload.utm_campaign,'thermal-test');assert.equal(payload.yclid,'test-click');assert.equal(payload.address,'Тестовый адрес');assert.equal(payload.secret,undefined);
}));
test('concurrent distinct leads all survive writes',()=>sandbox(async dir=>{
 const handler=createTeploLeadHandler({dataDir:dir,env,deliverDirect:async()=>({ok:true})});
 await Promise.all(Array.from({length:12},async(_,i)=>{const res=response();await handler(request({...base(),phone:'+7999000'+String(i).padStart(4,'0')}),res,()=>{});assert.equal(res.data.ok,true);}));
 const rows=await readTeploLeads(dir);assert.equal(rows.length,12);assert.ok(rows.every(r=>r.telegram_status.startsWith('доставлено')));
}));
test('only isolated new host serves static folder and counter is correct',async()=>{
 const server=await readFile(new URL('../server.mjs',import.meta.url),'utf8');assert.match(server,/createTeploLeadHandler/);assert.match(server,/readTeploLeads\(dataDir\)/);
 const html=await readFile(new URL('../teplo-static/index.html',import.meta.url),'utf8');assert.match(html,/https:\/\/teplo\.seti96\.ru/);assert.match(html,/ym-hide-content/);assert.match(html,/id="lead-form"/);assert.doesNotMatch(html,/german123312\.chatgpt\.site/);
 const script=await readFile(new URL('../teplo-static/metrika.js',import.meta.url),'utf8');assert.match(script,/113687988/);assert.match(script,/m\[i\]=m\[i\]\|\|function/);
});
