import test from 'node:test';
import assert from 'node:assert/strict';
import {submitBooking} from '../akcia-source/lib/submit-booking.ts';
test('A lost response retries the same request id and accepts a saved queued booking',async()=>{
  const calls=[];const payload={requestId:'stable-id'};
  const result=await submitBooking('/api/booking',payload,async(url,options)=>{
    calls.push({url,body:options.body});if(calls.length===1)throw new TypeError('Failed to fetch');
    return Response.json({ok:true,reference:'STABLE',delivery:'queued'},{status:202});
  });
  assert.equal(result.reference,'STABLE');assert.equal(calls.length,2);assert.equal(calls[0].body,calls[1].body);assert.equal(calls[0].url,'/api/booking');
});
test('Validation failures are shown without automatic repeats',async()=>{
  let count=0;await assert.rejects(()=>submitBooking('/api/booking',{},async()=>{count++;return Response.json({error:'Укажите телефон полностью.'},{status:400});}),/Укажите телефон полностью/);assert.equal(count,1);
});
test('Invalid gateway responses and offline failures show readable recovery advice',async()=>{
  for(const fetchImpl of [async()=>{throw new TypeError('Failed to fetch');},async()=>new Response('<html>Bad gateway</html>',{status:502})]) {
    await assert.rejects(()=>submitBooking('/api/booking',{},fetchImpl),/Данные остались в форме/);
  }
});
