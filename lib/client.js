window.__ModuleLoader__.load({
	id: "dsh-search-router",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		//#endregion
		let react = require("react");
		react = __toESM(react, 1);
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/index.tsx
		const NS = "search-router";
		const BACKENDS = [
			[
				"deepseek-official",
				"DeepSeek 官方搜索（需要 DEEPSEEK_API_KEY）",
				"DeepSeek Official (needs DEEPSEEK_API_KEY)"
			],
			[
				"anysearch",
				"AnySearch（匿名或 ANYSEARCH_API_KEY）",
				"AnySearch (anonymous or ANYSEARCH_API_KEY)"
			],
			[
				"bing",
				"Bing（免费，默认）",
				"Bing (free, default)"
			],
			[
				"ddg",
				"DuckDuckGo（免费）",
				"DuckDuckGo (free)"
			],
			[
				"ddg-lite",
				"DuckDuckGo Lite（免费）",
				"DuckDuckGo Lite (free)"
			],
			[
				"searxng",
				"SearXNG（免费元搜索）",
				"SearXNG (free meta-search)"
			]
		];
		let scope;
		let describeFace;
		const inject = ["slots", "settingsScope"];
		function isZh() {
			if (typeof navigator === "undefined") return false;
			return navigator.language?.toLowerCase().startsWith("zh") ?? false;
		}
		function lang() {
			return isZh() ? "zh" : "en";
		}
		const T = {
			zh: {
				title: "搜索路由",
				description: "选择 web_search 使用的搜索后端、密钥与单次结果上限",
				expand: "展开搜索路由",
				collapse: "收起搜索路由",
				provider: "搜索后端",
				maxResults: "单次搜索最大结果数",
				maxResultsHint: "默认 10，范围 1–20。",
				anyKey: "AnySearch API Key",
				anyKeyPlaceholder: "留空 = 匿名额度 / .env / .credentials.yaml",
				deepKey: "DeepSeek API Key",
				deepKeyPlaceholder: "留空 = .env / .credentials.yaml",
				saveKeys: "保存密钥",
				saved: "已保存",
				edit: "修改",
				fallback: "回退链",
				fallbackSuffix: "（失败后自动回退到 DeepSeek 官方）"
			},
			en: {
				title: "Search Router",
				description: "Choose the backend, keys, and per-search result limit used by web_search",
				expand: "Expand Search Router",
				collapse: "Collapse Search Router",
				provider: "Search provider",
				maxResults: "Max results per search",
				maxResultsHint: "Default 10, range 1–20.",
				anyKey: "AnySearch API Key",
				anyKeyPlaceholder: "empty = anonymous / .env / .credentials.yaml",
				deepKey: "DeepSeek API Key",
				deepKeyPlaceholder: "empty = .env / .credentials.yaml",
				saveKeys: "Save keys",
				saved: "saved",
				edit: "Edit",
				fallback: "Fallback chain",
				fallbackSuffix: "(auto-fallback to DeepSeek official)"
			}
		};
		const t = (key) => T[lang()][key];
		const cardStyle = {
			listStyle: "none",
			border: "0.5px solid var(--dsw-alias-border-l4, rgba(255,255,255,0.10))",
			borderRadius: 16,
			background: "var(--dsw-alias-bg-layer-3, transparent)",
			transition: "border-color .16s, background .16s"
		};
		const headerStyle = {
			width: "100%",
			appearance: "none",
			border: 0,
			background: "none",
			font: "inherit",
			color: "inherit",
			textAlign: "left",
			cursor: "pointer",
			display: "flex",
			alignItems: "center",
			gap: 12,
			padding: "14px 16px",
			borderRadius: 12
		};
		const headTextStyle = {
			flex: 1,
			minWidth: 0,
			display: "flex",
			flexDirection: "column",
			gap: 4
		};
		const nameStyle = {
			fontSize: 15,
			fontWeight: 600,
			lineHeight: 1.4,
			color: "var(--dsw-alias-label-primary, #e8e8ea)"
		};
		const descStyle = {
			fontSize: 13,
			lineHeight: 1.5,
			color: "var(--dsw-alias-label-tertiary, #9a9a9a)"
		};
		const chevronStyle = {
			flex: "none",
			color: "var(--dsw-alias-label-tertiary, #9a9a9a)",
			transition: "transform .16s",
			display: "flex"
		};
		const openCardStyle = {
			background: "var(--dsw-alias-bg-layer-2, transparent)",
			borderColor: "var(--dsw-alias-label-dimmed, rgba(255,255,255,0.3))"
		};
		const bodyStyle = {
			borderTop: "0.5px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.08))",
			margin: "0 16px",
			paddingBottom: 12,
			display: "flex",
			flexDirection: "column",
			gap: 12,
			paddingTop: 12
		};
		const labelStyle = {
			color: "var(--dsw-alias-label-primary, #e8e8ea)",
			fontSize: 13,
			fontWeight: 500
		};
		const inputStyle = {
			border: "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.08))",
			font: "inherit",
			fontVariantNumeric: "tabular-nums",
			color: "var(--dsw-alias-label-primary, #e8e8ea)",
			background: "var(--dsw-specific-input-major, transparent)",
			borderRadius: 6,
			padding: "6px 8px",
			fontSize: 13,
			width: "100%"
		};
		const hintStyle = {
			color: "var(--dsw-alias-label-secondary, #b0b0b0)",
			fontSize: 12,
			margin: 0
		};
		const editButtonStyle = {
			padding: "2px 8px",
			borderRadius: 6,
			border: "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.08))",
			background: "transparent",
			color: "var(--dsw-alias-label-secondary, #b0b0b0)",
			fontSize: 12,
			cursor: "pointer"
		};
		function Chevron({ open }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				style: {
					...chevronStyle,
					transform: open ? "rotate(180deg)" : "none"
				},
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
					width: 14,
					height: 14,
					viewBox: "0 0 14 14",
					fill: "none",
					xmlns: "http://www.w3.org/2000/svg",
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M11.8486 5.5L11.4238 5.92383L8.69727 8.65137C8.44157 8.90706 8.21562 9.13382 8.01172 9.29785C7.79912 9.46883 7.55595 9.61756 7.25 9.66602C7.08435 9.69222 6.91565 9.69222 6.75 9.66602C6.44405 9.61756 6.20088 9.46883 5.98828 9.29785C5.78438 9.13382 5.55843 8.90706 5.30273 8.65137L2.57617 5.92383L2.15137 5.5L3 4.65137L3.42383 5.07617L6.15137 7.80273C6.42595 8.07732 6.59876 8.24849 6.74023 8.3623C6.87291 8.46904 6.92272 8.47813 6.9375 8.48047C6.97895 8.48703 7.02105 8.48703 7.0625 8.48047C7.07728 8.47813 7.12709 8.46904 7.25977 8.3623C7.40124 8.24849 7.57405 8.07732 7.84863 7.80273L10.5762 5.07617L11 4.65137L11.8486 5.5Z",
						fill: "currentColor"
					})
				})
			});
		}
		function maskKey(raw) {
			if (!raw) return "";
			if (raw.length <= 8) return "••••••••";
			return `${raw.slice(0, 4)}••••••••${raw.slice(-4)}`;
		}
		function SearchRouterCard() {
			const subscribe = (listener) => scope.subscribe(listener);
			const getSnapshot = () => scope.getSnapshot();
			const snapshot = (0, react.useSyncExternalStore)(subscribe, getSnapshot);
			const value = snapshot?.value ?? {};
			const writable = snapshot?.writable !== false;
			const provider = typeof value.provider === "string" ? value.provider : "bing";
			const maxResults = typeof value.maxResults === "number" ? value.maxResults : 10;
			const fallback = Array.isArray(value.fallback) ? value.fallback : [];
			const anyMask = typeof value.anysearchApiKeyMask === "string" ? value.anysearchApiKeyMask : "";
			const deepMask = typeof value.deepseekApiKeyMask === "string" ? value.deepseekApiKeyMask : "";
			const nsView = (0, react.useSyncExternalStore)((listener) => describeFace.subscribe(listener), () => describeFace.getSnapshot())?.view?.namespaces?.find((n) => n.ns === NS);
			const secretSet = (path) => (nsView?.secrets ?? []).some((s) => s.path.join(".") === path && s.set);
			const anySecretSet = secretSet("anysearchApiKey");
			const deepSecretSet = secretSet("deepseekApiKey");
			const effectiveAnyMask = anyMask || (anySecretSet ? "••••••••" : "");
			const effectiveDeepMask = deepMask || (deepSecretSet ? "••••••••" : "");
			const [open, setOpen] = (0, react.useState)(false);
			const [anyKey, setAnyKey] = (0, react.useState)("");
			const [deepKey, setDeepKey] = (0, react.useState)("");
			const [anyEditing, setAnyEditing] = (0, react.useState)(false);
			const [deepEditing, setDeepEditing] = (0, react.useState)(false);
			const [keyMsg, setKeyMsg] = (0, react.useState)("");
			const anyInputRef = (0, react.useRef)(null);
			const deepInputRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				setAnyKey(effectiveAnyMask);
				setAnyEditing(false);
			}, [effectiveAnyMask]);
			(0, react.useEffect)(() => {
				setDeepKey(effectiveDeepMask);
				setDeepEditing(false);
			}, [effectiveDeepMask]);
			const startEditAny = () => {
				setAnyEditing(true);
				setAnyKey("");
				setTimeout(() => anyInputRef.current?.focus(), 0);
			};
			const startEditDeep = () => {
				setDeepEditing(true);
				setDeepKey("");
				setTimeout(() => deepInputRef.current?.focus(), 0);
			};
			const saveKeys = async () => {
				try {
					if (anyEditing) {
						const raw = anyKey.trim();
						if (raw) {
							await scope.set("anysearchApiKey", raw);
							await scope.set("anysearchApiKeyMask", maskKey(raw));
						} else {
							await scope.unset("anysearchApiKey");
							await scope.unset("anysearchApiKeyMask");
						}
					}
					if (deepEditing) {
						const raw = deepKey.trim();
						if (raw) {
							await scope.set("deepseekApiKey", raw);
							await scope.set("deepseekApiKeyMask", maskKey(raw));
						} else {
							await scope.unset("deepseekApiKey");
							await scope.unset("deepseekApiKeyMask");
						}
					}
					setAnyEditing(false);
					setDeepEditing(false);
					setAnyKey(effectiveAnyMask);
					setDeepKey(effectiveDeepMask);
					setKeyMsg(t("saved"));
				} catch (error) {
					setKeyMsg(error instanceof Error ? error.message : String(error));
				}
			};
			const fallbackNames = fallback.map((id) => {
				const entry = BACKENDS.find(([bid]) => bid === id);
				if (!entry) return id;
				return (isZh() ? entry[1] : entry[2]).split("（")[0].split(" (")[0];
			}).join(" → ");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
				style: {
					...cardStyle,
					...open ? openCardStyle : {}
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					style: headerStyle,
					"aria-expanded": open,
					"aria-label": open ? t("collapse") : t("expand"),
					onClick: () => {
						setOpen((prev) => !prev);
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						style: headTextStyle,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: nameStyle,
							children: t("title")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: descStyle,
							children: t("description")
						})]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Chevron, { open })]
				}), open ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: bodyStyle,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								flexDirection: "column",
								gap: 4
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
								style: labelStyle,
								children: t("provider")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
								value: provider,
								disabled: !writable,
								onChange: (event) => {
									scope.set("provider", event.target.value);
								},
								style: inputStyle,
								children: BACKENDS.map(([id, zhLabel, enLabel]) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
									value: id,
									children: isZh() ? zhLabel : enLabel
								}, id))
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								flexDirection: "column",
								gap: 4
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									style: labelStyle,
									children: t("maxResults")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									type: "number",
									min: 1,
									max: 20,
									value: maxResults,
									disabled: !writable,
									onChange: (event) => {
										const next = Number(event.target.value);
										if (Number.isInteger(next) && next > 0) scope.set("maxResults", next);
									},
									style: {
										...inputStyle,
										width: 120
									}
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									style: hintStyle,
									children: t("maxResultsHint")
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								flexDirection: "column",
								gap: 4
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
								style: labelStyle,
								children: t("anyKey")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: 8
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									ref: anyInputRef,
									type: anyEditing ? "password" : "text",
									value: anyKey,
									readOnly: !anyEditing && !!effectiveAnyMask,
									placeholder: t("anyKeyPlaceholder"),
									disabled: !writable,
									onChange: (event) => {
										setAnyKey(event.target.value);
									},
									style: {
										...inputStyle,
										flex: 1
									}
								}), !anyEditing && !!effectiveAnyMask ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									style: editButtonStyle,
									onClick: startEditAny,
									children: t("edit")
								}) : null]
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								flexDirection: "column",
								gap: 4
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
								style: labelStyle,
								children: t("deepKey")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: 8
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									ref: deepInputRef,
									type: deepEditing ? "password" : "text",
									value: deepKey,
									readOnly: !deepEditing && !!effectiveDeepMask,
									placeholder: t("deepKeyPlaceholder"),
									disabled: !writable,
									onChange: (event) => {
										setDeepKey(event.target.value);
									},
									style: {
										...inputStyle,
										flex: 1
									}
								}), !deepEditing && !!effectiveDeepMask ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									style: editButtonStyle,
									onClick: startEditDeep,
									children: t("edit")
								}) : null]
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								alignItems: "center",
								gap: 8
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									saveKeys();
								},
								disabled: !writable,
								style: {
									padding: "5px 12px",
									borderRadius: 6,
									border: "1px solid var(--dsw-alias-button-info-fill, #4d6bfe)",
									background: "var(--dsw-alias-button-info-fill, #4d6bfe)",
									color: "var(--dsw-alias-label-primary-foreground, #ffffff)",
									cursor: "pointer"
								},
								children: t("saveKeys")
							}), keyMsg ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: { fontSize: 12 },
								children: keyMsg
							}) : null]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								fontSize: 12,
								color: "var(--dsw-alias-label-secondary, #b0b0b0)"
							},
							children: [
								t("fallback"),
								": ",
								fallbackNames || "—",
								" ",
								t("fallbackSuffix")
							]
						})
					]
				}) : null]
			});
		}
		function apply(ctx) {
			scope = ctx.settingsScope.bind({ namespace: NS });
			describeFace = ctx.settingsScope.describe();
			ctx.slots.inject("settings.plugin.item", () => ctx.slots.register({
				name: "settings.plugin.item",
				key: NS,
				id: "dsh-search-router",
				order: 130,
				label: isZh() ? "搜索路由" : "Search Router"
			}, SearchRouterCard));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map