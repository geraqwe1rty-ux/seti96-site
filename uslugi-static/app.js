/* Сети96: navigation, catalogue, quotation, leads and consent-aware analytics. */
'use strict';
const counter = 112564086;
const storage = {get:k=>{try{return localStorage.getItem(k)}catch{return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch{}}};
const goal=(name,params={})=>{if(storage.get('seti96-analytics')==='yes'&&typeof window.ym==='function')window.ym(counter,'reachGoal',name,params)};
function loadMetrika(){
  if(window.__seti96Metrika)return;
  window.__seti96Metrika=true;
  (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r)return}k=e.createElement(t);a=e.getElementsByTagName(t)[0];k.async=1;k.src=r;a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=112564086','ym');
  window.ym(counter,'init',{ssr:true,webvisor:true,clickmap:true,ecommerce:'dataLayer',referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});
}
const cookieBanner=document.querySelector('.cookie-banner');
if(storage.get('seti96-analytics')==='yes')loadMetrika();
else if(!storage.get('seti96-analytics')&&cookieBanner)cookieBanner.hidden=false;
document.querySelectorAll('[data-cookies]').forEach(b=>b.addEventListener('click',()=>{const value=b.dataset.cookies;storage.set('seti96-analytics',value);cookieBanner.hidden=true;if(value==='yes')loadMetrika();else if(window.__seti96Metrika){if(typeof window.ym==='function')window.ym(counter,'destruct');window.__seti96Metrika=false;location.reload()}}));
document.querySelectorAll('[data-cookie-settings]').forEach(b=>b.addEventListener('click',()=>{cookieBanner.hidden=false;cookieBanner.querySelector('button').focus()}));
const menu=document.querySelector('.menu-toggle'),mobile=document.querySelector('.mobile-menu');
menu?.addEventListener('click',()=>{mobile.hidden=!mobile.hidden;menu.setAttribute('aria-expanded',String(!mobile.hidden))});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&mobile&&!mobile.hidden){mobile.hidden=true;menu.setAttribute('aria-expanded','false');menu.focus()}});
document.querySelectorAll('a[href^="tel:"]').forEach(a=>a.addEventListener('click',()=>goal('phone_click')));
document.querySelectorAll('a[href^="https://t.me/"]').forEach(a=>a.addEventListener('click',()=>goal('telegram_click')));
document.querySelectorAll('a[href^="mailto:"]').forEach(a=>a.addEventListener('click',()=>goal('email_click')));
const search=document.querySelector('#service-search'),filter=document.querySelector('#category-filter');
function filterServices(){let count=0;const q=search.value.toLocaleLowerCase('ru').trim();document.querySelectorAll('[data-search]').forEach(r=>{r.hidden=!(q.split(/\s+/).every(w=>r.dataset.search.includes(w))&&(!filter.value||r.dataset.category===filter.value));if(!r.hidden)count++});document.querySelector('#result-count').textContent='Найдено: '+count;document.querySelector('.empty').hidden=count>0}
search?.addEventListener('input',filterServices);filter?.addEventListener('change',filterServices);
const query=new URLSearchParams(location.search),selectedService=query.get('usluga');
document.querySelectorAll('select[name="service"]').forEach(s=>{if(selectedService&&Array.from(s.options).some(o=>o.value===selectedService))s.value=selectedService});
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n))+' ₽';
function estimate(service,quantity,zone,forceHeavy){
  if(!service||service.low===null||zone===4||service.monthly)return {custom:true};
  const mins=[5000,8000,10000,12000],fees=[0,3000,5000,7000];
  const workMin=Math.max(service.minimum||0,mins[zone]);
  const low=Math.max(service.low*quantity,workMin),high=Math.max((service.high||service.low)*quantity,workMin);
  const transport=fees[zone]*((forceHeavy||service.heavy)?1.5:1);
  return{low:low+transport,high:high+transport,work:low,transport,from:!service.high};
}
const estimator=document.querySelector('#estimate-form');
if(estimator){let items=[],previousService=null;fetch('/services.json').then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{items=data;renderEstimate()}).catch(()=>{document.querySelector('#estimate-result').textContent='Расчёт временно недоступен. Позвоните +7 993 106-04-23.'});function renderEstimate(){const s=items.find(x=>x.slug===estimator.elements.service.value);if(!s)return;const heavy=estimator.elements.heavy;heavy.disabled=s.heavy;const quantity=Number(estimator.elements.quantity.value);const zone=Number(estimator.elements.zone.value);if(previousService!==s.slug){heavy.checked=!!s.heavy;previousService=s.slug}const result=document.querySelector('#estimate-result');if(!Number.isInteger(quantity)||quantity<1||quantity>1000){result.textContent='Укажите целое количество от 1 до 1000.';return}const v=estimate(s,quantity,zone,heavy.checked);if(v.custom)result.innerHTML='<strong>Индивидуальный расчёт</strong><small>Для этой услуги или зоны требуется уточнение объекта.</small>';else result.innerHTML='<span>Ориентир за заказ</span><strong>'+(v.from?'от ':'')+fmt(v.low)+(v.high!==v.low?' – '+fmt(v.high):'')+'</strong><small>Работы с учётом минимума: '+fmt(v.work)+'<br>Транспортная доплата: '+fmt(v.transport)+'</small>';document.querySelector('#estimate-request').href='/zayavka/?usluga='+encodeURIComponent(s.slug)}estimator.addEventListener('input',renderEstimate);estimator.addEventListener('change',renderEstimate);estimator.addEventListener('submit',e=>e.preventDefault());document.querySelector('#estimate-request').addEventListener('click',()=>goal('estimate_request'))}
const leadForm=document.querySelector('#lead-form');
if(location.pathname==='/zayavka/')document.querySelectorAll('a[href="/zayavka/"]').forEach(a=>{a.href='#lead-form'});
if(leadForm){let started=false;leadForm.addEventListener('input',()=>{if(!started){goal('lead_start');started=true}},{passive:true});leadForm.addEventListener('submit',async e=>{
 e.preventDefault();const status=leadForm.querySelector('.form-status'),button=leadForm.querySelector('[type="submit"]');status.textContent='';
 const data=Object.fromEntries(new FormData(leadForm));let digits=String(data.phone||'').replace(/\D/g,'');if(digits.length===10)digits='7'+digits;else if(digits.length===11&&digits[0]==='8')digits='7'+digits.slice(1);
 if(!/^7\d{10}$/.test(digits)){status.textContent='Проверьте телефон: нужен российский номер из 11 цифр, начиная с 7 или 8.';leadForm.elements.phone.focus();return}
 if(data.website){status.textContent='Не удалось отправить форму. Позвоните нам.';return}if(!leadForm.elements.consent.checked){status.textContent='Для отправки нужно согласие на обработку данных.';return}
 const selected=leadForm.elements.service.selectedOptions[0];const payload={...data,name:data.name||'Не указано',phone:'+'+digits,service:selected.value?selected.textContent:'Нужна консультация',consent:true,policyVersion:'2026-09-14-uslugi',page:location.origin+location.pathname,source:'uslugi.seti96.ru',placement:'request-page',referrer:document.referrer};
 for(const k of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','yclid'])payload[k]=query.get(k)||sessionStorageValue(k);
 button.disabled=true;button.textContent='Отправляем…';
 try{const res=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(25000)});const result=await res.json();if(!res.ok||result.ok!==true)throw Error(result.error||'Не удалось подтвердить отправку');leadForm.hidden=true;const done=document.querySelector('#lead-success');done.hidden=false;done.focus();goal('lead_sent',{service:payload.service});leadForm.reset()}
 catch(error){status.textContent=(error.name==='TimeoutError'?'Не удалось получить подтверждение отправки. ':String(error.message)+'. ')+'Позвоните +7 993 106-04-23 — проверим обращение.'}
 finally{button.disabled=false;button.textContent='Получить предварительный расчёт'}
})}
function sessionStorageValue(k){try{return sessionStorage.getItem('seti96-'+k)||''}catch{return ''}}
for(const k of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','yclid'])if(query.has(k)){try{sessionStorage.setItem('seti96-'+k,query.get(k))}catch{}}
