"use client";
/* eslint-disable @next/next/no-img-element */

import {useEffect, useId, useRef, useState, type FormEvent} from "react";
import Link from "next/link";
import {articles, type ArticleData} from "./articles";

const METRIKA_ID = 111900032;
const PHONE = "+7 993 106-04-23";
const PHONE_HREF = "tel:+79931060423";
const EMAIL = "seti-96@yandex.ru";

type PageName = "home" | "dom" | "org" | "blog" | "contacts" | "article";
type ClientType = "Частный дом" | "УК / организация";
type MetricParams = Record<string, string>;
type MetricGoal = (goal: string, params?: MetricParams) => void;

const faqs = [
  [
    "Как понять, что нужна именно промывка?",
    "Неравномерный нагрев, шум и медленный выход на температуру могут быть связаны не только с отложениями. Сначала специалист оценивает систему, насос, арматуру и доступные точки подключения.",
  ],
  [
    "Можно ли промыть систему без демонтажа?",
    "Да, если конструкция и состояние оборудования позволяют подключить промывочную установку к изолированному контуру. Это определяется при осмотре.",
  ],
  [
    "Когда станет известна стоимость?",
    "После уточнения типа оборудования, объёма системы, материала, состояния и сложности подключения. Стоимость и технология согласуются до начала работ.",
  ],
  [
    "Один состав подходит для любого оборудования?",
    "Нет. Состав, концентрация, температура и время циркуляции подбираются с учётом материала и состояния оборудования.",
  ],
  [
    "Может ли после очистки обнаружиться течь?",
    "Плотные отложения иногда скрывают уже существующую коррозию. После их удаления может проявиться негерметичность, которая возникла до промывки.",
  ],
  [
    "Вы гарантируете снижение расхода газа?",
    "Если снижение эффективности вызвано отложениями, очистка может восстановить теплоотдачу. Результат зависит от фактической причины и исходного состояния оборудования.",
  ],
];

const navItems = [
  ["Главная", "/", "home"],
  ["Частный дом", "/dom", "dom"],
  ["Организациям", "/organizaciyam", "org"],
  ["Материалы", "/materialy", "blog"],
  ["Контакты", "/kontakty", "contacts"],
] as const;

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return "+7" + digits;
  if (digits.length === 11 && digits[0] === "8") return "+7" + digits.slice(1);
  if (digits.length === 11 && digits[0] === "7") return "+" + digits;
  return null;
}

function readSession(key: string) {
  try {
    return sessionStorage.getItem("seti96_" + key) || "";
  } catch {
    return "";
  }
}

function writeSession(key: string, value: string) {
  try {
    sessionStorage.setItem("seti96_" + key, value);
  } catch {
    // The form must continue working when browser storage is unavailable.
  }
}

function getAttribution() {
  const query = new URLSearchParams(window.location.search);
  const read = (key: string) => query.get(key) || readSession(key);
  return {
    source: read("utm_source") || document.referrer || "Прямой переход",
    referrer: readSession("referrer") || document.referrer || "",
    landing: readSession("landing") || window.location.href,
    utm_source: read("utm_source"),
    utm_medium: read("utm_medium"),
    utm_campaign: read("utm_campaign"),
    utm_content: read("utm_content"),
    utm_term: read("utm_term"),
    yclid: read("yclid"),
    gclid: read("gclid"),
  };
}

async function postLead(payload: Record<string, string>) {
  const response = await fetch("/api/leads", {
    method: "POST",
    headers: {"content-type": "application/json"},
    body: JSON.stringify({...payload, ...getAttribution()}),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {error?: string} | null;
    throw new Error(data?.error || "Не удалось отправить заявку");
  }
}

export default function SiteShell({
  page = "home",
  article,
}: {
  page?: PageName;
  article?: ArticleData;
}) {
  const [modal, setModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cookie, setCookie] = useState(false);
  const [modalPlacement, setModalPlacement] = useState("unknown");

  const metricGoal: MetricGoal = (goal, params = {}) => {
    const metrikaWindow = window as Window & {
      ym?: (id: number, action: string, goal: string, params?: MetricParams) => void;
    };
    metrikaWindow.ym?.(METRIKA_ID, "reachGoal", goal, params);
  };

  useEffect(() => {
    const cookieTimer = window.setTimeout(() => setCookie(localStorage.getItem("cookie-ok") !== "1"), 0);
    const query = new URLSearchParams(window.location.search);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "yclid", "gclid"].forEach(
      (key) => {
        const value = query.get(key);
        if (value) writeSession(key, value);
      },
    );
    if (!readSession("landing")) {
      writeSession("landing", window.location.href);
      writeSession("referrer", document.referrer);
    }
    return () => window.clearTimeout(cookieTimer);
  }, []);

  useEffect(() => {
    if (!modal) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModal(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [modal]);

  const organizationArticle = page === "article" && ["УК и организации", "Подготовка к сезону"].includes(article?.category || "");
  const defaultClient: ClientType = page === "org" || organizationArticle ? "УК / организация" : "Частный дом";
  const openModal = (placement: string) => {
    metricGoal("callback_open", {page, placement, client_type: defaultClient});
    setModalPlacement(placement);
    setMenuOpen(false);
    setModal(true);
  };
  const phoneClick = (placement: string) => metricGoal("phone_click", {page, placement});

  return (
    <div className="site">
      <header className="site-header">
        <Link href="/" className="logo" aria-label="Сети96 — главная">
          <img src="/media/seti96-logo.webp" width="300" height="125" alt="Сети96" />
        </Link>
        <nav className={menuOpen ? "site-nav open" : "site-nav"} aria-label="Основная навигация">
          {navItems.map(([label, href, key]) => {
            const active = page === key || (page === "article" && key === "blog");
            return (
              <Link
                key={href}
                href={href}
                className={active ? "active" : undefined}
                aria-current={active ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            );
          })}
          <a className="nav-phone" href={PHONE_HREF} onClick={() => phoneClick("mobile_menu")}>
            {PHONE}
          </a>
        </nav>
        <div className="header-actions">
          <a className="header-phone" href={PHONE_HREF} onClick={() => phoneClick("header")}>
            <small>Позвонить специалисту</small>
            <b>{PHONE}</b>
          </a>
          <button className="header-cta" type="button" onClick={() => openModal("header")}>
            Рассчитать стоимость
          </button>
        </div>
        <button
          className={menuOpen ? "menu-toggle open" : "menu-toggle"}
          type="button"
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      <main>
        {page === "home" && (
          <HomePage page={page} openModal={openModal} phoneClick={phoneClick} metricGoal={metricGoal} />
        )}
        {page === "dom" && (
          <SegmentPage
            page={page}
            clientType="Частный дом"
            eyebrow="Частным владельцам · Екатеринбург и до 50 км"
            title="Промывка отопления, котлов и теплообменников в частном доме"
            intro="Сначала выясним, связана ли проблема с внутренними отложениями. Если промывка действительно нужна — подберём безопасный для системы режим и согласуем стоимость до начала работ."
            image="/media/radiator-thermal-before-after.webp"
            imageAlt="Техническая иллюстрация нагрева радиатора до и после промывки"
            services={[
              "Газовые и электрические котлы",
              "Твердотопливные котлы",
              "Теплообменники и бойлеры",
              "Радиаторы и трубопроводы",
              "Контуры тёплого пола",
              "Система отопления дома",
            ]}
            benefits={[
              ["Ищем причину", "Проверяем, не связана ли проблема с воздухом, насосом, арматурой или настройкой системы."],
              ["Учитываем материалы", "Подбираем состав и режим циркуляции под конкретное оборудование и его состояние."],
              ["Согласуем заранее", "Объём, технология и стоимость работ известны до подключения установки."],
            ]}
            openModal={openModal}
            phoneClick={phoneClick}
            metricGoal={metricGoal}
          />
        )}
        {page === "org" && (
          <SegmentPage
            page={page}
            clientType="УК / организация"
            eyebrow="УК · ТСЖ · предприятия · Екатеринбург и до 50 км"
            title="Промывка ИТП, теплообменников и систем отопления организаций"
            intro="Обследуем объект, определим границы и технологию работ, подготовим расчёт. Работаем по договору и согласованному регламенту с актами и фотофиксацией."
            image="/media/plate-heat-exchanger-before-after.webp"
            imageAlt="Техническая иллюстрация пластинчатого теплообменника до и после очистки"
            services={[
              "ИТП и тепловые пункты",
              "Пластинчатые теплообменники",
              "Кожухотрубные теплообменники",
              "Котельное оборудование",
              "Системы отопления зданий",
              "Промывка и опрессовка",
              "Подготовка к отопительному сезону",
              "Акты и фотофиксация",
            ]}
            benefits={[
              ["Обследуем объект", "Уточняем схему, оборудование, точки подключения и допустимое время остановки."],
              ["Фиксируем объём", "До начала согласуем технологию, регламент, стоимость и состав документов."],
              ["Закрываем документально", "Работаем по договору, оформляем согласованные акты и фотофиксацию."],
            ]}
            openModal={openModal}
            phoneClick={phoneClick}
            metricGoal={metricGoal}
          />
        )}
        {page === "blog" && <MaterialsPage />}
        {page === "contacts" && (
          <ContactsPage openModal={openModal} phoneClick={phoneClick} metricGoal={metricGoal} />
        )}
        {page === "article" && article && <ArticlePage article={article} openModal={openModal} />}
      </main>

      <FinalCallToAction page={page} openModal={openModal} phoneClick={phoneClick} />

      <footer className="site-footer">
        <div className="footer-brand">
          <Link href="/" className="logo" aria-label="Сети96 — главная">
            <img src="/media/seti96-logo.webp" width="300" height="125" alt="Сети96" />
          </Link>
          <p>Промывка отопления и теплообменников в Екатеринбурге и до 50 км.</p>
        </div>
        <div className="footer-contact">
          <small>Связаться</small>
          <a href={PHONE_HREF} onClick={() => phoneClick("footer")}>
            {PHONE}
          </a>
          <a href={"mailto:" + EMAIL}>{EMAIL}</a>
        </div>
        <div className="footer-legal">
          <small>Реквизиты</small>
          <p>ООО «Танзанит» · ИНН 6670234728 · ОГРН 1086670038509</p>
          <p>Юридический адрес: Екатеринбург, ул. Вишнёвая, д. 69Б, офис 9</p>
        </div>
        <div className="footer-links">
          <Link href="/politika">Политика обработки данных</Link>
          <Link href="/materialy">Полезные материалы</Link>
          <Link href="/admin">Администратору</Link>
          <small>© 2026 Сети96</small>
        </div>
      </footer>

      <div className="mobile-bar" aria-label="Быстрая связь">
        <a href={PHONE_HREF} onClick={() => phoneClick("mobile_bar")}>
          Позвонить
        </a>
        <button type="button" onClick={() => openModal("mobile_bar")}>
          Получить расчёт
        </button>
      </div>

      {cookie && (
        <div className="cookie" role="status">
          <span>Сайт использует cookie для работы и аналитики.</span>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem("cookie-ok", "1");
              setCookie(false);
            }}
          >
            Понятно
          </button>
        </div>
      )}

      {modal && (
        <LeadModal
          page={page}
          clientType={defaultClient}
          placement={modalPlacement}
          metricGoal={metricGoal}
          onClose={() => setModal(false)}
        />
      )}
    </div>
  );
}

function HomePage({
  page,
  openModal,
  phoneClick,
  metricGoal,
}: {
  page: PageName;
  openModal: (placement: string) => void;
  phoneClick: (placement: string) => void;
  metricGoal: MetricGoal;
}) {
  return (
    <>
      <section className="hero dark-section">
        <div className="hero-copy">
          <p className="eyebrow">Екатеринбург и объекты до 50 км от города</p>
          <h1>Промывка систем отопления, котлов и теплообменников</h1>
          <p className="hero-lead">
            Сначала определим причину слабого нагрева. Если дело в отложениях — подберём технологию и
            согласуем стоимость до начала работ.
          </p>
          <ul className="hero-points">
            <li>Диагностика до решения о промывке</li>
            <li>Расчёт и технология до начала работ</li>
            <li>Для частных домов, УК и организаций</li>
          </ul>
          <ConversionActions placement="hero" openModal={openModal} phoneClick={phoneClick} />
          <p className="hero-note">Выезд для осмотра и расчёта стоимости — бесплатно.</p>
        </div>
        <div className="hero-conversion">
          <figure className="technical-visual">
            <img
              src="/media/heat-exchangers-before-after.webp"
              width="1200"
              height="675"
              alt="Техническая иллюстрация теплообменника до и после очистки"
              fetchPriority="high"
            />
            <figcaption>Техническая иллюстрация · результат зависит от состояния оборудования</figcaption>
          </figure>
          <QuickLeadForm page={page} clientType="Частный дом" placement="hero_form" metricGoal={metricGoal} />
        </div>
      </section>

      <section className="audience-section light-section" aria-labelledby="audience-title">
        <div className="section-heading compact-heading">
          <p className="eyebrow ink">Выберите вашу задачу</p>
          <h2 id="audience-title">Сразу к нужным условиям</h2>
        </div>
        <div className="audience-grid">
          <Link href="/dom" onClick={() => metricGoal("segment_click", {segment: "private", placement: "home"})}>
            <span className="card-number">01</span>
            <div>
              <small>Частным клиентам</small>
              <h3>Дом, котёл, бойлер или тёплый пол</h3>
              <p>Разберёмся с причиной, оценим систему и предложим понятный порядок действий.</p>
              <b>Условия для дома <i>→</i></b>
            </div>
          </Link>
          <Link href="/organizaciyam" onClick={() => metricGoal("segment_click", {segment: "business", placement: "home"})}>
            <span className="card-number">02</span>
            <div>
              <small>УК, ТСЖ и организациям</small>
              <h3>ИТП, теплообменники и системы зданий</h3>
              <p>Обследование, согласованный регламент, договор, акты и фотофиксация.</p>
              <b>Условия для организаций <i>→</i></b>
            </div>
          </Link>
        </div>
      </section>

      <section className="symptoms light-section">
        <div className="section-heading">
          <p className="eyebrow ink">Сначала — диагностика</p>
          <h2>Признаки, которые стоит проверить</h2>
          <p>
            Они могут говорить об отложениях, но встречаются и при других неисправностях. Не назначаем
            промывку только по одному симптому.
          </p>
        </div>
        <div className="symptom-list">
          {[
            "Батареи нагреваются неравномерно",
            "Котёл дольше выходит на температуру",
            "Горячая вода нагревается медленнее",
            "Контур тёплого пола стал холоднее",
            "Появился шум или перегрев",
            "Теплоноситель содержит ржавчину",
          ].map((item, index) => (
            <div key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <Benefits />
      <Process />
      <Reagent />
      <Faq />
    </>
  );
}

function SegmentPage({
  page,
  clientType,
  eyebrow,
  title,
  intro,
  image,
  imageAlt,
  services,
  benefits,
  openModal,
  phoneClick,
  metricGoal,
}: {
  page: PageName;
  clientType: ClientType;
  eyebrow: string;
  title: string;
  intro: string;
  image: string;
  imageAlt: string;
  services: string[];
  benefits: string[][];
  openModal: (placement: string) => void;
  phoneClick: (placement: string) => void;
  metricGoal: MetricGoal;
}) {
  return (
    <>
      <section className="segment-hero dark-section">
        <div className="segment-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="hero-lead">{intro}</p>
          <ConversionActions placement={page + "_hero"} openModal={openModal} phoneClick={phoneClick} />
          <p className="hero-note">Выезд для осмотра и расчёта стоимости — бесплатно.</p>
        </div>
        <div className="hero-conversion">
          <figure className="technical-visual">
            <img src={image} width="1200" height="675" alt={imageAlt} fetchPriority="high" />
            <figcaption>Техническая иллюстрация · фактический результат зависит от объекта</figcaption>
          </figure>
          <QuickLeadForm page={page} clientType={clientType} placement={page + "_hero_form"} metricGoal={metricGoal} />
        </div>
      </section>

      <section className="services light-section">
        <div className="section-heading compact-heading">
          <p className="eyebrow ink">Перечень работ</p>
          <h2>С чем работаем</h2>
        </div>
        <div className="service-grid">
          {services.map((service, index) => (
            <article key={service}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{service}</h3>
            </article>
          ))}
        </div>
        <p className="notice">
          Стоимость зависит от оборудования, объёма системы, материала, степени загрязнения и сложности
          подключения. Итоговый расчёт согласуем до начала работ.
        </p>
      </section>

      <section className="segment-benefits dark-section">
        <div className="section-heading compact-heading">
          <p className="eyebrow">Понятный порядок</p>
          <h2>Что происходит до начала работ</h2>
        </div>
        <div className="benefit-grid">
          {benefits.map(([heading, text], index) => (
            <article key={heading}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{heading}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <Process />
      <Faq />
    </>
  );
}

function MaterialsPage() {
  return (
    <section className="materials-page light-section">
      <div className="page-heading">
        <p className="eyebrow ink">Инженерная база знаний</p>
        <h1>Полезные материалы</h1>
        <p>
          Как отличить загрязнение от неисправности, выбрать метод очистки и подготовить объект к работам.
        </p>
      </div>
      <div className="article-grid">
        {articles.map((article, index) => (
          <article key={article.slug}>
            <div className="article-meta">
              <small>{article.category}</small>
              <span>{String(index + 1).padStart(2, "0")}</span>
            </div>
            <h2>{article.title}</h2>
            <p>{article.description}</p>
            <Link href={"/materialy/" + article.slug}>Читать материал <i>→</i></Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function ContactsPage({
  openModal,
  phoneClick,
  metricGoal,
}: {
  openModal: (placement: string) => void;
  phoneClick: (placement: string) => void;
  metricGoal: MetricGoal;
}) {
  return (
    <section className="contacts-page dark-section">
      <div className="page-heading">
        <p className="eyebrow">Связаться с нами</p>
        <h1>Обсудим вашу систему и следующий шаг</h1>
        <p>Работаем в Екатеринбурге и выезжаем на объекты в радиусе до 50 км от города.</p>
      </div>
      <div className="contacts-layout">
        <div className="contact-primary">
          <small>Телефон специалиста</small>
          <a href={PHONE_HREF} onClick={() => phoneClick("contacts_main")}>
            {PHONE}
          </a>
          <p>Если удобнее, оставьте номер — перезвоним и уточним исходные данные.</p>
          <button type="button" className="button primary" onClick={() => openModal("contacts_main")}>
            Получить расчёт стоимости
          </button>
        </div>
        <dl className="contact-details">
          <div>
            <dt>Рабочий адрес / база</dt>
            <dd>
              <a
                href="https://yandex.ru/maps/?text=Екатеринбург%2C%20ул.%20Хасановская%2C%2068"
                target="_blank"
                rel="noreferrer"
                onClick={() => metricGoal("map_click", {placement: "contacts"})}
              >
                Екатеринбург, ул. Хасановская, 68
              </a>
            </dd>
          </div>
          <div>
            <dt>Юридический адрес</dt>
            <dd>Екатеринбург, ул. Вишнёвая, д. 69Б, офис 9</dd>
          </div>
          <div>
            <dt>Электронная почта</dt>
            <dd>
              <a href={"mailto:" + EMAIL} onClick={() => metricGoal("email_click", {placement: "contacts"})}>
                {EMAIL}
              </a>
            </dd>
          </div>
          <div>
            <dt>Зона выезда</dt>
            <dd>Екатеринбург и объекты до 50 км от города</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

function ArticlePage({article, openModal}: {article: ArticleData; openModal: (placement: string) => void}) {
  return (
    <article className="article-page light-section">
      <div className="article-content">
        <Link className="back-link" href="/materialy">
          ← Все материалы
        </Link>
        <p className="eyebrow ink">{article.category}</p>
        <h1>{article.title}</h1>
        <p className="article-intro">{article.intro}</p>
        {article.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.bullets && (
              <ul>
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <aside className="article-cta">
          <p className="eyebrow ink">Нужна оценка вашего объекта?</p>
          <h2>Опишите симптомы — начнём с диагностики</h2>
          <p>Специалист уточнит оборудование и подскажет, какой следующий шаг имеет смысл.</p>
          <button type="button" className="button primary" onClick={() => openModal("article_inline")}>
            Задать вопрос специалисту
          </button>
        </aside>
      </div>
    </article>
  );
}

function Benefits() {
  const benefits = [
    ["Диагностика до решения", "Похожие симптомы могут возникать по разным причинам. Сначала оцениваем систему."],
    ["Метод под оборудование", "Учитываем материал, объём, тип отложений и доступ к точкам подключения."],
    ["Расчёт до начала", "Согласовываем объём, технологию и стоимость до подключения установки."],
    ["Проверка после промывки", "Удаляем рабочий раствор, промываем водой и проверяем доступные соединения."],
  ];
  return (
    <section className="benefits dark-section">
      <div className="section-heading compact-heading">
        <p className="eyebrow">Что получает клиент</p>
        <h2>Без лишней замены исправного оборудования</h2>
      </div>
      <div className="benefit-grid four">
        {benefits.map(([heading, text], index) => (
          <article key={heading}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{heading}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Process() {
  const steps = [
    ["Уточняем задачу", "По телефону выясняем симптомы, тип оборудования и расположение объекта."],
    ["Осматриваем систему", "Проверяем состояние, материалы, объём и возможность подключения."],
    ["Согласуем решение", "Объясняем метод, ограничения, объём работ и итоговую стоимость."],
    ["Промываем и проверяем", "Контролируем циркуляцию, удаляем раствор и проверяем результат."],
  ];
  return (
    <section className="process light-section">
      <div className="section-heading">
        <p className="eyebrow ink">Как всё проходит</p>
        <h2>Четыре понятных этапа</h2>
        <p>Вы понимаете, что и зачем будет сделано, ещё до начала промывки.</p>
      </div>
      <div className="process-grid">
        {steps.map(([heading, text], index) => (
          <article key={heading}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{heading}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Reagent() {
  return (
    <section className="reagent dark-section">
      <div className="reagent-copy">
        <p className="eyebrow">Технология промывки</p>
        <h2>Состав и режим выбираются под конкретную систему</h2>
        <p>
          Концентрация, температура и продолжительность обработки зависят от материала оборудования, объёма
          контура и характера загрязнений. Универсального режима для всех объектов нет.
        </p>
        <ul>
          <li>Циркуляция внутри изолированного контура</li>
          <li>Контроль процесса специалистом</li>
          <li>Промывка системы водой после обработки</li>
          <li>Проверка доступных соединений</li>
        </ul>
      </div>
      <figure className="technical-visual reagent-visual">
        <img
          src="/media/pipes-before-after.webp"
          width="1200"
          height="675"
          alt="Техническая иллюстрация трубы до и после химической очистки"
          loading="lazy"
        />
        <figcaption>Техническая иллюстрация процесса очистки</figcaption>
      </figure>
    </section>
  );
}

function Faq() {
  return (
    <section className="faq light-section">
      <div className="section-heading compact-heading">
        <p className="eyebrow ink">Вопросы и ограничения</p>
        <h2>Честно о промывке</h2>
      </div>
      <div className="faq-list">
        {faqs.map(([question, answer]) => (
          <details key={question}>
            <summary>
              {question}
              <span aria-hidden="true">+</span>
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function ConversionActions({
  placement,
  openModal,
  phoneClick,
}: {
  placement: string;
  openModal: (placement: string) => void;
  phoneClick: (placement: string) => void;
}) {
  return (
    <div className="conversion-actions">
      <button type="button" className="button primary" onClick={() => openModal(placement)}>
        Получить расчёт стоимости
      </button>
      <a className="button secondary" href={PHONE_HREF} onClick={() => phoneClick(placement)}>
        Позвонить {PHONE}
      </a>
    </div>
  );
}

function QuickLeadForm({
  page,
  clientType,
  placement,
  metricGoal,
}: {
  page: PageName;
  clientType: ClientType;
  placement: string;
  metricGoal: MetricGoal;
}) {
  const [phone, setPhone] = useState("+7");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientType>(clientType);
  const started = useRef(false);

  const onFocus = () => {
    if (started.current) return;
    started.current = true;
    metricGoal("form_start", {page, placement, client_type: selectedClient});
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const normalized = normalizePhone(phone);
    if (!normalized) {
      setError("Введите номер телефона из 10 цифр после +7");
      return;
    }
    setBusy(true);
    metricGoal("lead_attempt", {page, placement, client_type: selectedClient});
    try {
      const form = new FormData(event.currentTarget);
      await postLead({
        phone: normalized,
        name: "",
        clientType: selectedClient,
        message: "",
        website: String(form.get("website") || ""),
        page: window.location.pathname,
        placement,
      });
      metricGoal("lead_success", {page, placement, client_type: selectedClient});
      metricGoal(selectedClient === "Частный дом" ? "private_lead" : "organization_lead", {page, placement});
      setSent(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось отправить заявку");
      metricGoal("lead_error", {page, placement, client_type: selectedClient});
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="quick-form quick-success" role="status">
        <span className="success-icon">✓</span>
        <div>
          <b>Заявка отправлена</b>
          <p>Специалист свяжется с вами, чтобы уточнить задачу.</p>
        </div>
      </div>
    );
  }

  return (
    <form className="quick-form" onSubmit={submit} onFocus={onFocus}>
      <div className="quick-form-heading">
        <small>Бесплатная первичная оценка</small>
        <h2>Оставьте номер — уточним задачу и рассчитаем стоимость</h2>
      </div>
      <label>
        <span>Телефон</span>
        <input
          type="tel"
          name="phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="+7 (___) ___-__-__"
          autoComplete="tel"
          inputMode="tel"
          required
        />
      </label>
      {page === "home" && (
        <fieldset className="quick-object">
          <legend>Тип объекта</legend>
          <label>
            <input
              type="radio"
              name="quickClientType"
              checked={selectedClient === "Частный дом"}
              onChange={() => setSelectedClient("Частный дом")}
            />
            Частный дом
          </label>
          <label>
            <input
              type="radio"
              name="quickClientType"
              checked={selectedClient === "УК / организация"}
              onChange={() => setSelectedClient("УК / организация")}
            />
            УК / организация
          </label>
        </fieldset>
      )}
      <label className="honeypot" aria-hidden="true">
        Сайт
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="consent">
        <input type="checkbox" required />
        <span>
          Согласен на <a href="/politika" target="_blank" rel="noreferrer">обработку персональных данных</a>
        </span>
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" className="button primary" disabled={busy}>
        {busy ? "Отправляем…" : "Получить расчёт"}
      </button>
    </form>
  );
}

function LeadModal({
  page,
  clientType,
  placement,
  metricGoal,
  onClose,
}: {
  page: PageName;
  clientType: ClientType;
  placement: string;
  metricGoal: MetricGoal;
  onClose: () => void;
}) {
  const titleId = useId();
  const [phone, setPhone] = useState("+7");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientType>(clientType);
  const started = useRef(false);

  const onFocus = () => {
    if (started.current) return;
    started.current = true;
    metricGoal("form_start", {page, placement, client_type: selectedClient});
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const normalized = normalizePhone(phone);
    if (!normalized) {
      setError("Введите номер телефона из 10 цифр после +7");
      return;
    }
    const form = new FormData(event.currentTarget);
    setBusy(true);
    metricGoal("lead_attempt", {page, placement, client_type: selectedClient});
    try {
      await postLead({
        phone: normalized,
        name: String(form.get("name") || ""),
        clientType: selectedClient,
        message: String(form.get("message") || ""),
        website: String(form.get("website") || ""),
        page: window.location.pathname,
        placement,
      });
      metricGoal("lead_success", {page, placement, client_type: selectedClient});
      metricGoal(selectedClient === "Частный дом" ? "private_lead" : "organization_lead", {page, placement});
      setSent(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось отправить заявку");
      metricGoal("lead_error", {page, placement, client_type: selectedClient});
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="lead-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Закрыть форму">
          ×
        </button>
        {sent ? (
          <div className="modal-success" role="status">
            <span className="success-icon">✓</span>
            <p className="eyebrow ink">Заявка принята</p>
            <h2 id={titleId}>Спасибо! Мы получили ваш номер</h2>
            <p>Специалист свяжется с вами, чтобы уточнить оборудование и задачу.</p>
            <button className="button secondary dark-button" type="button" onClick={onClose}>
              Закрыть
            </button>
          </div>
        ) : (
          <>
            <p className="eyebrow ink">Бесплатная первичная оценка</p>
            <h2 id={titleId}>Получить расчёт стоимости</h2>
            <p className="modal-intro">Телефон обязателен. Имя и описание можно не заполнять.</p>
            <form onSubmit={submit} onFocus={onFocus}>
              <label>
                <span>Телефон *</span>
                <input
                  type="tel"
                  name="phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+7 (___) ___-__-__"
                  autoComplete="tel"
                  inputMode="tel"
                  autoFocus
                  required
                />
              </label>
              <label>
                <span>Имя <small>необязательно</small></span>
                <input type="text" name="name" autoComplete="name" maxLength={100} />
              </label>
              <fieldset>
                <legend>Тип объекта</legend>
                <label>
                  <input
                    type="radio"
                    name="clientType"
                    value="Частный дом"
                    checked={selectedClient === "Частный дом"}
                    onChange={() => setSelectedClient("Частный дом")}
                  />
                  Частный дом
                </label>
                <label>
                  <input
                    type="radio"
                    name="clientType"
                    value="УК / организация"
                    checked={selectedClient === "УК / организация"}
                    onChange={() => setSelectedClient("УК / организация")}
                  />
                  УК / организация
                </label>
              </fieldset>
              <label>
                <span>Что происходит с системой? <small>необязательно</small></span>
                <textarea name="message" rows={3} maxLength={1000} placeholder="Например: котёл стал дольше нагревать воду" />
              </label>
              <label className="honeypot" aria-hidden="true">
                Сайт
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
              <label className="consent">
                <input type="checkbox" required />
                <span>
                  Согласен на <a href="/politika" target="_blank" rel="noreferrer">обработку персональных данных</a>
                </span>
              </label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="button primary" type="submit" disabled={busy}>
                {busy ? "Отправляем…" : "Получить расчёт"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function FinalCallToAction({
  page,
  openModal,
  phoneClick,
}: {
  page: PageName;
  openModal: (placement: string) => void;
  phoneClick: (placement: string) => void;
}) {
  return (
    <section className="final-cta">
      <div>
        <p className="eyebrow ink">Первый шаг — без оплаты</p>
        <h2>Осмотрим объект и рассчитаем стоимость</h2>
        <p>Уточним задачу, проверим возможность промывки и предложим следующий шаг.</p>
      </div>
      <ConversionActions placement={page + "_final"} openModal={openModal} phoneClick={phoneClick} />
    </section>
  );
}
