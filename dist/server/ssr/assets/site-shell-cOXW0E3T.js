import { a as require_react, o as __toESM, t as require_jsx_runtime } from "../index.js";
//#region app/site-shell.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var phone = "+7 993 106-04-23", tel = "tel:+79931060423";
var email = "seti-96@yandex.ru", telegram = "https://t.me/seti96ru";
var articles = [
	["Когда требуется промывка системы отопления частного дома", "Частный дом"],
	["Почему газовый котёл стал хуже греть", "Котлы и бойлеры"],
	["Как проходит химическая промывка теплообменника", "Теплообменники"],
	["Почему батареи нагреваются неравномерно", "Частный дом"],
	["Когда требуется промывка контуров тёплого пола", "Частный дом"],
	["Химическая и гидропневматическая промывка: в чём разница", "Теплообменники"],
	["Как проводится промывка ИТП и теплового пункта", "Управляющим компаниям"],
	["Подготовка многоквартирного дома к отопительному сезону", "Подготовка к сезону"],
	["Зачем нужна опрессовка системы отопления", "Подготовка к сезону"],
	["Может ли система потечь после промывки", "Теплообменники"],
	["От чего зависит стоимость промывки отопления", "Частный дом"],
	["Как накипь влияет на работу котла и теплообменника", "Котлы и бойлеры"]
];
var faqs = [
	["Когда системе требуется промывка?", "Если оборудование дольше нагревается, шумит, перегревается, а радиаторы или контуры работают неравномерно. Такие признаки имеют разные причины, поэтому сначала нужен осмотр."],
	["Можно ли выполнить промывку без демонтажа?", "Да, когда конструкция и состояние оборудования позволяют подключить промывочную установку к закрытому контуру."],
	["Сколько времени занимает работа?", "Зависит от объёма системы, характера отложений и доступа к точкам подключения. Срок специалист определит после осмотра."],
	["Подходит ли один реагент для любого оборудования?", "Нет. Концентрация, температура и продолжительность обработки подбираются с учётом материала и состояния оборудования."],
	["Может ли после удаления отложений обнаружиться течь?", "Плотные отложения иногда скрывают уже существующую коррозию. После их удаления может обнаружиться негерметичность, существовавшая до промывки."],
	["Можно ли гарантировать снижение расхода газа?", "Если снижение эффективности связано с отложениями, очистка может восстановить теплоотдачу. Фактический результат зависит от состояния оборудования и причины неисправности."]
];
function SiteShell({ page = "home" }) {
	const [modal, setModal] = (0, import_react.useState)(false), [sent, setSent] = (0, import_react.useState)(false), [cookie, setCookie] = (0, import_react.useState)(true), [phoneInput, setPhoneInput] = (0, import_react.useState)("+7");
	(0, import_react.useEffect)(() => setCookie(localStorage.getItem("cookie-ok") !== "1"), []);
	const metricGoal = (goal) => {
		window.ym?.(111900032, "reachGoal", goal);
	};
	const openModal = () => {
		metricGoal("callback_open");
		setSent(false);
		setPhoneInput("+7");
		setModal(true);
	};
	const lead = async (e) => {
		e.preventDefault();
		const phoneField = e.currentTarget.elements.namedItem("phone"), digits = phoneInput.replace(/\D/g, "");
		if (digits.length !== 11 || digits[0] !== "7") {
			phoneField.setCustomValidity("Введите 10 цифр номера после +7");
			phoneField.reportValidity();
			return;
		}
		phoneField.setCustomValidity("");
		const f = new FormData(e.currentTarget);
		f.set("phone", "+7" + digits.slice(1));
		const clientType = String(f.get("clientType") || "");
		const q = new URLSearchParams(location.search), data = {
			...Object.fromEntries(f),
			source: document.referrer || "Прямой переход",
			utm_campaign: q.get("utm_campaign") || "",
			utm_content: q.get("utm_content") || "",
			utm_term: q.get("utm_term") || ""
		};
		if ((await fetch("/api/leads", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(data)
		})).ok) {
			metricGoal("lead_success");
			metricGoal(clientType === "Частный дом" ? "private_lead" : "organization_lead");
			setSent(true);
		}
	};
	const cta = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className: "btn primary",
		onClick: openModal,
		children: "Заказать звонок"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
		className: "btn ghost",
		href: tel,
		onClick: () => metricGoal("phone_click"),
		children: "Позвонить"
	})] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "site",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "/",
					className: "logo",
					"aria-label": "Сети96 — главная",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: "/media/seti96-logo.png",
						alt: "Сети96"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						children: "Главная"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/dom",
						children: "Частный дом"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/organizaciyam",
						children: "Организациям"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/materialy",
						children: "Материалы"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/kontakty",
						children: "Контакты"
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					className: "headphone",
					href: tel,
					onClick: () => metricGoal("phone_click"),
					children: phone
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "mini",
					onClick: openModal,
					children: "Заказать звонок"
				})
			] }),
			page === "home" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "hero dark",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "hero-copy",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "eyebrow",
								children: "Екатеринбург · Свердловская область"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", { children: [
								"Химическая промывка ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "котлов, теплообменников" }),
								" и систем отопления"
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "lead",
								children: "Удаляем накипь, ржавчину и минеральные отложения профессиональным составом на основе органических кислот. Работаем с объектами от бытового бойлера до многоквартирного дома."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "free",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "01" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Бесплатный выезд специалиста" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "для осмотра объекта и расчёта стоимости" })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "actions",
								children: cta
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "homeHeroMedia",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("figure", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: "/media/heat-exchangers-before-after.png",
							alt: "Пластинчатый теплообменник до и после очистки"
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "machine",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "dial",
									children: "96"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pipe p1" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pipe p2" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "caption",
									children: [
										"ЦИРКУЛЯЦИОННАЯ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
										"ПРОМЫВКА"
									]
								})
							]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "audience",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							className: "active",
							href: "/dom",
							children: "Для частного дома"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "/organizaciyam",
							children: "Для организаций и УК"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							"Выберите подходящий раздел, чтобы посмотреть перечень работ и условия. ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "/dom",
								children: "Частный дом →"
							}),
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "/organizaciyam",
								children: "Организациям →"
							})
						] })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "light problems",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "eyebrow ink",
							children: "Диагностика"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Когда системе может потребоваться промывка" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Признаки не всегда означают загрязнение. Перед работами инженер оценит систему и определит, даст ли промывка необходимый результат." })
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: [
						"Медленный нагрев воды",
						"Неравномерно греются батареи",
						"Тёплый пол потерял эффективность",
						"Шум при нагреве",
						"Долгий выход на температуру",
						"Перегрев теплообменника",
						"Перепады температуры",
						"Ржавчина в теплоносителе"
					].map((x, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: String(i + 1).padStart(2, "0") }), x] }, x)) })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "split dark",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: "/dom",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "ЧАСТНЫМ КЛИЕНТАМ" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Для дома" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Котлы, бойлеры, теплообменники, радиаторы, трубы и тёплый пол." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Перейти →" })
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: "/organizaciyam",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "B2B / ЖКХ" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Для организаций" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "ИТП, тепловые пункты, МКД, коммерческие и производственные объекты." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Перейти →" })
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Process, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reagent, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Faq, {})
			] }),
			page === "dom" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inner, {
				heroImage: "/media/radiator-thermal-before-after.png",
				heroAlt: "Термограмма радиатора до и после промывки",
				title: "Промывка отопления, котлов и теплообменников в частном доме",
				eyebrow: "Частным владельцам",
				intro: "Поможем восстановить нормальную циркуляцию и теплоотдачу без дорогостоящей замены исправного оборудования, если причиной проблемы являются внутренние отложения.",
				items: [
					"Газовые и электрические котлы",
					"Твердотопливные котлы",
					"Теплообменники и бойлеры",
					"Радиаторы и трубы",
					"Контуры тёплого пола",
					"Вся система отопления дома"
				],
				cta
			}),
			page === "org" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inner, {
				heroImage: "/media/plate-heat-exchanger-before-after.png",
				heroAlt: "Пластинчатый теплообменник до и после очистки",
				title: "Промывка ИТП, теплообменников и систем отопления для организаций",
				eyebrow: "УК · ТСЖ · предприятия",
				intro: "Бесплатно обследуем объект, подберём технологию и подготовим расчёт стоимости. Работаем по договору и согласованному регламенту.",
				items: [
					"ИТП и тепловые пункты",
					"Пластинчатые теплообменники",
					"Кожухотрубные теплообменники",
					"Котельное оборудование",
					"Системы отопления зданий",
					"Промывка и опрессовка",
					"Подготовка к отопительному сезону",
					"Акты и фотофиксация"
				],
				cta
			}),
			page === "blog" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "page light",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "eyebrow ink",
						children: "Инженерная база знаний"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Полезные материалы" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "intro",
						children: "Понятно о промывке, обслуживании и ограничениях технологии."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "articles",
						children: articles.map(([t, c], i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: c }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: t }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Разбираем признаки, возможные причины и порядок действий без лишних обещаний." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: `/materialy/statya-${i + 1}`,
								children: "Читать →"
							})
						] }, t))
					})
				]
			}),
			page === "contacts" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "page dark contact",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "eyebrow",
						children: "Связаться"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Контакты «Сети 96»" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "contactIntro",
						children: "Работаем в Екатеринбурге и Свердловской области. Бесплатно выезжаем на объект для осмотра и расчёта стоимости."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "contactList",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Телефон" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: tel,
								onClick: () => metricGoal("phone_click"),
								children: phone
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Адрес" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "https://yandex.ru/maps/?text=Екатеринбург%2C%20ул.%20Хасановская%2C%2068",
								target: "_blank",
								rel: "noreferrer",
								children: "Екатеринбург, ул. Хасановская, 68"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Электронная почта" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: `mailto:${email}`,
								onClick: () => metricGoal("email_click"),
								children: email
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Telegram" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: telegram,
								target: "_blank",
								rel: "noreferrer",
								onClick: () => metricGoal("telegram_click"),
								children: "@seti96ru ↗"
							})] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "region",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "66" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Свердловская область" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Частные дома, УК, ТСЖ и организации" })] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "actions",
						children: cta
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "final",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "eyebrow ink",
						children: "Первый шаг"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [
						"Бесплатно выедем на объект",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
						"и рассчитаем стоимость"
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Осмотрим систему, уточним объём и сложность работ, подберём способ промывки." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "actions",
						children: cta
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "/",
					className: "logo",
					"aria-label": "Сети96 — главная",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: "/media/seti96-logo.png",
						alt: "Сети96"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Химическая промывка теплотехнического оборудования" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "/politika",
					children: "Политика конфиденциальности"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "/admin",
					children: "Администратору"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "© 2026 Сети96" })
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mobilebar",
				children: cta
			}),
			cookie && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "cookie",
				children: ["Используем cookie для работы сайта и аналитики. ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => {
						localStorage.setItem("cookie-ok", "1");
						setCookie(false);
					},
					children: "Понятно"
				})]
			}),
			modal && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overlay",
				onMouseDown: (e) => e.target === e.currentTarget && setModal(false),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "modal",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "close",
						onClick: () => setModal(false),
						children: "×"
					}), sent ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "success",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Заявка принята" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Специалист «Сети96» скоро свяжется с вами." })]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "eyebrow ink",
							children: "Обратный звонок"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Заказать звонок" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: lead,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Ваше имя", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "name",
									required: true,
									autoComplete: "name"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Телефон", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "phone",
									required: true,
									inputMode: "tel",
									placeholder: "+7 (999) 000-00-00",
									autoComplete: "tel",
									value: phoneInput,
									onChange: (e) => {
										setPhoneInput(e.target.value);
										e.target.setCustomValidity("");
									}
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: "Тип клиента" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "radio",
										name: "clientType",
										value: "Частный дом",
										defaultChecked: true
									}), " Частный дом"] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "radio",
										name: "clientType",
										value: "УК / организация"
									}), " УК / организация"] })
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "hidden",
									name: "page",
									value: page
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "agree",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										required: true
									}), " Согласен на обработку персональных данных"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "btn primary",
									type: "submit",
									children: "Заказать звонок"
								})
							]
						})
					] })]
				})
			})
		]
	});
}
function Process() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "process dark",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "eyebrow",
				children: "Технология"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Как проходит промывка" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "steps",
				children: [
					"Звонок и уточнение задачи",
					"Бесплатный выезд",
					"Осмотр и расчёт",
					"Согласование технологии",
					"Подключение установки",
					"Циркуляция раствора",
					"Контроль очистки",
					"Промывка водой",
					"Проверка результата"
				].map((x, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: String(i + 1).padStart(2, "0") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: x })] }, x))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "scheme",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "ПРОМЫВОЧНАЯ УСТАНОВКА" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: "→" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Подающий шланг" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: "→" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "ОЧИЩАЕМЫЙ КОНТУР" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: "→" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Обратный шланг" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: "↩" })
				]
			})
		]
	});
}
function Reagent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "reagent light",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "eyebrow ink",
				children: "Собственная разработка"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Состав на основе органических кислот" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Концентрация и продолжительность обработки подбираются с учётом материала оборудования, объёма системы и характера загрязнений." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Растворяет накипь и минеральные отложения" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Работает внутри закрытого контура" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Процесс контролирует специалист" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "После обработки система промывается водой" })
			] })
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figure", {
			className: "reagentMedia",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: "/media/pipes-before-after.png",
				alt: "Труба до и после химической очистки"
			})
		})]
	});
}
function Faq() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "faq light",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "eyebrow ink",
				children: "Вопросы и ответы"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Без скрытых условий" }),
			faqs.map(([q, a]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", { children: [q, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "+" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: a })] }, q))
		]
	});
}
function Inner({ title, eyebrow, intro, items, cta, heroImage, heroAlt, secondaryHeroImage, secondaryHeroAlt }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: `innerHero dark${secondaryHeroImage ? " innerHeroWithStack" : ""}`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "innerCopy",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "eyebrow",
						children: eyebrow
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: title }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: intro }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "actions",
						children: cta
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "innerHeroMediaStack",
				children: [secondaryHeroImage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figure", {
					className: "innerHeroMedia",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: secondaryHeroImage,
						alt: secondaryHeroAlt
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
					className: "innerHeroMedia",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: heroImage,
						alt: heroAlt
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figcaption", { children: "Техническая иллюстрация" })]
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "serviceList light",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Что промываем" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: items.map((x, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: String(i + 1).padStart(2, "0") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: x })] }, x)) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "notice",
					children: "Стоимость зависит от типа оборудования, объёма системы, материала, степени загрязнения и сложности подключения. Специалист бесплатно выедет на объект и рассчитает стоимость до начала работ."
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Process, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Faq, {})
	] });
}
//#endregion
export { SiteShell as default };
