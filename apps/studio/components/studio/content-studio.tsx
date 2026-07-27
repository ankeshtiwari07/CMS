"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  AppShellCard,
  Button,
  DropdownMenu,
  Field,
  Input,
  LoadingIndicator,
  Separator,
  Textarea,
} from "@humain/ui";
import { ArrowLeft, ChevronDown, ChevronUp, Plus, RefreshCw, X } from "lucide-react";

/* =============================================================================
   Content Studio — plan an outline, write it section by section, edit, export.

   Migrated onto @humain/ui per adoption.md §4 and the package skill:
     <button>            -> Button (headers keep two visible; the MD/HTML/DOC
                            exports moved into AppShellCard.Menu)
     <input>/<textarea>  -> Input / Textarea, labelled through Field
     error + toast divs  -> Alert
     hand-rolled spinner -> LoadingIndicator. The old one injected its own
                            @keyframes into the document from inside render.
     bordered section divs -> Separator + spacing (a Card inside a Card is
                            never correct per the skill)

   Behaviour is untouched: same outline/article/section/save endpoints, same
   auto-run from ?prompt=, same markdown renderer, same export blobs and slug.
   ============================================================================= */

type Section = { id: string; heading: string; body: string };
type OutlineItem = { heading: string; intent: string };
const uid = () => `c${Math.random().toString(36).slice(2, 9)}`;

// Tiny markdown -> HTML (headings, bold/italic, code, lists, paragraphs).
function mdToHtml(md: string): string {
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
  const lines = String(md || "").split(/\r?\n/);
  let html = "", listType: "ul" | "ol" | null = null;
  const closeList = () => { if (listType) { html += `</${listType}>`; listType = null; } };
  const inline = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>").replace(/`(.+?)`/g, "<code>$1</code>");
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { closeList(); continue; }
    let m;
    if ((m = line.match(/^(#{1,4})\s+(.*)$/))) { closeList(); const lvl = m[1].length; html += `<h${lvl}>${inline(m[2])}</h${lvl}>`; }
    else if ((m = line.match(/^\s*[-*]\s+(.*)$/))) { if (listType !== "ul") { closeList(); listType = "ul"; html += "<ul>"; } html += `<li>${inline(m[1])}</li>`; }
    else if ((m = line.match(/^\s*\d+\.\s+(.*)$/))) { if (listType !== "ol") { closeList(); listType = "ol"; html += "<ol>"; } html += `<li>${inline(m[1])}</li>`; }
    else { closeList(); html += `<p>${inline(line)}</p>`; }
  }
  closeList();
  return html;
}

export default function ContentStudio({ projectId }: { projectId: string | null }) {
  const urlPrompt = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("prompt") || "" : "";
  const [phase, setPhase] = useState<"prompt" | "outline" | "editor">("prompt");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const [prompt, setPrompt] = useState(urlPrompt);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [preview, setPreview] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(projectId);
  const autoRan = useRef(false);
  const flash = (m: string) => { setNotice(m); setTimeout(() => setNotice(""), 2400); };

  useEffect(() => {
    if (projectId) {
      setBusy("Loading…");
      fetch(`/api/article/${projectId}`).then((r) => r.json()).then((d) => {
        if (d?.sections) { setTitle(d.title || ""); setSubtitle(d.subtitle || ""); setSections(d.sections.map((s: any) => ({ ...s, id: s.id || uid() }))); setPhase("editor"); setSavedId(d.id); setPrompt(d.prompt || ""); }
      }).finally(() => setBusy(""));
    }
  }, [projectId]);

  const genOutline = async () => {
    if (!prompt.trim()) return;
    setErr(""); setBusy("Planning the article…");
    try {
      const r = await fetch("/api/article/outline", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt }) });
      const j = await r.json();
      if (!r.ok || !j.sections) throw new Error(j.error || "Failed to plan");
      setTitle(j.title || prompt); setSubtitle(j.subtitle || ""); setOutline(j.sections); setPhase("outline");
    } catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  };
  useEffect(() => { if (!projectId && prompt.trim() && !autoRan.current) { autoRan.current = true; genOutline(); } /* eslint-disable-next-line */ }, []);

  const genArticle = async (fromOutline: boolean) => {
    setErr(""); setBusy("Writing your article… ~20s");
    try {
      const body: any = { prompt: prompt || title };
      if (fromOutline) body.outline = { title, subtitle, sections: outline };
      const r = await fetch("/api/article", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok || !j.sections) throw new Error(j.error || "Generation failed");
      setTitle(j.title); setSubtitle(j.subtitle || ""); setSections(j.sections.map((s: any) => ({ ...s, id: s.id || uid() }))); setPhase("editor");
    } catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  };

  const upd = (i: number, patch: Partial<Section>) => setSections((ss) => ss.map((s, k) => (k === i ? { ...s, ...patch } : s)));
  const move = (i: number, d: -1 | 1) => setSections((ss) => { const j = i + d; if (j < 0 || j >= ss.length) return ss; const n = [...ss]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const regen = async (i: number) => {
    const s = sections[i]; setBusy(`Rewriting “${s.heading}”…`);
    try { const r = await fetch("/api/article/section", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, section: s }) }); const j = await r.json(); if (j.id) upd(i, { heading: j.heading, body: j.body }); } catch { flash("Regenerate failed"); } finally { setBusy(""); }
  };

  const fullMd = () => `# ${title}\n${subtitle ? `\n_${subtitle}_\n` : ""}\n` + sections.map((s) => `## ${s.heading}\n\n${s.body}`).join("\n\n");
  const fullHtml = () => `<!doctype html><html><head><meta charset="utf-8"><title>${title.replace(/[<>]/g, "")}</title><style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;line-height:1.7;color:#1a1a1a}h1{font-size:34px}h2{margin-top:32px}code{background:#f2f2f2;padding:2px 5px;border-radius:4px}</style></head><body><h1>${title}</h1>${subtitle ? `<p><em>${subtitle}</em></p>` : ""}${sections.map((s) => `<h2>${s.heading}</h2>${mdToHtml(s.body)}`).join("")}</body></html>`;
  const download = (name: string, content: string, mime: string) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([content], { type: mime })); a.download = name; a.click(); };
  const slug = () => (title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "article");
  const save = async () => {
    setBusy("Saving…");
    try { const r = await fetch("/api/article/save", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: savedId, title, subtitle, prompt, sections }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error || "Save failed"); setSavedId(j.id); flash("Saved to Projects"); } catch (e: any) { flash(e.message); } finally { setBusy(""); }
  };


  if (phase === "prompt") {
    return (
      <AppShellCard>
        <AppShellCard.Header>
          <AppShellCard.Title>Write long-form content</AppShellCard.Title>
          <AppShellCard.Subtitle>
            Describe the article, blog or press piece. HUMAIN plans an outline you can edit, writes
            it section by section, and lets you refine, export (MD / HTML / DOC) and save.
          </AppShellCard.Subtitle>
        </AppShellCard.Header>
        <div className="mx-auto max-w-3xl">
          <Field>
            <Field.Label>Brief</Field.Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              placeholder="e.g. A 1,200-word thought-leadership article on sovereign AI for enterprises in the Gulf — audience: CIOs; confident, practical tone."
            />
          </Field>
          {err && <Alert variant="destructive" className="mt-3">{err}</Alert>}
          <div className="mt-5 flex flex-wrap gap-3">
            <Button loading={!!busy} disabled={!!busy || !prompt.trim()} onClick={genOutline}>
              {busy || "Plan outline"}
            </Button>
            <Button
              appearance="outline"
              variant="secondary"
              disabled={!!busy || !prompt.trim()}
              onClick={() => genArticle(false)}
            >
              Skip — write it now
            </Button>
          </div>
        </div>
      </AppShellCard>
    );
  }

  if (phase === "outline") {
    return (
      <AppShellCard>
        <AppShellCard.Header>
          <AppShellCard.Title>Outline</AppShellCard.Title>
          <AppShellCard.Subtitle>Edit, reorder or remove sections before writing.</AppShellCard.Subtitle>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              appearance="outline"
              variant="secondary"
              size="sm"
              startIcon={<ArrowLeft className="size-4" />}
              onClick={() => setPhase("prompt")}
            >
              Back
            </Button>
          </div>
        </AppShellCard.Header>

        <div className="mx-auto max-w-3xl">
          <Field>
            <Field.Label>Title</Field.Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>

          <Separator className="my-4" label="Sections" />

          <div className="grid gap-3">
            {outline.map((o, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="mt-2 w-6 shrink-0 font-bold text-primary">{i + 1}</span>
                <div className="grid flex-1 gap-1.5">
                  <Input
                    value={o.heading}
                    aria-label={`Section ${i + 1} heading`}
                    onChange={(e) => setOutline((os) => os.map((x, k) => (k === i ? { ...x, heading: e.target.value } : x)))}
                  />
                  <Input
                    value={o.intent}
                    size="sm"
                    aria-label={`Section ${i + 1} intent`}
                    placeholder="What this section covers"
                    onChange={(e) => setOutline((os) => os.map((x, k) => (k === i ? { ...x, intent: e.target.value } : x)))}
                  />
                </div>
                <Button
                  appearance="ghost"
                  variant="secondary"
                  size="icon-sm"
                  aria-label={`Remove section ${i + 1}`}
                  onClick={() => setOutline((os) => os.filter((_, k) => k !== i))}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            appearance="outline"
            variant="secondary"
            size="sm"
            className="mt-3"
            startIcon={<Plus className="size-4" />}
            onClick={() => setOutline((os) => [...os, { heading: "New section", intent: "" }])}
          >
            Add section
          </Button>

          {err && <Alert variant="destructive" className="mt-3">{err}</Alert>}

          <div className="mt-5">
            <Button loading={!!busy} disabled={!!busy} onClick={() => genArticle(true)}>
              {busy || `Write ${outline.length} sections`}
            </Button>
          </div>
        </div>
      </AppShellCard>
    );
  }

  // editor
  return (
    <AppShellCard>
      <AppShellCard.Toolbar>
        <AppShellCard.Header>
          <AppShellCard.Title>{title || "Untitled article"}</AppShellCard.Title>
          <AppShellCard.Subtitle>
            {sections.length} section{sections.length === 1 ? "" : "s"} · edit inline, regenerate any
            section, then export or save to Projects.
          </AppShellCard.Subtitle>
          {notice && (
            <div className="mt-3">
              <Alert variant="success">{notice}</Alert>
            </div>
          )}
        </AppShellCard.Header>
        <AppShellCard.Actions>
          <Button appearance="outline" variant="secondary" onClick={() => setPreview((p) => !p)}>
            {preview ? "Edit" : "Preview"}
          </Button>
          <Button loading={!!busy} disabled={!!busy} onClick={save}>
            {savedId ? "Update" : "Save"}
          </Button>
        </AppShellCard.Actions>
        {/* Exports live in the overflow menu — the skill caps a header at two
            visible buttons. */}
        <AppShellCard.Menu>
          <DropdownMenu.Item onClick={() => download(`${slug()}.md`, fullMd(), "text/markdown")}>
            Download Markdown
          </DropdownMenu.Item>
          <DropdownMenu.Item onClick={() => download(`${slug()}.html`, fullHtml(), "text/html")}>
            Download HTML
          </DropdownMenu.Item>
          <DropdownMenu.Item onClick={() => download(`${slug()}.doc`, fullHtml(), "application/msword")}>
            Download DOC
          </DropdownMenu.Item>
        </AppShellCard.Menu>
      </AppShellCard.Toolbar>

      <div className="mx-auto max-w-4xl">
        <Field>
          <Field.Label>Title</Field.Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field className="mt-3">
          <Field.Label>Subtitle / dek (optional)</Field.Label>
          <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </Field>

        {busy && (
          <div className="mt-4 flex items-center gap-2.5 text-sm text-secondary-foreground">
            <LoadingIndicator size="sm" /> {busy}
          </div>
        )}

        <Separator className="my-5" />

        {preview ? (
          <article
            className="hf-richtext text-base leading-relaxed text-foreground"
            dangerouslySetInnerHTML={{
              __html: sections.map((sec) => `<h2>${sec.heading}</h2>${mdToHtml(sec.body)}`).join(""),
            }}
          />
        ) : (
          <div className="grid gap-6">
            {sections.map((sec, i) => (
              <div key={sec.id}>
                <div className="mb-2 flex items-center gap-2">
                  <Input
                    value={sec.heading}
                    aria-label={`Section ${i + 1} heading`}
                    className="flex-1"
                    onChange={(e) => upd(i, { heading: e.target.value })}
                  />
                  <Button
                    appearance="ghost"
                    variant="secondary"
                    size="icon-sm"
                    disabled={!!busy}
                    aria-label="Regenerate section"
                    title="Regenerate"
                    onClick={() => regen(i)}
                  >
                    <RefreshCw className="size-4" />
                  </Button>
                  <Button
                    appearance="ghost"
                    variant="secondary"
                    size="icon-sm"
                    aria-label="Move section up"
                    title="Move up"
                    onClick={() => move(i, -1)}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    appearance="ghost"
                    variant="secondary"
                    size="icon-sm"
                    aria-label="Move section down"
                    title="Move down"
                    onClick={() => move(i, 1)}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button
                    appearance="ghost"
                    variant="destructive"
                    size="icon-sm"
                    aria-label="Remove section"
                    title="Remove"
                    onClick={() => setSections((ss) => ss.filter((_, k) => k !== i))}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                <Textarea
                  value={sec.body}
                  aria-label={`Section ${i + 1} body`}
                  rows={7}
                  onChange={(e) => upd(i, { body: e.target.value })}
                />
              </div>
            ))}
            <Button
              appearance="outline"
              variant="secondary"
              size="sm"
              startIcon={<Plus className="size-4" />}
              onClick={() => setSections((ss) => [...ss, { id: uid(), heading: "New section", body: "" }])}
            >
              Add section
            </Button>
          </div>
        )}
      </div>
    </AppShellCard>
  );
}
