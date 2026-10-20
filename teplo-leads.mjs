import {appendFile, readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

export const isTeploHost = req => String(req.hostname || '').toLowerCase() === 'teplo.seti96.ru';
const clean = (value, max) => String(value ?? '').trim().slice(0, max);
const relayUrl = 'https://seti96-engineering.german123312.chatgpt.site/api/leads';

export async function readTeploLeads(dataDir) {
  try {
    const rows = new Map();
    for (const line of (await readFile(path.join(dataDir, 'teplo-leads.ndjson'), 'utf8')).split('\n')) {
      if (line.trim()) { try { const lead = JSON.parse(line); rows.set(lead.id, lead); } catch {} }
    }
    return [...rows.values()];
  } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}

export function validateTeploLead(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {error:'Проверьте данные формы'};
  if (body.website) return {error:'Не удалось отправить форму'};
  if (body.consent !== true) return {error:'Необходимо согласие на обработку данных'};
  if (!/^\+7\d{10}$/.test(body.phone || '')) return {error:'Проверьте номер телефона'};
  if (!['Квартира','Частный дом','Организация'].includes(body.clientType)) return {error:'Выберите тип объекта'};
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId || '')) return {error:'Обновите страницу и повторите отправку'};
  const now = new Date().toISOString();
  const lead = {
    id: 'teplo-' + body.requestId.toLowerCase(), created_at: now,
    name: clean(body.name,100) || 'Не указано', phone: body.phone,
    client_type: body.clientType, service:'Тепловизионное обследование',
    address: clean(body.address,300), comment: clean(body.message,1200),
    topic: clean(body.topic,100), source:'teplo.seti96.ru', page:'https://teplo.seti96.ru/',
    form_place:clean(body.formPlace,80) || 'teplo-main',
    consent_at:now, policy_version:'teplo-2026-10-20', status:'новая',
    telegram_status:'ожидает доставки', delivery_attempts:0,
    ...Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content','utm_term','yclid','gclid','referrer','landing','metrika_client_id'].map(k=>[k,clean(body[k],400)]))
  };
  lead.fingerprint = createHash('sha256').update(JSON.stringify([lead.phone,lead.name,lead.client_type,lead.address,lead.comment,lead.topic])).digest('hex');
  return {lead};
}

export function createTeploLeadHandler({dataDir, deliverDirect, fetchImpl=fetch, env=process.env, publicRelayUrl=relayUrl}) {
  let writes = Promise.resolve();
  const active = new Map();
  const rate = new Map();
  const save = lead => {
    const operation = writes.then(()=>appendFile(path.join(dataDir,'teplo-leads.ndjson'),JSON.stringify(lead)+'\n',{encoding:'utf8',mode:0o600}));
    writes = operation.catch(()=>{});
    return operation;
  };
  async function processLead(lead, body) {
    const existing = (await readTeploLeads(dataDir)).find(row=>row.id===lead.id);
    if (existing) {
      if (existing.fingerprint !== lead.fingerprint) return {code:409,data:{error:'Данные заявки изменились. Обновите форму.'}};
      lead = existing;
      if (lead.telegram_status.startsWith('доставлено')) return {code:200,data:{ok:true,id:lead.id,delivery:'confirmed'}};
    }
    if (body.browserRelayReceipt === true) {
      if (!existing || body.receiptId !== lead.id) return {code:400,data:{error:'Не найдена сохранённая заявка'}};
      lead.telegram_status='подтверждено браузером, сервером не проверено';
      lead.updated_at=new Date().toISOString();
      await save(lead);
      return {code:202,data:{saved:true,id:lead.id,delivery:'browser-reported'}};
    }
    if (existing) {
      if (Date.now() - Number(lead.last_attempt_at || 0) < 10000) return {code:429,data:{saved:true,id:lead.id,error:'Заявка сохранена. Подождите несколько секунд перед повторной отправкой.'}};
    }
    const now=Date.now();
    for (const [key,entry] of rate) if(now-entry.at>600000) rate.delete(key);
    const count=rate.get(lead.phone)||{at:now,count:0};
    if(count.count>=5) return {code:429,data:{error:'Слишком много попыток. Позвоните нам: +7 993 106-04-23.'}};
    count.count++;rate.set(lead.phone,count);
    lead.delivery_attempts++;lead.last_attempt_at=now;
    lead.telegram_status='ожидает доставки';
    await save(lead);
    if (body.archiveOnly === true) return {code:202,data:{saved:true,id:lead.id,delivery:'pending'}};
    let delivered=false;
    if(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      try { const result=await deliverDirect({...lead,comment:[lead.topic,lead.comment].filter(Boolean).join('\n')}); delivered=result.ok===true; }
      catch { /* A saved request can still use the existing company relay. */ }
      if(delivered) lead.telegram_status='доставлено (напрямую)';
    }
    if(!delivered && publicRelayUrl) {
      try {
        const response=await fetchImpl(publicRelayUrl,{
          method:'POST',headers:{'content-type':'application/json','user-agent':'SETI96/1.0 (+https://teplo.seti96.ru)'},signal:AbortSignal.timeout(12000),
          body:JSON.stringify({...lead,clientType:lead.client_type,message:[lead.topic,lead.comment].filter(Boolean).join('\n'),formPlace:lead.form_place,leadId:lead.id,consent:true,policyVersion:lead.policy_version})
        });
        const result=await response.json();
        delivered=response.ok && result.ok===true && String(result.delivery||'').startsWith('доставлено');
        if(delivered) lead.telegram_status='доставлено (шлюз Сети96)';
      } catch { /* Delivery must be acknowledged; no browser-supplied flag is trusted. */ }
    }
    if(!delivered) lead.telegram_status='доставка не подтверждена';
    lead.updated_at=new Date().toISOString();
    await save(lead);
    return delivered
      ? {code:200,data:{ok:true,id:lead.id,delivery:'confirmed'}}
      : {code:502,data:{saved:true,id:lead.id,error:'Заявка сохранена, но доставка специалисту пока не подтверждена. Повторите попытку или позвоните: +7 993 106-04-23.'}};
  }
  return async function(req,res,next) {
    if(!isTeploHost(req)) return next();
    res.set?.('Cache-Control','no-store');
    const parsed=validateTeploLead(req.body);
    if(parsed.error) return res.status(400).json({error:parsed.error});
    const {lead}=parsed;
    const pending=active.get(lead.id);
    if(pending && pending.fingerprint!==lead.fingerprint) return res.status(409).json({error:'Данные заявки изменились. Обновите форму.'});
    if(!pending) {
      const promise=processLead(lead, req.body).finally(()=>active.delete(lead.id));
      active.set(lead.id,{fingerprint:lead.fingerprint,promise});
    }
    try {const result=await active.get(lead.id).promise;return res.status(result.code).json(result.data);}
    catch(error) {console.error('Teplo lead processing failed:',error?.code||'processing-error');return res.status(503).json({error:'Не удалось подтвердить обработку заявки. Повторите попытку или позвоните нам.'});}
  };
}
