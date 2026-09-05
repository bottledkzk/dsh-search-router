import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react'

const NS = 'search-router'

const BACKENDS = [
  ['deepseek-official', 'DeepSeek 官方搜索（需要 DEEPSEEK_API_KEY）', 'DeepSeek Official (needs DEEPSEEK_API_KEY)'],
  ['anysearch', 'AnySearch（匿名或 ANYSEARCH_API_KEY）', 'AnySearch (anonymous or ANYSEARCH_API_KEY)'],
  ['bing', 'Bing（免费，默认）', 'Bing (free, default)'],
  ['ddg', 'DuckDuckGo（免费）', 'DuckDuckGo (free)'],
  ['ddg-lite', 'DuckDuckGo Lite（免费）', 'DuckDuckGo Lite (free)'],
  ['searxng', 'SearXNG（免费元搜索）', 'SearXNG (free meta-search)'],
] as const

let scope: any
let describeFace: any

export const inject = ['slots', 'settingsScope']

function isZh(): boolean {
  if (typeof navigator === 'undefined') return false
  return navigator.language?.toLowerCase().startsWith('zh') ?? false
}

function lang(): 'zh' | 'en' {
  return isZh() ? 'zh' : 'en'
}

const T = {
  zh: {
    title: '搜索路由',
    description: '选择 web_search 使用的搜索后端、密钥与单次结果上限',
    expand: '展开搜索路由',
    collapse: '收起搜索路由',
    provider: '搜索后端',
    maxResults: '单次搜索最大结果数',
    maxResultsHint: '默认 10，范围 1–20。',
    anyKey: 'AnySearch API Key',
    anyKeyPlaceholder: '留空 = 匿名额度 / .env / .credentials.yaml',
    deepKey: 'DeepSeek API Key',
    deepKeyPlaceholder: '留空 = .env / .credentials.yaml',
    saveKeys: '保存密钥',
    saved: '已保存',
    edit: '修改',
    fallback: '回退链',
    fallbackSuffix: '（失败后自动回退到 DeepSeek 官方）',
  },
  en: {
    title: 'Search Router',
    description: 'Choose the backend, keys, and per-search result limit used by web_search',
    expand: 'Expand Search Router',
    collapse: 'Collapse Search Router',
    provider: 'Search provider',
    maxResults: 'Max results per search',
    maxResultsHint: 'Default 10, range 1–20.',
    anyKey: 'AnySearch API Key',
    anyKeyPlaceholder: 'empty = anonymous / .env / .credentials.yaml',
    deepKey: 'DeepSeek API Key',
    deepKeyPlaceholder: 'empty = .env / .credentials.yaml',
    saveKeys: 'Save keys',
    saved: 'saved',
    edit: 'Edit',
    fallback: 'Fallback chain',
    fallbackSuffix: '(auto-fallback to DeepSeek official)',
  },
} as const

const t = (key: keyof typeof T['en']) => T[lang()][key]

const cardStyle: React.CSSProperties = {
  listStyle: 'none',
  border: '0.5px solid var(--dsw-alias-border-l4, rgba(255,255,255,0.10))',
  borderRadius: 16,
  background: 'var(--dsw-alias-bg-layer-3, transparent)',
  transition: 'border-color .16s, background .16s',
}

const headerStyle: React.CSSProperties = {
  width: '100%',
  appearance: 'none',
  border: 0,
  background: 'none',
  font: 'inherit',
  color: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '14px 16px',
  borderRadius: 12,
}

const headTextStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const nameStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  lineHeight: 1.4,
  color: 'var(--dsw-alias-label-primary, #e8e8ea)',
}

const descStyle: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.5,
  color: 'var(--dsw-alias-label-tertiary, #9a9a9a)',
}

const chevronStyle: React.CSSProperties = {
  flex: 'none',
  color: 'var(--dsw-alias-label-tertiary, #9a9a9a)',
  transition: 'transform .16s',
  display: 'flex',
}

const openCardStyle: React.CSSProperties = {
  background: 'var(--dsw-alias-bg-layer-2, transparent)',
  borderColor: 'var(--dsw-alias-label-dimmed, rgba(255,255,255,0.3))',
}

const bodyStyle: React.CSSProperties = {
  borderTop: '0.5px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.08))',
  margin: '0 16px',
  paddingBottom: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  paddingTop: 12,
}

const labelStyle: React.CSSProperties = {
  color: 'var(--dsw-alias-label-primary, #e8e8ea)',
  fontSize: 13,
  fontWeight: 500,
}

const inputStyle: React.CSSProperties = {
  border: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.08))',
  font: 'inherit',
  fontVariantNumeric: 'tabular-nums',
  color: 'var(--dsw-alias-label-primary, #e8e8ea)',
  background: 'var(--dsw-specific-input-major, transparent)',
  borderRadius: 6,
  padding: '6px 8px',
  fontSize: 13,
  width: '100%',
}

const hintStyle: React.CSSProperties = {
  color: 'var(--dsw-alias-label-secondary, #b0b0b0)',
  fontSize: 12,
  margin: 0,
}

const editButtonStyle: React.CSSProperties = {
  padding: '2px 8px',
  borderRadius: 6,
  border: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.08))',
  background: 'transparent',
  color: 'var(--dsw-alias-label-secondary, #b0b0b0)',
  fontSize: 12,
  cursor: 'pointer',
}

function Chevron({ open }: { open: boolean }) {
  return (
    <span style={{ ...chevronStyle, transform: open ? 'rotate(180deg)' : 'none' }}>
      <svg width={14} height={14} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M11.8486 5.5L11.4238 5.92383L8.69727 8.65137C8.44157 8.90706 8.21562 9.13382 8.01172 9.29785C7.79912 9.46883 7.55595 9.61756 7.25 9.66602C7.08435 9.69222 6.91565 9.69222 6.75 9.66602C6.44405 9.61756 6.20088 9.46883 5.98828 9.29785C5.78438 9.13382 5.55843 8.90706 5.30273 8.65137L2.57617 5.92383L2.15137 5.5L3 4.65137L3.42383 5.07617L6.15137 7.80273C6.42595 8.07732 6.59876 8.24849 6.74023 8.3623C6.87291 8.46904 6.92272 8.47813 6.9375 8.48047C6.97895 8.48703 7.02105 8.48703 7.0625 8.48047C7.07728 8.47813 7.12709 8.46904 7.25977 8.3623C7.40124 8.24849 7.57405 8.07732 7.84863 7.80273L10.5762 5.07617L11 4.65137L11.8486 5.5Z"
          fill="currentColor"
        />
      </svg>
    </span>
  )
}

function maskKey(raw: string): string {
  if (!raw) return ''
  if (raw.length <= 8) return '••••••••'
  return `${raw.slice(0, 4)}••••••••${raw.slice(-4)}`
}

function SearchRouterCard() {
  const subscribe = (listener: () => void) => scope.subscribe(listener)
  const getSnapshot = () => scope.getSnapshot()
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  const value: any = snapshot?.value ?? {}
  const writable: boolean = snapshot?.writable !== false

  const provider: string = typeof value.provider === 'string' ? value.provider : 'bing'
  const maxResults: number = typeof value.maxResults === 'number' ? value.maxResults : 10
  const fallback: string[] = Array.isArray(value.fallback) ? value.fallback : []
  const anyMask: string = typeof value.anysearchApiKeyMask === 'string' ? value.anysearchApiKeyMask : ''
  const deepMask: string = typeof value.deepseekApiKeyMask === 'string' ? value.deepseekApiKeyMask : ''
  const describeSnapshot = useSyncExternalStore(
    (listener: () => void) => describeFace.subscribe(listener),
    () => describeFace.getSnapshot(),
  )
  const nsView = describeSnapshot?.view?.namespaces?.find((n: any) => n.ns === NS)
  const secretSet = (path: string): boolean => (nsView?.secrets ?? []).some((s: { path: string[]; set: boolean }) => s.path.join('.') === path && s.set)
  const anySecretSet = secretSet('anysearchApiKey')
  const deepSecretSet = secretSet('deepseekApiKey')
  const effectiveAnyMask = anyMask || (anySecretSet ? '••••••••' : '')
  const effectiveDeepMask = deepMask || (deepSecretSet ? '••••••••' : '')

  const [open, setOpen] = useState(false)
  const [anyKey, setAnyKey] = useState('')
  const [deepKey, setDeepKey] = useState('')
  const [anyEditing, setAnyEditing] = useState(false)
  const [deepEditing, setDeepEditing] = useState(false)
  const [keyMsg, setKeyMsg] = useState('')

  const anyInputRef = useRef<HTMLInputElement>(null)
  const deepInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setAnyKey(effectiveAnyMask)
    setAnyEditing(false)
  }, [effectiveAnyMask])
  useEffect(() => {
    setDeepKey(effectiveDeepMask)
    setDeepEditing(false)
  }, [effectiveDeepMask])

  const startEditAny = () => {
    setAnyEditing(true)
    setAnyKey('')
    setTimeout(() => anyInputRef.current?.focus(), 0)
  }

  const startEditDeep = () => {
    setDeepEditing(true)
    setDeepKey('')
    setTimeout(() => deepInputRef.current?.focus(), 0)
  }

  const saveKeys = async () => {
    try {
      if (anyEditing) {
        const raw = anyKey.trim()
        if (raw) {
          await scope.set('anysearchApiKey', raw)
          await scope.set('anysearchApiKeyMask', maskKey(raw))
        } else {
          await scope.unset('anysearchApiKey')
          await scope.unset('anysearchApiKeyMask')
        }
      }
      if (deepEditing) {
        const raw = deepKey.trim()
        if (raw) {
          await scope.set('deepseekApiKey', raw)
          await scope.set('deepseekApiKeyMask', maskKey(raw))
        } else {
          await scope.unset('deepseekApiKey')
          await scope.unset('deepseekApiKeyMask')
        }
      }
      setAnyEditing(false)
      setDeepEditing(false)
      setAnyKey(effectiveAnyMask)
      setDeepKey(effectiveDeepMask)
      setKeyMsg(t('saved'))
    } catch (error) {
      setKeyMsg(error instanceof Error ? error.message : String(error))
    }
  }

  const fallbackNames = fallback.map((id) => {
    const entry = BACKENDS.find(([bid]) => bid === id)
    if (!entry) return id
    return (isZh() ? entry[1] : entry[2]).split('（')[0].split(' (')[0]
  }).join(' → ')

  return (
    <li style={{ ...cardStyle, ...(open ? openCardStyle : {}) }}>
      <button type="button" style={headerStyle} aria-expanded={open} aria-label={open ? t('collapse') : t('expand')} onClick={() => { setOpen(prev => !prev) }}>
        <span style={headTextStyle}>
          <span style={nameStyle}>{t('title')}</span>
          <span style={descStyle}>{t('description')}</span>
        </span>
        <Chevron open={open} />
      </button>
      {open ? (
        <div style={bodyStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={labelStyle}>{t('provider')}</label>
            <select
              value={provider}
              disabled={!writable}
              onChange={(event) => { void scope.set('provider', event.target.value) }}
              style={inputStyle}
            >
              {BACKENDS.map(([id, zhLabel, enLabel]) => <option key={id} value={id}>{isZh() ? zhLabel : enLabel}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={labelStyle}>{t('maxResults')}</label>
            <input
              type="number"
              min={1}
              max={20}
              value={maxResults}
              disabled={!writable}
              onChange={(event) => {
                const next = Number(event.target.value)
                if (Number.isInteger(next) && next > 0) { void scope.set('maxResults', next) }
              }}
              style={{ ...inputStyle, width: 120 }}
            />
            <p style={hintStyle}>{t('maxResultsHint')}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={labelStyle}>{t('anyKey')}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                ref={anyInputRef}
                type={anyEditing ? 'password' : 'text'}
                value={anyKey}
                readOnly={!anyEditing && !!effectiveAnyMask}
                placeholder={t('anyKeyPlaceholder')}
                disabled={!writable}
                onChange={(event) => { setAnyKey(event.target.value) }}
                style={{ ...inputStyle, flex: 1 }}
              />
              {!anyEditing && !!effectiveAnyMask ? <button type="button" style={editButtonStyle} onClick={startEditAny}>{t('edit')}</button> : null}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={labelStyle}>{t('deepKey')}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                ref={deepInputRef}
                type={deepEditing ? 'password' : 'text'}
                value={deepKey}
                readOnly={!deepEditing && !!effectiveDeepMask}
                placeholder={t('deepKeyPlaceholder')}
                disabled={!writable}
                onChange={(event) => { setDeepKey(event.target.value) }}
                style={{ ...inputStyle, flex: 1 }}
              />
              {!deepEditing && !!effectiveDeepMask ? <button type="button" style={editButtonStyle} onClick={startEditDeep}>{t('edit')}</button> : null}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => { void saveKeys() }}
              disabled={!writable}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                border: '1px solid var(--dsw-alias-button-info-fill, #4d6bfe)',
                background: 'var(--dsw-alias-button-info-fill, #4d6bfe)',
                color: 'var(--dsw-alias-label-primary-foreground, #ffffff)',
                cursor: 'pointer',
              }}
            >
              {t('saveKeys')}
            </button>
            {keyMsg ? <span style={{ fontSize: 12 }}>{keyMsg}</span> : null}
          </div>

          <div style={{ fontSize: 12, color: 'var(--dsw-alias-label-secondary, #b0b0b0)' }}>
            {t('fallback')}: {fallbackNames || '—'} {t('fallbackSuffix')}
          </div>
        </div>
      ) : null}
    </li>
  )
}

export function apply(ctx: any): void {
  scope = ctx.settingsScope.bind({ namespace: NS })
  describeFace = ctx.settingsScope.describe()
  ctx.slots.inject('settings.plugin.item', () => ctx.slots.register({
    name: 'settings.plugin.item',
    key: NS,
    id: 'dsh-search-router',
    order: 130,
    label: isZh() ? '搜索路由' : 'Search Router',
  }, SearchRouterCard))
}
