'use strict';
(() => {
  const form=document.querySelector('#heating-form'),errorBox=document.querySelector('#form-error'),submit=form.querySelector('[type="submit"]');
  const notice=document.querySelector('#cookie-notice'),choiceKey='heating-analytics-v1',counter=111900032;
  let enabled=false,loaded=false,sending=false,requestId='',payloadKey='',started=false;
  function startAnalytics(){
    if(enabled)return;enabled=true;
    if(!loaded){
      window.ym=window.ym||function(){(window.ym.a=window.ym.a||[]).push(arguments)};window.ym.l=Date.now();
      const script=document.createElement('script');script.async=true;script.src='https://mc.yandex.ru/metrika/tag.js?id='+counter;document.head.append(script);loaded=true;
    }
    window.ym(counter,'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});
    window.ym(counter,'getClientID',id=>{window.seti96MetrikaClientId=String(id||'')});
  }
  function track(name,details={}){if(enabled)window.ym(counter,'reachGoal',name,{variant:'heating-one-screen',...details})}
  let choice;try{choice=localStorage.getItem(choiceKey)}catch{}
  if(choice==='yes')startAnalytics();notice.hidden=choice==='yes'||choice==='no';
  document.querySelectorAll('[data-analytics]').forEach(button=>button.addEventListener('click',()=>{
    const value=button.dataset.analytics;try{localStorage.setItem(choiceKey,value)}catch{}notice.hidden=true;
    if(value==='yes')startAnalytics();else{enabled=false;window.seti96MetrikaClientId='';if(loaded)window.ym(counter,'destruct')}
  }));
  document.querySelector('#analytics-settings').addEventListener('click',()=>{notice.hidden=false;notice.querySelector('button').focus()});
  document.querySelectorAll('[data-goal]').forEach(link=>link.addEventListener('click',()=>track(link.dataset.goal)));

  const keys=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','yclid','gclid'];
  const params=new URLSearchParams(location.search);let attribution=Object.fromEntries(keys.map(k=>[k,params.get(k)||'']));
  try{
    const old=JSON.parse(sessionStorage.getItem('heating-attribution')||'null');
    if(!keys.some(k=>params.has(k))&&old)attribution=old;
    else sessionStorage.setItem('heating-attribution',JSON.stringify(attribution));
  }catch{}
  form.addEventListener('focusin',()=>{if(!started){started=true;track('form_start')}});
  form.elements.phone.addEventListener('input',()=>form.elements.phone.setCustomValidity(''));
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(sending)return;errorBox.hidden=true;
    let digits=form.elements.phone.value.replace(/\D/g,'');
    if(digits.length===11&&['7','8'].includes(digits[0]))digits=digits.slice(1);
    if(digits.length!==10){form.elements.phone.setCustomValidity('Укажите 10 цифр номера после +7.');form.elements.phone.reportValidity();return;}
    if(!form.reportValidity())return;
    const data=Object.fromEntries(new FormData(form));const key=JSON.stringify([digits,data.clientType,data.topic]);
    if(key!==payloadKey||!requestId){payloadKey=key;requestId=crypto.randomUUID()}
    const payload={phone:'+7'+digits,clientType:data.clientType,topic:data.topic||'',consent:form.elements.consent.checked,website:data.website,requestId,placement:'one-screen',page:'https://seti96.ru/promyvka/',landing:location.href.slice(0,400),referrer:document.referrer.slice(0,400),policyVersion:'heating-2026-10-27',...attribution,metrika_client_id:window.seti96MetrikaClientId||''};
    sending=true;submit.disabled=true;submit.textContent='Отправляем…';form.setAttribute('aria-busy','true');track('lead_attempt');
    try{
      const response=await fetch('/api/heating-leads',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(25000)});
      const result=await response.json().catch(()=>null);
      if(!response.ok||result?.ok!==true||result.saved!==true||!result.id)throw new Error(result?.error||'Не удалось подтвердить заявку. Повторите отправку или позвоните нам.');
      if(result.thankYouUrl==='/spasibo'){location.assign('/spasibo');return;}
      form.hidden=true;document.querySelector('#form-success').hidden=false;
    }catch(error){
      errorBox.textContent=error.name==='TimeoutError'||error instanceof TypeError?'Не получили подтверждение отправки. Повторите попытку или позвоните: +7 993 106-04-23.':error.message;
      errorBox.hidden=false;track('lead_error');
    }finally{sending=false;submit.disabled=false;submit.innerHTML='Обсудить мою задачу <span aria-hidden="true">↗</span>';form.removeAttribute('aria-busy')}
  });

  const content={
    diagnosis:['Проверяем причину','Холодная батарея не всегда означает засор. Оценим нагрев, циркуляцию и доступные элементы системы. По результату объясним, нужна ли промывка или следует искать другую неисправность.'],
    price:['Согласуем объём и стоимость','Стоимость зависит от оборудования, объёма системы, состояния и подключения. Уточним симптомы и адрес, обсудим обследование. Объём, технологию и стоимость работ согласуем до начала.'],
    work:['Промываем, если это нужно','Если причина в отложениях, подберём способ промывки под материал и состояние системы. После очистки промоем контур водой и проверим работу. Заранее обещать одинаковый результат для разных неисправностей нельзя.'],
    company:['Сети96 · инженерные услуги','Работаем в Екатеринбурге и на объектах до 50 км от города. Частные дома, квартиры и организации. ООО «Танзанит», ИНН 6670234728, ОГРН 1086670038509. Юридический адрес: Екатеринбург, ул. Вишнёвая, д. 69Б, офис 9. Телефон: +7 993 106-04-23. Электронная почта: seti-96@yandex.ru.']
  };
  const dialog=document.querySelector('#details');let opener;
  document.querySelectorAll('[data-detail]').forEach(button=>button.addEventListener('click',()=>{
    opener=button;const [title,text]=content[button.dataset.detail];document.querySelector('#detail-title').textContent=title;
    const paragraph=document.createElement('p');paragraph.textContent=text;document.querySelector('#detail-body').replaceChildren(paragraph);dialog.showModal();
  }));
  dialog.querySelector('.close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>opener?.focus());
  dialog.addEventListener('click',event=>{const b=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom))dialog.close()});
  document.querySelector('#to-form').addEventListener('click',()=>{dialog.close();document.querySelector('#request').scrollIntoView();form.elements.phone.focus()});
})();
