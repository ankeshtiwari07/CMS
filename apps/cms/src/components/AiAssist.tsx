'use client'
// @ts-nocheck — leaf UI component; relies on @payloadcms/ui runtime hooks whose
// exact generic signatures vary across patch versions. Runtime is exercised via
// screenshot verification.
/*
 * HUMAIN AI Assist — brings "generate content by prompt" INTO the Payload admin
 * console (previously it lived only in the separate console/manage surface and
 * the MCP tools). Rendered as a `ui` field at the top of every content
 * collection's edit view. Reads the document's text fields, asks the existing
 * console suggest endpoint (/api/content/suggest — same origin, reuses the AI
 * service) to draft on-brand values, then writes them into the live form via
 * Payload's form dispatch. Agents propose; the human reviews and publishes.
 */
import * as React from 'react'
import { useForm, useFormFields, useDocumentInfo, useLocale } from '@payloadcms/ui'

// Fields the assistant must NOT overwrite: governance/system fields, and
// rich-text / relationship / array / upload fields (whose values aren't plain
// strings — writing a string would corrupt them).
const DENY = new Set<string>([
  'site', 'riskTier', 'aiGenerated', 'createdBy', 'workflowState', 'template',
  'id', '_status', 'updatedAt', 'createdAt', 'seo', 'aiAssist',
  // rich-text
  'solution', 'body', 'bio', 'answer', 'details', 'description',
  // relationship / array / upload
  'author', 'tags', 'industry', 'photo', 'items', 'features', 'media',
])

const AiAssist: React.FC = () => {
  const { dispatchFields } = useForm()
  const doc = useDocumentInfo() as { collectionSlug?: string; id?: unknown }
  const locale = useLocale() as { code?: string } | string

  // Current top-level form fields (path -> state). We only target plain-string
  // (or empty) fields so rich-text / relationship values are never clobbered.
  const fieldMap = useFormFields(([fields]) => fields) as Record<string, { value?: unknown }>
  const targets = React.useMemo(
    () =>
      Object.entries(fieldMap || {})
        .filter(([p, f]) => !p.includes('.') && !DENY.has(p))
        .filter(([, f]) => f?.value == null || typeof f.value === 'string')
        .map(([p]) => p),
    [fieldMap],
  )

  const [prompt, setPrompt] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [msg, setMsg] = React.useState<{ k: 'ok' | 'err'; t: string } | null>(null)

  const localeCode = typeof locale === 'string' ? locale : locale?.code || 'en'
  const slug = doc?.collectionSlug || 'content'

  async function generate() {
    if (busy || !targets.length) return
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/content/suggest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          typeLabel: slug,
          fields: targets.map((n) => ({ name: n, label: n, type: 'text' })),
          brief: prompt.trim() || undefined,
          locale: localeCode,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) {
        setMsg({ k: 'err', t: data?.error || `AI draft failed (${res.status})` })
      } else {
        const filled: Record<string, unknown> = data.data || {}
        let n = 0
        for (const [k, v] of Object.entries(filled)) {
          if (v == null || !targets.includes(k)) continue
          dispatchFields({ type: 'UPDATE', path: k, value: v })
          n++
        }
        // Flag for the human-review gate.
        if (n > 0) dispatchFields({ type: 'UPDATE', path: 'aiGenerated', value: true })
        setMsg({
          k: 'ok',
          t: n
            ? `Drafted ${n} field${n !== 1 ? 's' : ''} — review & edit before publishing.`
            : 'No suggestions returned.',
        })
      }
    } catch {
      setMsg({ k: 'err', t: 'Network error contacting the AI service.' })
    }
    setBusy(false)
  }

  return (
    <div className="hc-ai">
      <div className="hc-ai__title">✨ Generate with AI</div>
      <div className="hc-ai__sub">
        Describe what you want and the agent drafts this document&apos;s fields. It flags the doc as
        AI-generated for human review — nothing publishes automatically.
      </div>
      <div className="hc-ai__row">
        <textarea
          className="hc-ai__input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate()
          }}
          placeholder={`e.g. A launch post for HUMAIN's new Arabic voice model, upbeat and concise…`}
          rows={2}
        />
        <button className="hc-ai__btn" onClick={generate} disabled={busy || !targets.length}>
          {busy ? 'Drafting…' : 'Generate'}
        </button>
      </div>
      {msg && <div className={`hc-ai__msg hc-ai__msg--${msg.k}`}>{msg.t}</div>}
    </div>
  )
}

export default AiAssist
