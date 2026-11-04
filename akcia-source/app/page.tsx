'use client';
import { useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, CheckCircle2, CalendarDays, MapPin, ScanLine, FileText, ListChecks, ChevronDown, ShieldCheck } from 'lucide-react';
import { campaign } from '../lib/campaign';
import { trackPromoGoal, trackSavedLead } from '../lib/analytics';
import AnalyticsChoice from './analytics-choice';
function newRequestId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const h = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}

export default function Home({bookingEndpoint = '/api/booking', heroSrc = '/hero.png'}: {bookingEndpoint?: string; heroSrc?: string} = {}) {
  const [townId, setTownId] = useState('');
  const [state, setState] = useState<'idle'|'sending'|'success'>('idle');
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const [requestId, setRequestId] = useState('');
  const leadStarted = useRef(false);
  const town = campaign.towns.find(t => t.id === townId);
  function startLead() { if (!leadStarted.current) leadStarted.current = trackPromoGoal('promo_lead_start', townId); }
  function selectTown(id: string) { setTownId(id); setError(''); setState('idle'); setRequestId(''); trackPromoGoal('promo_town_select', id); }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === 'sending') return;
    const form = new FormData(event.currentTarget);
    const id = requestId || newRequestId(); setRequestId(id);
    setState('sending'); setError('');
    try {
      const res = await fetch(bookingEndpoint, { method: 'POST', credentials:'omit', headers: {'Content-Type':'application/json'}, body: JSON.stringify({town: townId, phone: form.get('phone'), address: form.get('address'), consent: form.get('consent') === 'on', website: form.get('website'), requestId: id}) });
      const body = await res.json() as { ok?: boolean; error?: string; reference?: string };
      if (!res.ok || !body.ok) throw new Error(body.error || 'Не удалось отправить заявку. Попробуйте ещё раз.');
      setReference(body.reference || id.slice(0, 8).toUpperCase()); setState('success');
      trackSavedLead(id, townId);
      document.getElementById('booking-status')?.focus();
    } catch (e) { setError(e instanceof Error ? e.message : 'Проверьте интернет и попробуйте ещё раз.'); setState('idle'); trackPromoGoal('promo_lead_error', townId); }
  }
  return <>
    <a className="skip-link" href="#booking">Перейти к записи</a>
    <div className="dark-top">
      <header className="header shell">
        <a className="brand" href="#" aria-label="Сети96, главная"><span className="brand-mark"><i/><i/><i/></span>Сети<span>96</span></a>
        <nav aria-label="Навигация"><a href="#schedule">Выезды</a><a href="#included">Что входит</a><a href="#questions">Вопросы</a></nav>
        <a className="header-cta" href="#booking">Записаться <ArrowUpRight size={17}/></a>
      </header>
      <main>
      <section className="hero shell" aria-labelledby="hero-title">
        <div className="hero-copy">
          <span className="eyebrow"><span className="status-dot"/> АКЦИЯ · 7–10 НОЯБРЯ 2026</span>
          <h1 id="hero-title">Дома холодно?<br/>Узнайте, куда<br/>уходит <em>тепло.</em></h1>
          <p className="hero-description">Обследуем дом тепловизором. Покажем проблемные участки и объясним, с чего начать, чтобы вернуть тепло.</p>
          <div className="offer-line"><strong>800 <span>₽</span></strong><p>за обследование<br/>в день общего выезда</p></div>
          <a className="button primary hero-button" href="#schedule">Выбрать дату выезда <ArrowRight size={21}/></a>
          <p className="hero-note"><Check size={15}/> Снимки, развёрнутое заключение и рекомендации</p>
        </div>
        <div className="hero-art">
          <img src={heroSrc} alt="Тепловизор на фоне загородного дома зимой. Иллюстрация обследования." fetchPriority="high"/>
          <div className="scan-corner top-left"/><div className="scan-corner bottom-right"/>
          <span className="art-tag"><ScanLine size={16}/> УВИДЕТЬ НЕВИДИМОЕ</span>
          <div className="art-caption"><span>Меньше догадок.</span><strong>Больше понимания<br/>своего дома.</strong></div>
          <small className="illustration">Иллюстрация</small>
        </div>
      </section>
      <div className="hero-bottom shell"><span><MapPin size={16}/> 4 населённых пункта</span><span><CalendarDays size={16}/> Выезд по предварительной записи</span><span><ShieldCheck size={16}/> Без обязательного заказа ремонта</span></div>
      </main>
    </div>

    <section className="booking-section shell" id="schedule" aria-labelledby="schedule-title">
      <div className="schedule-column">
        <span className="section-kicker">В ЭТОТ РАЗ РЯДОМ С ВАМИ</span>
        <h2 id="schedule-title">Выберите свой<br/>населённый пункт</h2>
        <p className="section-intro">Объединяем заявки в один маршрут, чтобы предложить обследование за 800 ₽.</p>
        <div className="schedule-list" role="group" aria-label="Расписание выездов">
          {campaign.towns.map((t, index) => <button key={t.id} className={'schedule-row '+(townId === t.id ? 'selected' : '')} onClick={() => {selectTown(t.id); if (window.innerWidth < 800) document.getElementById('booking')?.scrollIntoView({behavior:'smooth'});}} aria-pressed={townId===t.id}>
            <span className="date-box"><strong>{String(t.day).padStart(2,'0')}</strong><span>ноября</span></span>
            <span className="town-copy"><strong>{t.name}</strong><small>{t.weekday} · 10:00–18:00</small></span>
            <span className="row-arrow">{townId===t.id?<Check size={20}/>:<ArrowUpRight size={21}/>}</span>
          </button>)}
        </div>
        <p className="schedule-note">Предварительный график. Точную дату и время подтвердим по телефону с учётом маршрута и погоды.</p>
      </div>
      <div className="booking-card" id="booking">
        <span className="form-eyebrow">ЗАПИСЬ НА ОБСЛЕДОВАНИЕ</span>
        <h2>Начнём с вашего дома</h2>
        <p className="form-intro">Оставьте контакты. Мы свяжемся с вами и согласуем выезд.</p>
        {state === 'success' ? <div className="success-panel ym-hide-content" id="booking-status" tabIndex={-1} role="status"><CheckCircle2 size={44}/><h3>Заявка принята</h3><p>{town?.name}, предварительно {town?.day} ноября.</p><p>Мы позвоним на указанный номер и подтвердим время. До звонка запись считается предварительной.</p><small>Номер заявки: {reference}</small><button className="button secondary" onClick={() => {setState('idle'); setRequestId(''); leadStarted.current = false;}}>Записать другой адрес <ArrowRight size={18}/></button></div> : <form className="ym-hide-content ym-disable-submit" onFocusCapture={startLead} onSubmit={submit}>
          <label htmlFor="town">Населённый пункт <span>*</span></label>
          <div className="select-wrap"><select id="town" name="town" value={townId} onChange={e=>selectTown(e.target.value)} required><option value="" disabled>Выберите из списка</option>{campaign.towns.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select><ChevronDown size={18}/></div>
          <div className={'date-notice '+(town?'active':'')} aria-live="polite"><CalendarDays size={17}/>{town?`${town.day} ноября · 10:00–18:00`:'Дата появится после выбора пункта'}</div>
          <label htmlFor="phone">Телефон <span>*</span></label>
          <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+7 (___) ___-__-__" required minLength={10} maxLength={22} onChange={()=>setError('')}/>
          <label htmlFor="address">Адрес <span>*</span></label>
          <input id="address" name="address" autoComplete="street-address" placeholder="Улица, номер дома" required minLength={5} maxLength={250} onChange={()=>setError('')}/>
          <div className="honeypot" aria-hidden="true"><label htmlFor="website">Сайт</label><input id="website" name="website" tabIndex={-1} autoComplete="off"/></div>
          <label className="consent"><input name="consent" type="checkbox" required/><span>Даю <a href="https://teplo.seti96.ru/consent" target="_blank" rel="noreferrer">согласие на обработку данных</a> и принимаю <a href="https://teplo.seti96.ru/policy" target="_blank" rel="noreferrer">политику конфиденциальности</a>.</span></label>
          {error&&<p className="form-error" role="alert">{error}</p>}
          <button className="button primary submit-button" type="submit" disabled={state==='sending'}>{state==='sending'?'Отправляем заявку…':'Записаться за 800 ₽'}<ArrowRight size={20}/></button>
          <p className="form-footnote">Цена включает обследование и заключение.<br/>Точное время согласуем при звонке.</p>
        </form>}
      </div>
    </section>

    <section className="included-section" id="included">
      <div className="shell">
        <div className="section-heading"><div><span className="section-kicker">ЧТО ВЫ ПОЛУЧИТЕ ЗА 800 ₽</span><h2>Не просто снимки.<br/>Понятный план действий.</h2></div><p>Холод в доме может иметь разные причины. Обследование помогает понять, что проверять и исправлять в первую очередь.</p></div>
        <div className="included-grid">
          <article><span className="step-number">01</span><ScanLine size={30}/><h3>Обследование дома</h3><p>Осмотрим доступные участки: стены, окна, двери и элементы отопления. Зафиксируем температурные особенности.</p></article>
          <article><span className="step-number">02</span><FileText size={30}/><h3>Развёрнутое заключение</h3><p>Передадим снимки с пояснениями: что обнаружили и на какие участки стоит обратить внимание.</p></article>
          <article><span className="step-number">03</span><ListChecks size={30}/><h3>Рекомендации</h3><p>Объясним дальнейшие шаги. Если потребуется дополнительная диагностика, отдельно укажем это в заключении.</p></article>
        </div>
        <div className="included-note"><CheckCircle2 size={20}/><p>Вы сами решаете, заказывать ли дальнейшие работы. Обследование ни к чему не обязывает.</p></div>
      </div>
    </section>

    <section className="faq-section shell" id="questions"><div><span className="section-kicker">ПЕРЕД ЗАПИСЬЮ</span><h2>Что ещё<br/>важно знать</h2><a className="contact-link" href="#booking">Перейти к записи <ArrowUpRight size={18}/></a><span className="contact-caption">Оставьте телефон, и мы свяжемся с вами</span></div><div className="faq-list">
      <details><summary>Почему обследование стоит 800 ₽?<ChevronDown size={20}/></summary><p>Это цена по акции при записи на общий выезд в один из четырёх населённых пунктов по расписанию. В стоимость входят обследование, развёрнутое заключение и рекомендации. Ремонт и дополнительные проверки в эту цену не входят и обсуждаются отдельно.</p></details>
      <details><summary>Что подготовить перед приездом?<ChevronDown size={20}/></summary><p>При звонке расскажите, где холодно, есть ли сквозняки и как работает отопление. Специалист уточнит условия и подготовку к обследованию. Обеспечьте доступ к участкам, которые нужно проверить.</p></details>
      <details><summary>Запись сразу подтверждает время?<ChevronDown size={20}/></summary><p>Нет. Форма отправляет предварительную заявку. Мы свяжемся с вами и подтвердим дату и время с учётом маршрута, погоды и условий для обследования.</p></details>
      <details><summary>Тепловизор точно покажет причину холода?<ChevronDown size={20}/></summary><p>Тепловизор показывает температуру поверхностей и помогает выявить подозрительные участки. Для точного определения причины иногда нужны дополнительные проверки. Об этом будет указано в заключении.</p></details>
      <details><summary>Моего населённого пункта нет в списке<ChevronDown size={20}/></summary><p>Эта акция действует для Рассохи, Верхнего Дуброво, Арамиля и Косулино в дни общих выездов. Заявки на другие адреса в рамках этой акции не принимаются.</p></details>
    </div></section>
    <footer className="footer"><div className="shell"><a className="brand" href="#"><span className="brand-mark"><i/><i/><i/></span>Сети<span>96</span></a><p>Тепло начинается с понимания.</p><a href="https://teplo.seti96.ru/policy" target="_blank" rel="noreferrer">Конфиденциальность</a><AnalyticsChoice/><small>© Сети96, 2026</small></div></footer>
    <a className="mobile-cta button primary" href="#booking">Записаться за 800 ₽ <ArrowRight size={19}/></a>
  </>;
}
