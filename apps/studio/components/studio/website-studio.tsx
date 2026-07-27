"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  AppShellCard,
  Badge,
  Button,
  ButtonGroup,
  DropdownMenu,
  Field,
  Input,
  Separator,
  Textarea,
} from "@humain/ui";
import { ArrowLeft, ChevronDown, ChevronUp, Monitor, RefreshCw, Smartphone, Sparkles, X } from "lucide-react";

/* =============================================================================
   Website Studio — plan sections, generate, edit, publish.

   Migrated onto @humain/ui per adoption.md §4 and the package skill:
     <button> x17        -> Button / ButtonGroup (device toggle)
     <input>/<textarea>  -> Input / Textarea in Field
     notice + published  -> Alert
     bordered rows       -> Separator + spacing (no Card inside a Card)
     header commands     -> two visible (Save, Publish); Preview, Export and
                            Submit-for-review moved into AppShellCard.Menu

   Behaviour untouched: plan/generate/section/publish/PATCH endpoints, the
   ?prompt= auto-run, assemble(), slugify(), the review submission and the D2
   natural-language site edit.

   TWO deliberate exceptions, both flagged rather than faked:
   - <input type="color"> stays native. The package ships no colour picker, and
     the skill says to say so rather than invent one.
   - The generated site's own brand hex values stay literal. They are the
     artifact being produced, not this app's chrome.
   ============================================================================= */

type Brand = { bg: string; ink: string; muted: string; accent: string; accent2: string; line: string; soft: string; font?: string; radius?: number };
type Section = { id: string; kind: string; brief: string; html?: string };
type Plan = { title: string; description?: string; brand: Brand; sections: Section[]; lang?: string; dir?: string; bilingual?: boolean };

const uid = () => `w${Math.random().toString(36).slice(2, 9)}`;
const DEFAULT_FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function assemble(title: string, brand: Brand, sections: Section[]): string {
  const body = sections.map((s) => s.html || "").filter(Boolean).map((h, i) => `<div id="sec-${i}">${h}</div>`).join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${(title || "").replace(/[<>]/g, "")}</title><style>*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}body{background:${brand.bg};color:${brand.ink};font-family:${brand.font || DEFAULT_FONT};line-height:1.55;-webkit-font-smoothing:antialiased}a{color:inherit;text-decoration:none}img{max-width:100%;display:block}details>summary{cursor:pointer;list-style:none}details>summary::-webkit-details-marker{display:none}</style></head><body>${body}</body></html>`;
}
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

export default function WebsiteStudio({ siteId }: { siteId: string | null }) {
  const [phase, setPhase] = useState<"prompt" | "plan" | "editor">("prompt");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const [prompt, setPrompt] = useState(() => (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("prompt") || "" : ""));
  const autoRan = useRef(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [site, setSite] = useState<{ title: string; brand: Brand; sections: Section[]; html: string } | null>(null);
  const [savedId, setSavedId] = useState<string | null>(siteId);
  const [slug, setSlug] = useState("");
  const [publishedPath, setPublishedPath] = useState("");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [aiEdit, setAiEdit] = useState("");
  const flash = (m: string) => { setNotice(m); setTimeout(() => setNotice(""), 2600); };

  useEffect(() => {
    if (!siteId) return;
    setBusy("Loading…");
    fetch(`/api/website/${siteId}`).then((r) => r.json()).then((d) => {
      if (d?.html) { setSite({ title: d.title, brand: d.brand, sections: d.sections || [], html: d.html }); setPrompt(d.prompt || ""); setSlug(d.slug || ""); setSavedId(d.id); setPhase("editor"); if (d.status === "published") setPublishedPath(`/site/${d.slug}`); }
    }).finally(() => setBusy(""));
  }, [siteId]);

  const genPlan = async () => {
    if (!prompt.trim()) return;
    setErr(""); setBusy("Planning the site…");
    try {
      const r = await fetch("/api/website/plan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt }) });
      const j = await r.json();
      if (!r.ok || !j.sections) throw new Error(j.error || "Failed to plan");
      setPlan({ title: j.title, description: j.description, brand: j.brand, lang: j.lang, dir: j.dir, bilingual: j.bilingual, sections: j.sections.map((s: any) => ({ ...s, id: s.id || uid() })) });
      setSlug(slugify(j.title));
      setPhase("plan");
    } catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  };

  // Arrived from the prompt box with ?prompt=... — plan sections automatically.
  useEffect(() => {
    if (!siteId && prompt.trim() && !autoRan.current) { autoRan.current = true; genPlan(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const genSite = async (usePlan: boolean) => {
    setErr(""); setBusy("Designing sections in parallel… ~15s");
    try {
      const body: any = { prompt };
      if (usePlan && plan) body.plan = { title: plan.title, description: plan.description, brand: plan.brand, sections: plan.sections, lang: plan.lang, dir: plan.dir, bilingual: plan.bilingual };
      const r = await fetch("/api/website", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok || !j.html) throw new Error(j.error || "Generation failed");
      setSite({ title: j.title, brand: j.brand, sections: j.sections, html: j.html });
      if (!slug) setSlug(slugify(j.title));
      setPhase("editor");
    } catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  };

  const regenSection = async (i: number) => {
    if (!site) return;
    const sec = site.sections[i];
    setBusy(`Rewriting ${sec.kind}…`);
    try {
      const r = await fetch("/api/website/section", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ siteTitle: site.title, sitePrompt: prompt, brand: site.brand, section: sec }) });
      const j = await r.json();
      if (!r.ok || !j.html) throw new Error(j.error || "Failed");
      const sections = site.sections.map((s, k) => (k === i ? { ...s, html: j.html } : s));
      setSite({ ...site, sections, html: assemble(site.title, site.brand, sections) });
      flash(`Regenerated ${sec.kind}`);
    } catch (e: any) { flash(e.message); } finally { setBusy(""); }
  };
  const removeSection = (i: number) => { if (!site) return; const sections = site.sections.filter((_, k) => k !== i); setSite({ ...site, sections, html: assemble(site.title, site.brand, sections) }); };
  const moveSection = (i: number, d: -1 | 1) => { if (!site) return; const j = i + d; if (j < 0 || j >= site.sections.length) return; const sections = [...site.sections]; [sections[i], sections[j]] = [sections[j], sections[i]]; setSite({ ...site, sections, html: assemble(site.title, site.brand, sections) }); };

  const save = async (publish: boolean) => {
    if (!site) return;
    setBusy(publish ? "Publishing…" : "Saving…");
    try {
      const r = await fetch("/api/website/publish", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: savedId, title: site.title, slug: slug || slugify(site.title), prompt, brand: site.brand, sections: site.sections, html: site.html, status: publish ? "published" : "draft" }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      setSavedId(j.id);
      if (publish) { setPublishedPath(j.path || `/site/${slug}`); flash("Published"); } else flash("Saved to CMS");
    } catch (e: any) { flash(e.message); } finally { setBusy(""); }
  };
  const exportHtml = () => {
    if (!site) return;
    const blob = new Blob([site.html], { type: "text/html" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${slugify(site.title) || "site"}.html`; a.click();
  };
  // Open the assembled site full-screen / standalone in a new tab.
  const preview = () => {
    if (!site) return;
    const w = window.open("", "_blank");
    if (w) { w.document.open(); w.document.write(site.html); w.document.close(); }
  };
  // Submit the site into the governed review flow (In Review → appears in /review).
  const review = async () => {
    if (!site) return;
    setBusy("Submitting for review…");
    try {
      const r = await fetch("/api/website/publish", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: savedId, title: site.title, slug: slug || slugify(site.title), prompt, brand: site.brand, sections: site.sections, html: site.html, status: "in-review" }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      setSavedId(j.id); flash("Sent for review");
    } catch (e: any) { flash(e.message); } finally { setBusy(""); }
  };

  // D2 — edit the EXISTING saved site with a natural-language instruction. The
  // Website Builder agent plans edit ops and regenerates only affected sections.
  const aiEditSite = async () => {
    if (!site || !aiEdit.trim()) return;
    if (!savedId) { flash("Save the site first, then edit it with AI."); return; }
    setErr(""); setBusy("Editing with AI…");
    try {
      const r = await fetch(`/api/website/${savedId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ instruction: aiEdit }) });
      const j = await r.json();
      if (!r.ok || !j.html) throw new Error(j.error || "AI edit failed");
      setSite({ ...site, sections: (j.sections && j.sections.length ? j.sections : site.sections), html: j.html });
      const n = Array.isArray(j.changed) ? j.changed.length : 0;
      flash(n ? `AI updated ${n} section${n > 1 ? "s" : ""}` : "AI applied your edit");
      setAiEdit("");
    } catch (e: any) { flash(e.message); } finally { setBusy(""); }
  };

  const deviceWidth = device === "mobile" ? 390 : undefined;

  if (phase === "prompt") {
    return (
      <AppShellCard>
        <AppShellCard.Header>
          <AppShellCard.Title>Generate a website</AppShellCard.Title>
          <AppShellCard.Subtitle>
            Describe the site. HUMAIN plans the sections, designs each one, assembles a complete
            responsive page, and publishes it to a live URL in the CMS.
          </AppShellCard.Subtitle>
        </AppShellCard.Header>
        <div className="mx-auto max-w-3xl">
          <Field>
            <Field.Label>Brief</Field.Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              placeholder="e.g. The HUMAIN ONE marketing homepage — enterprise AI agents. Hero, 6 agent cards, operational domains, platform, FAQ, footer. Teal + lime, white."
            />
          </Field>
          {err && <Alert variant="destructive" className="mt-3">{err}</Alert>}
          <div className="mt-5 flex flex-wrap gap-3">
            <Button loading={!!busy} disabled={!!busy || !prompt.trim()} onClick={genPlan}>
              {busy || "Plan sections"}
            </Button>
            <Button appearance="outline" variant="secondary" disabled={!!busy || !prompt.trim()} onClick={() => genSite(false)}>
              Skip — generate now
            </Button>
          </div>
        </div>
      </AppShellCard>
    );
  }

  if (phase === "plan" && plan) {
    return (
      <AppShellCard>
        <AppShellCard.Header>
          <AppShellCard.Title>Section plan</AppShellCard.Title>
          <AppShellCard.Subtitle>Edit, reorder or remove sections before generating.</AppShellCard.Subtitle>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button appearance="outline" variant="secondary" size="sm" startIcon={<ArrowLeft className="size-4" />} onClick={() => setPhase("prompt")}>
              Back
            </Button>
          </div>
        </AppShellCard.Header>

        <div className="mx-auto max-w-3xl">
          <Field>
            <Field.Label>Title</Field.Label>
            <Input value={plan.title} onChange={(e) => setPlan({ ...plan, title: e.target.value })} />
          </Field>

          <Separator className="my-4" label="Brand" />
          <div className="flex flex-wrap items-center gap-3">
            {(["bg", "ink", "accent", "accent2"] as const).map((k) => (
              <label key={k} className="flex items-center gap-2 text-xs text-secondary-foreground" title={k}>
                {/* Native colour input: the package ships no colour picker. */}
                <input
                  type="color"
                  aria-label={`Brand ${k}`}
                  value={(plan.brand as any)[k]}
                  onChange={(e) => setPlan({ ...plan, brand: { ...plan.brand, [k]: e.target.value } })}
                  className="size-7 cursor-pointer rounded-md border border-border bg-transparent p-0"
                />
                {k}
              </label>
            ))}
          </div>

          <Separator className="my-4" label="Sections" />
          <div className="grid gap-3">
            {plan.sections.map((sec, i) => (
              <div key={sec.id} className="flex items-center gap-2.5">
                <span className="w-6 shrink-0 font-bold text-primary">{i + 1}</span>
                <Badge variant="soft" color="primary" size="sm">{sec.kind}</Badge>
                <Input
                  value={sec.brief}
                  aria-label={`Section ${i + 1} brief`}
                  className="flex-1"
                  onChange={(e) => setPlan({ ...plan, sections: plan.sections.map((x, k) => (k === i ? { ...x, brief: e.target.value } : x)) })}
                />
                <Button
                  appearance="ghost"
                  variant="secondary"
                  size="icon-sm"
                  aria-label={`Remove section ${i + 1}`}
                  onClick={() => setPlan({ ...plan, sections: plan.sections.filter((_, k) => k !== i) })}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          {err && <Alert variant="destructive" className="mt-3">{err}</Alert>}
          <div className="mt-5">
            <Button loading={!!busy} disabled={!!busy} onClick={() => genSite(true)}>
              {busy || `Generate ${plan.sections.length} sections`}
            </Button>
          </div>
        </div>
      </AppShellCard>
    );
  }

  if (!site) {
    return (
      <AppShellCard>
        <AppShellCard.Header>
          <AppShellCard.Title>Website Studio</AppShellCard.Title>
          <AppShellCard.Subtitle>{busy || "Loading…"}</AppShellCard.Subtitle>
        </AppShellCard.Header>
      </AppShellCard>
    );
  }

  return (
    <AppShellCard bodyPadding="none">
      <AppShellCard.Toolbar>
        <AppShellCard.Header>
          <AppShellCard.Title>{site.title || "Untitled site"}</AppShellCard.Title>
          <AppShellCard.Subtitle>
            {site.sections.length} section{site.sections.length === 1 ? "" : "s"} · regenerate,
            reorder or edit with AI, then publish to /site/{slug || "…"}.
          </AppShellCard.Subtitle>
        </AppShellCard.Header>
        <AppShellCard.Actions>
          <Button appearance="outline" variant="secondary" loading={busy === "Saving…"} disabled={!!busy} onClick={() => save(false)}>
            {savedId ? "Save" : "Save draft"}
          </Button>
          <Button loading={busy === "Publishing…"} disabled={!!busy} onClick={() => save(true)}>Publish</Button>
        </AppShellCard.Actions>
        <AppShellCard.Menu>
          <DropdownMenu.Item onClick={preview}>Open standalone preview</DropdownMenu.Item>
          <DropdownMenu.Item onClick={exportHtml}>Export HTML</DropdownMenu.Item>
          <DropdownMenu.Item disabled={!!busy} onClick={review}>Submit for review</DropdownMenu.Item>
        </AppShellCard.Menu>
      </AppShellCard.Toolbar>

      <div className="border-b border-border px-6 py-4">
        {notice && <Alert variant="success" className="mb-3">{notice}</Alert>}
        {publishedPath && (
          <Alert variant="success" className="mb-3">
            Published — live at{" "}
            <a href={publishedPath} target="_blank" rel="noreferrer" className="font-semibold underline">
              {publishedPath}
            </a>
          </Alert>
        )}

        <div className="flex flex-wrap items-end gap-3">
          <Field className="flex-1 min-w-56">
            <Field.Label>Title</Field.Label>
            <Input value={site.title} onChange={(e) => setSite({ ...site, title: e.target.value })} />
          </Field>
          <Field>
            <Field.Label>Path</Field.Label>
            <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} className="max-w-xs" />
          </Field>
          <ButtonGroup>
            <Button
              appearance={device === "desktop" ? "soft" : "outline"}
              variant={device === "desktop" ? "primary" : "secondary"}
              size="icon-sm"
              aria-label="Desktop preview"
              title="Desktop"
              onClick={() => setDevice("desktop")}
            >
              <Monitor className="size-4" />
            </Button>
            <Button
              appearance={device === "mobile" ? "soft" : "outline"}
              variant={device === "mobile" ? "primary" : "secondary"}
              size="icon-sm"
              aria-label="Mobile preview"
              title="Mobile"
              onClick={() => setDevice("mobile")}
            >
              <Smartphone className="size-4" />
            </Button>
          </ButtonGroup>
        </div>

        {/* D2 — edit the whole site by instruction. */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="soft" color="primary" size="sm">
            <Sparkles className="me-1 inline size-3 align-middle" /> Edit with AI
          </Badge>
          <Input
            value={aiEdit}
            onChange={(e) => setAiEdit(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") aiEditSite(); }}
            aria-label="Describe the change"
            placeholder={savedId ? "e.g. rewrite the hero headline to be punchier and add a testimonials section" : "Save the site first to enable AI editing"}
            disabled={!savedId || !!busy}
            className="min-w-64 flex-1"
          />
          <Button loading={busy === "Editing with AI…"} disabled={!!busy || !savedId || !aiEdit.trim()} onClick={aiEditSite}>
            Apply edit
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-start gap-4 p-6">
        <aside className="w-56 shrink-0 overflow-y-auto" aria-label="Sections">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">Sections</div>
          <div className="grid gap-2">
            {site.sections.map((sec, i) => (
              <div key={sec.id}>
                <div className="text-xs font-semibold text-foreground">{i + 1}. {sec.kind}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Button appearance="ghost" variant="secondary" size="icon-xs" disabled={!!busy} aria-label={`Regenerate ${sec.kind}`} title="Regenerate" onClick={() => regenSection(i)}>
                    <RefreshCw className="size-3.5" />
                  </Button>
                  <Button appearance="ghost" variant="secondary" size="icon-xs" aria-label={`Move ${sec.kind} up`} title="Move up" onClick={() => moveSection(i, -1)}>
                    <ChevronUp className="size-3.5" />
                  </Button>
                  <Button appearance="ghost" variant="secondary" size="icon-xs" aria-label={`Move ${sec.kind} down`} title="Move down" onClick={() => moveSection(i, 1)}>
                    <ChevronDown className="size-3.5" />
                  </Button>
                  <Button appearance="ghost" variant="destructive" size="icon-xs" aria-label={`Remove ${sec.kind}`} title="Remove" onClick={() => removeSection(i)}>
                    <X className="size-3.5" />
                  </Button>
                </div>
                <Separator className="mt-2" />
              </div>
            ))}
          </div>
          {busy && <div className="mt-2 text-xs text-secondary-foreground">{busy}</div>}
        </aside>

        <div className="min-w-0 flex-1">
          <div
            className="mx-auto overflow-hidden rounded-xl border border-border shadow-md"
            style={{ width: deviceWidth, transition: "width .2s" }}
          >
            {/* Height is viewport-relative and off the utility scale. */}
            <iframe title="preview" srcDoc={site.html} className="w-full border-0 bg-card" style={{ height: "calc(100vh - 300px)" }} />
          </div>
        </div>
      </div>
    </AppShellCard>
  );
}
