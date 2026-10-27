import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createHeatingOutbox,readHeatingLeads,validateHeatingLead} from '../heating-leads.mjs';
import {createLeadReceipts} from '../lead-receipts.mjs';
const input=()=>({requestId:randomUUID(),phone:'+79990000000',clientType:'Частный дом',consent:true,placement:'one-screen',topic:'Холодные батареи',utm_campaign:'qa-isolated'});
const response=()=>({code:200,data:null,headers:{},set(k,v){this.headers[k]=v;return this;},status(c){this.code=c;return this;},json(d){this.data=d;return this;}});
async function sandbox(fn){const dir=await mkdtemp(path.join(tmpdir(),'heating-qa-'));try{await fn(dir)}finally{await rm(dir,{recursive:true,force:true})}}
test('heating saves first, deduplicates concurrent retries, preserves attribution and resumes queued delivery',()=>sandbox(async dataDir=>{
 let time=100000,sends=0;const body=input();
 const first=createHeatingOutbox({dataDir,now:()=>time,deliverDirect:async()=>{sends++;assert.equal((await readHeatingLeads(dataDir)).length,1);return {ok:false}}});
 const send=async box=>{const res=response();await box.handler({hostname:'seti96.ru',body},res,()=>assert.fail());return res};
 const replies=await Promise.all([send(first),send(first),send(first)]);assert.ok(replies.every(r=>r.code===202&&r.data.saved));assert.equal(sends,1);
 const restart=createHeatingOutbox({dataDir,now:()=>time,deliverDirect:async()=>{sends++;return {ok:true}}});time+=31000;await restart.drain();
 assert.equal((await send(restart)).data.delivery,'confirmed');assert.equal(sends,2);
 const saved=(await readHeatingLeads(dataDir))[0];assert.equal(saved.utm_campaign,'qa-isolated');assert.equal(saved.topic,body.topic);assert.equal(saved.source,'seti96.ru');
}));
test('invalid phone, consent, bots and mismatched payload are not successful leads',()=>sandbox(async dataDir=>{
 let sends=0;const box=createHeatingOutbox({dataDir,deliverDirect:async()=>{sends++;return {ok:true}}}),body=input();
 for(const extra of [{consent:false},{phone:'123'},{website:'bot'},{clientType:'other'}]){
  const res=response();await box.handler({hostname:'seti96.ru',body:{...body,...extra}},res,()=>assert.fail());assert.equal(res.code,400);
 }
 assert.equal(sends,0);assert.equal((await readHeatingLeads(dataDir)).length,0);
 assert.equal(validateHeatingLead({...body,source:'spoof'}).lead.source,'seti96.ru');
 const good=response();await box.handler({hostname:'seti96.ru',body},good,()=>assert.fail());
 const changed=response();await box.handler({hostname:'seti96.ru',body:{...body,phone:'+79990000001'}},changed,()=>assert.fail());assert.equal(changed.code,409);assert.equal(sends,1);
}));
test('thank-you receipt requires a saved lead; direct visits, another host, refresh and repeat submission do not count',()=>{
 const receipts=createLeadReceipts();const req={hostname:'seti96.ru',body:{placement:'one-screen'},headers:{}};
 assert.equal(receipts.consume(req),null);
 const bad=response();receipts.attach(req,bad,()=>{});bad.json({ok:true});assert.equal(bad.headers['Set-Cookie'],undefined);
 const res=response();receipts.attach(req,res,()=>{});res.json({ok:true,saved:true,id:'heating-'+randomUUID(),delivery:'confirmed'});
 assert.equal(res.data.thankYouUrl,'/spasibo');const cookie=res.headers['Set-Cookie'].split(';')[0];
 assert.equal(receipts.consume({...req,hostname:'teplo.seti96.ru',headers:{cookie}}),null);
 assert.deepEqual(receipts.consume({...req,headers:{cookie}}),{kind:'landing',delivery:'confirmed'});
 assert.equal(receipts.consume({...req,headers:{cookie}}),null);
 const retry=response();receipts.attach(req,retry,()=>{});retry.json({...res.data,thankYouUrl:undefined});assert.equal(retry.headers['Set-Cookie'],undefined);
});
test('expired receipt cannot create a conversion and pending delivery is clearly distinguished',()=>{
 let time=0;const receipts=createLeadReceipts({now:()=>time}),req={hostname:'teplo.seti96.ru',headers:{}};
 const res=response();receipts.attach(req,res,()=>{});res.json({ok:true,saved:true,id:'teplo-'+randomUUID(),delivery:'queued'});
 const cookie=res.headers['Set-Cookie'].split(';')[0];time=86400001;assert.equal(receipts.consume({...req,headers:{cookie}}),null);
});
