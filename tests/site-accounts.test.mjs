import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readAccounts, matchesAccount} from '../site-accounts.mjs';
import {registerDirectReport} from '../direct-report.mjs';
import express from 'express';

const hash = str => createHash('sha256').update(str).digest('hex');
const basic = str => 'Basic '+Buffer.from(str).toString('base64');
const owner = hash('owner-fixture:with-colon');
const director = hash('director-fixture');
test('separate named accounts require explicit and valid deployment configuration', () => {
  for (const input of [undefined,'','v1.bad.bad','v1.'+owner+'.'+owner]) assert.equal(readAccounts(input),null);
  const accounts = readAccounts('v1.'+owner+'.'+director);
  assert.ok(matchesAccount(basic('german:owner-fixture:with-colon'),'german',accounts.owner));
  assert.ok(!matchesAccount(basic('directolog:director-fixture'),'german',accounts.owner));
  assert.equal(readAccounts('v1.'+owner+'.off').director,'off');
});
test('deployment-managed director sees only the report and can be disabled independently', async t => {
  async function serverFor(configuredDirector) {
    const app = express();
    const protectOwner = (req,res,next) => matchesAccount(req.headers.authorization,'german',owner) ? next() : res.sendStatus(401);
    registerDirectReport(app,{dataDir:'.',readLeads:async()=>[],protectOwner,configuredDirector});
    app.get('/api/leads',protectOwner,(_req,res)=>res.json([]));
    const server = await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s))});
    t.after(()=>new Promise(resolve=>server.close(resolve)));
    return (route,credentials) => fetch('http://127.0.0.1:'+server.address().port+route,{headers:{Authorization:basic(credentials)}});
  }
  const request = await serverFor(director);
  assert.equal((await request('/direct','directolog:director-fixture')).status,200);
  assert.equal((await request('/direct','directolog:wrong')).status,401);
  assert.equal((await request('/api/leads','directolog:director-fixture')).status,401);
  assert.equal((await request('/admin/direct-access','directolog:director-fixture')).status,401);
  assert.equal((await request('/admin/direct-access','german:owner-fixture:with-colon')).status,200);
  const disabled=await serverFor('off');
  assert.equal((await disabled('/direct','directolog:director-fixture')).status,401);
});
