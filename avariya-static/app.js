(() => {
  const form = document.querySelector("#lead-form");
  if (!form) return;
  const status = form.querySelector(".form-status");
  const params = new URLSearchParams(location.search);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button[type='submit']");
    const data = new FormData(form);
    button.disabled = true;
    status.textContent = "Отправляем заявку…";
    status.className = "form-status";
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({
          name: String(data.get("name") || "").trim(), phone: String(data.get("phone") || "").trim(),
          address: String(data.get("address") || "").trim(), problem: String(data.get("problem") || "").trim(),
          clientType: "Аварийные работы", service: "avariya", page: location.hostname + location.pathname,
          source: params.get("utm_source") || document.referrer || "Прямой переход",
          utm_campaign: params.get("utm_campaign") || "", utm_content: params.get("utm_content") || "", utm_term: params.get("utm_term") || ""
        })
      });
      if (!response.ok) throw new Error("send failed");
      form.reset();
      status.textContent = "Заявка отправлена. Свяжемся с вами, чтобы уточнить ситуацию.";
      status.className = "form-status success-text";
    } catch {
      status.textContent = "Не удалось отправить заявку. Позвоните нам: +7 993 106-04-23";
      status.className = "form-status error-text";
    } finally { button.disabled = false; }
  });
})();
