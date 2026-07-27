"use client";
import { useEffect, useMemo, useState } from "react";
import {
  AppShellCard,
  Badge,
  Button,
  Dialog,
  EmptyState,
  Field,
  Input,
  Select,
  SelectItem,
  Separator,
  Textarea,
} from "@humain/ui";
import { Blocks, ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";

/* =============================================================================
   Library Page Builder.

   Migrated onto @humain/ui per adoption.md §4 and the package skill:
     <select>            -> Select + SelectItem (flat API)
     <input>/<textarea>  -> Input / Textarea in Field
     <button> x9 + minis -> Button / icon Buttons with aria-labels
     source pills        -> Badge with semantic colour
     hand-rolled overlay -> Dialog (the library picker)
     bordered tiles      -> outline Buttons, NOT Card: these sit inside an
                            AppShellCard and the skill is explicit that a Card
                            inside a Card is never correct

   Behaviour untouched: compose/save/publish endpoints, the delegation summary,
   block CRUD and reordering, library add, and the approval-gated publish path.
   ============================================================================= */

type Block = { id?: string; kind: string; brief?: string; html: string; componentKey?: string | null; componentSource?: string };
type LibComp = { id: string; name: string; key: string; type: string; status: string; html: string };
type Item = { id: string; title: string; contentType: string; status: string; blocks: number; updatedAt: string };

const TYPES = [{ v: "page", l: "Page" }, { v: "blog", l: "Blog" }, { v: "post", l: "Post" }, { v: "article", l: "Article" }, { v: "pressRelease", l: "Press Release" }, { v: "webinar", l: "Webinar" }, { v: "event", l: "Event" }];
const sourceBadge = (b: Block): { t: string; color: "success" | "warning" | "secondary" } =>
  b.componentSource === "library" ? { t: `Reused · ${b.componentKey}`, color: "success" }
  : b.componentSource === "delegated" ? { t: `AI-delegated · ${b.componentKey || ""}`, color: "warning" }
  : { t: "Generated", color: "secondary" };

function assemble(blocks: Block[]): string {
  return `<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#fff}img{max-width:100%}</style></head><body>${blocks.map((b) => b.html).join("\n")}</body></html>`;
}

export default function PageStudio() {
  const [contentType, setContentType] = useState("page");
  const [prompt, setPrompt] = useState("");
  const [id, setId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [brand, setBrand] = useState<any>({});
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [lib, setLib] = useState<LibComp[]>([]);
  const [picker, setPicker] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [delegation, setDelegation] = useState<any>(null);

  async function loadList() { try { const d = await fetch("/api/page").then((r) => r.json()); setItems(d.items || []); } catch {} }
  useEffect(() => { loadList(); fetch("/api/components").then((r) => r.json()).then((j) => setLib((j.docs || []).filter((c: any) => c.status === "live").map((c: any) => ({ id: c.id, name: c.name, key: c.key, type: c.type, status: c.status, html: c.html || "" })))).catch(() => {}); }, []);

  async function generate() {
    if (!prompt.trim()) { setMsg("Describe the content first."); return; }
    setBusy("gen"); setMsg("Composing from the component library…"); setDelegation(null);
    try {
      const d = await fetch("/api/page", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt, contentType }) }).then((r) => r.json());
      if (!d?.ok) { setMsg(d?.error || "Generation failed"); return; }
      setId(d.id); setTitle(d.title); setBlocks(d.blocks || []); setBrand(d.brand || {}); setDelegation(d.delegation); setMsg("");
      loadList();
    } catch { setMsg("Generation failed."); } finally { setBusy(""); }
  }
  async function load(it: Item) {
    setBusy("load");
    try { const d = await fetch(`/api/page/${it.id}`).then((r) => r.json()); setId(d.id); setTitle(d.title); setBlocks(d.blocks || []); setBrand(d.brand || {}); setContentType(d.contentType || "page"); setMsg(""); } catch {} finally { setBusy(""); }
  }
  async function save() {
    if (!id) return; setBusy("save"); setMsg("Saving…");
    try { const r = await fetch(`/api/page/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ blocks, title, brand }) }); setMsg(r.ok ? "Saved." : "Save failed."); loadList(); } catch { setMsg("Save failed."); } finally { setBusy(""); }
  }
  async function publish() {
    if (!id) return; setBusy("pub"); await save();
    try {
      const r = await fetch(`/api/page/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "published" }) });
      if (r.ok) setMsg("Published ✓");
      else setMsg("Sent for approval — a Brand Manager/Admin publishes it (Flow A/B). It's in the Review Queue.");
    } catch { setMsg("Publish failed."); } finally { setBusy(""); loadList(); }
  }

  const move = (i: number, d: number) => setBlocks((b) => { const n = [...b]; const j = i + d; if (j < 0 || j >= n.length) return b; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const del = (i: number) => setBlocks((b) => b.filter((_, k) => k !== i));
  const editBlock = (i: number, html: string) => setBlocks((b) => b.map((x, k) => (k === i ? { ...x, html } : x)));
  const addFromLib = (c: LibComp) => { setBlocks((b) => [...b, { kind: c.type, html: c.html, componentKey: c.key, componentSource: "library" }]); setPicker(false); };

  const previewDoc = useMemo(() => assemble(blocks), [blocks]);

  return (
    <AppShellCard>
      <AppShellCard.Toolbar>
        <AppShellCard.Header>
          <AppShellCard.Title>Library Page Builder</AppShellCard.Title>
          <AppShellCard.Subtitle>
            Generate a page, blog or post composed from your component library — the builder reuses
            live components and delegates any gaps to the Component Agent. Then reorder, edit, add or
            remove blocks and publish through the approval flow.
          </AppShellCard.Subtitle>
        </AppShellCard.Header>
        {blocks.length > 0 && (
          <AppShellCard.Actions>
            <Button appearance="outline" variant="secondary" disabled={!!busy} onClick={save}>Save</Button>
            <Button loading={busy === "pub"} disabled={!!busy} onClick={publish}>Publish</Button>
          </AppShellCard.Actions>
        )}
      </AppShellCard.Toolbar>

      {/* Compose */}
      <div className="flex flex-wrap items-end gap-3">
        <Field>
          <Field.Label>Type</Field.Label>
          <Select value={contentType} onValueChange={setContentType}>
            {TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}
          </Select>
        </Field>
        <Field className="min-w-64 flex-1">
          <Field.Label>Brief</Field.Label>
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
            placeholder={`Describe the ${contentType} to compose…`}
          />
        </Field>
        <Button loading={busy === "gen"} disabled={!!busy} onClick={generate}>
          {busy === "gen" ? "Composing…" : "Compose from library"}
        </Button>
        {msg && <span className="text-sm text-secondary-foreground">{msg}</span>}
      </div>

      {delegation && (
        <div className="mt-2 text-sm text-secondary-foreground">
          Reused <b className="text-success">{delegation.reused?.length || 0}</b> live component(s) ·{" "}
          <b className="text-warning">{delegation.created?.length || 0}</b> new component(s) delegated
          {delegation.gated ? " (draft, pending approval)" : ""}.
        </div>
      )}

      {blocks.length > 0 && (
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
          {/* Blocks */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Field className="flex-1">
                <Field.Label>Title</Field.Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <Badge variant="soft" color="secondary" size="sm" className="mt-6">{blocks.length} blocks</Badge>
            </div>

            <div className="grid max-h-96 gap-3 overflow-auto">
              {blocks.map((b, i) => {
                const sb = sourceBadge(b);
                return (
                  <div key={i}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold capitalize text-foreground">{b.kind}</span>
                      <Badge variant="soft" color={sb.color} size="xs">{sb.t}</Badge>
                      <span className="ms-auto flex gap-1">
                        <Button appearance="ghost" variant="secondary" size="icon-xs" aria-label="Move block up" title="Move up" onClick={() => move(i, -1)}>
                          <ChevronUp className="size-3.5" />
                        </Button>
                        <Button appearance="ghost" variant="secondary" size="icon-xs" aria-label="Move block down" title="Move down" onClick={() => move(i, 1)}>
                          <ChevronDown className="size-3.5" />
                        </Button>
                        <Button appearance="ghost" variant="secondary" size="icon-xs" aria-label="Edit block HTML" title="Edit HTML" onClick={() => setEditing(editing === i ? null : i)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button appearance="ghost" variant="destructive" size="icon-xs" aria-label="Delete block" title="Delete" onClick={() => del(i)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </span>
                    </div>
                    {editing === i ? (
                      <Textarea
                        value={b.html}
                        aria-label={`Block ${i + 1} HTML`}
                        rows={5}
                        className="mt-2 font-mono"
                        onChange={(e) => editBlock(i, e.target.value)}
                      />
                    ) : (
                      <iframe
                        title={`b${i}`}
                        srcDoc={b.html}
                        className="pointer-events-none mt-2 w-full rounded-lg border border-border bg-card"
                        style={{ height: 90 }}
                      />
                    )}
                    <Separator className="mt-3" />
                  </div>
                );
              })}
            </div>

            <Button
              appearance="outline"
              variant="secondary"
              size="sm"
              className="mt-3"
              startIcon={<Plus className="size-4" />}
              onClick={() => setPicker(true)}
            >
              Add block from library
            </Button>
          </div>

          {/* Live preview */}
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">Live preview</div>
            <iframe
              title="preview"
              srcDoc={previewDoc}
              className="w-full rounded-xl border border-border bg-card"
              style={{ height: 520 }}
            />
          </div>
        </div>
      )}

      {/* Existing content */}
      {items.length > 0 && (
        <>
          <Separator className="my-5" label="Your pages / blogs / posts" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((it) => (
              <Button
                key={it.id}
                appearance="outline"
                variant="secondary"
                onClick={() => load(it)}
                aria-label={`Open ${it.title}`}
                className="block h-auto w-full whitespace-normal p-3 text-start"
              >
                <span className="flex items-center justify-between gap-2">
                  <Badge variant="soft" color="primary" size="xs">{it.contentType}</Badge>
                  <Badge variant="soft" color={it.status === "published" ? "success" : "warning"} size="xs">{it.status}</Badge>
                </span>
                <span className="mt-1 block truncate text-sm font-semibold text-foreground">{it.title}</span>
                <span className="mt-0.5 block text-xs text-secondary-foreground">{it.blocks} blocks</span>
              </Button>
            ))}
          </div>
        </>
      )}

      {/* Library picker */}
      <Dialog open={picker} onOpenChange={setPicker}>
        <Dialog.Popup size="lg">
          <Dialog.Header>
            <Dialog.Title>Add a live library component</Dialog.Title>
            <Dialog.Description>Only components marked live are available to compose with.</Dialog.Description>
          </Dialog.Header>
          <Dialog.Body>
            {lib.length === 0 ? (
              <EmptyState
                title="No live components yet"
                description="Publish a component in Component Studio and it becomes available here."
                media="featured-icon"
                icon={<Blocks />}
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {lib.map((c) => (
                  <Button
                    key={c.id}
                    appearance="outline"
                    variant="secondary"
                    onClick={() => addFromLib(c)}
                    className="block h-auto w-full p-3 text-start"
                  >
                    <span className="block text-sm font-semibold text-foreground">{c.name}</span>
                    <span className="mt-0.5 block text-xs text-secondary-foreground">{c.type} · {c.key}</span>
                  </Button>
                ))}
              </div>
            )}
          </Dialog.Body>
        </Dialog.Popup>
      </Dialog>
    </AppShellCard>
  );
}
