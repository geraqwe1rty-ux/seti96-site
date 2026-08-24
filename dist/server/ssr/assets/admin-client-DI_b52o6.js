import { a as require_react, o as __toESM, t as require_jsx_runtime } from "../index.js";
//#region app/admin/admin-client.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function AdminClient({ user, signout }) {
	const [leads, setLeads] = (0, import_react.useState)([]), [tab, setTab] = (0, import_react.useState)("Заявки");
	(0, import_react.useEffect)(() => {
		fetch("/api/leads").then((r) => r.json()).then((x) => setLeads(Array.isArray(x) ? x : []));
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "admin",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				className: "logo",
				href: "/",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: "↻" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", { children: ["Сети", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "96" })] })]
			}),
			[
				"Заявки",
				"Страницы",
				"Материалы",
				"Медиа",
				"FAQ",
				"Настройки"
			].map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: tab === x ? "on" : "",
				onClick: () => setTab(x),
				children: x
			}, x)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: signout,
				children: "Выйти"
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Панель управления" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: tab })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: user })] }), tab === "Заявки" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "adminstats",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Новые" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: leads.length })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Назначенные выезды" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "0" })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Договоры" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "0" })] })
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "leadtable",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "tr th",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "№ / дата" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Клиент" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Тип" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Статус" })
				]
			}), leads.length ? leads.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "tr",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"#",
						l.id,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: new Date(l.created_at).toLocaleString("ru-RU") })
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: l.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: `tel:${l.phone}`,
						children: l.phone
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: l.client_type }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("mark", { children: l.status }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: ["Telegram: ", l.telegram_status] })] })
				]
			}, l.id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "empty",
				children: "Пока нет заявок. Новые обращения появятся здесь автоматически."
			})]
		})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Editor, { tab })] })]
	});
}
function Editor({ tab }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "editor",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: tab }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Раздел готов к наполнению. Здесь можно создавать, редактировать, менять порядок и скрывать материалы без удаления." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { children: "Добавить" })
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "editcard",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Публичный контент" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Главная страница" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Для частного дома" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Для организаций и УК" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Контакты" })
			]
		})]
	});
}
//#endregion
export { AdminClient as default };
