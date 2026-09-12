import {getChatGPTUser} from "../../chatgpt-auth";

const schema = `CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  client_type TEXT NOT NULL,
  page TEXT,
  status TEXT NOT NULL DEFAULT 'новая',
  telegram_status TEXT NOT NULL DEFAULT 'не настроен',
  comment TEXT
)`;

type RuntimeEnv = {
  DB: D1Database;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
};

async function runtime() {
  const {env} = await import("cloudflare:workers");
  const runtimeEnv = env as unknown as RuntimeEnv;
  await runtimeEnv.DB.prepare(schema).run();
  return runtimeEnv;
}

const value = (body: Record<string, unknown>, key: string, maxLength: number) =>
  String(body[key] || "").trim().slice(0, maxLength);

const clean = (input: string) => {
  const replacements: Record<string, string> = {"<": "&lt;", ">": "&gt;", "&": "&amp;"};
  return input.replace(/[<>&]/g, (character) => replacements[character]);
};

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({error: "Некорректные данные"}, {status: 400});
  }

  if (value(body, "website", 200)) return Response.json({ok: true});

  const phone = value(body, "phone", 30);
  const name = value(body, "name", 100) || "Не указано";
  const clientType = value(body, "clientType", 40);
  const page = value(body, "page", 200);
  const message = value(body, "message", 1000);

  if (!/^\+7\d{10}$/.test(phone) || !["Частный дом", "УК / организация"].includes(clientType)) {
    return Response.json({error: "Проверьте номер телефона"}, {status: 400});
  }

  const runtimeEnv = await runtime();
  const created = new Date().toISOString();
  const saved = await runtimeEnv.DB.prepare(
    "INSERT INTO leads(created_at,name,phone,client_type,page,telegram_status,comment) VALUES(?,?,?,?,?,'ожидает отправки',?)",
  )
    .bind(created, name, phone, clientType, page, message)
    .run();
  const id = Number(saved.meta.last_row_id);
  const origin = new URL(request.url).origin;
  let telegramStatus = "не настроен";

  if (runtimeEnv.TELEGRAM_BOT_TOKEN && runtimeEnv.TELEGRAM_CHAT_ID) {
    const details = ([
      ["Тип клиента", clientType],
      ["Имя", name],
      ["Телефон", phone],
      ["Дата и время", new Date(created).toLocaleString("ru-RU", {timeZone: "Asia/Yekaterinburg"})],
      ["Описание", message],
      ["Страница", page],
      ["Место формы", value(body, "placement", 100)],
      ["Источник", value(body, "source", 300)],
      ["Referrer", value(body, "referrer", 500)],
      ["Первая страница", value(body, "landing", 500)],
      ["UTM source", value(body, "utm_source", 200)],
      ["UTM medium", value(body, "utm_medium", 200)],
      ["Кампания", value(body, "utm_campaign", 200)],
      ["Объявление", value(body, "utm_content", 200)],
      ["Поисковый запрос", value(body, "utm_term", 300)],
      ["yclid", value(body, "yclid", 200)],
      ["gclid", value(body, "gclid", 200)],
    ] as Array<[string, string]>).filter(([, fieldValue]) => fieldValue);
    const telegramText = [
      "<b>Новая заявка с seti96.ru</b>",
      ...details.map(([label, fieldValue]) => "<b>" + label + ":</b> " + clean(fieldValue)),
    ]
      .join("\n")
      .slice(0, 4000);
    try {
      const telegramResponse = await fetch(
        "https://api.telegram.org/bot" + runtimeEnv.TELEGRAM_BOT_TOKEN + "/sendMessage",
        {
          method: "POST",
          headers: {"content-type": "application/json"},
          body: JSON.stringify({
            chat_id: runtimeEnv.TELEGRAM_CHAT_ID,
            text: telegramText,
            parse_mode: "HTML",
            reply_markup: {inline_keyboard: [[{text: "Открыть заявку", url: origin + "/admin"}]]},
          }),
        },
      );
      telegramStatus = telegramResponse.ok ? "доставлено" : "ошибка " + telegramResponse.status;
    } catch {
      telegramStatus = "ошибка доставки";
    }
  }

  await runtimeEnv.DB.prepare("UPDATE leads SET telegram_status=? WHERE id=?").bind(telegramStatus, id).run();
  return Response.json({ok: true});
}

export async function GET() {
  if (!(await getChatGPTUser())) return Response.json({error: "Требуется вход"}, {status: 401});
  const runtimeEnv = await runtime();
  const rows = await runtimeEnv.DB.prepare("SELECT * FROM leads ORDER BY id DESC LIMIT 200").all();
  return Response.json(rows.results);
}
