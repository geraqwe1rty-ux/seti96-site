import {open} from 'node:fs/promises';
import path from 'node:path';
import {isTeploHost, readTeploLeads, validateTeploLead} from './teplo-leads.mjs';

// One delivery worker per Node process. DATA_DIR must be a persistent volume.
export function createTeploOutbox({dataDir, deliverDirect, now=Date.now}) {
  const active=new Map(), rate=new Map();
  let writes=Promise.resolve(), draining=false;
  const file=path.join(dataDir,'teplo-leads.ndjson');
  const save=lead=>{
    const line=JSON.stringify(lead)+'\n';
    const operation=writes.then(async()=>{
      const handle=await open(file,'a',0o600);
      try{await handle.writeFile(line);await handle.sync();}finally{await handle.close();}
    });
    writes=operation.catch(()=>{});return operation;
  };
  const confirmed=lead=>String(lead.telegram_status).startsWith('доставлено');
  const result=lead=>confirmed(lead)
    ? {code:200,data:{ok:true,saved:true,id:lead.id,delivery:'confirmed'}}
    : {code:202,data:{ok:true,saved:true,id:lead.id,delivery:'queued',error_code:lead.delivery_error||null}};
  async function deliver(lead){
    lead.delivery_attempts=(lead.delivery_attempts||0)+1;
    lead.last_attempt_at=now();
    // Persist the retry deadline before I/O so a restart does not lose the job.
    lead.next_attempt_at=now()+Math.min(3600000,30000*2**Math.min(lead.delivery_attempts-1,7));
    lead.telegram_status='в очереди отправки';
    await save(lead);
    try{
      const delivered=await deliverDirect({...lead,comment:[lead.topic,lead.comment].filter(Boolean).join('\n')});
      if(delivered?.ok===true){lead.telegram_status='доставлено (напрямую)';lead.next_attempt_at=null;lead.delivered_at=new Date(now()).toISOString();}
      else lead.delivery_error=[delivered?.code||'telegram_not_acknowledged',delivered?.reason].filter(Boolean).join(':');
    }catch{lead.delivery_error='telegram_connection_failed';}
    lead.updated_at=new Date(now()).toISOString();
    await save(lead);return result(lead);
  }
  async function accept(incoming){
    let lead=(await readTeploLeads(dataDir)).find(row=>row.id===incoming.id);
    if(lead){
      if(lead.fingerprint!==incoming.fingerprint)return {code:409,data:{error:'Данные заявки изменились. Обновите форму.'}};
      if(confirmed(lead))return result(lead);
      if(lead.delivery_engine==='server-v3'&&lead.next_attempt_at>now())return result(lead);
    }else{
      for(const [key,value] of rate)if(now()-value.at>=600000)rate.delete(key);
      const entry=rate.get(incoming.phone)||{at:now(),count:0};
      if(entry.count>=5)return {code:429,data:{error:'Слишком много заявок. Позвоните нам: +7 993 106-04-23.'}};
      entry.count++;rate.set(incoming.phone,entry);lead=incoming;
    }
    lead.delivery_engine='server-v3';
    return deliver(lead);
  }
  async function drain(){
    if(draining)return;draining=true;
    try{
      for(const candidate of await readTeploLeads(dataDir)){
        if(candidate.delivery_engine!=='server-v3'||confirmed(candidate)||candidate.next_attempt_at>now()||active.has(candidate.id))continue;
        const promise=(async()=>{
          const latest=(await readTeploLeads(dataDir)).find(row=>row.id===candidate.id);
          if(!latest||confirmed(latest)||latest.next_attempt_at>now())return;
          return deliver(latest);
        })().finally(()=>active.delete(candidate.id));
        active.set(candidate.id,{fingerprint:candidate.fingerprint,promise});
        await promise;
      }
    }finally{draining=false;}
  }
  async function handler(req,res,next){
    if(!isTeploHost(req))return next();
    res.set?.('Cache-Control','no-store');
    const parsed=validateTeploLead(req.body);
    if(parsed.error)return res.status(400).json({error:parsed.error});
    const {lead}=parsed;
    let job=active.get(lead.id);
    if(job&&job.fingerprint!==lead.fingerprint)return res.status(409).json({error:'Данные заявки изменились. Обновите форму.'});
    if(!job){
      const promise=accept(lead).finally(()=>active.delete(lead.id));
      job={fingerprint:lead.fingerprint,promise};active.set(lead.id,job);
    }
    try{
      const answer=await job.promise;
      // A concurrent background worker may already have acknowledged this record.
      const resolved=answer||result((await readTeploLeads(dataDir)).find(row=>row.id===lead.id));
      return res.status(resolved.code).json(resolved.data);
    }catch(error){
      console.error('Teplo outbox processing failed',error?.code||'storage_error');
      return res.status(503).json({error:'Не удалось подтвердить сохранение заявки. Повторите попытку или позвоните нам.'});
    }
  }
  return {handler,drain};
}
