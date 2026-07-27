"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertDialog,
  AppShellCard,
  Badge,
  Button,
  Dialog,
  EmptyState,
  Field,
  Input,
  Separator,
  Textarea,
} from "@humain/ui";
import { Copy, FileText, Images, Search, Trash2, Upload } from "lucide-react";

/* =============================================================================
   Asset Library (DAM).

   Migrated onto @humain/ui per references/adoption.md §4 (Plain HTML/CSS map):
     <button class="…">          -> Button
     <input type="text">         -> Input (with startIcon)
     <textarea>                  -> Textarea (label as a field prop)
     custom modal (div+overlay)  -> Dialog
     window.confirm()            -> AlertDialog
     hand-rolled tile chrome     -> Card
     hand-rolled "no assets" row -> EmptyState  (organisms.md is explicit:
                                    prefer EmptyState for non-chat product
                                    empty states)

   Behaviour is unchanged: same endpoints, same upload loop and progress
   message, same alt-text PATCH with its dirty check, same delete, same search
   filter, same rendition list and clipboard copy.

   The clickable tile is an outline Button, NOT a Card: it sits inside an
   AppShellCard and the skill is explicit that a Card nested in a Card is never
   correct. Button also gives real semantics (focus ring, Enter/Space) that a div
   with onClick would not.
   ============================================================================= */

type Rendition = { name: string; url: string; width?: number; height?: number; filesize?: number };
type Asset = {
  id: string | number; filename: string; url: string; mimeType: string; filesize: number;
  width?: number; height?: number; alt?: string; usageRights?: string; aiGenerated?: boolean; createdAt?: string; sizes: Rendition[];
};

const kb = (n?: number) => (n == null ? "—" : n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`);
const isImg = (m?: string) => (m || "").startsWith("image/");

export default function DamStudio() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [store, setStore] = useState<string>("humain-media");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Asset | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [altDraft, setAltDraft] = useState("");
  const [savingAlt, setSavingAlt] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function open(a: Asset) { setSel(a); setAltDraft(a.alt || ""); }

  async function saveAlt() {
    if (!sel) return;
    setSavingAlt(true);
    try {
      const r = await fetch(`/api/dam/${sel.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ alt: altDraft }) });
      if (r.ok) { setAssets((xs) => xs.map((x) => (x.id === sel.id ? { ...x, alt: altDraft } : x))); setSel({ ...sel, alt: altDraft }); }
    } catch {}
    setSavingAlt(false);
  }

  async function load() {
    try {
      const d = await fetch("/api/dam").then((r) => r.json());
      setAssets(d.assets || []); setStore(d.store || "humain-media");
    } catch { setMsg("Could not load assets."); }
  }
  useEffect(() => { load(); }, []);

  async function upload(files: FileList | null) {
    if (!files || !files.length) return;
    setBusy(true);
    for (const f of Array.from(files)) {
      setMsg(`Uploading ${f.name} → S3/MinIO…`);
      try {
        const fd = new FormData(); fd.append("file", f); fd.append("alt", f.name.replace(/\.[a-z0-9]+$/i, ""));
        const r = await fetch("/api/dam", { method: "POST", body: fd });
        if (!r.ok) { const e = await r.json().catch(() => ({})); setMsg(`Upload failed: ${e.error || r.status}`); }
      } catch { setMsg(`Upload failed: ${f.name}`); }
    }
    setBusy(false); setMsg(""); await load();
  }

  async function del(a: Asset) {
    await fetch(`/api/dam/${a.id}`, { method: "DELETE" });
    setConfirmDel(false); setSel(null); await load();
  }

  const shown = useMemo(() => assets.filter((a) => !q.trim() || (a.filename + " " + (a.alt || "")).toLowerCase().includes(q.toLowerCase())), [assets, q]);
  const totalBytes = useMemo(() => assets.reduce((s, a) => s + (a.filesize || 0), 0), [assets]);

  return (
    <AppShellCard>
      <AppShellCard.Header>
        <AppShellCard.Title>Asset Library</AppShellCard.Title>
        <AppShellCard.Subtitle>
          Every asset — uploaded or agent-generated — is stored in the object store behind the
          media API, with responsive renditions and AI alt-text. {assets.length} asset
          {assets.length === 1 ? "" : "s"} · {kb(totalBytes)}.
        </AppShellCard.Subtitle>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="dot" color="success" size="sm">
            Storage: self-hosted S3 / MinIO · bucket “{store}”
          </Badge>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search assets…"
            aria-label="Search assets"
            size="sm"
            startIcon={<Search className="size-4" />}
            className="max-w-xs"
          />
          <Button size="sm" loading={busy} onClick={() => fileRef.current?.click()} startIcon={<Upload className="size-4" />}>
            {busy ? "Uploading…" : "Upload assets"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,application/pdf,video/*"
            className="hidden"
            onChange={(e) => upload(e.target.files)}
          />
          {msg && <span className="text-sm text-secondary-foreground">{msg}</span>}
        </div>
      </AppShellCard.Header>

      {shown.length === 0 ? (
        <EmptyState
          title={q.trim() ? "No matching assets" : "No assets yet"}
          description={
            q.trim()
              ? "Try a different search term, or clear the search to see everything in the bucket."
              : "Upload an image, PDF or video and it is stored in the object store with responsive renditions and AI alt-text."
          }
          media="featured-icon"
          icon={<Images />}
          primaryAction={{ label: "Upload assets", startIcon: <Upload className="size-4" />, onClick: () => fileRef.current?.click() }}
          secondaryAction={q.trim() ? { label: "Clear search", onClick: () => setQ("") } : undefined}
        />
      ) : (
        // Standard scale utilities only. The package ships a PRECOMPILED utility
        // layer, so an arbitrary `grid-cols-[repeat(auto-fill,…)]` silently
        // resolves to nothing — which collapsed this grid to a single column.
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {shown.map((a) => (
            <Button
              key={a.id}
              appearance="outline"
              variant="secondary"
              onClick={() => open(a)}
              aria-label={`Open ${a.filename}`}
              className="block h-auto w-full overflow-hidden whitespace-normal p-0 text-start"
            >
              <span className="block">
                <span className="grid h-32 place-items-center border-b border-border bg-muted">
                  {isImg(a.mimeType) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.sizes.find((s) => s.name === "thumbnail")?.url || a.url}
                      alt={a.alt || a.filename}
                      className="max-h-32 max-w-full object-contain"
                    />
                  ) : (
                    <FileText className="size-8 text-muted-foreground" />
                  )}
                </span>
                <span className="block p-3">
                  <span className="block truncate text-xs font-semibold text-foreground">{a.filename}</span>
                  <span className="mt-0.5 block text-xs text-secondary-foreground">
                    {a.width && a.height ? `${a.width}×${a.height} · ` : ""}{kb(a.filesize)}
                  </span>
                  {a.alt && (
                    <Badge variant="soft" color="success" size="xs" className="mt-1.5">AI alt-text</Badge>
                  )}
                </span>
              </span>
            </Button>
          ))}
        </div>
      )}

      {/* Detail — the package Dialog replaces the hand-rolled fixed overlay. */}
      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <Dialog.Popup size="lg">
          <Dialog.Header>
            <Dialog.Title>{sel?.filename}</Dialog.Title>
            <Dialog.Description>{sel?.mimeType}</Dialog.Description>
          </Dialog.Header>
          <Dialog.Body>
            {sel && (
              <div className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
                <div className="grid min-h-60 place-items-center rounded-xl border border-border bg-muted p-3">
                  {isImg(sel.mimeType) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sel.url} alt={sel.alt || sel.filename} className="max-h-96 max-w-full" />
                  ) : (
                    <FileText className="size-14 text-muted-foreground" />
                  )}
                </div>

                <div className="text-sm">
                  <Row k="Type" v={sel.mimeType} />
                  <Row k="Dimensions" v={sel.width && sel.height ? `${sel.width} × ${sel.height}` : "—"} />
                  <Row k="Size" v={kb(sel.filesize)} />
                  <Row k="Store" v={`S3 / MinIO · ${store}`} />
                  <Row k="Uploaded" v={sel.createdAt ? new Date(sel.createdAt).toLocaleString() : "—"} />

                  <Separator className="my-4" />

                  {/* Field wrapper, not Textarea's `label` prop: the package's
                      field props are declared but unreachable from a consumer
                      (its .d.ts files import through the library's internal `@/`
                      alias), so `label` is not in the public type. Field is the
                      sanctioned compound escape hatch. */}
                  <Field>
                    <Field.Label>AI alt-text (editable)</Field.Label>
                    <Textarea
                      value={altDraft}
                      onChange={(e) => setAltDraft(e.target.value)}
                      rows={2}
                    />
                  </Field>
                  <Button
                    size="sm"
                    className="mt-2"
                    loading={savingAlt}
                    disabled={savingAlt || altDraft === (sel.alt || "")}
                    onClick={saveAlt}
                  >
                    {savingAlt ? "Saving…" : "Save alt-text"}
                  </Button>

                  <Separator className="my-4" label={`Renditions (${sel.sizes.length})`} />
                  {sel.sizes.map((s) => (
                    <div key={s.name} className="flex justify-between text-xs">
                      <span className="capitalize text-foreground">{s.name}</span>
                      <span className="text-secondary-foreground">{s.width}×{s.height} · {kb(s.filesize)}</span>
                    </div>
                  ))}

                  <Separator className="my-4" label="Public URL" />
                  <div className="flex gap-1.5">
                    <Input readOnly value={sel.url} size="sm" aria-label="Public URL" className="flex-1" />
                    <Button
                      appearance="outline"
                      variant="secondary"
                      size="icon-sm"
                      aria-label="Copy public URL"
                      title="Copy"
                      onClick={() => navigator.clipboard?.writeText(sel.url)}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Dialog.Body>
          <Dialog.Footer>
            <Button
              appearance="outline"
              variant="destructive"
              startIcon={<Trash2 className="size-4" />}
              onClick={() => setConfirmDel(true)}
            >
              Delete asset
            </Button>
          </Dialog.Footer>
        </Dialog.Popup>
      </Dialog>

      {/* window.confirm() replaced by the package's confirmation dialog. */}
      <AlertDialog open={confirmDel} onOpenChange={setConfirmDel}>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop />
          <AlertDialog.Popup>
            <AlertDialog.Header>
              <AlertDialog.Title>Delete this asset?</AlertDialog.Title>
              <AlertDialog.Description>
                “{sel?.filename}” is removed from the asset store along with its renditions. This
                cannot be undone.
              </AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
              {/* size/variant/shape/appearance are required here rather than
                  optional — same `@/`-alias packaging quirk as the field props. */}
              <AlertDialog.Cancel size="default" appearance="outline" variant="secondary" shape="rounded">
                Cancel
              </AlertDialog.Cancel>
              <AlertDialog.Action variant="destructive" onClick={() => sel && del(sel)}>
                Delete asset
              </AlertDialog.Action>
            </AlertDialog.Footer>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog>
    </AppShellCard>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2.5 leading-7">
      <span className="w-24 shrink-0 text-secondary-foreground">{k}</span>
      <span className="break-words text-foreground">{v}</span>
    </div>
  );
}
