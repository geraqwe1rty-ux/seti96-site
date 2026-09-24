(() => {
  'use strict';
  const form = document.querySelector('#lead-form');
  const errorBox = document.querySelector('#form-error');
  const success = document.querySelector('.success');
  const submit = form.querySelector('[type="submit"]');
  const phone = form.elements.phone;
  const counter = 111937544;
  let sending = false;
  let analyticsEnabled = false;
  const params = new URLSearchParams(location.search);
  const track = goal => { if (analyticsEnabled && typeof window.ym === 'function') window.ym(counter, 'reachGoal', goal); };
  function enableAnalytics() {
    if (analyticsEnabled) return;
    analyticsEnabled = true;
    window.seti96StartAnalytics();
  }
  const cookieNotice = document.querySelector('.cookie-notice');
  let analyticsChoice;
  try { analyticsChoice = localStorage.getItem('santehnika-analytics-v1'); } catch {}
  if (analyticsChoice === 'yes') enableAnalytics();
  cookieNotice.hidden = !!analyticsChoice;
  document.querySelectorAll('[data-analytics]').forEach(button => button.addEventListener('click', () => {
    const choice = button.dataset.analytics;
    try { localStorage.setItem('santehnika-analytics-v1', choice); } catch {}
    cookieNotice.hidden = true;
    if (choice === 'yes') enableAnalytics();
    else if (analyticsEnabled) { window.ym(counter, 'destruct'); analyticsEnabled = false; }
  }));
  document.querySelector('.cookie-settings').addEventListener('click', () => { cookieNotice.hidden = false; cookieNotice.querySelector('button').focus(); });
  const menu = document.querySelector('#mobile-menu');
  const menuButton = document.querySelector('.menu-button');
  function closeMenu() { menu.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Открыть меню'); }
  menuButton.addEventListener('click', () => { menu.hidden = !menu.hidden; menuButton.setAttribute('aria-expanded', String(!menu.hidden)); menuButton.setAttribute('aria-label', menu.hidden ? 'Открыть меню' : 'Закрыть меню'); });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { closeMenu(); menuButton.focus(); } });
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  function selectTab(tab) { tabs.forEach(t => { const selected = t === tab; t.setAttribute('aria-selected', String(selected)); t.tabIndex = selected ? 0 : -1; document.getElementById(t.getAttribute('aria-controls')).hidden = !selected; }); }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', e => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) { e.preventDefault(); const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (index + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length; selectTab(tabs[next]); tabs[next].focus(); } });
  });
  document.querySelectorAll('a[href="#request"]').forEach(a => a.addEventListener('click', () => { if (a.dataset.task) form.elements.task.value = a.dataset.task; if (a.dataset.client) form.elements.clientType.value = a.dataset.client; track('request_open'); }));
  document.querySelectorAll('a[href^="tel:"]').forEach(a => a.addEventListener('click', () => track('phone_click')));
  phone.addEventListener('input', () => { phone.setCustomValidity(''); errorBox.hidden = true; });
  const normalizePhone = value => { let digits = String(value).replace(/\D/g, ''); if (digits.length === 10) digits = '7' + digits; else if (digits.length === 11 && digits[0] === '8') digits = '7' + digits.slice(1); return /^7\d{10}$/.test(digits) ? '+' + digits : null; };
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (sending) return; errorBox.hidden = true;
    const normalized = normalizePhone(phone.value);
    if (!normalized) { phone.setCustomValidity('Укажите российский номер: 10 цифр после +7.'); phone.reportValidity(); return; }
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form));
    const payload = {name: values.name.trim() || 'Не указано', phone: normalized, clientType: values.clientType, service: 'Сантехника', address: values.address.trim(), problem: [values.task, values.problem.trim()].filter(Boolean).join('\n'), consent: form.elements.consent.checked, policyVersion: 'santehnika-2026-09-23', website: values.website, formPlace: 'santehnika-main', page: 'https://santehnika.seti96.ru' + location.pathname, source: 'santehnika.seti96.ru', referrer: document.referrer, landing: location.href.slice(0, 500), ...Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content','utm_term','yclid','gclid'].map(k => [k, params.get(k) || '']))};
    sending = true; submit.disabled = true; submit.textContent = 'Отправляем…';
    let savedId;
    try {
      const response = await fetch('/api/leads', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({...payload, archiveOnly: true}), signal: AbortSignal.timeout(15000)});
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.saved !== true || !Number.isInteger(result.id)) throw new Error('archive');
      savedId = result.id;
      await deliverThroughCompanyBrowser({...payload, leadId: savedId});
      fetch('/api/leads', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({...payload, browserRelayReceipt: true, receiptId: savedId}), keepalive: true}).catch(() => {});
      form.hidden = true; success.hidden = false; success.focus(); form.reset(); track('lead_sent');
    } catch (error) {
      errorBox.textContent = savedId ? 'Заявка сохранена, но доставка уведомления специалисту не подтверждена. Повторно отправлять форму не нужно. Позвоните: +7 993 106-04-23.' : 'Не удалось подтвердить сохранение заявки. Позвоните нам: +7 993 106-04-23.';
      errorBox.hidden = false; track(savedId ? 'lead_saved_delivery_failed' : 'lead_error');
    } finally { sending = false; submit.disabled = false; submit.innerHTML = 'Получить расчёт <span aria-hidden="true">↗</span>'; }
  });
  function deliverThroughCompanyBrowser(payload) {
    return new Promise((resolve, reject) => {
      const origin = 'https://prochistka.seti96.ru';
      const frame = document.createElement('iframe');
      const id = crypto.randomUUID();
      frame.hidden = true; frame.title = 'Доставка заявки'; frame.src = origin + '/santehnika-relay.html';
      let started = false;
      const cleanup = () => { clearTimeout(timer); window.removeEventListener('message', receive); frame.remove(); };
      const receive = event => {
        if (event.origin !== origin || event.source !== frame.contentWindow) return;
        if (event.data?.type === 'santehnika-relay-ready' && !started) { started = true; frame.contentWindow.postMessage({type: 'santehnika-lead', id, payload}, origin); }
        if (event.data?.type === 'santehnika-lead-result' && event.data.id === id) { cleanup(); event.data.ok === true ? resolve() : reject(new Error('delivery')); }
      };
      const timer = setTimeout(() => { cleanup(); reject(new Error('timeout')); }, 25000);
      window.addEventListener('message', receive); document.body.appendChild(frame);
    });
  }
  document.querySelector('#another-request').addEventListener('click', () => { success.hidden = true; form.hidden = false; phone.focus(); });
})();
