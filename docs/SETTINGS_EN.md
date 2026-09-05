# dsh-search-router Settings and Notes

> Applies to: DSH 0.1.2-rc.1 / plugin dsh-search-router 0.1.0

## Settings panel

Location: **Settings → Plugins → Plugin configuration → Search Router**.

| Field | Purpose | Default |
|---|---|---|
| Search provider | Backend used by `web_search` | `bing` |
| Max results per search | Result limit for one search | `10` (1–20) |
| AnySearch API Key | AnySearch credential | empty = anonymous / environment / `.env` / `.credentials.yaml` |
| DeepSeek API Key | DeepSeek official search credential | empty = environment / `.env` / `.credentials.yaml` |
| Save keys | Write/overwrite/clear the key fields | required after edits |
| Fallback chain | Order used after the current backend fails | `anysearch -> deepseek-official` |

## Configuration storage and priority

The primary source of truth is the DSH settings namespace `search-router`, persisted in:

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

If the settings service is unavailable, the plugin falls back to `$DSH_HOME/search-router.json`.

Key resolution order:
1. Key entered in the panel (explicit override)
2. `process.env.DEEPSEEK_API_KEY` / `ANYSEARCH_API_KEY`
3. `~/.dsh/.env`
4. `~/.dsh/.credentials.yaml`

## Key display rules

| Case | Display |
|---|---|
| Key saved in the panel | Partial mask: `as_s********f76f` / `sk-2********abcd`, with an Edit button |
| No panel key, but key exists in environment/credentials | Generic mask `••••••••`, with an Edit button |
| Not configured | Empty input + placeholder |

- Click Edit to type a new key; saving an empty edit clears the panel-stored key and falls back to environment/credentials.
- The full key is never returned to the browser; only masks are displayed.

## Notes

1. Hard-refresh the browser after client UI updates (`Ctrl+F5`).
2. Avoid conflicts with other search plugins over `web.searchProvider`. If you also install other search plugins, pin this router in the profile user config:
   ```yaml
   - id: web
     config:
       searchProvider: router
       fetchProvider: http
   ```
3. To uninstall:
   - Remove `dsh-search-router` from the profile `package.json` dependencies and bundles.
   - Run `pnpm install` in the profile directory.
   - Restart dsh.
   - If `web.searchProvider` still points to `router`, set it back to `deepseek-official` or remove the override.
4. Keys saved before the mask feature may show only `••••••••`; click Edit and save again to generate the partial mask.
5. The DeepSeek API Key field expects the DeepSeek official `sk-...` key — the same key used for model configuration, not an Anthropic key.
6. AnySearch works anonymously without a key; registered users can enter `as_sk_...` for a higher quota and more stable results.
7. Default fallback chain: `anysearch -> deepseek-official`. If AnySearch also fails, DeepSeek official is the final backend; results include a `Note: ...` explaining which backend was actually used.
8. The plugin does not depend on dsh-web-ui, but the settings card requires the official `settings.plugin.item` slot and therefore appears in the official Settings → Plugins → Plugin configuration page.
