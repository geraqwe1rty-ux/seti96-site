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

const escapeHtml = value => String(value || "").replace(/[<>&]/g, char => ({"<":"&lt;", ">":"&gt;", "&":"&amp;"})[char]);

app.get("/health", (_req, res) => res.json({ok: true}));
app.use("/admin", protect);
app.get("/api/leads", protect, async (_req, res) => res.json(await readLeads()));
app.post("/api/leads", express.json({limit: "32kb"}), async (req, res) => {
  const body = req.body || {};
  if (!body.name || !body.phone || !body.clientType || body.name.length > 100 || body.phone.length > 40) {
    return res.status(400).json({error: "Проверьте данные"});
  }
  const leads = await readLeads();
  const created = new Date().toISOString();
  const lead = {
    id: (leads[0]?.id || 0) + 1, created_at: created, name: body.name,
    phone: body.phone, client_type: body.clientType, page: body.page || "",
    status: "новая", telegram_status: "не настроен"
  };
  leads.unshift(lead);
  await writeLeads(leads.slice(0, 2000));

  if (process.env.LEAD_RELAY_URL && process.env.LEAD_RELAY_SECRET) {
    try {
      const result = await fetch(process.env.LEAD_RELAY_URL.trim(), {
        method: "POST", headers: {"content-type":"application/json"},
        redirect: "follow",
        body: JSON.stringify({...body, secret: process.env.LEAD_RELAY_SECRET.trim()})
      });
      const relay = await result.json().catch(() => ({}));
      lead.telegram_status = result.ok && relay.ok ? "доставлено" : `ошибка шлюза ${result.status}`;
    } catch { lead.telegram_status = "ошибка доставки"; }
    await writeLeads(leads.slice(0, 2000));
  }
  return res.json({ok: true});
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

const child = spawn(process.execPath, ["node_modules/vinext/dist/cli.js", "start", "--port", String(appPort), "--hostname", "127.0.0.1"], {
  stdio: "inherit", env: {...process.env, PORT: String(appPort)}
});

app.use(createProxyMiddleware({target: `http://127.0.0.1:${appPort}`, changeOrigin: false, ws: true}));
const server = app.listen(port, "0.0.0.0", () => console.log(`Сети96 запущен на порту ${port}`));

function stop(signal) { child.kill(signal); server.close(() => process.exit(0)); }
process.on("SIGTERM", () => stop("SIGTERM"));
process.on("SIGINT", () => stop("SIGINT"));
child.on("exit", code => { if (code) process.exit(code); });
