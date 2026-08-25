"use client";

import {FormEvent, useState} from "react";

const phone = "+7 993 106-04-23";
const services = [
  ["01", "Аварийный выезд", "Пропало электричество, искрит розетка, выбивает автомат или появился запах гари."],
  ["02", "Монтаж и замена", "Розетки, выключатели, светильники, автоматы, кабельные линии и электрические щиты."],
  ["03", "Диагностика", "Поиск неисправности, проверка проводки, замеры и определение причины отключений."],
  ["04", "Объекты под ключ", "Электромонтаж в квартирах, частных домах, офисах и коммерческих помещениях."],
];

export default function Home() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const query = new URLSearchParams(window.location.search);
    const payload = {
      ...Object.fromEntries(form),
      clientType: "Электрика",
      page: window.location.pathname,
      source: query.get("utm_source") || document.referrer,
      utm_campaign: query.get("utm_campaign") || "",
      utm_content: query.get("utm_content") || "",
      utm_term: query.get("utm_term") || "",
    };
    try {
      const response = await fetch("/api/leads", {method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify(payload)});
      if (!response.ok) throw new Error("delivery");
      setSent(true);
      event.currentTarget.reset();
      if (typeof window.ym === "function") window.ym(111934175, "reachGoal", "lead_sent");
    } catch {
      setError("Не удалось отправить заявку. Позвоните нам по номеру +7 993 106-04-23.");
    } finally {
      setSending(false);
    }
  }
  return <main>
    <header>
      <a className="brand" href="#top" aria-label="Сети 96 — электрика"><img src="/seti96-logo.webp" alt="Сети 96"/><em>⚡ Электрика</em></a>
      <nav><a href="#services">Услуги</a><a href="#process">Как работаем</a><a href="#contact">Контакты</a></nav>
      <a className="headerPhone" href="tel:+79931060423">{phone}</a><a className="headerButton" href="#request">Вызвать электрика</a>
    </header>
    <section className="hero" id="top"><div className="heroCopy"><p className="kicker">Екатеринбург и Свердловская область</p><h1>Электрик для дома<br/>и бизнеса</h1><p className="heroText">Диагностика, ремонт и электромонтажные работы. Сначала определим причину неисправности, затем согласуем решение и стоимость.</p><div className="heroActions"><a className="primary" href="#request">Оставить заявку</a><a className="secondary" href="tel:+79931060423">Позвонить</a></div><div className="trust"><span><b>Екатеринбург</b>Выезд по городу и области</span><span><b>Частные и коммерческие</b>Работаем с разными объектами</span></div></div><figure className="heroImage"><img src="/electro-hero.webp" alt="Диагностика электрического щита специалистом"/><figcaption>Диагностика перед началом работ</figcaption></figure></section>
    <section className="services" id="services"><div className="sectionHead"><p className="kicker darkKicker">Что делаем</p><h2>От одной розетки<br/>до электрики объекта</h2><p>Объём и способ работ определяем после осмотра. Не навязываем замену исправного оборудования.</p></div><div className="serviceGrid">{services.map(([number,title,text])=><article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p><a href="#request">Оставить заявку →</a></article>)}</div></section>
    <section className="warning"><span>!</span><div><p className="kicker">Важно</p><h2>При запахе гари или искрении отключите вводной автомат</h2><p>Не прикасайтесь к повреждённым проводам и электроприборам. После отключения позвоните специалисту.</p></div><a href="tel:+79931060423">Позвонить сейчас</a></section>
    <section className="process" id="process"><p className="kicker darkKicker">Порядок работы</p><h2>Понятно на каждом этапе</h2><div className="steps"><div><span>01</span><b>Заявка</b><p>Расскажите, что произошло, и укажите адрес.</p></div><div><span>02</span><b>Диагностика</b><p>Специалист проверит сеть и найдёт причину.</p></div><div><span>03</span><b>Согласование</b><p>Объясним варианты и стоимость до начала работ.</p></div><div><span>04</span><b>Работа</b><p>Выполним ремонт или монтаж и проверим результат.</p></div></div></section>
    <section className="request" id="request"><div><p className="kicker">Заявка</p><h2>Опишите задачу</h2><p>Имя и телефон нужны для обратной связи. Адрес и описание можно не заполнять.</p><a className="largePhone" href="tel:+79931060423">{phone}</a></div>{sent ? <div className="success"><span>✓</span><div className="successBolt">⚡</div><h3>Заявка принята</h3><p>Специалист свяжется с вами, чтобы уточнить детали.</p><button onClick={()=>setSent(false)}>Отправить ещё одну</button></div> : <form onSubmit={submit}><input type="hidden" name="service" value="Электрика"/><label>Ваше имя<input name="name" autoComplete="name" required/></label><label>Телефон<input name="phone" type="tel" autoComplete="tel" placeholder="+7 (999) 000-00-00" required/></label><label>Адрес объекта <small>необязательно</small><input name="address" autoComplete="street-address" placeholder="Улица, дом, квартира или офис"/></label><label>Описание проблемы <small>необязательно</small><textarea name="problem" rows={4} placeholder="Например: выбивает автомат при включении плиты"/></label><label className="agree"><input type="checkbox" required/> <span>Согласен на <a href="/politika">обработку персональных данных</a></span></label>{error&&<p role="alert">{error}</p>}<button className="submit" type="submit" disabled={sending}>{sending?"Отправляем…":"Отправить заявку"}</button></form>}</section>
    <footer id="contact"><a className="brand" href="#top"><img src="/seti96-logo.webp" alt="Сети 96"/><em>⚡ Электрика</em></a><p>Екатеринбург и Свердловская область<br/>ООО «Танзанит»</p><a href="mailto:seti-96@yandex.ru">seti-96@yandex.ru</a><a href="/politika">Политика обработки данных</a><small>© 2026</small></footer>
  </main>
}
