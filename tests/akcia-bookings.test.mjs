import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createAkciaBookings,readAkciaBookings,validateAkciaBooking} from '../akcia-bookings.mjs';

const fixed=Date.parse('2026-11-04T18:00:00Z');
const input=()=>({requestId:randomUUID(),town:'kosulino',phone:'+70000000000',address:'ТЕСТ: не звонить и не выезжать',consent:true});
const response=()=>({code:200,set(){return this;},status(v){this.code=v;return this;},json(v){this.body=v;return this;}});
const request=body=>({body,headers:{origin:'https://akcia.seti96.ru','content-type':'application/json'}});
async function setup(t,deliverDirect){const dataDir=await mkdtemp(path.join(tmpdir(),'akcia-test-'));t.after(()=>rm(dataDir,{recursive:true,force:true}));return {dataDir,box:createAkciaBookings({dataDir,deliverDirect,now:()=>fixed})};}

test('All four towns and common Russian phone formats validate; tampered input is rejected',()=>{
  for(const town of ['rassokha','verkhnee-dubrovo','aramil','kosulino']) {
    for(const phone of ['+7 (900) 000-00-00','8 900 000 00 00','9000000000']) {
      const parsed=validateAkciaBooking({...input(),town,phone},fixed);
      assert.equal(parsed.row.phone,'+79000000000'); assert.equal(parsed.row.price_rub,800);
    }
  }
  for(const patch of [{town:'__proto__'},{town:'other'},{phone:'123'},{address:'123'},{consent:false},{website:'spam'},{requestId:'bad'}]) assert.ok(validateAkciaBooking({...input(),...patch},fixed).error);
  assert.ok(validateAkciaBooking(input(),Date.parse('2026-11-11T00:00:00Z')).error);
});
test('Persistence is acknowledged while Telegram remains unavailable, then survives a restart',async t=>{
  const {dataDir,box}=await setup(t,async()=>({ok:false,code:'telegram_timeout'}));
  const body=input(),res=response();
  await box.handler(request(body),res);
  assert.equal(res.code,202); assert.equal(res.body.ok,true);
  assert.equal((await readAkciaBookings(dataDir)).length,1);
  await box.drain();
  const later=fixed+60000;let sends=0;
  const restart=createAkciaBookings({dataDir,now:()=>later,deliverDirect:async()=>{sends++;return {ok:true};}});
  await restart.drain();
  const retry=response();await restart.handler(request(body),retry);
  assert.equal(retry.body.delivery,'confirmed');assert.equal(sends,1);
});
test('Slow Telegram does not delay the saved response and concurrent duplicate submissions send once',async t=>{
  let release,started=0;
  const delivery=new Promise(resolve=>release=resolve);
  const {dataDir,box}=await setup(t,async()=>{started++;await delivery;return {ok:true};});
  const body=input(),a=response(),b=response();
  await Promise.all([box.handler(request(body),a),box.handler(request(body),b)]);
  assert.equal(a.body.ok,true);assert.equal(b.body.ok,true);
  assert.equal((await readAkciaBookings(dataDir)).length,1);
  const drain=box.drain();
  release();await drain;
  assert.equal(started,1);
  const c=response();await box.handler(request(body),c);
  assert.equal(c.body.delivery,'confirmed');
  const changed=response();await box.handler(request({...body,address:'Другой адрес, 2'}),changed);
  assert.equal(changed.code,409);
});
test('Origins and request formats are checked before saving',async t=>{
  const {dataDir,box}=await setup(t,async()=>({ok:true}));
  for(const [headers,status] of [[{origin:'https://example.com','content-type':'application/json'},403],[{'content-type':'text/plain'},415]]) {
    const res=response();await box.handler({body:input(),headers},res);assert.equal(res.code,status);
  }
  assert.deepEqual(await readAkciaBookings(dataDir),[]);
});
test('Storage failure never reports success',async()=>{
  const box=createAkciaBookings({dataDir:'/definitely-missing-akcia-directory/data',deliverDirect:async()=>({ok:true}),now:()=>fixed});
  const res=response();await box.handler(request(input()),res);assert.equal(res.code,503);assert.notEqual(res.body.ok,true);
});
