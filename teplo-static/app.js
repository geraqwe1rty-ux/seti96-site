'use strict';

const panels = {
  walls: {
    title: 'Стены, окна и двери',
    body: '<p>Холодно возле окна, промерзает угол или одна комната остывает быстрее остальных? Проверим температурную картину доступных поверхностей внутри и снаружи здания.</p><h3>На что смотрим</h3><p>Наружные стены, откосы, оконные и дверные примыкания, стыки конструкций. Ищем участки, которые отличаются по температуре и требуют внимания.</p><p class="note">Для поиска теплопотерь нужна достаточная разница температур внутри и снаружи. Погоду, доступ к фасаду и условия обследования обсудим перед выездом.</p>'
  },
  floor: {
    title: 'Тёплый пол',
    body: '<p>Часть пола остаётся холодной или разные комнаты прогреваются неодинаково? Посмотрим, как распределяется тепло по поверхности.</p><h3>Что покажет обследование</h3><p>Тёплые и холодные участки, различия в работе контуров и, при подходящих условиях, расположение нагретых труб. Это помогает выбрать участок для дальнейшей проверки.</p><p class="note">Система должна работать в подходящем режиме. Тепловизор измеряет температуру поверхности: он не видит сквозь пол и сам по себе не определяет причину каждой неисправности.</p>'
  },
  heating: {
    title: 'Радиаторы, котлы и трубы',
    body: '<p>Батарея нагревается только сверху, один контур холоднее другого или котёл работает, а дома всё равно прохладно? Проверим температурную картину доступных элементов системы.</p><h3>На что смотрим</h3><p>Равномерность нагрева радиаторов, температуру доступных труб и участков контуров. Обсудим, какие дополнительные проверки помогут уточнить причину.</p><p class="note">Холодный участок не всегда означает засор. Причиной могут быть воздух, настройки или циркуляция. Тепловизионное обследование не заменяет сервисное обслуживание котла.</p>'
  },
  process: {
    title: 'От вопроса к понятному решению',
    body: '<ol class="steps"><li><strong>Обсудим вашу задачу</strong><p>Расскажите, что беспокоит, где находится объект и что нужно проверить. Согласуем объём и стоимость.</p></li><li><strong>Проведём обследование</strong><p>Проверим согласованные участки тепловизором при подходящих условиях.</p></li><li><strong>Разберём увиденное</strong><p>Покажем температурные различия и объясним, что стоит проверить дальше.</p></li></ol><p class="note">Диагностика от 2 000 ₽. Итоговая стоимость зависит от объёма обследования и адреса объекта. Формат фиксации результатов согласуем заранее.</p>'
  },
  details: {
    title: 'Условия обследования',
    body: '<h3>Стоимость и выезд</h3><p>От 2 000 ₽. Работаем в Екатеринбурге и на объектах до 50 км от города. Итоговую стоимость, объём и условия выезда согласуем до обследования.</p><h3>Подходящие условия</h3><p>На результат влияют погода, разница температур, доступ к поверхностям и режим работы отопления. Обсудим их перед записью.</p><h3>Результат</h3><p>Тепловизионная диагностика помогает выявить температурные аномалии. Для установления причины иногда требуются дополнительные проверки. Формат снимков или письменного отчёта уточняется отдельно. Судебная экспертиза в предложение не включена.</p><p class="company-details">Сети96 · ООО «Танзанит»<br>ИНН 6670234728 · ОГРН 1086670038509<br>Екатеринбург, ул. Вишнёвая, д. 69Б, офис 9</p>'
  }
};

const dialog = document.querySelector('#details-dialog');
const title = document.querySelector('#dialog-title');
const content = document.querySelector('#dialog-content');
const emailLink = document.querySelector('#dialog-email');
let lastTrigger = null;

function track(name, details = {}) {
  // Conversion hooks contain no form contact details.
  window.dispatchEvent(new CustomEvent('seti96:conversion', { detail: { name, ...details } }));
  const goal = name.startsWith('phone_') ? 'phone_click' : name.startsWith('email_') ? 'email_click' : name;
  window.seti96TrackGoal?.(goal, {place: name, ...details});
}

function openPanel(key, trigger) {
  const panel = panels[key];
  if (!panel) return;
  lastTrigger = trigger;
  title.textContent = panel.title;
  content.innerHTML = panel.body;
  emailLink.href = 'mailto:seti-96@yandex.ru?subject=' + encodeURIComponent('Тепловизионное обследование — ' + panel.title) + '&body=' + encodeURIComponent('Здравствуйте! Хочу обсудить тепловизионное обследование.\n\nАдрес объекта: \nЧто нужно проверить: \nКонтактный телефон: ');
  dialog.showModal();
  document.body.classList.add('modal-open');
  track('details_open', { topic: key });
}

document.querySelectorAll('[data-panel]').forEach(button => {
  button.addEventListener('click', () => openPanel(button.dataset.panel, button));
});
document.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const box = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
});
dialog.addEventListener('close', () => {
  document.body.classList.toggle('modal-open', requestDialog.open);
  if (lastTrigger && !requestDialog.open) lastTrigger.focus();
});
document.querySelectorAll('[data-event]').forEach(link => link.addEventListener('click', () => track(link.dataset.event)));


const requestDialog = document.querySelector('#request-dialog');
const form = document.querySelector('#lead-form');
const errorBox = document.querySelector('#form-error');
const successBox = document.querySelector('#form-success');
const submitButton = form.querySelector('[type="submit"]');
let requestTrigger=null, formPlace='hero', requestId='', payloadKey='', sending=false;
const params = new URLSearchParams(location.search);
const attributionKeys=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','yclid','gclid'];
let attribution=Object.fromEntries(attributionKeys.map(key=>[key,params.get(key)||'']));
try {
  const saved=JSON.parse(sessionStorage.getItem('teplo-attribution')||'null');
  if(saved && !attributionKeys.some(key=>params.has(key))) attribution=saved;
  else sessionStorage.setItem('teplo-attribution',JSON.stringify(attribution));
} catch {}
function openRequest(trigger) {
  requestTrigger=trigger;
  formPlace=trigger.dataset.request||'hero';
  if(form.hidden){form.hidden=false;successBox.hidden=true;form.reset();requestId='';payloadKey='';}
  const topic={walls:'Стены и окна',floor:'Тёплый пол',heating:'Радиаторы и котлы'}[lastTrigger?.dataset.panel];
  if(dialog.open){dialog.close();if(topic)form.elements.topic.value=topic;}
  requestDialog.showModal();document.body.classList.add('modal-open');
  track('lead_start',{place:formPlace});
  form.elements.phone.focus();
}
document.querySelectorAll('[data-request]').forEach(button=>button.addEventListener('click',()=>openRequest(button)));
requestDialog.querySelector('.close').addEventListener('click',()=>requestDialog.close());
document.querySelector('#request-done').addEventListener('click',()=>requestDialog.close());
requestDialog.addEventListener('close',()=>{document.body.classList.toggle('modal-open',dialog.open);requestTrigger?.focus();});
requestDialog.addEventListener('click',event=>{
  const box=requestDialog.getBoundingClientRect();
  if(event.target===requestDialog && (event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom))requestDialog.close();
});
function normalizedPhone(input){
  let digits=input.replace(/\D/g,'');
  if(digits.length===11 && (digits[0]==='7'||digits[0]==='8'))digits=digits.slice(1);
  return digits.length===10?'+7'+digits:null;
}
form.elements.phone.addEventListener('input',()=>form.elements.phone.setCustomValidity(''));
function deliverThroughCompanyBrowser(payload){
  return new Promise((resolve,reject)=>{
    const origin='https://prochistka.seti96.ru';
    const frame=document.createElement('iframe');
    frame.hidden=true;frame.title='Доставка заявки';
    frame.src=origin+'/teplo-relay.html';
    const id=payload.requestId;
    let started=false;
    const cleanup=()=>{clearTimeout(timer);window.removeEventListener('message',receive);frame.remove();};
    const fail=()=>{cleanup();reject(new Error('Заявка сохранена, но доставка специалисту пока не подтверждена. Повторите попытку или позвоните: +7 993 106-04-23.'));};
    function receive(event){
      if(event.origin!==origin||event.source!==frame.contentWindow)return;
      if(event.data?.type==='teplo-relay-ready'&&!started){started=true;frame.contentWindow.postMessage({type:'teplo-lead',id,payload},origin);}
      if(event.data?.type==='teplo-lead-result'&&event.data.id===id){
        if(event.data.ok===true){cleanup();resolve();}else fail();
      }
    }
    const timer=setTimeout(fail,30000);
    window.addEventListener('message',receive);
    frame.addEventListener('error',fail,{once:true});
    document.body.append(frame);
  });
}
form.addEventListener('submit',async event=>{
  event.preventDefault();if(sending)return;
  errorBox.hidden=true;
  const phone=normalizedPhone(form.elements.phone.value);
  if(!phone){form.elements.phone.setCustomValidity('Укажите 10 цифр номера после +7.');form.elements.phone.reportValidity();return;}
  if(!form.reportValidity())return;
  const fields=Object.fromEntries(new FormData(form));
  const key=JSON.stringify([phone,fields.name,fields.clientType,fields.address,fields.message,fields.topic]);
  if(key!==payloadKey||!requestId){requestId=crypto.randomUUID();payloadKey=key;}
  const payload={...fields,phone,consent:form.elements.consent.checked,requestId,formPlace,service:'Тепловизионное обследование',source:'teplo.seti96.ru',page:'https://teplo.seti96.ru/',landing:location.href.slice(0,400),referrer:document.referrer.slice(0,400),policyVersion:'teplo-2026-10-20',...attribution,metrika_client_id:window.seti96MetrikaClientId||''};
  sending=true;submitButton.disabled=true;submitButton.textContent='Отправляем…';
  form.setAttribute('aria-busy','true');
  try{
    const response=await fetch('/api/leads',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...payload,archiveOnly:true}),signal:AbortSignal.timeout(25000)});
    const result=await response.json();
    if(!response.ok||!result.id||(!result.saved&&result.delivery!=='confirmed'))throw new Error(result.error||'Не удалось сохранить заявку. Повторите попытку или позвоните нам.');
    if(result.delivery!=='confirmed'&&result.delivery!=='queued'){
      await deliverThroughCompanyBrowser({...payload,leadId:result.id,message:[fields.topic,fields.message].filter(Boolean).join('\n')});
      fetch('/api/leads',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...payload,browserRelayReceipt:true,receiptId:result.id}),keepalive:true}).catch(()=>{});
    }
    successBox.querySelector('h3').textContent=result.delivery==='queued'?'Заявка принята':'Заявка отправлена';
    successBox.querySelector('p').textContent=result.delivery==='queued'?'Обращение сохранено. Уведомление специалисту отправляется автоматически. Повторно заполнять форму не нужно.':'Мы получили ваше обращение и свяжемся с вами, чтобы обсудить обследование.';
    form.hidden=true;successBox.hidden=false;successBox.focus();
    track(result.delivery==='queued'?'lead_accepted':'lead_sent',{place:formPlace,object_type:fields.clientType,topic:fields.topic});
    form.reset();
  }catch(error){
    errorBox.textContent=error.name==='TimeoutError'||error instanceof TypeError?'Не удалось получить подтверждение. Проверьте соединение и повторите отправку или позвоните: +7 993 106-04-23.':error.message;
    errorBox.hidden=false;track('lead_error',{place:formPlace});
  }finally{sending=false;submitButton.disabled=false;submitButton.textContent='Отправить заявку';form.removeAttribute('aria-busy');}
});
