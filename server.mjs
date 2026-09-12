import express from "express";
import {createProxyMiddleware} from "http-proxy-middleware";
import {spawn} from "node:child_process";
import {mkdir, readFile, rename, writeFile} from "node:fs/promises";
import path from "node:path";

const port = Number(process.env.PORT || 3000);
const appPort = Number(process.env.APP_INTERNAL_PORT || 3001);
const dataDir = path.resolve(process.env.DATA_DIR || "/tmp/data");
const leadsFile = path.join(dataDir, "leads.json");
const electroDir = path.resolve("electro-static");
const cameraDir = path.resolve("camera-static");
const santehnikaDir = path.resolve("santehnika-static");
const gromkayaSvyazDir = path.resolve("gromkaya-svyaz-static");
const avariyaDir = path.resolve("avariya-static");
const prochistkaDir = path.resolve("prochistka-static");
const app = express();

await mkdir(dataDir, {recursive: true});

async function readLeads() {
  try { return JSON.parse(await readFile(leadsFile, "utf8")); }
  catch (error) { if (error.code === "ENOENT") return []; throw error; }
}

async function writeLeads(leads) {
  const temporary = `${leadsFile}.tmp`;
  await writeFile(temporary, JSON.stringify(leads, null, 2));
  await rename(temporary, leadsFile);
}

function authorized(req) {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPassword) return false;
  const value = req.headers.authorization || "";
  if (!value.startsWith("Basic ")) return false;
  const [user, password] = Buffer.from(value.slice(6), "base64").toString().split(":");
  return user === expectedUser && password === expectedPassword;
}

function protect(req, res, next) {
  if (authorized(req)) return next();
  res.set("WWW-Authenticate", 'Basic realm="Seti96 admin"');
  return res.status(401).send("Требуется вход");
}

function isElectroHost(req) {
  return String(req.hostname || "").toLowerCase() === "electro.seti96.ru";
}

function isCameraHost(req) {
  return String(req.hostname || "").toLowerCase() === "camera.seti96.ru";
}

function isSantehnikaHost(req) {
  return String(req.hostname || "").toLowerCase() === "santehnika.seti96.ru";
}

function isGromkayaSvyazHost(req) {
  return String(req.hostname || "").toLowerCase() === "gromkaya-svyaz.seti96.ru";
}

function isAvariyaHost(req) {
  return String(req.hostname || "").toLowerCase() === "avariya.seti96.ru";
}

function isProchistkaHost(req) {
  return String(req.hostname || "").toLowerCase() === "prochistka.seti96.ru";
}

function isPrimarySeti96Host(req) {
  const hostname = String(req.hostname || "").toLowerCase();
  return ["seti96.ru", "www.seti96.ru", "localhost", "127.0.0.1"].includes(hostname);
}

const bodyValue = (body, key, maxLength) => String(body[key] ?? "").trim().slice(0, maxLength);

const escapeHtml = value => String(value || "").replace(/[<>&]/g, char => ({"<":"&lt;", ">":"&gt;", "&":"&amp;"})[char]);

async function deliverPrimaryLeadDirectly(lead) {
  const token = String(process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const chatId = String(process.env.TELEGRAM_CHAT_ID || "").trim();
  if (!token || !chatId) return {ok: false, status: "Telegram напрямую не настроен"};

  const details = [
    ["Тип клиента", lead.client_type],
    ["Имя", lead.name],
    ["Телефон", lead.phone],
    ["Описание", lead.comment],
    ["Страница", lead.page],
    ["Место формы", lead.form_place],
    ["Источник", lead.utm_source || lead.source],
    ["Кампания", lead.utm_campaign],
    ["Поисковый запрос", lead.utm_term],
    ["yclid", lead.yclid],
  ].filter(([, value]) => value);
  const text = [
    "<b>Новая заявка с seti96.ru</b>",
    ...details.map(([label, value]) => `<b>${label}:</b> ${escapeHtml(value)}`),
  ].join("\n").slice(0, 4000);

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {"content-type": "application/json"},
      body: JSON.stringify({chat_id: chatId, text, parse_mode: "HTML"}),
      signal: AbortSignal.timeout(8000),
    });
    const telegram = await response.json().catch(() => ({}));
    return response.ok && telegram.ok
      ? {ok: true, status: "доставлено (напрямую)"}
      : {ok: false, status: `Telegram ${response.status}${telegram.description ? `: ${String(telegram.description).slice(0, 160)}` : ""}`};
  } catch (error) {
    console.error("Direct Telegram delivery failed", escapeHtml(error?.message));
    return {ok: false, status: error?.name === "TimeoutError" ? "Telegram: тайм-аут" : "Telegram: ошибка соединения"};
  }
}

app.get("/health", (_req, res) => res.json({ok: true, release: "telegram-diagnostics-v3"}));
app.use("/admin", protect);
app.get("/api/leads", protect, async (_req, res) => res.json(await readLeads()));
app.post("/api/leads", express.json({limit: "32kb"}), async (req, res) => {
  const body = req.body || {};
  const name = bodyValue(body, "name", 100);
  const phone = bodyValue(body, "phone", 40);
  const clientType = bodyValue(body, "clientType", 40);
  const isPrimaryLead = isPrimarySeti96Host(req);

  if (isPrimaryLead && bodyValue(body, "website", 200)) return res.json({ok: true});
  if (isPrimaryLead && (!/^\+7\d{10}$/.test(phone) || !["Частный дом", "УК / организация"].includes(clientType))) {
    return res.status(400).json({error: "Проверьте номер телефона"});
  }
  if (!isPrimaryLead && (!name || !phone || !clientType)) {
    return res.status(400).json({error: "Проверьте данные"});
  }
  if (body.service === "Прочистка канализации" && body.consent !== true) {
    return res.status(400).json({error: "Необходимо согласие на обработку данных"});
  }
  const leads = await readLeads();
  const created = new Date().toISOString();
  const lead = {
    id: (leads[0]?.id || 0) + 1, created_at: created, name: name || "Не указано",
    phone, client_type: clientType, page: bodyValue(body, "page", 500),
    service: bodyValue(body, "service", 200), address: bodyValue(body, "address", 500),
    comment: bodyValue(body, "message", 1000) || bodyValue(body, "problem", 1000) || bodyValue(body, "comment", 1000),
    form_place: bodyValue(body, "placement", 100) || bodyValue(body, "formPlace", 100),
    consent_at: body.consent ? created : "", policy_version: body.policyVersion || "",
    source: bodyValue(body, "source", 300),
    referrer: bodyValue(body, "referrer", 500), landing: bodyValue(body, "landing", 500),
    utm_source: bodyValue(body, "utm_source", 200), utm_medium: bodyValue(body, "utm_medium", 200),
    utm_campaign: bodyValue(body, "utm_campaign", 200) || bodyValue(body, "campaign", 200),
    utm_content: bodyValue(body, "utm_content", 200), utm_term: bodyValue(body, "utm_term", 300),
    yclid: bodyValue(body, "yclid", 200), gclid: bodyValue(body, "gclid", 200),
    status: "новая", telegram_status: "не настроен"
  };
  leads.unshift(lead);
  await writeLeads(leads.slice(0, 2000));

  if (process.env.LEAD_RELAY_URL && process.env.LEAD_RELAY_SECRET) {
    try {
      const result = await fetch(process.env.LEAD_RELAY_URL.trim(), {
        method: "POST", headers: {"content-type":"application/json"},
        redirect: "follow",
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({
          ...body,
          name: lead.name,
          phone: lead.phone,
          clientType: lead.client_type,
          page: lead.page,
          formPlace: lead.form_place,
          problem: lead.comment,
          comment: lead.comment,
          leadId: lead.id,
          adminUrl: `https://${req.hostname}/admin`,
          secret: process.env.LEAD_RELAY_SECRET.trim()
        })
      });
      const relayText = await result.text();
      const relay = (() => { try { return JSON.parse(relayText); } catch { return {}; } })();
      const relayMessage = String(relay.error || relay.description || "").trim().slice(0, 120);
      const relayTelegramStatus = Number.isFinite(Number(relay.telegramStatus))
        ? `Telegram ${Number(relay.telegramStatus)}`
        : "";
      const relayDetail = [relayMessage, relayTelegramStatus].filter(Boolean).join(", ");
      lead.telegram_status = result.ok && relay.ok
        ? "доставлено (шлюз)"
        : `ошибка шлюза ${result.status}${relayDetail ? `: ${relayDetail}` : ""}`;
    } catch (error) {
      console.error("Lead relay error", escapeHtml(error?.message));
      lead.telegram_status = "ошибка доставки";
    }
  }

  if (isPrimaryLead && !lead.telegram_status.startsWith("доставлено")) {
    const relayStatus = lead.telegram_status;
    const direct = await deliverPrimaryLeadDirectly(lead);
    lead.telegram_status = direct.ok ? direct.status : `${relayStatus}; ${direct.status}`;
  }
  await writeLeads(leads.slice(0, 2000));

  if (isPrimaryLead && !lead.telegram_status.startsWith("доставлено")) {
    return res.status(502).json({
      error: "Заявка сохранена, но уведомление не отправлено. Позвоните нам по номеру +7 993 106-04-23.",
      saved: true,
      delivery: lead.telegram_status,
    });
  }
  return res.json({ok: true, delivery: lead.telegram_status});
});

app.get("/", (req, res, next) => isElectroHost(req) ? res.sendFile(path.join(electroDir, "index.html")) : next());
app.get("/politika", (req, res, next) => isElectroHost(req) ? res.sendFile(path.join(electroDir, "politika.html")) : next());
app.use((req, res, next) => isElectroHost(req) ? express.static(electroDir, {index: false})(req, res, next) : next());
app.get("/", (req, res, next) => isCameraHost(req) ? res.sendFile(path.join(cameraDir, "index.html")) : next());
app.get("/politika", (req, res, next) => isCameraHost(req) ? res.sendFile(path.join(cameraDir, "politika.html")) : next());
app.use((req, res, next) => isCameraHost(req) ? express.static(cameraDir, {index: false})(req, res,next) : next());
app.get("/", (req, res, next) => isSantehnikaHost(req) ? res.sendFile(path.join(santehnikaDir, "index.html")) : next());
app.get("/politika", (req, res, next) => isSantehnikaHost(req) ? res.sendFile(path.join(santehnikaDir, "politika.html")) : next());
app.use((req, res, next) => isSantehnikaHost(req) ? express.static(santehnikaDir, {index: false})(req, res,next) : next());
app.get("/", (req, res, next) => isGromkayaSvyazHost(req) ? res.sendFile(path.join(gromkayaSvyazDir, "index.html")) : next());
app.get("/politika", (req, res, next) => isGromkayaSvyazHost(req) ? res.sendFile(path.join(gromkayaSvyazDir, "politika.html")) : next());
app.use((req, res, next) => isGromkayaSvyazHost(req) ? express.static(gromkayaSvyazDir, {index: false})(req, res,next) : next());
app.get("/", (req, res, next) => isAvariyaHost(req) ? res.sendFile(path.join(avariyaDir, "index.html")) : next());
app.get("/politika", (req, res, next) => isAvariyaHost(req) ? res.sendFile(path.join(avariyaDir, "politika.html")) : next());
app.use((req, res, next) => isAvariyaHost(req) ? express.static(avariyaDir, {index: false})(req, res,next) : next());
app.get("/", (req, res, next) => isProchistkaHost(req) ? res.sendFile(path.join(prochistkaDir, "index.html")) : next());
app.get("/politika", (req, res, next) => isProchistkaHost(req) ? res.redirect(301, "/policy") : next());
app.get("/policy", (req, res, next) => isProchistkaHost(req) ? res.sendFile(path.join(prochistkaDir, "policy.html")) : next());
app.get("/consent", (req, res, next) => isProchistkaHost(req) ? res.sendFile(path.join(prochistkaDir, "consent.html")) : next());
app.get("/cookies", (req, res, next) => isProchistkaHost(req) ? res.sendFile(path.join(prochistkaDir, "cookies.html")) : next());
app.use((req, res, next) => isProchistkaHost(req) ? express.static(prochistkaDir, {index: false})(req, res,next) : next());

const child = spawn(process.execPath, ["node_modules/vinext/dist/cli.js", "start", "--port", String(appPort), "--hostname", "127.0.0.1"], {
  stdio: "inherit", env: {...process.env, PORT: String(appPort)}
});

app.use(createProxyMiddleware({target: `http://127.0.0.1:${appPort}`, changeOrigin: false, ws: true}));
const server = app.listen(port, "0.0.0.0", () => console.log(`Сети96 запущен на порту ${port}`));

function stop(signal) { child.kill(signal); server.close(() => process.exit(0)); }
process.on("SIGTERM", () => stop("SIGTERM"));
process.on("SIGINT", () => stop("SIGINT"));
child.on("exit", code => { if (code) process.exit(code); });
