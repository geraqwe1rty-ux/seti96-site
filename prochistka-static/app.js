const METRIKA_ID = window.PROCHISTKA_METRIKA_ID;
const COOKIE_KEY = "seti96_prochistka_cookie_choice";
const selectedObjectInputs = document.querySelectorAll('[name="objectType"]');
const objectButtons = document.querySelectorAll("[data-object-option]");
const problemInputs = document.querySelectorAll('[name="problem"]');
const problemButtons = document.querySelectorAll("[data-pick-problem]");
const leadForms = document.querySelectorAll(".lead-form");
const cookieBanner = document.querySelector("#cookie-banner");

const params = new URLSearchParams(location.search);
const utm = {
  source: params.get("utm_source") || "сайт",
  campaign: params.get("utm_campaign") || "",
  content: params.get("utm_content") || "",
  term: params.get("utm_term") || ""
};

try {
  const savedUtm = JSON.parse(sessionStorage.getItem("seti96_prochistka_utm") || "null");
  if (savedUtm && !params.has("utm_source")) Object.assign(utm, savedUtm);
  else sessionStorage.setItem("seti96_prochistka_utm", JSON.stringify(utm));
} catch {}

function loadMetrika() {
  if (!METRIKA_ID || window.ym) return;
  (function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    k=e.createElement(t);a=e.getElementsByTagName(t)[0];k.async=1;k.src=r;a.parentNode.insertBefore(k,a);
  })(window,document,"script","https://mc.yandex.ru/metrika/tag.js?id="+METRIKA_ID,"ym");
  window.ym(METRIKA_ID,"init",{ssr:true,webvisor:true,clickmap:true,referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});
}

function trackGoal(goal, details) {
  if (typeof window.ym === "function" && METRIKA_ID) window.ym(METRIKA_ID, "reachGoal", goal, details || {});
}

const cookieChoice = localStorage.getItem(COOKIE_KEY);
if (cookieChoice === "accepted") loadMetrika();
else if (!cookieChoice && cookieBanner) cookieBanner.hidden = false;

document.querySelectorAll("[data-cookie]").forEach(button => {
  button.addEventListener("click", () => {
    const accepted = button.dataset.cookie === "accept";
    localStorage.setItem(COOKIE_KEY, accepted ? "accepted" : "declined");
    if (cookieBanner) cookieBanner.hidden = true;
    if (accepted) loadMetrika();
  });
});

function chooseObject(value, scrollToForm = false) {
  objectButtons.forEach(button => {
    const active = button.dataset.objectOption === value;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  selectedObjectInputs.forEach(input => { input.value = value; });
  if (scrollToForm) document.querySelector("#request")?.scrollIntoView({behavior:"smooth", block:"start"});
}

function chooseProblem(value) {
  problemInputs.forEach(input => { input.value = value; });
  problemButtons.forEach(button => button.classList.toggle("is-selected", button.dataset.pickProblem === value));
  trackGoal("select_problem_prochistka", {problem: value});
  document.querySelector("#request")?.scrollIntoView({behavior:"smooth", block:"start"});
}

objectButtons.forEach(button => button.addEventListener("click", () => chooseObject(button.dataset.objectOption || "Квартира")));
document.querySelectorAll("[data-pick-object]").forEach(link => link.addEventListener("click", event => {
  event.preventDefault();
  chooseObject(link.dataset.pickObject || "Квартира", true);
  trackGoal("select_object_prochistka", {object: link.dataset.pickObject || "Квартира"});
}));
problemButtons.forEach(button => button.addEventListener("click", () => chooseProblem(button.dataset.pickProblem || "")));
document.querySelectorAll('select[name="objectType"]').forEach(select => select.addEventListener("change", () => chooseObject(select.value)));
document.querySelectorAll("[data-call]").forEach(link => link.addEventListener("click", () => trackGoal("click_phone_prochistka", {place: link.closest("header") ? "header" : "page"})));
document.querySelectorAll("[data-telegram]").forEach(link => link.addEventListener("click", () => trackGoal("click_telegram_prochistka", {place: link.closest("footer") ? "footer" : "page"})));
document.querySelectorAll('a[href="#request"]').forEach(link => link.addEventListener("click", () => trackGoal("open_form_prochistka", {place: link.closest("header") ? "header" : "page"})));

document.querySelectorAll('input[type="tel"]').forEach(input => {
  input.addEventListener("input", () => {
    let digits = input.value.replace(/\D/g, "");
    if (digits.length > 10 && (digits.startsWith("7") || digits.startsWith("8"))) digits = digits.slice(1);
    digits = digits.slice(0, 10);
    const parts = [digits.slice(0,3), digits.slice(3,6), digits.slice(6,8), digits.slice(8,10)];
    input.value = parts[0] + (parts[1] ? " " + parts[1] : "") + (parts[2] ? "-" + parts[2] : "") + (parts[3] ? "-" + parts[3] : "");
  });
});

document.querySelectorAll(".faq details").forEach(item => {
  item.addEventListener("toggle", () => {
    if (!item.open) return;
    document.querySelectorAll(".faq details").forEach(other => { if (other !== item) other.open = false; });
  });
});

leadForms.forEach(form => {
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const statusNode = form.querySelector(".form-status");
    const data = new FormData(form);
    const rawPhone = String(data.get("phone") || "").trim();
    let digits = rawPhone.replace(/\D/g, "");
    if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) digits = digits.slice(1);
    const phone = `+7 ${rawPhone}`;
    statusNode.className = statusNode.classList.contains("wide-field") ? "form-status wide-field" : "form-status";

    if (digits.length !== 10) {
      statusNode.textContent = "Проверьте номер телефона.";
      statusNode.classList.add("visible", "error");
      return;
    }

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Отправляем…";

    try {
      const objectType = String(data.get("objectType") || "Квартира");
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({
          name: String(data.get("name") || "Не указано").trim() || "Не указано",
          phone,
          clientType: objectType,
          service: "Прочистка канализации",
          address: String(data.get("address") || "").trim(),
          problem: String(data.get("problem") || "").trim(),
          page: location.hostname + location.pathname,
          formPlace: form.dataset.formPlace || "Форма расчёта",
          consent: data.get("consent") === "on",
          policyVersion: "2026-09-11",
          source: utm.source,
          campaign: utm.campaign,
          utm_campaign: utm.campaign,
          utm_content: utm.content,
          utm_term: utm.term
        })
      });
      if (!response.ok) throw new Error("send_failed");
      form.reset();
      chooseObject("Квартира");
      problemButtons.forEach(button => button.classList.remove("is-selected"));
      statusNode.textContent = "Заявка принята. Скоро мы позвоним вам.";
      statusNode.classList.add("visible", "success");
      button.textContent = "Заявка отправлена";
      trackGoal("lead_prochistka", {object: objectType, form: form.dataset.formPlace || "main"});
      setTimeout(() => { button.textContent = originalText; }, 5000);
    } catch {
      statusNode.innerHTML = 'Не удалось отправить заявку. Позвоните: <a href="tel:+79931060423">+7 993 106-04-23</a>.';
      statusNode.classList.add("visible", "error");
      button.textContent = originalText;
    } finally {
      button.disabled = false;
    }
  });
});
