const form = document.querySelector("#lead-form");
const statusNode = document.querySelector("#form-status");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector("button[type='submit']");
  const data = new FormData(form);
  statusNode.className = "form-status";
  button.disabled = true;
  button.textContent = "Отправляем…";

  try {
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: {"content-type": "application/json"},
      body: JSON.stringify({
        name: String(data.get("name") || "").trim(),
        phone: String(data.get("phone") || "").trim(),
        address: String(data.get("address") || "").trim(),
        problem: String(data.get("problem") || "").trim(),
        clientType: "Прочистка канализации",
        service: "prochistka",
        page: location.hostname,
        source: new URLSearchParams(location.search).get("utm_source") || "сайт",
        campaign: new URLSearchParams(location.search).get("utm_campaign") || ""
      })
    });
    if (!response.ok) throw new Error("send_failed");
    form.reset();
    statusNode.textContent = "Заявка отправлена. Скоро мы свяжемся с вами.";
    statusNode.className = "form-status visible";
    if (typeof window.ym === "function" && window.PROCHISTKA_METRIKA_ID) {
      window.ym(window.PROCHISTKA_METRIKA_ID, "reachGoal", "lead_prochistka");
    }
  } catch {
    statusNode.textContent = "Не удалось отправить заявку. Позвоните нам: +7 993 106-04-23.";
    statusNode.className = "form-status visible error";
  } finally {
    button.disabled = false;
    button.textContent = "Отправить заявку →";
  }
});
