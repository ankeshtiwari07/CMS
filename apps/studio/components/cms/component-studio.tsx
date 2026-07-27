"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AppShellCard,
  Badge,
  Button,
  Dialog,
  EmptyState,
  Field,
  Input,
  Select,
  SelectItem,
  Textarea,
} from "@humain/ui";
import { Check, Globe, Layers, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { standaloneDocCss } from "@humain/design-tokens";

/* =============================================================================
   Component Studio — drag blocks onto a canvas, or generate one with AI.

   Migrated onto @humain/ui per adoption.md §4 and the package skill:
     <button> x11 + minis -> Button / icon Buttons with aria-labels
     <input>/<textarea>/<select> -> Input / Textarea / Select in Field
     hand-rolled overlay  -> Dialog
     toast div            -> Alert
     status + type pills  -> Badge
     empty canvas / empty library -> EmptyState
     bordered tiles       -> outline Buttons, not Card (no Card inside a Card)

   The --hc-* wrapper is gone: it aliased Foundation vars, but the surface now
   sits in an AppShellCard which already owns the canvas.

   Drag-and-drop is unchanged (draggable + dataTransfer), as are every endpoint,
   the AI generation flow and the approval-gated save.

   pageDoc() keeps standaloneDocCss and literal values on purpose: an
   <iframe srcDoc> is a separate document that inherits none of the host's custom
   properties, so tokens must be declared inside it.
   ============================================================================= */

type Comp = { id: string | number; name: string; key?: string; type: string; category?: string; status: string; html?: string; description?: string };
type Block = { uid: string; comp: Comp };

const TYPES = ["container", "section", "hero", "text", "image", "gallery", "card", "feature", "cta", "testimonial", "stats", "logoCloud", "pricing", "faq", "nav", "footer", "form", "banner"];

// Humanize a stored key for display (VALUE stays the raw key so saves don't break).
const TYPE_LABELS: Record<string, string> = { logoCloud: "Logo cloud", cta: "Call to action", faq: "FAQ", cms: "CMS" };
const titleCase = (s: string) => TYPE_LABELS[s] ?? String(s || "").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

// A neutral wrapper so bare component markup renders reasonably in the canvas.
// NOTE: this is an `<iframe srcDoc>` — a separate document that inherits none of
// the host page's custom properties, so the tokens have to be declared inside it
// (standaloneDocCss). Never reference a host var here; it silently resolves to
// nothing. The preview always renders light, matching the published site.
function pageDoc(html: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
${standaloneDocCss}
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:var(--foreground);background:var(--background);-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}
section,header,footer{padding:32px}
h1,h2,h3{margin:0 0 .35em;line-height:1.2}
p{margin:0;color:var(--text-muted);line-height:1.6}
a{color:var(--primary)}
.features{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:1040px;margin:0 auto}
.features .card{background:var(--soft-bg);border:1px solid var(--hairline);border-radius:14px;padding:22px}
.features .card i{display:inline-flex;width:40px;height:40px;align-items:center;justify-content:center;border-radius:11px;background:color-mix(in srgb, var(--primary) 14%, var(--background));color:var(--primary);font-style:normal;font-size:19px;margin-bottom:12px}
.features .card h3{font-size:16px}
.features .card p{font-size:14px}
.cta-band{background:var(--primary);color:var(--primary-foreground);border-radius:16px;text-align:center;display:grid;gap:16px;place-items:center;padding:44px;max-width:1040px;margin:0 auto}
.cta-band h2{color:var(--primary-foreground);font-size:25px}
.cta-band a{display:inline-block;background:var(--primary-foreground);color:var(--primary);padding:11px 22px;border-radius:10px;font-weight:700;text-decoration:none}
.hero-split{display:grid;grid-template-columns:1fr 1fr;gap:30px;align-items:center;max-width:1040px;margin:0 auto}
.hero-split h1{font-size:32px}
.hero-split .copy p{margin-bottom:20px;font-size:16px}
.hero-split .copy a{display:inline-block;background:var(--primary);color:var(--primary-foreground);padding:11px 22px;border-radius:10px;font-weight:700;text-decoration:none}
.hero-split .media img{width:100%;border-radius:16px}
@media(max-width:680px){.features{grid-template-columns:1fr}.hero-split{grid-template-columns:1fr}}
</style></head><body>${html}</body></html>`;
}

// Sample data used to PREVIEW component templates ({{field}} / {{#each items}})
// as neat visual blocks on the canvas instead of raw Handlebars source.
const SAMPLE_ITEMS = [
  { icon: "✦", title: "Fast & reliable", body: "Ship on-brand pages in minutes with reusable, governed components." },
  { icon: "◆", title: "AI-assisted", body: "Generate a section from a prompt, then review and publish with confidence." },
  { icon: "●", title: "Multilingual", body: "Author once in English or Arabic and localise across every market." },
];
const SAMPLE: Record<string, string> = {
  title: "Build on-brand pages, faster",
  headline: "Create with HUMAIN",
  subhead: "A governed content studio for teams that move fast.",
  body: "Short, descriptive copy that explains the value in a line or two.",
  label: "Get started", ctaLabel: "Get started", href: "#", ctaHref: "#", icon: "✦",
  image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='520'%3E%3Crect width='800' height='520' fill='%23d9efeb'/%3E%3Crect x='56' y='56' width='688' height='408' rx='18' fill='%23bfe3dc'/%3E%3C/svg%3E",
};
// Minimal, dependency-free Handlebars-ish renderer: expands {{#each items}}...{{/each}}
// with SAMPLE_ITEMS, then fills remaining {{field}} tokens from SAMPLE. Plain HTML
// (e.g. AI-generated inline-styled sections) passes through untouched.
function renderTemplate(html?: string): string {
  if (!html) return "";
  let out = html.replace(/\{\{#each\s+\w+\}\}([\s\S]*?)\{\{\/each\}\}/g, (_m, inner) =>
    SAMPLE_ITEMS.map((it: any) => inner.replace(/\{\{\s*(\w+)\s*\}\}/g, (_x: string, k: string) => it[k] ?? SAMPLE[k] ?? "")).join(""));
  out = out.replace(/\{\{\s*(\w+)\s*\}\}/g, (_x: string, k: string) => SAMPLE[k] ?? "");
  return out;
}

export default function ComponentStudio({ user, canPublish }: { user: { name?: string; email: string; roles?: string[] }; canPublish: boolean }) {
  const [lib, setLib] = useState<Comp[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [filter, setFilter] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", type: "section", status: "live", html: "", description: "" });
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);
  function startEdit(c: any) { setFormErr(null); setEditingId(c.id); setForm({ name: c.name || "", type: c.type || "section", status: c.status || "live", html: c.html || "", description: c.description || "" }); setShowNew(true); }
  const [aiPrompt, setAiPrompt] = useState("");
  const uidRef = useRef(0);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2600); };

  async function loadLib() {
    try { const r = await fetch("/api/components"); const j = await r.json(); setLib((j.docs || []).map((d: any) => ({ id: d.id, name: d.name, key: d.key, type: d.type, category: d.category, status: d.status, html: d.html, description: d.description }))); } catch {}
  }
  useEffect(() => { loadLib(); }, []);

  const shown = useMemo(() => lib.filter((c) => !filter || (c.name + c.type + (c.category || "")).toLowerCase().includes(filter.toLowerCase())), [lib, filter]);
  const assembled = useMemo(() => blocks.map((b) => renderTemplate(b.comp.html) || `<!-- ${b.comp.name} -->`).join("\n"), [blocks]);

  const addBlock = (c: Comp) => setBlocks((b) => [...b, { uid: `b${uidRef.current++}`, comp: c }]);
  const move = (i: number, d: number) => setBlocks((b) => { const n = [...b]; const j = i + d; if (j < 0 || j >= n.length) return b; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const remove = (uid: string) => setBlocks((b) => b.filter((x) => x.uid !== uid));

  // AI: generate a component's HTML from a description, then open the save form.
  async function aiGenerate(prompt: string) {
    if (!prompt.trim() || busy) return;
    setBusy(true); flash("Generating component with AI…");
    try {
      const r = await fetch("/api/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "websiteBuild", prompt: `Design ONE reusable, self-contained, production-quality website section (not a full page) for: ${prompt}. Requirements: semantic HTML5; ALL styling inline via style attributes (no <style> tags, no CSS classes, no external CSS/JS/fonts/images); use the HUMAIN brand — teal #009688 primary accents on a light background, generous padding, rounded corners (12–16px), and a clear type hierarchy; make it responsive with a sensible max-width and flexible layout; fill it with realistic sample copy (never leave {{placeholders}}). Return ONLY the HTML for that one <section>.` }) });
      const j = await r.json();
      const html = String(j.artifact || "").trim();
      if (!html || /credit|balance|error/i.test(html.slice(0, 60))) { flash("AI unavailable (check model credits)"); setBusy(false); return; }
      setForm({ name: prompt.slice(0, 40), type: "section", status: "live", html, description: prompt });
      setShowNew(true); setAiPrompt("");
    } catch { flash("Generation failed"); }
    setBusy(false);
  }

  async function saveComponent() {
    setFormErr(null);
    if (!form.name.trim()) { setFormErr("Name is required."); return; }
    if (!form.html.trim()) { setFormErr("HTML is required."); return; }
    setBusy(true);
    try {
      const r = await fetch(editingId ? `/api/components/${editingId}` : "/api/components", { method: editingId ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      if (r.ok) { flash(editingId ? "Component updated" : "Component saved to the library"); setFormErr(null); setShowNew(false); setEditingId(null); setForm({ name: "", type: "section", status: "live", html: "", description: "" }); await loadLib(); }
      else { const e = await r.json().catch(() => ({})); setFormErr(e.error || "Could not save — please try again."); }
    } catch { setFormErr("Could not save — please try again."); }
    setBusy(false);
  }

  function downloadPage() {
    const blob = new Blob([pageDoc(assembled)], { type: "text/html" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "humain-page.html"; a.click();
    flash("Downloaded page HTML");
  }
  function previewPage() {
    const w = window.open("", "_blank"); if (w) { w.document.write(pageDoc(assembled)); w.document.close(); }
  }

  const isAdmin = (user.roles || []).includes("admin");
  return (
    <AppShellCard bodyPadding="none">
      <AppShellCard.Toolbar>
        <AppShellCard.Header>
          <AppShellCard.Title>Component Studio</AppShellCard.Title>
          <AppShellCard.Subtitle>Drag blocks onto the canvas — or generate one with AI.</AppShellCard.Subtitle>
        </AppShellCard.Header>
        <AppShellCard.Actions>
          <Button appearance="outline" variant="secondary" disabled={!blocks.length} onClick={previewPage}>Preview</Button>
          <Button appearance="outline" variant="secondary" disabled={!blocks.length} onClick={downloadPage}>Download</Button>
        </AppShellCard.Actions>
      </AppShellCard.Toolbar>

      {toast && (
        <div className="px-6 pt-4">
          <Alert variant="success">{toast}</Alert>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* LEFT — library palette */}
        <aside className="flex w-72 shrink-0 flex-col gap-2.5 border-e border-border p-4" aria-label="Component library">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Component Library</span>
            {isAdmin && (
              <Button
                size="sm"
                startIcon={<Plus className="size-4" />}
                onClick={() => { setFormErr(null); setEditingId(null); setForm({ name: "", type: "section", status: "live", html: "", description: "" }); setShowNew(true); }}
              >
                New
              </Button>
            )}
          </div>

          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search components…"
            aria-label="Search components"
            size="sm"
          />

          {isAdmin && (
            <div className="flex gap-1.5">
              <Input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && aiGenerate(aiPrompt)}
                placeholder="Generate a component with AI…"
                aria-label="Generate a component with AI"
                size="sm"
                className="flex-1"
              />
              <Button
                size="icon-sm"
                disabled={busy || !aiPrompt.trim()}
                aria-label="Generate with AI"
                title="Generate with AI"
                onClick={() => aiGenerate(aiPrompt)}
              >
                <Sparkles className="size-4" />
              </Button>
            </div>
          )}

          <div className="grid min-h-0 flex-1 content-start gap-2 overflow-y-auto pe-1">
            {shown.length === 0 && (
              <EmptyState
                title="No components yet"
                description="Create one with New, or generate one with AI."
                media="featured-icon"
                icon={<Layers />}
                size="sm"
              />
            )}
            {shown.map((c) => (
              <Button
                key={c.id}
                appearance="outline"
                variant="secondary"
                draggable
                onDragStart={(e: React.DragEvent<HTMLButtonElement>) => e.dataTransfer.setData("text/plain", String(c.id))}
                onClick={() => addBlock(c)}
                title="Drag onto the canvas, or click to add"
                className="block h-auto w-full cursor-grab p-3 text-start"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">{c.name}</span>
                  <Badge variant="soft" color={c.status === "live" ? "success" : "warning"} size="xs">{c.status}</Badge>
                </span>
                <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge variant="soft" color="primary" size="xs">{c.type}</Badge>
                  {c.category && <Badge variant="outline" color="secondary" size="xs">{c.category}</Badge>}
                </span>
              </Button>
            ))}
          </div>

          {isAdmin && shown.length > 0 && (
            <div className="text-xs text-secondary-foreground">Tip: use Edit on a component from the canvas header.</div>
          )}
        </aside>

        {/* CENTER — page canvas */}
        <section
          className="min-w-0 flex-1 overflow-y-auto p-4"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const id = e.dataTransfer.getData("text/plain"); const c = lib.find((x) => String(x.id) === id); if (c) addBlock(c); }}
        >
          {blocks.length === 0 ? (
            <div className={dragOver ? "rounded-2xl border-2 border-dashed border-primary p-6" : "rounded-2xl border-2 border-dashed border-border p-6"}>
              <EmptyState
                title="Build a page"
                description="Drag components from the left, or click one to add it here."
                media="featured-icon"
                icon={<Globe />}
              />
            </div>
          ) : (
            <div className="mx-auto grid max-w-5xl gap-3">
              {blocks.map((b, i) => (
                <div key={b.uid} className="overflow-hidden rounded-xl border border-border">
                  <div className="flex items-center gap-2 border-b border-border bg-muted px-3 py-2">
                    <Layers className="size-3.5 text-primary" />
                    <span className="text-sm font-semibold text-foreground">{b.comp.name}</span>
                    <Badge variant="soft" color="primary" size="xs">{b.comp.type}</Badge>
                    <span className="ms-auto flex gap-1">
                      {isAdmin && (
                        <Button appearance="ghost" variant="secondary" size="icon-xs" aria-label={`Edit ${b.comp.name}`} title="Edit component" onClick={() => startEdit(b.comp)}>
                          <Pencil className="size-3.5" />
                        </Button>
                      )}
                      <Button appearance="ghost" variant="secondary" size="icon-xs" disabled={i === 0} aria-label="Move block up" title="Move up" onClick={() => move(i, -1)}>
                        <span aria-hidden>↑</span>
                      </Button>
                      <Button appearance="ghost" variant="secondary" size="icon-xs" disabled={i === blocks.length - 1} aria-label="Move block down" title="Move down" onClick={() => move(i, 1)}>
                        <span aria-hidden>↓</span>
                      </Button>
                      <Button appearance="ghost" variant="destructive" size="icon-xs" aria-label={`Remove ${b.comp.name}`} title="Remove" onClick={() => remove(b.uid)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </span>
                  </div>
                  <iframe
                    title={b.comp.name}
                    srcDoc={pageDoc(renderTemplate(b.comp.html) || `<section style="padding:40px;text-align:center">${b.comp.name} — no HTML yet</section>`)}
                    className="block w-full border-0 bg-card"
                    style={{ height: 240 }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* New / edit / AI-review component */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <Dialog.Popup size="lg">
          <Dialog.Header>
            <Dialog.Title>{editingId ? "Edit component" : form.html ? "Review & save component" : "New component"}</Dialog.Title>
            <Dialog.Description>Components marked live become available to the page builders.</Dialog.Description>
          </Dialog.Header>
          <Dialog.Body>
            <div className="grid gap-3">
              <Field>
                <Field.Label>Name</Field.Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </Field>
              <div className="flex gap-3">
                <Field className="flex-1">
                  <Field.Label>Type</Field.Label>
                  <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: String(v) }))}>
                    {TYPES.map((t) => <SelectItem key={t} value={t}>{titleCase(t)}</SelectItem>)}
                  </Select>
                </Field>
                <Field className="flex-1">
                  <Field.Label>Status</Field.Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: String(v) }))}>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </Select>
                </Field>
              </div>
              <Field>
                <Field.Label>HTML</Field.Label>
                <Textarea value={form.html} onChange={(e) => setForm((f) => ({ ...f, html: e.target.value }))} rows={8} className="font-mono" />
              </Field>
              {form.html && (
                <iframe
                  title="preview"
                  srcDoc={pageDoc(renderTemplate(form.html))}
                  className="w-full rounded-lg border border-border bg-card"
                  style={{ height: 180 }}
                />
              )}
              {formErr && (
                <Alert variant="destructive">
                  {formErr}
                  {/approval|review|publish/i.test(formErr) ? <> · <a href="/review" className="underline">Open Review</a></> : null}
                </Alert>
              )}
            </div>
          </Dialog.Body>
          <Dialog.Footer>
            <Button appearance="outline" variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button loading={busy} disabled={busy} startIcon={<Check className="size-4" />} onClick={saveComponent}>
              Save to library
            </Button>
          </Dialog.Footer>
        </Dialog.Popup>
      </Dialog>
    </AppShellCard>
  );
}
