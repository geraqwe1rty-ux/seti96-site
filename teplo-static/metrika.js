'use strict';
(() => {
  const counter = 113687988;
  const choiceKey = 'teplo-analytics-v1';
  const notice = document.querySelector('#cookie-notice');
  let enabled = false;
  let loaded = false;
  function start() {
    if (enabled) return;
    enabled = true;
    window.dataLayer = window.dataLayer || [];
    (function(m,e,t,r,i,k,a){
      m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();
      for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r)return;}
      k=e.createElement(t);a=e.getElementsByTagName(t)[0];k.async=1;k.src=r;a.parentNode.insertBefore(k,a);
    })(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=113687988','ym');
    window.ym(counter,'init',{ssr:true,webvisor:true,clickmap:true,ecommerce:'dataLayer',referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});
    loaded = true;
    window.ym(counter,'getClientID',id=>{window.seti96MetrikaClientId=String(id||'');});
  }
  window.seti96TrackGoal = (name, params={}) => {
    if (enabled && typeof window.ym === 'function') window.ym(counter,'reachGoal',name,params);
  };
  let choice;
  try {choice=localStorage.getItem(choiceKey);} catch {}
  if(choice==='yes') start();
  notice.hidden=choice==='yes'||choice==='no';
  document.querySelectorAll('[data-analytics]').forEach(button=>button.addEventListener('click',()=>{
    const value=button.dataset.analytics;
    try {localStorage.setItem(choiceKey,value);} catch {}
    notice.hidden=true;
    if(value==='yes') start();
    else {enabled=false;window.seti96MetrikaClientId='';if(loaded&&typeof window.ym==='function')window.ym(counter,'destruct');}
  }));
  document.querySelector('.analytics-settings').addEventListener('click',()=>{notice.hidden=false;notice.querySelector('button').focus();});
})();
