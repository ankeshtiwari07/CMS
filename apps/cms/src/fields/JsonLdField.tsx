'use client'
// @ts-nocheck — leaf UI component; relies on @payloadcms/ui runtime hooks whose
// exact generic signatures vary across patch versions. Runtime is exercised via
// screenshot verification.
/*
 * HUMAIN JSON-LD field — a self-contained, theme-matching replacement for
 * Payload's default `json` editor. Payload's json field renders a Monaco
 * editor that loads its runtime from cdn.jsdelivr.net, which the admin's CSP
 * (script-src 'self') blocks — so the field collapsed to an empty grey box.
 * This component needs no external asset: a monospace textarea with live JSON
 * validation, wired to the form via useField. Works inside the CMS iframe.
 */
import * as React from 'react'
import { useField, FieldLabel } from '@payloadcms/ui'

type Props = { path: string; field?: { label?: unknown; admin?: { description?: unknown } } }

const stringify = (v: unknown): string => {
  if (v == null || v === '') return ''
  try {
    return typeof v === 'string' ? v : JSON.stringify(v, null, 2)
  } catch {
    return ''
  }
}

const JsonLdField: React.FC<Props> = (props) => {
  const { path, field } = props
  const label = (typeof field?.label === 'string' && field.label) || 'JSON-LD'
  const { value, setValue, showError, errorMessage } = useField<unknown>({ path })

  const [text, setText] = React.useState<string>(() => stringify(value))
  const [localErr, setLocalErr] = React.useState<string | null>(null)

  // Keep the textarea in sync when the value changes from outside (e.g. the AI
  // assistant fills fields, or a version is loaded) — but never clobber text
  // the user is actively editing if it already parses to the same value.
  React.useEffect(() => {
    setText((cur) => {
      try {
        const curParsed = cur.trim() ? JSON.parse(cur) : null
        if (JSON.stringify(curParsed) === JSON.stringify(value ?? null)) return cur
      } catch {
        /* current text is mid-edit / invalid — fall through to refresh only if empty */
        if (cur.trim()) return cur
      }
      return stringify(value)
    })
  }, [value])

  const onChange = (t: string) => {
    setText(t)
    if (!t.trim()) {
      setLocalErr(null)
      setValue(null)
      return
    }
    try {
      const parsed = JSON.parse(t)
      setLocalErr(null)
      setValue(parsed)
    } catch {
      setLocalErr('Invalid JSON — fix the syntax to save.')
    }
  }

  const err = localErr || (showError ? (errorMessage as string) : null)

  return (
    <div className="field-type json hc-jsonld">
      <FieldLabel label={label} path={path} />
      <textarea
        className="hc-jsonld__area"
        value={text}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "Article"\n}'}
      />
      {err ? (
        <div className="hc-jsonld__err">{err}</div>
      ) : (
        <div className="hc-jsonld__hint">Structured data (schema.org). Leave blank to omit.</div>
      )}
    </div>
  )
}

export default JsonLdField
