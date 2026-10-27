import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {createTeploOutbox} from './teplo-outbox.mjs';

const clean=(value,max=400)=>String(value??'').trim().slice(0,max);
export const isHeatingHost=req=>['seti96.ru','www.seti96.ru','localhost','127.0.0.1'].includes(String(req.hostname||'').toLowerCase());
export async function readHeatingLeads(dataDir){
  try{
    const rows=new Map();
    for(const line of (await readFile(path.join(dataDir,'heating-leads.ndjson'),'utf8')).split('\n')){
      if(line.trim()){try{const row=JSON.parse(line);rows.set(row.id,row);}catch{}}
    }
    return [...rows.values()];
  }catch(error){if(error.code==='ENOENT')return [];throw error;}
}
export function validateHeatingLead(body){
  if(!body||typeof body!=='object'||Array.isArray(body)||body.website)return {error:'Проверьте данные формы'};
  if(body.consent!==true)return {error:'Необходимо согласие на обработку данных'};
  if(!/^\+7\d{10}$/.test(body.phone||''))return {error:'Проверьте номер телефона'};
  if(!['Частный дом','Квартира','УК / организация'].includes(body.clientType))return {error:'Выберите тип объекта'};
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId||''))return {error:'Обновите страницу и повторите отправку'};
  const now=new Date().toISOString();
  const lead={
    id:'heating-'+body.requestId.toLowerCase(),created_at:now,name:clean(body.name,100)||'Не указано',phone:body.phone,
    client_type:body.clientType,service:'Диагностика и промывка отопления',source:'seti96.ru',
    page:clean(body.page,500),form_place:clean(body.placement||body.formPlace,80),
    address:clean(body.address,300),comment:clean(body.message,1200),topic:clean(body.topic,100),
    consent_at:now,policy_version:clean(body.policyVersion,80),status:'новая',telegram_status:'ожидает доставки',delivery_attempts:0,
    ...Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content','utm_term','yclid','gclid','referrer','landing','metrika_client_id'].map(k=>[k,clean(body[k])]))
  };
  lead.fingerprint=createHash('sha256').update(JSON.stringify([lead.phone,lead.name,lead.client_type,lead.address,lead.comment,lead.topic])).digest('hex');
  return {lead};
}
export function createHeatingOutbox(options){
  return createTeploOutbox({...options,matches:isHeatingHost,validate:validateHeatingLead,readRecords:readHeatingLeads,fileName:'heating-leads.ndjson'});
}
