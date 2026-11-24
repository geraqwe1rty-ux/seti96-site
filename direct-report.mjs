import {createHash, randomBytes, timingSafeEqual} from 'node:crypto';
import {readFile, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';

const sites = new Map([
  ['seti96.ru', ['Основной сайт', 111900032]],
  ['seti96.ru/promyvka', ['Промывка отопления', 113822833]],
  ['teplo.seti96.ru', ['Тепловизор', 113687988]],
  ['akcia.seti96.ru', ['Акция «Тепловизор»', 113687988]],
  ['santehnika.seti96.ru', ['Сантехника', 111937544]],
  ['electro.seti96.ru', ['Электрика', 111934175]],
  ['camera.seti96.ru', ['Видеонаблюдение', 111936559]],
  ['prochistka.seti96.ru', ['Прочистка канализации', 112523744]],
  ['avariya.seti96.ru', ['Аварийные работы', 112017198]],
  ['gromkaya-svyaz.seti96.ru', ['Громкая связь', 112011543]],
  ['uslugi.seti96.ru', ['Каталог услуг', 112564086]]
]);
const ownerPath = '/admin/direct-access';
const reportPath = '/direct';
const passwordHash = value => createHash('sha256').update(value).digest();
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const localTime = new Intl.DateTimeFormat('ru-RU', {timeZone:'Asia/Yekaterinburg', dateStyle:'short', timeStyle:'short'});

function asUrl(value) {
  if (typeof value !== 'string' || !value) return;
  try {
    if (/^https?:\/\//i.test(value)) return new URL(value);
    if (/^[\w.-]+\.[\w-]+(?:\/|$)/.test(value)) return new URL('https://' + value);
  } catch {}
}

function leadSite(lead) {
  const urls = [lead.page, lead.landing, lead.source].map(asUrl).filter(Boolean);
  const localPath = typeof lead.page === 'string' && /^\/[^/]/.test(lead.page) ? lead.page : '';
  for (const url of urls) {
    let host = url.hostname.replace(/^www\./, '');
    if (host === 'xn--96-mlcm7bh.xn--p1ai') host = 'seti96.ru';
    if (!sites.has(host)) continue;
    if (host === 'seti96.ru' && [url.pathname, localPath].some(p => /^\/promyvka(?:[/?#]|$)/.test(p))) return 'seti96.ru/promyvka';
    return host;
  }
  // Older primary forms wrote their local pathname without a hostname.
  if (typeof lead.page === 'string' && /^\/(?!\/)/.test(lead.page)) return /^\/promyvka(?:[/?#]|$)/.test(lead.page) ? 'seti96.ru/promyvka' : 'seti96.ru';
  return 'Не определён';
}

function attribution(lead) {
  if (lead.utm_source) return String(lead.utm_source).slice(0,160);
  if (lead.yclid) return 'Яндекс Директ';
  if (lead.gclid) return 'Google Ads';
  for (const value of [lead.referrer, lead.source]) {
    const url = asUrl(value);
    if (url) {
      if (!/(^|\.)(seti96\.ru|xn--96-mlcm7bh\.xn--p1ai)$/.test(url.hostname)) return url.hostname;
    } else if (value && value !== 'сайт') return String(value).slice(0,160);
  }
  return 'Без метки';
}

function table(head, rows, empty) {
  return '<div class="scroll"><table><thead><tr>' + head.map(h=>'<th>'+h+'</th>').join('') +
    '</tr></thead><tbody>' + (rows.length ? rows.map(row=>'<tr>'+row.map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('') :
      '<tr><td colspan="'+head.length+'">'+esc(empty)+'</td></tr>') + '</tbody></table></div>';
}

function page(title, body) {
  return '<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(title) +
    ' · Сети96</title><style>*{box-sizing:border-box}body{margin:0;background:#f4f6f8;color:#172936;font:16px/1.5 Inter,Arial,sans-serif}main{max-width:1150px;margin:auto;padding:32px 20px}header{display:flex;align-items:baseline;gap:18px;border-bottom:2px solid #066452;padding-bottom:16px}h1{font-size:clamp(23px,4vw,32px);margin:0}h2{font-size:21px;margin:28px 0 10px}form{display:flex;gap:12px;align-items:end;flex-wrap:wrap;margin:20px 0}label{display:grid;gap:4px}button,select{font:inherit;border:1px solid #a9b6c1;border-radius:6px;background:white;padding:8px 12px}button{background:#125c51;color:white;cursor:pointer}a{color:#075b86}table{border-collapse:collapse;min-width:560px;width:100%;background:#fff}td,th{text-align:left;vertical-align:top;padding:9px 12px;border-bottom:1px solid #dee4e8;overflow-wrap:anywhere}th{font-size:14px;color:#3e5667}.scroll{overflow:auto}small{color:#526676}nav a{margin-right:14px}code{user-select:all;font-size:16px;overflow-wrap:anywhere}details{margin:20px 0}summary{cursor:pointer}</style><main><header><b>Сети96</b><h1>' + esc(title) + '</h1></header>' + body + '</main></html>';
}

function report(leads, query) {
  const days = ['7','30','90','all'].includes(query.days) ? query.days : '30';
  const site = sites.has(query.site) || query.site === 'Не определён' ? query.site : '';
  // Екатеринбург is UTC+05:00. Include today and the preceding N-1 local calendar days.
  const day = 86400000, offset = 5 * 3600000;
  const start = days === 'all' ? -Infinity : Math.floor((Date.now()+offset)/day)*day-offset-(Number(days)-1)*day;
  const rows = [];
  const totals = new Map();
  for (const lead of leads) {
    const time = Date.parse(lead.created_at);
    if (!Number.isFinite(time) || time < start) continue;
    if ([lead.name,lead.comment,lead.utm_campaign].some(v=>typeof v === 'string' && /\bSETI-AUDIT-\d{8}\b/i.test(v))) continue;
    const host = leadSite(lead);
    if (site && host !== site) continue;
    const source = attribution(lead);
    const campaign = String(lead.utm_campaign || 'Без метки').slice(0,200);
    const key = JSON.stringify([host, source, campaign]);
    totals.set(key, (totals.get(key) || 0) + 1);
    rows.push({time, host, source, campaign});
  }
  rows.sort((a,b)=>b.time-a.time);
  const pageCount = Math.max(1, Math.ceil(rows.length/50));
  const current = Math.min(pageCount, Math.max(1, parseInt(query.p,10)||1));
  const link = p => reportPath+'?'+esc(new URLSearchParams({site,days,p:String(p)}));
  const option = (v, label, selected) => '<option value="'+esc(v)+'"'+(v===selected?' selected':'')+'>'+esc(label)+'</option>';
  const summary = [...totals].sort((a,b)=>b[1]-a[1]).map(([k,n])=>[...JSON.parse(k),n]);
  const list = rows.slice((current-1)*50,current*50).map(row=>[localTime.format(row.time),row.host,row.source,row.campaign]);
  const metrics = [...sites].filter(([key])=>!site||key===site).map(([key,[label,id]])=>'<li><a href="https://metrika.yandex.ru/dashboard?id='+id+'">'+esc(label)+'</a> · '+esc(key)+'</li>').join('');
  const filters = '<form method="get"><label>Сайт<select name="site">'+option('','Все сайты',site)+[...sites].map(([k,[l]])=>option(k,l,site)).join('')+option('Не определён','Не определён',site)+'</select></label><label>Период<select name="days">'+[['7','7 дней'],['30','30 дней'],['90','90 дней'],['all','Весь журнал']].map(([k,l])=>option(k,l,days)).join('')+'</select></label><button>Показать</button></form>';
  return page('Отчёт по рекламе',filters+'<h2>Заявок за период: '+rows.length+'</h2>'+
    table(['Сайт','Источник','Кампания','Заявки'],summary,'За выбранный период заявок нет.')+
    '<h2>Журнал заявок</h2>'+table(['Екатеринбург','Сайт','Источник','Кампания'],list,'Нет записей.')+
    (pageCount>1 ? '<nav>'+(current>1?'<a href="'+link(current-1)+'">Назад</a>':'')+'Страница '+current+' из '+pageCount+' '+(current<pageCount?'<a href="'+link(current+1)+'">Дальше</a>':'')+'</nav>' : '')+
    '<p><small>Количество по серверному журналу. Заявки с проверочной меткой SETI-AUDIT исключены. «Без метки» означает, что источник или кампания не записаны.</small></p>'+
    '<details><summary>Посещаемость и расходы на рекламу</summary><p>Посещения и цели доступны в Яндекс Метрике под вашим логином. Расходы по кампаниям — в <a href="https://direct.yandex.ru/">Яндекс Директе</a>.</p><ul>'+metrics+'</ul></details>');
}

export function registerDirectReport(app, {dataDir, readLeads, protectOwner}) {
  const file = path.join(dataDir, 'direct-access.sha256');
  async function currentHash() {
    try { return (await readFile(file,'utf8')).trim(); }
    catch (e) { if (e.code === 'ENOENT') return ''; throw e; }
  }
  function privatePage(req,res,next) {
    res.set({'Cache-Control':'private, no-store','Vary':'Authorization','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"});
    next();
  }
  app.use([ownerPath,reportPath],privatePage);
  app.use(ownerPath,protectOwner);
  const loginInfo = '<p>Адрес для специалиста: <a href="https://seti96.ru/direct">https://seti96.ru/direct</a><br>Логин: <b>directolog</b></p>';
  app.get(ownerPath,async (_req,res)=>{
    const active = Boolean(await currentHash());
    res.send(page('Доступ директолога',loginInfo+'<p>'+(active?'Доступ включён.':'Доступ пока выключен.')+'</p>'+
      '<form method="post" action="'+ownerPath+'/'+(active?'revoke':'issue')+'"><button>'+(active?'Отозвать доступ':'Создать пароль')+'</button></form>'));
  });
  app.post(ownerPath+'/:action', async (req,res)=>{
    if (req.headers.origin !== 'https://seti96.ru' || req.hostname !== 'seti96.ru') return res.sendStatus(403);
    if (req.params.action === 'revoke') {
      await rm(file,{force:true});
      return res.redirect(303,ownerPath);
    }
    if (req.params.action !== 'issue') return res.sendStatus(404);
    const password = randomBytes(24).toString('base64url');
    // Exclusive creation prevents a double click or a retry from replacing a valid password.
    try { await writeFile(file,passwordHash(password).toString('hex'),{mode:0o600,flag:'wx',flush:true}); }
    catch (e) { if (e.code==='EEXIST') return res.redirect(303,ownerPath); throw e; }
    res.send(page('Пароль создан',loginInfo+'<p>Пароль: <code>'+esc(password)+'</code></p><p>Скопируйте пароль и передайте директологу лично. Он отображается один раз.</p><a href="'+ownerPath+'">Управление доступом</a>'));
  });
  app.get(reportPath,async (req,res)=>{
    const header = String(req.headers.authorization || '');
    const pair = header.startsWith('Basic ') ? Buffer.from(header.slice(6),'base64').toString('utf8') : '';
    const stored = await currentHash();
    const correct = pair.startsWith('directolog:') && /^[0-9a-f]{64}$/.test(stored) && timingSafeEqual(passwordHash(pair.slice('directolog:'.length)),Buffer.from(stored,'hex'));
    if (!correct) return res.set('WWW-Authenticate','Basic realm="Seti96 Ads"').status(401).send('Требуется вход директолога');
    res.send(report(await readLeads(),req.query));
  });
}
