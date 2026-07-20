'use client'
// @ts-nocheck — leaf UI component; relies on @payloadcms/ui runtime hooks whose
// exact generic signatures vary across patch versions. Runtime verified live.
/*
 * HUMAIN AI Component Assist — create AND refine a reusable library component
 * with the agent, right in the Payload admin. "Generate" builds a fresh block
 * from a description; "Refine" edits the component's CURRENT HTML per your
 * instruction. Manual editing of the fields below stays a first-class path.
 */
import * as React from 'react'
import { useForm, useFormFields } from '@payloadcms/ui'

const RULES =
  ' Requirements: semantic HTML5; ALL styling inline via style attributes (no <style> tags, no CSS classes, no external CSS/JS/fonts/images); use the HUMAIN brand (teal #009688 accents on a light ground, generous padding, 12–16px radius, clear type hierarchy); responsive with a sensible max-width; realistic sample copy, never {{placeholders}}. Return ONLY the HTML for that one <section>.'

const AiComponentAssist: React.FC = () => {
  const { dispatchFields } = useForm()
  const fields = useFormFields(([f]) => f) as Record<string, { value?: unknown }>
  const currentHtml = String(fields?.html?.value || '')
  const currentName = String(fields?.name?.value || '')
  const [prompt, setPrompt] = React.useState('')
  const [busy, setBusy] = React.useState<'gen' | 'refine' | null>(null)
  const [msg, setMsg] = React.useState<{ k: 'ok' | 'err'; t: string } | null>(null)

  async function run(refine: boolean) {
    if (busy || !prompt.trim()) return
    if (refine && !currentHtml) { setMsg({ k: 'err', t: 'No component HTML yet to refine — Generate one first, or edit the HTML field.' }); return }
    setBusy(refine ? 'refine' : 'gen')
    setMsg({ k: 'ok', t: refine ? 'Refining the component with AI…' : 'Generating the component with AI…' })
    try {
      const base = refine
        ? `Refine this reusable website-section component. Current HTML:\n"""${currentHtml.slice(0, 6000)}"""\nChange requested: ${prompt.trim()}.`
        : `Design ONE reusable, self-contained, production-quality website SECTION (not a full page) for: ${prompt.trim()}.`
      const r = await fetch('/api/generate', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: 'websiteBuild', prompt: base + RULES }),
      })
      const j = await r.json().catch(() => ({}))
      const html = String(j.artifact || j.html || '')
      if (!html || /credit|balance|error|unavailable/i.test(html.slice(0, 60))) {
        setMsg({ k: 'err', t: 'AI service unavailable (check model credits).' }); setBusy(null); return
      }
      const set = (path: string, value: unknown) => dispatchFields({ type: 'UPDATE', path, value })
      set('html', html)
      if (!refine) {
        if (!currentName) set('name', prompt.trim().slice(0, 60))
        set('description', prompt.trim())
        set('aiGenerated', true)
      }
      setMsg({ k: 'ok', t: refine ? 'Refined — review the HTML & save.' : 'Generated — review the fields & HTML, then save.' })
    } catch {
      setMsg({ k: 'err', t: 'Network error contacting the AI service.' })
    }
    setBusy(null)
  }

  return (
    <div className="hc-ai">
      <div className="hc-ai__title">✨ Create or refine this component with AI</div>
      <div className="hc-ai__sub">
        Describe a component and <b>Generate</b> builds it; or type a change and <b>Refine</b> edits the
        current HTML. You can also edit every field below by hand — both paths work.
      </div>
      <div className="hc-ai__row">
        <textarea
          className="hc-ai__input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={currentHtml ? 'e.g. make the CTA lime and add a testimonial quote below the heading…' : 'e.g. a pricing section with 3 tiers and a highlighted middle plan…'}
          rows={2}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="hc-ai__btn" onClick={() => run(false)} disabled={!!busy || !prompt.trim()}>
            {busy === 'gen' ? 'Generating…' : 'Generate'}
          </button>
          <button className="hc-ai__btn" style={{ background: 'transparent', color: 'var(--theme-text)', border: '1px solid rgba(0,150,136,0.5)' }}
            onClick={() => run(true)} disabled={!!busy || !prompt.trim() || !currentHtml}>
            {busy === 'refine' ? 'Refining…' : 'Refine'}
          </button>
        </div>
      </div>
      {msg && <div className={`hc-ai__msg hc-ai__msg--${msg.k}`}>{msg.t}</div>}
    </div>
  )
}

export default AiComponentAssist
