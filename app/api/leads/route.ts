import {getChatGPTUser} from "../../chatgpt-auth";
const schema=`CREATE TABLE IF NOT EXISTS leads (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL, client_type TEXT NOT NULL, page TEXT, status TEXT NOT NULL DEFAULT 'новая', telegram_status TEXT NOT NULL DEFAULT 'не настроен', comment TEXT)`;
type RuntimeEnv={DB:D1Database;TELEGRAM_BOT_TOKEN?:string;TELEGRAM_CHAT_ID?:string};
async function runtime(){const {env}=await import("cloudflare:workers");const e=env as unknown as RuntimeEnv;await e.DB.prepare(schema).run();return e}
const clean=(v:string)=>v.replace(/[<>&]/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;"}[c]!));
export async function POST(req:Request){
 const b=await req.json() as Record<string,string>;
 if(!b.name||!b.phone||!b.clientType||b.name.length>100||b.phone.length>40)return Response.json({error:"Проверьте данные"},{status:400});
 const e=await runtime(),created=new Date().toISOString();
 const saved=await e.DB.prepare("INSERT INTO leads(created_at,name,phone,client_type,page,telegram_status) VALUES(?,?,?,?,?,'ожидает отправки')").bind(created,b.name,b.phone,b.clientType,b.page||"").run();
 const id=Number(saved.meta.last_row_id),origin=new URL(req.url).origin;
 let telegramStatus="не настроен";
 if(e.TELEGRAM_BOT_TOKEN&&e.TELEGRAM_CHAT_ID){
  const details=[["Тип клиента",b.clientType],["Имя",b.name],["Телефон",b.phone],["Дата и время",new Date(created).toLocaleString("ru-RU",{timeZone:"Asia/Yekaterinburg"})],["Страница",b.page],["Источник",b.source],["Кампания",b.utm_campaign],["Объявление",b.utm_content],["Поисковый запрос",b.utm_term]].filter(([,v])=>v);
  const text=["<b>Новая заявка с Сети96.рф</b>",...details.map(([k,v])=>`<b>${k}:</b> ${clean(v)}`)].join("\n");
  try{const tg=await fetch(`https://api.telegram.org/bot${e.TELEGRAM_BOT_TOKEN}/sendMessage`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({chat_id:e.TELEGRAM_CHAT_ID,text,parse_mode:"HTML",reply_markup:{inline_keyboard:[[{text:"Открыть заявку",url:`${origin}/admin`}]]}})});telegramStatus=tg.ok?"доставлено":`ошибка ${tg.status}`}catch{telegramStatus="ошибка доставки"}
 }
 await e.DB.prepare("UPDATE leads SET telegram_status=? WHERE id=?").bind(telegramStatus,id).run();
 return Response.json({ok:true});
}
export async function GET(){if(!await getChatGPTUser())return Response.json({error:"Требуется вход"},{status:401});const e=await runtime();const rows=await e.DB.prepare("SELECT * FROM leads ORDER BY id DESC LIMIT 200").all();return Response.json(rows.results)}
