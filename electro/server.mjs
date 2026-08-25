import express from "express";
import {createProxyMiddleware} from "http-proxy-middleware";
import {spawn} from "node:child_process";

const port = Number(process.env.PORT || 3000);
const appPort = Number(process.env.APP_INTERNAL_PORT || 3001);
const app = express();

const escapeHtml = value => String(value || "").replace(/[<>&]/g, char => ({"<":"&lt;", ">":"&gt;", "&":"&amp;"})[char]);

app.get("/health", (_req, res) => res.json({ok:true}));
app.post("/api/leads", express.json({limit:"32kb"}), async (req, res) => {
  const body = req.body || {};
  if (!body.name || !body.phone || String(body.name).length > 100 || String(body.phone).length > 40) {
    return res.status(400).json({error:"Проверьте данные"});
  }
  if (!process.env.LEAD_RELAY_URL || !process.env.LEAD_RELAY_SECRET) {
    return res.status(503).json({error:"Отправка заявок не настроена"});
  }
  const optionalDetails = [
    body.address ? `Адрес: ${String(body.address)}` : "",
    body.problem ? `Описание: ${String(body.problem)}` : "",
  ].filter(Boolean);
  const details = {
    secret: process.env.LEAD_RELAY_SECRET,
    name: String(body.name),
    phone: String(body.phone),
    clientType: ["Электрика", ...optionalDetails].join("\n"),
    service: "Электрика",
    address: String(body.address || ""),
    problem: String(body.problem || ""),
    page: String(body.page || "/"),
    source: String(body.source || ""),
    utm_campaign: String(body.utm_campaign || ""),
    utm_content: String(body.utm_content || ""),
    utm_term: String(body.utm_term || ""),
  };
  try {
    const relay = await fetch(process.env.LEAD_RELAY_URL, {
      method:"POST", headers:{"content-type":"application/json"}, redirect:"follow", body:JSON.stringify(details)
    });
    const responseText = await relay.text();
    if (!relay.ok) return res.status(502).json({error:"Ошибка доставки",status:relay.status});
    return res.type("application/json").send(responseText || JSON.stringify({ok:true}));
  } catch (error) {
    console.error("Lead relay error", escapeHtml(error?.message));
    return res.status(502).json({error:"Ошибка доставки"});
  }
});

const child = spawn(process.execPath, ["node_modules/vinext/dist/cli.js", "start", "--port", String(appPort), "--hostname", "127.0.0.1"], {
  stdio:"inherit", env:{...process.env,PORT:String(appPort)}
});
app.use(createProxyMiddleware({target:`http://127.0.0.1:${appPort}`,changeOrigin:false,ws:true}));
const server = app.listen(port,"0.0.0.0",()=>console.log(`Сети 96 Электрика запущен на порту ${port}`));
function stop(signal){child.kill(signal);server.close(()=>process.exit(0));}
process.on("SIGTERM",()=>stop("SIGTERM"));
process.on("SIGINT",()=>stop("SIGINT"));
child.on("exit",code=>{if(code)process.exit(code);});
