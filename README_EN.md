# dsh-search-router

[中文](README.md) | **English**

A DeepSeek Harness plugin that routes `web_search` across multiple backends through a single `ctx.web` search provider (`router`). It provides **live backend switching**, **clear visibility into the active backend and fallback chain**, and **automatic fallback to DeepSeek official search** when a backend fails. The settings panel adapts to the browser language (Chinese or English).

## Features

- **Multiple backends**: DeepSeek official / AnySearch / Bing / DuckDuckGo / DuckDuckGo Lite / SearXNG
- **Live switching**: switch from the settings panel or the `search_router_switch` tool; the next `web_search` call uses the new backend immediately, without restarting
- **Clear status**: `search_router_status` reports the current backend, fallback chain, and the most recent failure
- **Automatic fallback**: if the selected backend fails or returns no results, the router tries the fallback chain in order and ends on `deepseek-official` by default; results include a `Note: ...` explaining which backend was actually used
- **Settings panel**: a collapsible card under **Settings → Plugins → Plugin configuration → Search Router**, rendered in English or Chinese based on the browser language
- **Flexible credentials**: settings panel > environment variables > `~/.dsh/.env` > `~/.dsh/.credentials.yaml`
- **Non-destructive**: adds only its own configuration and plugin package; it never modifies DSH source or existing credentials

## Install

### From npm

```bash
npx -y @deepseek-ai/dsh plugin --profile web add dsh-search-router
```

Restart the dsh web process, then hard-refresh the browser (`Ctrl+F5`).

### From a local directory

```bash
dsh plugin --profile web add /path/to/dsh-search-router
```

## Usage

1. Open **Settings → Plugins → Plugin configuration → Search Router**, choose a backend, adjust the per-search result limit, and enter API keys if needed.
2. Or ask the agent to call:
   - `search_router_switch` to change backends
   - `search_router_status` to inspect the current router state

## Supported backends

| provider id | Description | Credentials |
|---|---|---|
| `deepseek-official` | DeepSeek official search (Anthropic-compatible Messages API) | `DEEPSEEK_API_KEY` |
| `anysearch` | AnySearch REST search | `ANYSEARCH_API_KEY` optional; anonymous quota otherwise |
| `bing` | Bing web search (HTML scraping, zh-CN by default) | free |
| `ddg` | DuckDuckGo HTML search | free |
| `ddg-lite` | DuckDuckGo Lite search | free |
| `searxng` | SearXNG meta-search (public instances) | free |

## Configuration

- Primary source of truth: the DSH settings namespace `search-router`
- Default location: the `search-router:` section in `~/.dsh/settings.yaml`
- Fallback when the settings service is unavailable: `~/.dsh/search-router.json`

See [docs/SETTINGS_EN.md](docs/SETTINGS_EN.md) for field details, key display rules, and notes.

## Compatibility

- DSH `>=0.1.2-rc.1 <0.2`
- Host runtime dependencies: Node.js built-ins + `@deepseek-ai/schemastery`
- Client runtime dependencies: React, `@deepseek-ai/dsh-client-runtime`, `slots`, `settingsScope` (provided by the web UI)
- Registers provider id: `router`
- The bundle patch sets `web.searchProvider = router` and keeps `web.fetchProvider = http`

## License

MIT
