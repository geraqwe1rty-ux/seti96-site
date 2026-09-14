import {appendFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

export const isUslugiHost=req=>String(req.hostname||'').toLowerCase()==='uslugi.seti96.ru';
const clean=(value,limit)=>String(value??'').trim().slice(0,limit);
export function validateUslugiLead(body){
  if(body.website)return {error:'Не удалось отправить форму',status:400};
  if(body.consent!==true)return {error:'Необходимо согласие на обработку данных',status:400};
  if(!/^\+7\d{10}$/.test(String(body.phone||'')))return {error:'Проверьте номер телефона',status:400};
  if(!['Квартира','Частный дом','Организация'].includes(body.clientType))return {error:'Выберите тип объекта',status:400};
  return {lead:{id:randomUUID(),created_at:new Date().toISOString(),name:clean(body.name,100)||'Не указано',phone:body.phone,client_type:body.clientType,service:clean(body.service,250),address:clean(body.address,250),comment:clean(body.message,1500),page:clean(body.page,500),form_place:'request-page',source:'uslugi.seti96.ru',consent_at:new Date().toISOString(),policy_version:'2026-09-14-uslugi',status:'новая',telegram_status:'ожидает доставки',...Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content','utm_term','yclid','referrer'].map(k=>[k,clean(body[k],300)]))}};
}
export async function readUslugiLeads(dataDir){
  try{const text=await readFile(path.join(dataDir,'uslugi-leads.ndjson'),'utf8');const latest=new Map();for(const line of text.split('\n'))if(line.trim()){try{const lead=JSON.parse(line);latest.set(lead.id,lead)}catch{}}return Array.from(latest.values()).sort((a,b)=>b.created_at.localeCompare(a.created_at))}
  catch(e){if(e.code==='ENOENT')return [];throw e}
}
export function createUslugiLeadHandler({dataDir,deliverDirect,env=process.env}){
  let writing=Promise.resolve();const attempts=new Map();
  const save=lead=>{const operation=writing.then(()=>appendFile(path.join(dataDir,'uslugi-leads.ndjson'),JSON.stringify(lead)+'\n','utf8'));writing=operation.catch(()=>{});return operation};
  return async function(req,res,next){
    if(!isUslugiHost(req))return next();
    const parsed=validateUslugiLead(req.body||{});if(parsed.error)return res.status(parsed.status).json({error:parsed.error});
    const lead=parsed.lead;const now=Date.now();for(const [key,value] of attempts)if(now-value.time>600000)attempts.delete(key);
    const recent=attempts.get(lead.phone)||{time:now,count:0};if(recent.count>=5)return res.status(429).json({error:'Слишком много обращений с этого номера. Позвоните нам.'});recent.count++;attempts.set(lead.phone,recent);
    try{
      await save(lead);
      let delivered=false;
      if(env.TELEGRAM_BOT_TOKEN&&env.TELEGRAM_CHAT_ID){const result=await deliverDirect(lead);delivered=result.ok;lead.telegram_status=result.ok?'доставлено (напрямую)':'не удалось доставить напрямую'}
      if(!delivered&&env.LEAD_RELAY_URL&&env.LEAD_RELAY_SECRET){
        try{const response=await fetch(env.LEAD_RELAY_URL.trim(),{method:'POST',headers:{'content-type':'application/json'},signal:AbortSignal.timeout(8000),body:JSON.stringify({...lead,clientType:lead.client_type,problem:lead.comment,message:lead.comment,formPlace:lead.form_place,leadId:lead.id,adminUrl:'https://uslugi.seti96.ru/admin',secret:env.LEAD_RELAY_SECRET.trim()})});const result=await response.json();delivered=response.ok&&result.ok===true;lead.telegram_status=delivered?'доставлено (шлюз)':'ошибка доставки через шлюз'}catch{lead.telegram_status='ошибка доставки через шлюз'}
      }
      if(!delivered&&lead.telegram_status==='ожидает доставки')lead.telegram_status='доставка не настроена';
      await save(lead);
      if(!delivered)return res.status(502).json({error:'Обращение сохранено, но доставка специалисту не подтверждена',saved:true});
      return res.json({ok:true,id:lead.id});
    }catch(error){console.error('Uslugi lead processing failed',error?.code||'unknown');return res.status(503).json({error:'Не удалось подтвердить обработку обращения'})}
  }
}
