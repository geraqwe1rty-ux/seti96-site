import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import http from 'node:http';
import express from 'express';
import {registerDirectReport} from '../direct-report.mjs';

test('owner issues and revokes an independent password; the report exposes only advertising fields', async t => {
  const dir = await mkdtemp(path.join(tmpdir(), 'seti96-direct-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  const basic = (login, password) => 'Basic '+Buffer.from(login+':'+password).toString('base64');
  const owner = basic('owner','fixture-only');
  const protectOwner = (req,res,next) => req.get('authorization')===owner ? next() : res.sendStatus(401);
  const created_at = new Date().toISOString();
  const leads = [
    {created_at,page:'camera.seti96.ru/',source:'https://ref.example/path?private=hidden-param',utm_campaign:'camera-search',name:'HiddenName',phone:'HiddenPhone',client_type:'HiddenAddress',comment:'HiddenMemo'},
    {created_at,page:'/promyvka/',source:'seti96.ru',yclid:'HiddenClickId',utm_campaign:'heating-search'},
    {created_at,page:'/promyvka/',utm_campaign:'excluded',comment:'SETI-AUDIT-20261117'},
    {created_at:'2025-01-01T12:00:00Z',source:'teplo.seti96.ru',utm_campaign:'old-campaign'},
    {created_at,page:'https://santehnika.seti96.ru/',utm_source:'<script>fixture</script>'}
  ];
  const app = express();
  registerDirectReport(app,{dataDir:dir,protectOwner,readLeads:async()=>leads});
  app.get('/api/leads',protectOwner,(_req,res)=>res.json(leads));
  const server = await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  function request(route, auth='', method='GET', origin='https://seti96.ru',body='') {
    return new Promise((resolve,reject)=>{
      const req = http.request({hostname:'127.0.0.1',port:server.address().port,path:route,method,headers:{host:'seti96.ru',origin,authorization:auth,'content-type':'application/x-www-form-urlencoded'}}, async res=>{
        const chunks = [];
        for await (const chunk of res) chunks.push(chunk);
        resolve({status:res.statusCode, headers:new Headers(res.headers), text:()=>Buffer.concat(chunks).toString()});
      });
      req.on('error',reject).end(body);
    });
  }
  const control='/admin/direct-access';
  const inactive=await request('/direct');
  assert.equal(inactive.status,401);
  assert.equal(inactive.headers.get('www-authenticate'),null);
  assert.match(inactive.text(),/Доступ пока не включён/);
  assert.equal((await request(control)).status,401);
  assert.equal((await request(control+'/issue',owner,'POST','https://other.example')).status,403);
  const result=await request(control+'/issue',owner,'POST');
  assert.equal(result.status,200);
  assert.match(result.headers.get('cache-control'),/no-store/);
  const password=(await result.text()).match(/<code>([A-Za-z0-9_-]{32})<\/code>/)[1];
  const reader=basic('directolog',password);
  assert.match(await readFile(path.join(dir,'direct-access.sha256'),'utf8'),/^[a-f0-9]{64}$/);
  assert.equal((await request(control+'/issue',owner,'POST')).status,303);
  const response=await request('/direct',reader);
  assert.equal(response.status,200);
  const html=await response.text();
  assert.match(html,/Заявок за период: 3/);
  for (const included of ['ref.example','Яндекс Директ','heating-search','camera-search','&lt;script&gt;fixture&lt;\/script&gt;']) assert.ok(html.includes(included));
  for (const hidden of ['HiddenPhone','HiddenName','HiddenAddress','HiddenMemo','HiddenClickId','hidden-param','old-campaign','excluded','<script>fixture']) assert.ok(!html.includes(hidden));
  const filtered=await (await request('/direct?days=all&site=teplo.seti96.ru',reader)).text();
  assert.match(filtered,/Заявок за период: 1/);
  assert.match(filtered,/old-campaign/);
  assert.ok(!filtered.includes('camera-search'));
  for (const route of ['/api/leads',control]) assert.equal((await request(route,reader)).status,401);
  assert.equal((await request(control+'/revoke',reader,'POST')).status,401);
  assert.equal((await request('/api/leads',owner)).status,200);
  assert.equal((await request(control+'/revoke',owner,'POST')).status,303);
  assert.equal((await request('/direct',reader)).status,401);
  const setup='/admin/direct-access/issue';
  const prepared='only-test-A7c9Zr1Q9aBx_123';
  const payload=new URLSearchParams({password:prepared}).toString();
  const canonical='https://seti96.ru';
  assert.equal((await request(setup,reader,'POST',canonical,payload)).status,401);
  assert.equal((await request(setup,owner,'POST',canonical,'password=short')).status,400);
  assert.equal((await request(setup,owner,'POST',canonical,payload)).status,200);
  const preparedReader=basic('directolog',prepared);
  assert.equal((await request('/direct',preparedReader)).status,200);
  assert.equal((await request('/api/leads',preparedReader)).status,401);
  assert.equal((await request(setup,owner,'POST',canonical,'password=other-secure-test-password-123456')).status,303);
  assert.equal((await request('/direct',preparedReader)).status,200);
  assert.equal((await request(control+'/revoke',owner,'POST')).status,303);
  assert.equal((await request('/direct',preparedReader)).status,401);
});
