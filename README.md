# dsh-search-router

DeepSeek Harness 搜索路由插件：将多个搜索后端统一包装为一个 `ctx.web` search provider（`router`），支持**即时切换当前搜索后端**、**查看当前后端与回退链**、**后端失败自动回退到 DeepSeek 官方搜索**，并提供中文设置面板。

## 特性

- **多后端可切换**：DeepSeek 官方 / AnySearch / Bing / DuckDuckGo / DuckDuckGo Lite / SearXNG
- **即时生效**：设置面板或 `search_router_switch` 工具切换后，下一次 `web_search` 立即使用新后端，无需重启
- **状态可查**：`search_router_status` 工具显示当前后端、回退链、最近一次失败
- **自动回退**：当前后端失败/无结果时按回退链尝试，默认最终回退到 `deepseek-official`，结果中附 `Note: ...` 说明实际生效后端
- **中文设置面板**：与官方插件配置页样式一致，可收缩展开；支持填写 AnySearch / DeepSeek Key（保存后脱敏显示）
- **密钥优先级**：面板填写 > 环境变量 > `~/.dsh/.env` > `~/.dsh/.credentials.yaml`
- **非破坏性**：只新增配置与插件包，不修改 DSH 源码，不覆盖现有凭据

## 安装

### 从 npm

```bash
npx -y @deepseek-ai/dsh plugin --profile web add dsh-search-router
```

重启 dsh Web UI 后生效。

### 从本地开发目录

```bash
dsh plugin --profile web add /path/to/dsh-search-router
```

### 构建（可选，源码方式）

```bash
cd dsh-search-router
pnpm install
# 如果本地已安装 devDependencies，可以直接：
npm run build
# 否则指定一个 DSH 源码 checkout：
DSH_CHECKOUT=/path/to/deepseek-harness npm run build
```

构建后产物：

- `lib/index.js`：Host 插件
- `lib/client.js`：设置面板客户端

## 使用

1. 打开 **设置 → 插件 → 插件配置 → 搜索路由**，选择搜索后端、调整单次结果上限、填写密钥。
2. 或在会话中让 agent 调用：
   - `search_router_switch` 切换后端
   - `search_router_status` 查看状态

## 支持的搜索后端

| provider id | 说明 | 凭据 |
|---|---|---|
| `deepseek-official` | DeepSeek 官方搜索（Anthropic 兼容 Messages API） | `DEEPSEEK_API_KEY` |
| `anysearch` | AnySearch REST 搜索 | `ANYSEARCH_API_KEY` 可选，缺省匿名 |
| `bing` | Bing 网页搜索（HTML 抓取，默认 zh-CN） | 免费 |
| `ddg` | DuckDuckGo HTML 搜索 | 免费 |
| `ddg-lite` | DuckDuckGo Lite 搜索 | 免费 |
| `searxng` | SearXNG 元搜索（公开实例） | 免费 |

## 配置

- 权威配置：DSH 设置命名空间 `search-router`
- 默认位置：`~/.dsh/settings.yaml` 中 `search-router:` 段
- 设置服务不可用时回退：`~/.dsh/search-router.json`

详细设置字段、Key 显示规则、回退策略见 [docs/SETTINGS.md](docs/SETTINGS.md)。

## 兼容性

- DSH `>=0.1.2-rc.1 <0.2`
- Host 侧运行时依赖：Node.js 内建模块 + `@deepseek-ai/schemastery`
- Client 侧运行时依赖：React、`@deepseek-ai/dsh-client-runtime`、`slots`、`settingsScope`（web UI 自带）
- 注册 provider id：`router`
- patch 会自动设置 `web.searchProvider = router`，保持 `web.fetchProvider = http`

## 许可证

MIT
