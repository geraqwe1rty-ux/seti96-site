import test from 'node:test';
import assert from 'node:assert/strict';
import {createAkciaHandler,isAkciaHost} from '../akcia-site.mjs';
test('Only the exact promo host uses the campaign handler',()=>{
  for(const hostname of ['seti96.ru','teplo.seti96.ru','prochistka.seti96.ru','akcia.seti96.ru.example','example.com']) assert.equal(isAkciaHost({hostname}),false);
  assert.equal(isAkciaHost({hostname:'AKCIA.SETI96.RU'}),true);
});
test('Existing hosts pass through without modifying the response',()=>{
  let next=0; createAkciaHandler({staticMiddleware(){throw Error('wrong route');}})({hostname:'teplo.seti96.ru'}, {},()=>next++); assert.equal(next,1);
});
test('Promo host cannot fall through into unrelated pages or admin APIs',()=>{
  const response={headers:{},code:200,set(k,v){this.headers[k]=v;return this;},status(c){this.code=c;return this;},type(){return this;},send(b){this.body=b;return this;},json(b){this.body=b;return this;}};
  let next=0;
  createAkciaHandler({staticMiddleware(req,res,done){done();}})({hostname:'akcia.seti96.ru',method:'GET',path:'/admin'},response,()=>next++);
  assert.equal(response.code,404); assert.equal(next,0);
  createAkciaHandler({staticMiddleware(){throw Error('unexpected');}})({hostname:'akcia.seti96.ru',method:'POST',path:'/api/leads'},response,()=>next++);
  assert.equal(response.code,405); assert.equal(next,0);
});
