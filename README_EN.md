# dsh-search-router

A DeepSeek Harness search router plugin that wraps multiple search backends behind one `ctx.web` search provider (`router`). It supports **live switching between search backends**, **checking the current backend and fallback chain**, **automatic fallback to DeepSeek official search on failure**, and includes an English/Chinese settings panel.

## Features

- **Multiple backends**: DeepSeek official / AnySearch / Bing / DuckDuckGo / DuckDuckGo Lite / SearXNG
- **Live switching**: switch from the settings panel or the `search_router_switch` tool; the next `web_search` uses the new backend immediately, no restart required
- **Status visible**: the `search_router_status` tool shows the current backend, fallback chain, and the last failure
- **Automatic fallback**: if the current backend fails or returns no results, the router walks the fallback chain and ends on `deepseek-official` by default; the result includes a `Note: ...` explaining which backend was actually used
- **Settings panel**: a collapsible card in **Settings → Plugins → Plugin configuration → Search Router**, with English or Chinese UI depending on the browser language
- **Key priority**: settings panel > environment variables > `~/.dsh/.env` > `~/.dsh/.credentials.yaml`
- **Non-destructive**: only adds configuration and a plugin package; does not modify DSH source or overwrite existing credentials

## Install

### From npm

```bash
npx -y @deepseek-ai/dsh plugin --profile web add dsh-search-router
```

Restart the dsh web process and hard-refresh the browser (`Ctrl+F5`).

### From a local directory

```bash
dsh plugin --profile web add /path/to/dsh-search-router
```

## Usage

1. Open **Settings → Plugins → Plugin configuration → Search Router**, choose a backend, adjust the per-search result limit, and enter API keys if needed.
2. Or ask the agent to call:
   - `search_router_switch` to switch backends
   - `search_router_status` to inspect the router state

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

- Authoritative source: the DSH settings namespace `search-router`
- Default location: the `search-router:` section in `~/.dsh/settings.yaml`
- Fallback when the settings service is unavailable: `~/.dsh/search-router.json`

See [docs/SETTINGS.md](docs/SETTINGS.md) for field details, key display rules, and notes.

## Compatibility

- DSH `>=0.1.2-rc.1 <0.2`
- Host runtime dependencies: Node.js built-ins + `@deepseek-ai/schemastery`
- Client runtime dependencies: React, `@deepseek-ai/dsh-client-runtime`, `slots`, `settingsScope` (provided by the web UI)
- Registers provider id: `router`
- The bundle patch sets `web.searchProvider = router` and keeps `web.fetchProvider = http`

## License

MIT
