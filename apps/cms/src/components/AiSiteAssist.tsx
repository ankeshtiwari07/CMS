'use client'
// @ts-nocheck — leaf UI component; relies on @payloadcms/ui runtime hooks whose
// exact generic signatures vary across patch versions. Runtime verified live.
/*
 * HUMAIN AI Site Assist — the AGENT-DRIVEN way to create a website INSIDE the
 * Payload admin (option b). Instead of hand-filling the AiWebsites form, you
 * describe the site and the agent BUILDS it (reusing the live component library,
 * delegating any missing blocks) and fills title / slug / html / sections /
 * brand for you. It flags the doc AI-generated so publishing routes through the
 * approval flow — agents propose, authorised humans dispose.
 */
import * as React from 'react'
import { useForm } from '@payloadcms/ui'

function slugify(s: string): string {
  return String(s || '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

const AiSiteAssist: React.FC = () => {
  const { dispatchFields } = useForm()
  const [prompt, setPrompt] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [msg, setMsg] = React.useState<{ k: 'ok' | 'err'; t: string } | null>(null)

  async function build() {
    if (busy || !prompt.trim()) return
    setBusy(true)
    setMsg({ k: 'ok', t: 'Building the site with the agent — this can take up to a minute…' })
    try {
      const res = await fetch('/api/website', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      })
      const gen = await res.json().catch(() => ({}))
      if (!res.ok || !gen?.html) {
        setMsg({ k: 'err', t: gen?.error || gen?.message || `Site build failed (${res.status})` })
        setBusy(false)
        return
      }
      const set = (path: string, value: unknown) => dispatchFields({ type: 'UPDATE', path, value })
      set('title', gen.title || 'Untitled site')
      set('slug', slugify(gen.title || prompt))
      set('prompt', prompt.trim())
      set('contentType', 'website')
      set('html', gen.html)
      if (gen.sections) set('sections', gen.sections)
      if (gen.brand) set('brand', gen.brand)
      set('aiGenerated', true)
      const nSec = Array.isArray(gen.sections) ? gen.sections.length : 0
      const nNew = gen?.delegation?.created?.length || 0
      setMsg({
        k: 'ok',
        t: `Built "${gen.title}" — ${nSec} section${nSec !== 1 ? 's' : ''}${nNew ? `, ${nNew} new component${nNew !== 1 ? 's' : ''} added to the library (draft)` : ''}. Review below, then Save. Publishing routes through the approval flow.`,
      })
    } catch {
      setMsg({ k: 'err', t: 'Network error contacting the AI service.' })
    }
    setBusy(false)
  }

  return (
    <div className="hc-ai">
      <div className="hc-ai__title">✨ Build this website with AI</div>
      <div className="hc-ai__sub">
        Describe the site and the agent builds it end-to-end — reusing your component library and
        filling every field below. It&apos;s flagged AI-generated for human review; nothing publishes
        automatically.
      </div>
      <div className="hc-ai__row">
        <textarea
          className="hc-ai__input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) build() }}
          placeholder={`e.g. A bold landing page for HUMAIN's new Arabic voice model — hero, 3 feature cards, testimonial, CTA…`}
          rows={2}
        />
        <button className="hc-ai__btn" onClick={build} disabled={busy || !prompt.trim()}>
          {busy ? 'Building…' : 'Build site'}
        </button>
      </div>
      {msg && <div className={`hc-ai__msg hc-ai__msg--${msg.k}`}>{msg.t}</div>}
    </div>
  )
}

export default AiSiteAssist
