'use client'
// @ts-nocheck — leaf UI component; relies on @payloadcms/ui runtime hooks whose
// exact generic signatures vary across patch versions. Runtime verified live.
/*
 * HUMAIN AI Deck Assist — agent-driven deck creation INSIDE the Payload admin.
 * Describe the presentation and the agent builds it (title, subtitle, themed
 * slide deck) and fills every field. Mirrors AiSiteAssist (websites); the deck
 * engine is apps/ai-service/src/deck.ts via /api/deck.
 */
import * as React from 'react'
import { useForm } from '@payloadcms/ui'

const AiDeckAssist: React.FC = () => {
  const { dispatchFields } = useForm()
  const [prompt, setPrompt] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [msg, setMsg] = React.useState<{ k: 'ok' | 'err'; t: string } | null>(null)

  async function build() {
    if (busy || !prompt.trim()) return
    setBusy(true)
    setMsg({ k: 'ok', t: 'Building the deck with the agent — this can take up to a minute…' })
    try {
      const res = await fetch('/api/deck', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      })
      const gen = await res.json().catch(() => ({}))
      if (!res.ok || !Array.isArray(gen?.slides) || !gen.slides.length) {
        setMsg({ k: 'err', t: gen?.error || gen?.message || `Deck build failed (${res.status})` })
        setBusy(false)
        return
      }
      const set = (path: string, value: unknown) => dispatchFields({ type: 'UPDATE', path, value })
      set('title', gen.title || 'Untitled deck')
      if (gen.subtitle) set('subtitle', gen.subtitle)
      set('prompt', prompt.trim())
      if (gen.theme) set('theme', gen.theme)
      if (gen.outline) set('outline', gen.outline)
      set('slides', gen.slides)
      set('status', 'ready')
      setMsg({ k: 'ok', t: `Built "${gen.title}" — ${gen.slides.length} slides. Review below, then Save.` })
    } catch {
      setMsg({ k: 'err', t: 'Network error contacting the AI service.' })
    }
    setBusy(false)
  }

  return (
    <div className="hc-ai">
      <div className="hc-ai__title">✨ Build this deck with AI</div>
      <div className="hc-ai__sub">
        Describe the presentation and the agent builds the whole themed slide deck, filling every
        field below. Review and save — nothing is shared until you do.
      </div>
      <div className="hc-ai__row">
        <textarea
          className="hc-ai__input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) build() }}
          placeholder={`e.g. A 10-slide investor pitch for HUMAIN's sovereign AI platform — problem, solution, market, traction, ask…`}
          rows={2}
        />
        <button className="hc-ai__btn" onClick={build} disabled={busy || !prompt.trim()}>
          {busy ? 'Building…' : 'Build deck'}
        </button>
      </div>
      {msg && <div className={`hc-ai__msg hc-ai__msg--${msg.k}`}>{msg.t}</div>}
    </div>
  )
}

export default AiDeckAssist
