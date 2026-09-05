# dsh-search-router 设置与注意事项

> 适用版本：DSH 0.1.2-rc.1 / plugin dsh-search-router 0.1.0
> 最后更新：2026-09-05

## 一、设置面板

位置：**设置 → 插件 → 插件配置 → 搜索路由**（中文 UI，默认收起，可展开/收缩）。

| 字段 | 作用 | 默认/说明 |
|---|---|---|
| 搜索后端 | `web_search` 实际使用的搜索后端 | `bing` |
| 单次搜索最大结果数 | 单次搜索返回的结果上限 | `10`（1–20） |
| AnySearch API Key | AnySearch 专用密钥 | 留空 = 匿名额度 / 环境变量 / `.env` / `.credentials.yaml` |
| DeepSeek API Key | DeepSeek 官方搜索密钥 | 留空 = 环境变量 / `.env` / `.credentials.yaml` |
| 保存密钥 | 写入/覆盖/清除上述密码框 | 修改后必点 |
| 回退链 | 当前后端失败后的自动回退顺序 | `anysearch -> deepseek-official` |

## 二、配置存储与优先级

现在以 **DSH 设置服务命名空间 `search-router`** 为权威来源，持久化在：

```yaml
# ~/.dsh/settings.yaml
search-router:
  provider: bing
  fallback: [anysearch, deepseek-official]
  searxngInstances: []
  maxResults: 10
  anysearchApiKey: ...
  anysearchApiKeyMask: "as_s********f76f"
  deepseekApiKey: ...
  deepseekApiKeyMask: "••••••••"
```

- 当设置服务不可用时，回退到 `$DSH_HOME/search-router.json`。
- `search_router_switch` 工具、设置面板、`search_router_status` 工具共享同一配置。
- **Key 读取优先级**：
  1. 面板/设置里填写的 Key（显式覆盖）
  2. `process.env.DEEPSEEK_API_KEY` / `ANYSEARCH_API_KEY`
  3. `~/.dsh/.env`
  4. `~/.dsh/.credentials.yaml`

## 三、Key 显示规则

| 场景 | 显示 |
|---|---|
| 面板保存过 Key | 部分脱敏掩码：`as_s********f76f` / `sk-2********abcd`，带「修改」按钮 |
| 未在面板保存，但环境/凭据中心有 Key | Host 自动投影为 `••••••••`，带「修改」按钮 |
| 完全未配置 | 空输入框 + 占位提示 |

- 点击「修改」后才允许输入新 Key；修改框内留空保存 = 清除面板内保存的 Key，回退到环境/凭据中心。
- 完整 Key 永不回显到前端；脱敏掩码仅用于展示。

## 四、注意事项

1. **强刷浏览器**：客户端 UI 更新后必须 `Ctrl+F5`，否则浏览器会继续用旧的 `client.js`，导致看不到新卡片或新掩码。
2. **不要同时让多个搜索插件抢 `web.searchProvider`**：
   - `dsh-free-search`、`anysearch-dsh`、`dsh-search-router` 都会 patch `id: web`。
   - 如果同时安装 `dsh-free-search` / `anysearch-dsh`，请在 profile 的用户配置层显式固定：
     ```yaml
     - id: web
       config:
         searchProvider: router
         fetchProvider: http
     ```
   - `router` 是 dsh-search-router 的 provider id。
3. **卸载恢复**：
   - 从 `~/.dsh/profiles/web/package.json` 移除 `dsh-search-router` 依赖与 bundles；
   - `cd ~/.dsh/profiles/web && pnpm install`；
   - 重启 dsh；
   - 若 `web.searchProvider` 仍指向 `router`，在 profile 配置里改回 `deepseek-official`（或删除覆盖让其回落到唯一可用 provider）。
4. **旧 Key 掩码迁移**：在掩码功能上线前保存的 Key 没有 `anysearchApiKeyMask` / `deepseekApiKeyMask` 字段，会显示 `••••••••`；想显示前后缀掩码时，点「修改」重新保存一次即可。
5. **DeepSeek Key 与模型配置一致**：该字段填 DeepSeek 官方 `sk-...`，与模型设置/凭据中心里的 DeepSeek Key 同一个；不是 Anthropic Key。
6. **AnySearch 匿名/KEY 说明**：不填 AnySearch Key 时走匿名额度；已注册用户建议填入 `as_sk_...` 以获得更高额度和更稳定的结果。
7. **回退链**：默认 `anysearch -> deepseek-official`。如果 `anysearch` 也无法使用（匿名限流），最终会回退到 DeepSeek 官方搜索；结果里会带 `Note: ...` 说明实际用了哪个后端。
8. **无关插件**：`dsh-search-router` 不依赖 dsh-web-ui；但设置卡片渲染需要官方 `settings.plugin.item` 插槽，因此位于官方「设置 → 插件 → 插件配置」页面。
