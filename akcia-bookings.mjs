import {open, readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

const towns = {
  rassokha: ['Рассоха','2026-11-07'],
  'verkhnee-dubrovo': ['Верхнее Дуброво','2026-11-08'],
  aramil: ['Арамиль','2026-11-09'],
  kosulino: ['Косулино','2026-11-10'],
};
const filename = 'akcia-bookings.ndjson';
const delivered = row => row.telegram_status === 'доставлено (напрямую)';
export async function readAkciaBookings(dataDir) {
  let text;
  try { text = await readFile(path.join(dataDir,filename),'utf8'); }
  catch(error) { if(error.code==='ENOENT') return []; throw error; }
  const rows = new Map();
  for(const line of text.split('\n')) {
    if(!line.trim()) continue;
    // Ignore an incomplete final append after a process crash; complete records survive.
    try {const row=JSON.parse(line); rows.set(row.id,row);} catch {}
  }
  return [...rows.values()];
}
export function validateAkciaBooking(body, now=Date.now()) {
  if(!body || typeof body!=='object' || Array.isArray(body) || body.website) return {error:'Проверьте данные формы.'};
  const town=Object.hasOwn(towns,body.town)?towns[body.town]:null;
  if(!town) return {error:'Выберите населённый пункт из списка.'};
  if(now>Date.parse(town[1]+'T18:00:00+05:00')) return {error:'Запись на этот выезд завершена.'};
  let phone=typeof body.phone==='string'?body.phone.replace(/\D/g,''):'';
  if(phone.length===10) phone='7'+phone;
  if(phone.startsWith('8')) phone='7'+phone.slice(1);
  if(!/^7\d{10}$/.test(phone)) return {error:'Укажите телефон полностью: +7 и ещё 10 цифр.'};
  const address=typeof body.address==='string'?body.address.trim().replace(/\s+/g,' '):'';
  if(address.length<5 || address.length>250) return {error:'Укажите улицу и номер дома (от 5 до 250 символов).'};
  if(body.consent!==true) return {error:'Для записи необходимо согласие на обработку данных.'};
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId||'')) return {error:'Обновите страницу и отправьте заявку ещё раз.'};
  const reference=body.requestId.slice(0,8).toUpperCase();
  const row={id:'akcia-'+body.requestId.toLowerCase(),reference,created_at:new Date(now).toISOString(),
    name:'Заявка по акции «Тепловизор за 800 ₽»',phone:'+'+phone,address:town[0]+', '+address,
    town:town[0],visit_date:town[1],price_rub:800,client_type:'Частный дом',source:'akcia.seti96.ru',
    service:'Тепловизор · акция 800 ₽',page:'https://akcia.seti96.ru/',form_place:'promo-800-november-2026',
    comment:`Предварительный выезд: ${Number(town[1].slice(-2))} ноября 2026, 10:00–18:00 (Екатеринбург).\n800 ₽: обследование, снимки, развёрнутое заключение и рекомендации.\nПозвоните клиенту для подтверждения времени.\nНомер заявки: ${reference}`,
    consent_at:new Date(now).toISOString(),policy_version:'2026-11-04',status:'новая',
    telegram_status:'в очереди отправки',delivery_attempts:0,next_attempt_at:now};
  row.fingerprint=createHash('sha256').update(JSON.stringify([row.phone,row.address,row.visit_date])).digest('hex');
  return {row};
}
export function createAkciaBookings({dataDir,deliverDirect,now=Date.now}) {
  let writes=Promise.resolve(), accepts=Promise.resolve(), draining=null;
  const save=row=>{
    const line=JSON.stringify(row)+'\n';
    const pending=writes.then(async()=>{
      const handle=await open(path.join(dataDir,filename),'a',0o600);
      try {await handle.writeFile(line);await handle.sync();} finally {await handle.close();}
    });
    writes=pending.catch(()=>{});return pending;
  };
  const load=async()=>{await writes;return readAkciaBookings(dataDir);};
  const answer=row=>({code:delivered(row)?200:202,data:{ok:true,reference:row.reference,delivery:delivered(row)?'confirmed':'queued'}});
  async function accept(incoming) {
    const records=await load(), previous=records.find(row=>row.id===incoming.id);
    if(previous) return previous.fingerprint===incoming.fingerprint?answer(previous):{code:409,data:{error:'Данные заявки изменились. Обновите форму и повторите отправку.'}};
    if(records.filter(row=>row.phone===incoming.phone && Date.parse(row.created_at)>now()-3600000).length>=3)
      return {code:429,data:{error:'Вы уже оставили несколько заявок. Дождитесь звонка специалиста.'}};
    await save(incoming);
    return answer(incoming);
  }
  function drain() {
    if(draining) return draining;
    draining=(async()=>{try {
      const due=(await load()).filter(row=>!delivered(row)&&row.next_attempt_at<=now()).slice(0,5);
      for(const row of due) {
        row.delivery_attempts++;
        row.next_attempt_at=now()+Math.min(3600000,30000*2**Math.min(row.delivery_attempts-1,7));
        await save(row);
        try {
          const result=await deliverDirect(row);
          if(result?.ok===true) {row.telegram_status='доставлено (напрямую)';row.next_attempt_at=null;row.delivered_at=new Date(now()).toISOString();delete row.delivery_error;}
          else row.delivery_error=result?.code||'telegram_not_acknowledged';
        } catch {row.delivery_error='telegram_connection_failed';}
        await save(row);
      }
    } finally {draining=null;}})();
    return draining;
  }
  async function handler(req,res) {
    res.set('Cache-Control','no-store');
    if(req.headers.origin && req.headers.origin!=='https://akcia.seti96.ru') return res.status(403).json({error:'Обновите страницу и повторите попытку.'});
    if(!String(req.headers['content-type']||'').toLowerCase().includes('application/json')) return res.status(415).json({error:'Неверный формат заявки.'});
    const parsed=validateAkciaBooking(req.body,now());
    if(parsed.error) return res.status(400).json({error:parsed.error});
    // Acknowledge disk persistence before contacting Telegram. The browser's
    // connection lifetime cannot cancel delivery or turn a saved lead into an error.
    const pending=accepts.then(()=>accept(parsed.row));
    accepts=pending.catch(()=>{});
    try {
      const result=await pending;
      res.status(result.code).json(result.data);
      if(result.data.ok) setImmediate(()=>void drain().catch(error=>console.error('Akcia delivery retry',error?.code||'storage_error')));
      return res;
    } catch(error) {
      console.error('Akcia booking persistence',error?.code||'storage_error');
      return res.status(503).json({error:'Не удалось сохранить заявку. Проверьте соединение и повторите отправку.'});
    }
  }
  return {handler,drain};
}
