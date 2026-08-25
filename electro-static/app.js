const form = document.querySelector("#lead-form");
const success = document.querySelector(".success");
const errorBox = document.querySelector(".formError");
const submitButton = form.querySelector("button[type=submit]");

form.addEventListener("submit", async event => {
  event.preventDefault();
  errorBox.hidden = true;
  submitButton.disabled = true;
  submitButton.textContent = "Отправляем…";
  const values = Object.fromEntries(new FormData(form));
  const query = new URLSearchParams(location.search);
  const details = ["Электрика", values.address && `Адрес: ${values.address}`, values.problem && `Проблема: ${values.problem}`].filter(Boolean).join("\n");
  const payload = {...values, clientType: details, page: `electro.seti96.ru${location.pathname}`, source: query.get("utm_source") || document.referrer, utm_campaign: query.get("utm_campaign") || "", utm_content: query.get("utm_content") || "", utm_term: query.get("utm_term") || ""};
  try {
    const response = await fetch("/api/leads", {method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify(payload)});
    if (!response.ok) throw new Error("delivery");
    form.hidden = true; success.hidden = false; form.reset();
    if (typeof window.ym === "function") window.ym(111934175, "reachGoal", "lead_sent");
  } catch {
    errorBox.textContent = "Не удалось отправить заявку. Позвоните нам по номеру +7 993 106-04-23.";
    errorBox.hidden = false;
  } finally { submitButton.disabled = false; submitButton.textContent = "Отправить заявку"; }
});

success.querySelector("button").addEventListener("click", () => { success.hidden = true; form.hidden = false; });
