import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {randomUUID} from 'node:crypto';
const freePort=()=>new Promise(resolve=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p))})});
test('built production server: saved request unlocks thanks once; bad or direct requests never do',async()=>{
 const dataDir=await mkdtemp(path.join(tmpdir(),'heating-http-')),port=await freePort(),appPort=await freePort();
 const child=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:String(port),APP_INTERNAL_PORT:String(appPort),DATA_DIR:dataDir,TELEGRAM_BOT_TOKEN:'',TELEGRAM_CHAT_ID:'',LEAD_RELAY_URL:'',LEAD_RELAY_SECRET:''},stdio:'pipe'});
 let logs='';child.stdout.on('data',v=>logs+=v);child.stderr.on('data',v=>logs+=v);
 const origin=`http://127.0.0.1:${port}`;
 try{
  let ready=false;
  for(let n=0;n<100;n++){try{if((await fetch(origin+'/health')).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}
  assert.ok(ready,logs);
  const landing=await fetch(origin+'/promyvka/');assert.equal(landing.status,200);assert.match(await landing.text(),/heating-20261027-v1/);
  assert.equal((await fetch(origin+'/promyvka/styles.css')).status,200);
  assert.equal((await fetch(origin+'/spasibo',{redirect:'manual'})).status,303);
  const post=body=>fetch(origin+'/api/heating-leads',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  const bad=await post({phone:'123'});assert.equal(bad.status,400);assert.equal(bad.headers.get('set-cookie'),null);
  const body={phone:'+79990000000',clientType:'Частный дом',consent:true,requestId:randomUUID(),placement:'one-screen'};
  const accepted=await post(body),reply=await accepted.json();assert.equal(accepted.status,202);assert.equal(reply.delivery,'queued');assert.equal(reply.thankYouUrl,'/spasibo');
  const cookie=accepted.headers.get('set-cookie').split(';')[0];
  const thank=await fetch(origin+'/spasibo',{headers:{cookie},redirect:'manual'});assert.equal(thank.status,200);assert.match(await thank.text(),/Заявка принята/);assert.equal(thank.headers.get('x-robots-tag'),'noindex, nofollow');
  assert.equal((await fetch(origin+'/spasibo',{headers:{cookie},redirect:'manual'})).status,303);
  const repeated=await post(body);assert.equal(repeated.headers.get('set-cookie'),null);assert.equal((await repeated.json()).id,reply.id);
  let main;
  for(let n=0;n<100;n++){main=await fetch(origin+'/');if(main.ok)break;await new Promise(r=>setTimeout(r,100))}
  assert.equal(main.status,200,logs);
 }finally{child.kill('SIGTERM');await new Promise(r=>child.once('exit',r));await rm(dataDir,{recursive:true,force:true})}
});
