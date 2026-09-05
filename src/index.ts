/**
 * dsh-search-router — local multi-provider search router for DeepSeek Harness.
 *
 * Registers ONE wrapper provider (`router`) into `ctx.web` so the official
 * `web_search` tool routes through this plugin. The active backend is read
 * from `$DSH_HOME/search-router.json` on every search, which makes switching
 * instant (no restart). On failure or empty results the plugin walks the
 * configured fallback chain and annotates the result with a `content` note
 * (surfaced by the official `web_search` tool as its answer).
 *
 * Runtime dependencies: node builtins only.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import z from '@deepseek-ai/schemastery'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

const BACKENDS = [
  'deepseek-official',
  'anysearch',
  'bing',
  'ddg',
  'ddg-lite',
  'searxng',
] as const

type BackendId = (typeof BACKENDS)[number]

interface RouterConfig {
  provider: BackendId
  fallback: BackendId[]
  searxngInstances: string[]
  maxResults: number
  anysearchApiKey?: string
  deepseekApiKey?: string
  anysearchApiKeyMask?: string
  deepseekApiKeyMask?: string
}

interface SearchSource {
  url: string
  title?: string
  snippet?: string
  publishedAt?: string
}

interface SearchResult {
  sources: SearchSource[]
  truncated: boolean
  content?: string
}

interface RouterState {
  config: RouterConfig
  lastError: string | null
  lastErrorAt: string | null
}

interface ApplyConfig {
  provider?: string
  fallback?: string[]
  searxngInstances?: string[]
  maxResults?: number
  anysearchApiKey?: string
  deepseekApiKey?: string
  anysearchApiKeyMask?: string
  deepseekApiKeyMask?: string
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

export const name = 'web-search-router'
export const inject = ['web', 'tools']

const PROVIDER_ID = 'router'
const SETTINGS_NS = 'search-router'
const CONFIG_FILENAME = 'search-router.json'
const DEEPSEEK_SEARCH_URL = 'https://api.deepseek.com/anthropic/v1/messages'
const ANYSEARCH_SEARCH_URL = 'https://api.anysearch.com/v1/search'
const BING_URL = 'https://www.bing.com/search'
const DDG_HTML_URL = 'https://html.duckduckgo.com/html/'
const DDG_LITE_URL = 'https://lite.duckduckgo.com/lite/'

const DEFAULT_FALLBACK: BackendId[] = ['anysearch', 'deepseek-official']
const DEFAULT_SEARXNG_INSTANCES = [
  'https://opnxng.com',
  'https://priv.au',
  'https://searx.be',
  'https://searx.tiekoetter.com',
  'https://search.inetol.net',
  'https://paulgo.io',
]

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const ACCEPT_LANG = 'zh-CN,zh;q=0.9,en;q=0.8'

/* ------------------------------------------------------------------ */
/* Small utilities                                                     */
/* ------------------------------------------------------------------ */

function dshHome(): string {
  return process.env.DSH_HOME ?? join(homedir(), '.dsh')
}

function configPath(): string {
  return join(dshHome(), CONFIG_FILENAME)
}

function isBackendId(value: unknown): value is BackendId {
  return typeof value === 'string' && (BACKENDS as readonly string[]).includes(value)
}

function normalizeConfig(config: ApplyConfig | undefined): RouterConfig {
  const provider = isBackendId(config?.provider) ? config.provider : 'bing'
  const fallback = Array.isArray(config?.fallback)
    ? config.fallback.filter(isBackendId)
    : [...DEFAULT_FALLBACK]
  if (fallback.length === 0) fallback.push(...DEFAULT_FALLBACK)
  const searxngInstances = Array.isArray(config?.searxngInstances)
    ? config.searxngInstances.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : []
  const maxResults = typeof config?.maxResults === 'number' && Number.isInteger(config.maxResults) && config.maxResults > 0
    ? config.maxResults
    : 10
  const anysearchApiKey = typeof config?.anysearchApiKey === 'string' && config.anysearchApiKey.length > 0
    ? config.anysearchApiKey
    : undefined
  const deepseekApiKey = typeof config?.deepseekApiKey === 'string' && config.deepseekApiKey.length > 0
    ? config.deepseekApiKey
    : undefined
  const anysearchApiKeyMask = typeof config?.anysearchApiKeyMask === 'string' && config.anysearchApiKeyMask.length > 0
    ? config.anysearchApiKeyMask
    : undefined
  const deepseekApiKeyMask = typeof config?.deepseekApiKeyMask === 'string' && config.deepseekApiKeyMask.length > 0
    ? config.deepseekApiKeyMask
    : undefined
  return { provider, fallback, searxngInstances, maxResults, ...anysearchApiKey === undefined ? {} : { anysearchApiKey }, ...deepseekApiKey === undefined ? {} : { deepseekApiKey }, ...anysearchApiKeyMask === undefined ? {} : { anysearchApiKeyMask }, ...deepseekApiKeyMask === undefined ? {} : { deepseekApiKeyMask } }
}

function readConfigFile(): RouterConfig | undefined {
  try {
    const raw = readFileSync(configPath(), 'utf8')
    const parsed = JSON.parse(raw) as Partial<RouterConfig>
    const provider = isBackendId(parsed.provider) ? parsed.provider : 'bing'
    const fallback = Array.isArray(parsed.fallback)
      ? parsed.fallback.filter(isBackendId)
      : [...DEFAULT_FALLBACK]
    if (fallback.length === 0) fallback.push(...DEFAULT_FALLBACK)
    const searxngInstances = Array.isArray(parsed.searxngInstances)
      ? parsed.searxngInstances.filter((item): item is string => typeof item === 'string' && item.length > 0)
      : []
    const maxResults = typeof parsed.maxResults === 'number' && Number.isInteger(parsed.maxResults) && parsed.maxResults > 0
      ? parsed.maxResults
      : 10
    const anysearchApiKey = typeof parsed.anysearchApiKey === 'string' && parsed.anysearchApiKey.length > 0
      ? parsed.anysearchApiKey
      : undefined
    const deepseekApiKey = typeof parsed.deepseekApiKey === 'string' && parsed.deepseekApiKey.length > 0
      ? parsed.deepseekApiKey
      : undefined
    const anysearchApiKeyMask = typeof parsed.anysearchApiKeyMask === 'string' && parsed.anysearchApiKeyMask.length > 0
      ? parsed.anysearchApiKeyMask
      : undefined
    const deepseekApiKeyMask = typeof parsed.deepseekApiKeyMask === 'string' && parsed.deepseekApiKeyMask.length > 0
      ? parsed.deepseekApiKeyMask
      : undefined
    return { provider, fallback, searxngInstances, maxResults, ...anysearchApiKey === undefined ? {} : { anysearchApiKey }, ...deepseekApiKey === undefined ? {} : { deepseekApiKey }, ...anysearchApiKeyMask === undefined ? {} : { anysearchApiKeyMask }, ...deepseekApiKeyMask === undefined ? {} : { deepseekApiKeyMask } }
  } catch {
    return undefined
  }
}

function writeConfigFile(config: RouterConfig): void {
  mkdirSync(dshHome(), { recursive: true })
  writeFileSync(configPath(), JSON.stringify(config, null, 2) + '\n', 'utf8')
}

function readConfig(initial: RouterConfig): RouterConfig {
  const existing = readConfigFile()
  if (existing) return existing
  writeConfigFile(initial)
  return initial
}

function decodeEntities(text: string): string {
  return String(text)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function stripTags(html: string): string {
  return decodeEntities(String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
}

function uniqueSources(sources: SearchSource[], limit: number): SearchSource[] {
  const seen = new Set<string>()
  const out: SearchSource[] = []
  for (const source of sources) {
    if (source.url && !seen.has(source.url)) {
      seen.add(source.url)
      out.push(source)
    }
    if (out.length >= limit) break
  }
  return out
}

function extractDdgUrl(rel: string): string | null {
  if (!rel) return null
  const match = rel.match(/uddg=([^&]+)/)
  if (match) {
    try {
      return decodeURIComponent(match[1]!)
    } catch {
      return match[1]!
    }
  }
  if (rel.startsWith('//')) return `https:${rel}`
  return rel
}

/* ------------------------------------------------------------------ */
/* Credential resolution (env -> .env -> credentials refs)             */
/* ------------------------------------------------------------------ */

function parseEnvFile(file: string): Record<string, string> {
  try {
    const text = readFileSync(file, 'utf8')
    const out: Record<string, string> = {}
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!match) continue
      const value = match[2]!.replace(/^['"]|['"]$/g, '')
      if (value.length > 0) out[match[1]!] = value
    }
    return out
  } catch {
    return {}
  }
}

function parseCredentialsRefs(file: string): Record<string, string> {
  try {
    const text = readFileSync(file, 'utf8')
    const out: Record<string, string> = {}
    const section = text.match(/^refs:\s*$/m)
    if (!section || section.index === undefined) return out
    const rest = text.slice(section.index)
    const lines = rest.split(/\r?\n/).slice(1)
    for (const line of lines) {
      const match = line.match(/^  ([A-Z][A-Z0-9_]*):\s*(.*?)\s*$/)
      if (!match) {
        if (/^\S/.test(line)) break
        continue
      }
      const value = match[2]!.replace(/^['"]|['"]$/g, '')
      if (value.length > 0) out[match[1]!] = value
    }
    return out
  } catch {
    return {}
  }
}

const state: RouterState = {
  config: {
    provider: 'bing',
    fallback: [...DEFAULT_FALLBACK],
    searxngInstances: [],
    maxResults: 10,
  },
  lastError: null,
  lastErrorAt: null,
}

let settingsApi: {
  update(ns: string, patch: object, expectedRevision?: number): Promise<void>
} | undefined

function resolveApiKey(name: 'DEEPSEEK_API_KEY' | 'ANYSEARCH_API_KEY'): string | undefined {
  // 设置面板里明确填写的 key 优先（用户主动覆盖现有凭据）；
  // 留空时回退到 process.env → ~/.dsh/.env → ~/.dsh/.credentials.yaml。
  if (name === 'ANYSEARCH_API_KEY' && state.config.anysearchApiKey) return state.config.anysearchApiKey
  if (name === 'DEEPSEEK_API_KEY' && state.config.deepseekApiKey) return state.config.deepseekApiKey
  if (process.env[name]) return process.env[name]
  const fromEnv = parseEnvFile(join(dshHome(), '.env'))[name]
  if (fromEnv) return fromEnv
  return parseCredentialsRefs(join(dshHome(), '.credentials.yaml'))[name]
}

/** 把凭据中心已存在的 key 投影成一个非敏感掩码字段，供设置页只读展示。 */
function withCredentialMasks(config: RouterConfig): RouterConfig {
  const next = { ...config }
  if (!next.anysearchApiKeyMask && resolveApiKey('ANYSEARCH_API_KEY')) {
    next.anysearchApiKeyMask = '••••••••'
  }
  if (!next.deepseekApiKeyMask && resolveApiKey('DEEPSEEK_API_KEY')) {
    next.deepseekApiKeyMask = '••••••••'
  }
  return next
}

/* ------------------------------------------------------------------ */
/* Backends                                                            */
/* ------------------------------------------------------------------ */

async function searchDeepSeekOfficial(
  query: string,
  maxResults: number,
  signal?: AbortSignal,
): Promise<SearchResult> {
  const apiKey = resolveApiKey('DEEPSEEK_API_KEY')
  if (!apiKey) throw new Error('DeepSeek search requires DEEPSEEK_API_KEY')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20000)
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort)
  let response: Response
  try {
    response = await fetch(DEEPSEEK_SEARCH_URL, {
      method: 'POST',
      redirect: 'error',
      headers: {
        'x-api-key': apiKey,
        authorization: `Bearer ${apiKey}`,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: `Perform a web search for the query: ${query}` }],
          },
        ],
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 1 }],
      }),
      signal: controller.signal,
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new Error(`DeepSeek search request failed: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    if (response.status === 401) throw new Error('DeepSeek API key is invalid (HTTP 401)')
    throw new Error(`DeepSeek API error (HTTP ${response.status}): ${detail.slice(0, 200)}`)
  }

  const data = (await response.json()) as {
    content?: Array<{
      type?: string
      citations?: Array<{ url?: string; cited_text?: string }>
      content?: unknown
    }>
  }
  const blocks = data.content ?? []
  const snippets = new Map<string, string>()
  for (const block of blocks) {
    if (block.type !== 'text') continue
    for (const cite of block.citations ?? []) {
      if (cite.url && cite.cited_text && !snippets.has(cite.url)) snippets.set(cite.url, cite.cited_text)
    }
  }
  const sources: SearchSource[] = []
  for (const block of blocks) {
    if (block.type !== 'web_search_tool_result' || !Array.isArray(block.content)) continue
    for (const item of block.content) {
      if (!item || typeof item !== 'object' || item.type !== 'web_search_result' || !item.url) continue
      const itemRecord = item as { url?: string; title?: string; page_age?: string }
      if (sources.some(source => source.url === itemRecord.url)) continue
      sources.push({
        url: itemRecord.url!,
        ...(itemRecord.title ? { title: itemRecord.title } : {}),
        ...(snippets.get(itemRecord.url!) ? { snippet: snippets.get(itemRecord.url!) } : {}),
        ...(itemRecord.page_age ? { publishedAt: itemRecord.page_age } : {}),
      })
    }
  }
  return { sources: uniqueSources(sources, maxResults), truncated: false }
}

async function searchAnysearch(
  query: string,
  maxResults: number,
  signal?: AbortSignal,
): Promise<SearchResult> {
  const apiKey = resolveApiKey('ANYSEARCH_API_KEY')
  const headers: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json',
    'user-agent': USER_AGENT,
  }
  if (apiKey) headers.authorization = `Bearer ${apiKey}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort)
  let response: Response
  try {
    response = await fetch(ANYSEARCH_SEARCH_URL, {
      method: 'POST',
      redirect: 'error',
      headers,
      body: JSON.stringify({ query, max_results: maxResults }),
      signal: controller.signal,
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new Error(`AnySearch request failed: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }

  if (!response.ok) {
    throw new Error(`AnySearch API error (HTTP ${response.status})`)
  }
  const data = (await response.json()) as {
    code?: number
    message?: string
    data?: {
      results?: Array<{
        url?: string
        title?: string
        snippet?: string
        published_at?: string
      }>
    }
  }
  if (data.code !== 0) {
    throw new Error(`AnySearch API error (${data.code ?? 'unknown'}): ${data.message ?? 'no message'}`)
  }
  const sources = (data.data?.results ?? [])
    .filter(result => result.url)
    .map(result => ({
      url: result.url!,
      ...(result.title ? { title: result.title } : {}),
      ...(result.snippet ? { snippet: result.snippet } : {}),
      ...(result.published_at ? { publishedAt: result.published_at } : {}),
    }))
  return { sources: uniqueSources(sources, maxResults), truncated: false }
}

async function fetchHtml(url: string, signal?: AbortSignal, acceptLang = ACCEPT_LANG): Promise<string> {
  let response: Response
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)
    const onAbort = () => controller.abort()
    signal?.addEventListener('abort', onAbort)
    response = await fetch(url, {
      headers: { 'user-agent': USER_AGENT, 'accept-language': acceptLang },
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  } catch (error) {
    if (signal?.aborted) throw error
    throw new Error(`connection error: ${error instanceof Error ? error.message : String(error)}`)
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url.split('?')[0]}`)
  }
  const html = await response.text()
  if (response.status === 202 || /anomaly|captcha|unusual traffic|robot check/i.test(html.slice(0, 4000))) {
    throw new Error('DuckDuckGo is rate-limited right now (anti-bot challenge, usually temporary)')
  }
  return html
}

async function fetchHtmlWithRetry(url: string, signal?: AbortSignal, acceptLang?: string): Promise<string> {
  let lastError: unknown
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const html = await fetchHtml(url, signal, acceptLang)
      if (html.length > 500) return html
      lastError = new Error(`empty response (${html.length} bytes)`)
    } catch (error) {
      lastError = error
    }
    if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 1500))
  }
  throw lastError instanceof Error ? lastError : new Error('fetch failed')
}

async function searchBing(query: string, maxResults: number, signal?: AbortSignal): Promise<SearchResult> {
  const params = new URLSearchParams({ q: query, mkt: 'zh-CN' })
  const html = await fetchHtmlWithRetry(`${BING_URL}?${params}`, signal, ACCEPT_LANG)
  const blocks = html.match(/<li class="b_algo"[\s\S]*?<\/li>/g) ?? []
  const sources: SearchSource[] = []
  for (const block of blocks) {
    const hrefMatch = block.match(/<a[^>]*href="(https?:\/\/[^"]+)"/)
    const titleMatch = block.match(/<h2[^>]*>[\s\S]*?<a[^>]*>(.*?)<\/a>[\s\S]*?<\/h2>/)
    const snippetMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/)
    if (!hrefMatch) continue
    sources.push({
      url: hrefMatch[1]!,
      ...(titleMatch ? { title: stripTags(titleMatch[1]!) } : {}),
      ...(snippetMatch ? { snippet: stripTags(snippetMatch[1]!) } : {}),
    })
  }
  return { sources: uniqueSources(sources, maxResults), truncated: false }
}

async function searchDdg(query: string, maxResults: number, signal?: AbortSignal): Promise<SearchResult> {
  const params = new URLSearchParams({ q: query })
  const html = await fetchHtmlWithRetry(`${DDG_HTML_URL}?${params}`, signal, ACCEPT_LANG)
  const blocks = html.match(/<div class="result results_links[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g) ?? []
  const sources: SearchSource[] = []
  for (const block of blocks) {
    const urlMatch = block.match(/<a[^>]*class="result__a"[^>]*href="([^"]*)"/)
    const titleMatch = block.match(/<a[^>]*class="result__a"[^>]*>(.*?)<\/a>/)
    const snippetMatch = block.match(/<a[^>]*class="result__snippet"[^>]*>(.*?)<\/a>/)
    const dateMatch = block.match(/<span[^>]*>\s*([\dT:.+-]+)\s*<\/span>/)
    const url = extractDdgUrl(urlMatch?.[1] ?? '')
    if (!url) continue
    sources.push({
      url,
      ...(titleMatch ? { title: stripTags(titleMatch[1]!) } : {}),
      ...(snippetMatch ? { snippet: stripTags(snippetMatch[1]!) } : {}),
      ...(dateMatch ? { publishedAt: dateMatch[1] } : {}),
    })
  }
  return { sources: uniqueSources(sources, maxResults), truncated: false }
}

async function searchDdgLite(query: string, maxResults: number, signal?: AbortSignal): Promise<SearchResult> {
  const params = new URLSearchParams({ q: query })
  const html = await fetchHtmlWithRetry(`${DDG_LITE_URL}?${params}`, signal, ACCEPT_LANG)
  const linkMatches = html.match(/<a[^>]*class=['"]result-link['"][^>]*>[\s\S]*?<\/a>/g) ?? []
  const snippetMatches = html.match(/class=['"]result-snippet['"][^>]*>([\s\S]*?)<\/td>/g) ?? []
  const sources: SearchSource[] = []
  for (let i = 0; i < linkMatches.length; i++) {
    const tag = linkMatches[i]!
    const hrefMatch = tag.match(/href="([^"]*)"/)
    const titleMatch = tag.match(/class=['"]result-link['"][^>]*>(.*?)<\/a>/)
    if (!hrefMatch) continue
    const url = extractDdgUrl(hrefMatch[1]!)
    if (!url) continue
    const snippet = snippetMatches[i]?.match(/class=['"]result-snippet['"][^>]*>([\s\S]*?)<\/td>/)?.[1]
    sources.push({
      url,
      ...(titleMatch ? { title: stripTags(titleMatch[1]!) } : {}),
      ...(snippet ? { snippet: stripTags(snippet) } : {}),
    })
  }
  return { sources: uniqueSources(sources, maxResults), truncated: false }
}

async function searchSearxng(
  query: string,
  maxResults: number,
  instances: string[],
  signal?: AbortSignal,
): Promise<SearchResult> {
  const errors: string[] = []
  const targets = instances.length > 0 ? instances : DEFAULT_SEARXNG_INSTANCES
  for (const base of targets) {
    try {
      const params = new URLSearchParams({ q: query, format: 'json' })
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000)
      const onAbort = () => controller.abort()
      signal?.addEventListener('abort', onAbort)
      const response = await fetch(`${base}/search?${params}`, {
        headers: { 'user-agent': USER_AGENT, accept: 'application/json' },
        signal: controller.signal,
      })
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      if (!response.ok) {
        errors.push(`${base}: HTTP ${response.status}`)
        continue
      }
      const data = (await response.json()) as { results?: Array<{ url?: string; title?: string; content?: string }> }
      if (!data || !Array.isArray(data.results)) {
        errors.push(`${base}: invalid JSON`)
        continue
      }
      const sources = data.results
        .filter(result => result.url)
        .map(result => ({
          url: result.url!,
          ...(result.title ? { title: String(result.title) } : {}),
          ...(result.content ? { snippet: String(result.content) } : {}),
        }))
      if (sources.length > 0) {
        return { sources: uniqueSources(sources, maxResults), truncated: false }
      }
      errors.push(`${base}: 0 results`)
    } catch (error) {
      errors.push(`${base}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  throw new Error(`all SearXNG instances failed: ${errors.join(', ') || 'no instances'}`)
}

/* ------------------------------------------------------------------ */
/* Router provider                                                     */
/* ------------------------------------------------------------------ */

async function runBackend(
  backend: BackendId,
  query: string,
  maxResults: number,
  searxngInstances: string[],
  signal?: AbortSignal,
): Promise<SearchResult> {
  switch (backend) {
    case 'deepseek-official':
      return searchDeepSeekOfficial(query, maxResults, signal)
    case 'anysearch':
      return searchAnysearch(query, maxResults, signal)
    case 'bing':
      return searchBing(query, maxResults, signal)
    case 'ddg':
      return searchDdg(query, maxResults, signal)
    case 'ddg-lite':
      return searchDdgLite(query, maxResults, signal)
    case 'searxng':
      return searchSearxng(query, maxResults, searxngInstances, signal)
    default:
      throw new Error(`unsupported backend: ${String(backend)}`)
  }
}

function createRouterProvider() {
  return {
    id: PROVIDER_ID,
    available() {
      return true
    },
    async search(request: { query: string; maxResults?: number }, signal?: AbortSignal): Promise<SearchResult> {
      const query = request.query
      const config = state.config
      const maxResults = Math.min(request.maxResults ?? config.maxResults, config.maxResults)
      const chain: BackendId[] = [config.provider, ...config.fallback.filter(backend => backend !== config.provider)]
      let lastError: string | null = null
      for (const backend of chain) {
        try {
          const result = await runBackend(backend, query, maxResults, config.searxngInstances, signal)
          if (result.sources.length > 0) {
            if (backend !== config.provider) {
              result.content = `Note: ${config.provider} unavailable or failed${lastError ? ` (${lastError})` : ''}, using ${backend}.`
            }
            state.lastError = null
            state.lastErrorAt = null
            return result
          }
          lastError = `${backend} returned 0 results`
        } catch (error) {
          lastError = `${backend}: ${error instanceof Error ? error.message : String(error)}`
        }
      }
      state.lastError = lastError
      state.lastErrorAt = new Date().toISOString()
      throw new Error(`all search backends failed (${chain.join(' -> ')}): ${lastError ?? 'unknown error'}`)
    },
  }
}

/* ------------------------------------------------------------------ */
/* Model-facing tools                                                  */
/* ------------------------------------------------------------------ */

function formatStatus(): string {
  const { config, lastError, lastErrorAt } = state
  const lines = [
    `current provider: ${config.provider}`,
    `fallback chain: ${config.fallback.join(' -> ')}`,
    `available backends: ${BACKENDS.join(', ')}`,
    `last failure: ${lastErrorAt ? `${lastErrorAt} ${lastError}` : 'none'}`,
    `max results per search: ${config.maxResults}`,
    `config file: ${configPath()}`,
  ]
  return lines.join('\n')
}

const STATUS_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    message: { type: 'string' },
  },
  required: ['message'],
} as const

const SWITCH_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    message: { type: 'string' },
  },
  required: ['message'],
} as const

const statusTool = {
  name: 'search_router_status',
  description:
    'Show the current web search backend of the search router, its fallback chain, all available backends, and the last failure if any.',
  parameters: {
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
  output: {
    schema: STATUS_OUTPUT_SCHEMA,
    render(_args: unknown, value: { message: string }) {
      return [{ type: 'text', text: value.message }]
    },
  },
  timeoutMs: 30000,
  async execute(_args: unknown): Promise<{ message: string }> {
    return { message: formatStatus() }
  },
}

const switchTool = {
  name: 'search_router_switch',
  description:
    'Switch the current web search backend immediately. Choose one of: deepseek-official (DeepSeek official search, needs DEEPSEEK_API_KEY), anysearch (AnySearch, anonymous or ANYSEARCH_API_KEY), bing (free, default), ddg / ddg-lite (free DuckDuckGo), searxng (free meta-search). The next web_search call uses the new backend without restart.',
  parameters: {
    type: 'object',
    additionalProperties: false,
    properties: {
      provider: {
        type: 'string',
        enum: [...BACKENDS],
      },
    },
    required: ['provider'],
  },
  output: {
    schema: SWITCH_OUTPUT_SCHEMA,
    render(_args: unknown, value: { message: string }) {
      return [{ type: 'text', text: value.message }]
    },
  },
  timeoutMs: 30000,
  async execute(args: unknown): Promise<{ message: string }> {
    const provider = (args as { provider?: unknown }).provider
    if (!isBackendId(provider)) {
      throw new Error(`unknown provider: ${String(provider)} (available: ${BACKENDS.join(', ')})`)
    }
    const previousProvider = state.config.provider
    state.config.provider = provider
    state.lastError = null
    state.lastErrorAt = null
    if (settingsApi) {
      try {
        await settingsApi.update(SETTINGS_NS, { provider })
      } catch (error) {
        state.config.provider = previousProvider
        throw error
      }
    } else {
      writeConfigFile(state.config)
    }
    return {
      message: `search router provider set to "${provider}". fallback chain: ${state.config.fallback.join(' -> ')}. Next web_search will use it immediately.`,
    }
  },
}

/* ------------------------------------------------------------------ */
/* Plugin entrypoint                                                   */
/* ------------------------------------------------------------------ */

const RouterConfigSchema = z.object({
  provider: z.string().default('bing'),
  fallback: z.array(z.string()).default([...DEFAULT_FALLBACK]),
  searxngInstances: z.array(z.string()).default([]),
  maxResults: z.number().default(10),
  anysearchApiKey: z.string().role('secret'),
  anysearchApiKeyMask: z.string(),
  deepseekApiKey: z.string().role('secret'),
  deepseekApiKeyMask: z.string(),
})

export function apply(ctx: {
  web: {
    registerSearchProvider(provider: ReturnType<typeof createRouterProvider>): unknown
  }
  tools: {
    register(definition: unknown): unknown
  }
  inject(deps: string[], callback: (sctx: any) => void): void
  logger?: { info(message: string): void }
}, config?: ApplyConfig): void {
  const initial = normalizeConfig(config)
  state.config = withCredentialMasks(readConfig(initial))

  ctx.web.registerSearchProvider(createRouterProvider())
  ctx.tools.register(statusTool)
  ctx.tools.register(switchTool)

  // Optional settings section (Settings > Plugins > Search Router). Keeps the
  // plugin functional even when the settings service is absent.
  try {
    ctx.inject(['settings'], (sctx: any) => {
      if (!sctx?.settings || typeof sctx.settings.installSection !== 'function') {
        console.error('[dsh-search-router] settings service unavailable: installSection missing')
        return
      }
      let currentConfig: () => RouterConfig = () => state.config
      sctx.settings.installSection(ctx, SETTINGS_NS, RouterConfigSchema, state.config, {
        setSource: (source: () => unknown) => {
          currentConfig = () => normalizeConfig(source() as ApplyConfig | undefined)
          state.config = currentConfig()
        },
        onChange: () => {
          state.config = currentConfig()
        },
      })
      settingsApi = {
        update: async (ns: string, patch: object) => {
          await sctx.settings.update(ns, patch)
        },
      }
      console.error('[dsh-search-router] settings section installed under namespace:', SETTINGS_NS)
    })
  } catch (error) {
    console.error('[dsh-search-router] settings section registration failed:', error)
  }

  ctx.logger?.info(`dsh-search-router: provider "${state.config.provider}", fallback [${state.config.fallback.join(', ')}], maxResults ${state.config.maxResults}`)
}
