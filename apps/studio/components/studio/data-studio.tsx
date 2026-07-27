"use client";
import { useEffect, useMemo, useState } from "react";
import {
  AlertDialog,
  AppShellCard,
  Badge,
  Button,
  type ColumnDef,
  DataTable,
  EmptyState,
  Field,
  Input,
  Pagination,
  Separator,
  Textarea,
} from "@humain/ui";
import { ArrowLeft, Database, Plus, Search, Trash2 } from "lucide-react";

/* =============================================================================
   CMS Data — native back-office over every collection and global.

   Migrated onto @humain/ui per references/adoption.md §4:
     row list       -> DataTable (organisms.md), with server paging kept on the
                       package Pagination underneath rather than DataTable's own
                       client-side pagination — the API pages server-side, so the
                       table only ever holds the current page.
     <input>        -> Input, <textarea> -> Textarea, both labelled via Field
     <button>       -> Button
     window.confirm -> AlertDialog
     empty/intro    -> EmptyState
     status pill    -> Badge

   Every endpoint, payload shape and handler is unchanged, including the
   scalar/JSON detection in build(), the "template from the first row" behaviour
   of newDoc(), and global editing.

   NOTE on layout values: the package's utility layer is PRECOMPILED, so only
   standard-scale utilities exist — an arbitrary class like `w-[220px]` silently
   resolves to nothing. Sizes here snap to the scale (w-56, max-w-xs) rather than
   being expressed as arbitrary values.

   Labels go through the compound `Field` rather than the documented smart
   `label` prop: that prop is unreachable from a consumer on Input, Textarea AND
   Select, because the package's .d.ts files import it through the library's
   internal `@/` alias. Field is the sanctioned fallback.
   ============================================================================= */

type Row = { id: string | number; title: string; status?: string; updatedAt?: string };

// Grouped collection catalogue (mirrors the API allowlist).
const CATALOG: { group: string; items: { slug: string; label: string }[] }[] = [
  { group: "Content", items: [["articles", "Articles"], ["blogPosts", "Blog Posts"], ["pressReleases", "Press Releases"], ["events", "Events"], ["products", "Products"], ["caseStudies", "Case Studies"], ["faqs", "FAQs"], ["careers", "Careers"], ["leadership", "Leadership"], ["mediaGalleries", "Media Galleries"], ["campaignMicrosites", "Campaign Microsites"], ["pages", "Pages"], ["tags", "Tags"]].map(([slug, label]) => ({ slug, label })) },
  { group: "Building blocks", items: [["components", "Components"], ["media", "Media"]].map(([slug, label]) => ({ slug, label })) },
  { group: "Create", items: [["aiwebsites", "Websites & Pages"], ["decks", "Decks"], ["projects", "Projects"], ["conversations", "Conversations"]].map(([slug, label]) => ({ slug, label })) },
  { group: "Studio", items: [["brandGuidelines", "Brand Guidelines"], ["sites", "Sites"]].map(([slug, label]) => ({ slug, label })) },
  { group: "Governance", items: [["approvals", "Approvals"], ["auditLog", "Audit Log"]].map(([slug, label]) => ({ slug, label })) },
  { group: "System", items: [["users", "Users"]].map(([slug, label]) => ({ slug, label })) },
];
const GLOBALS = [{ slug: "navigation", label: "Navigation" }, { slug: "settings", label: "Site Settings" }];
const SKIP = new Set(["id", "createdAt", "updatedAt", "sizes", "thumbnailURL"]);
const isScalar = (v: any) => v == null || ["string", "number", "boolean"].includes(typeof v);
const isLive = (s?: string) => s === "published" || s === "live";

export default function DataStudio({ initialCollection }: { initialCollection: string | null }) {
  const [coll, setColl] = useState<string | null>(initialCollection);
  const [globalSlug, setGlobalSlug] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [doc, setDoc] = useState<any | null>(null);
  const [editVals, setEditVals] = useState<Record<string, string>>({});
  const [isNew, setIsNew] = useState(false);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);

  const label = useMemo(() => {
    for (const g of CATALOG) { const it = g.items.find((x) => x.slug === coll); if (it) return it.label; }
    return coll || "";
  }, [coll]);

  async function loadList(slug: string, pg = 1, query = "") {
    setColl(slug); setGlobalSlug(null); setDoc(null); setBusy("list"); setMsg("");
    try {
      const d = await fetch(`/api/manage/${slug}?page=${pg}&q=${encodeURIComponent(query)}`).then((r) => r.json());
      setRows(d.rows || []); setPage(d.page || 1); setTotalPages(d.totalPages || 1); setTotal(d.totalDocs || 0);
    } catch { setMsg("Load failed."); } finally { setBusy(""); }
  }
  useEffect(() => { if (initialCollection) loadList(initialCollection); }, []); // eslint-disable-line

  function openDoc(d: any, asNew = false) {
    setDoc(d); setIsNew(asNew);
    const v: Record<string, string> = {};
    for (const [k, val] of Object.entries(d)) { if (SKIP.has(k)) continue; v[k] = isScalar(val) ? (val == null ? "" : String(val)) : JSON.stringify(val, null, 2); }
    setEditVals(v);
  }
  async function edit(id: string | number) {
    setBusy("get");
    try { const d = await fetch(`/api/manage/${coll}/${id}`).then((r) => r.json()); if (d.doc) openDoc(d.doc, false); } catch { setMsg("Load failed."); } finally { setBusy(""); }
  }
  async function newDoc() {
    // Template from an existing record's shape (empty values); else blank.
    let tpl: any = {};
    if (rows[0]) { try { const d = await fetch(`/api/manage/${coll}/${rows[0].id}`).then((r) => r.json()); for (const [k, val] of Object.entries(d.doc || {})) { if (SKIP.has(k)) continue; tpl[k] = isScalar(val) ? "" : (Array.isArray(val) ? [] : {}); } } catch {} }
    openDoc(tpl, true);
  }
  function build(): any {
    const out: any = {};
    for (const [k, raw] of Object.entries(editVals)) {
      const orig = doc?.[k];
      if (!isScalar(orig) || (isNew && (raw.trim().startsWith("{") || raw.trim().startsWith("[")))) { try { out[k] = JSON.parse(raw); } catch { /* skip invalid json */ } }
      else if (typeof orig === "boolean") out[k] = raw === "true";
      else if (typeof orig === "number") out[k] = raw === "" ? null : Number(raw);
      else out[k] = raw;
    }
    return out;
  }
  async function save() {
    setBusy("save"); setMsg("");
    try {
      const payload = build();
      const url = isNew ? `/api/manage/${coll}` : `/api/manage/${coll}/${doc.id}`;
      const r = await fetch(url, { method: isNew ? "POST" : "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (r.ok) { setMsg(isNew ? "Created ✓" : "Saved ✓"); setDoc(null); loadList(coll!, page, q); }
      else setMsg(j.error || "Save failed.");
    } catch { setMsg("Save failed."); } finally { setBusy(""); }
  }
  async function del(id: string | number) {
    await fetch(`/api/manage/${coll}/${id}`, { method: "DELETE" });
    setConfirmDel(false); setDoc(null); loadList(coll!, page, q);
  }
  async function openGlobal(slug: string) {
    setGlobalSlug(slug); setColl(null); setRows([]); setBusy("get");
    try { const d = await fetch(`/api/manage/global/${slug}`).then((r) => r.json()); if (d.doc) { setDoc({ ...d.doc, _global: slug }); const v: Record<string, string> = {}; for (const [k, val] of Object.entries(d.doc)) { if (SKIP.has(k)) continue; v[k] = isScalar(val) ? (val == null ? "" : String(val)) : JSON.stringify(val, null, 2); } setEditVals(v); setIsNew(false); } } catch {} finally { setBusy(""); }
  }
  async function saveGlobal() {
    setBusy("save");
    try { const r = await fetch(`/api/manage/global/${globalSlug}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(build()) }); setMsg(r.ok ? "Saved ✓" : "Save failed."); } catch { setMsg("Save failed."); } finally { setBusy(""); }
  }

  // The title cell is the row action, so the table keeps real button semantics
  // instead of an onClick on a <tr>.
  const columns = useMemo<ColumnDef<Row, unknown>[]>(() => [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <span className="text-xs text-secondary-foreground">#{String(row.original.id)}</span>,
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <Button
          appearance="link"
          variant="primary"
          className="h-auto p-0 text-start"
          onClick={() => edit(row.original.id)}
        >
          {row.original.title}
        </Button>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) =>
        row.original.status ? (
          <Badge variant="soft" color={isLive(row.original.status) ? "success" : "warning"} size="sm">
            {row.original.status}
          </Badge>
        ) : null,
    },
  ], [coll]); // eslint-disable-line

  const railItem = (active: boolean, text: string, onClick: () => void) => (
    <Button
      key={text}
      appearance={active ? "soft" : "ghost"}
      variant={active ? "primary" : "secondary"}
      size="sm"
      onClick={onClick}
      className="w-full justify-start text-start"
    >
      {text}
    </Button>
  );

  return (
    <AppShellCard inset bodyPadding="none">
      <AppShellCard.Header>
        <AppShellCard.Title>{globalSlug ? "Site configuration" : label || "CMS Data"}</AppShellCard.Title>
        <AppShellCard.Subtitle>
          {coll
            ? `${total} record${total === 1 ? "" : "s"} · full create, read, update and delete via the Payload API.`
            : "Full create / read / update / delete over every collection and global, via the Payload API."}
        </AppShellCard.Subtitle>
      </AppShellCard.Header>

      <div className="flex min-h-0 flex-1">
        {/* Collection rail */}
        <aside
          className="w-56 shrink-0 overflow-y-auto border-e border-border p-3"
          aria-label="Collections"
        >
          {CATALOG.map((g) => (
            <div key={g.group} className="mb-2">
              <Separator className="my-2" label={g.group} />
              <div className="grid gap-0.5">
                {g.items.map((it) => railItem(coll === it.slug, it.label, () => loadList(it.slug)))}
              </div>
            </div>
          ))}
          <Separator className="my-2" label="Globals" />
          <div className="grid gap-0.5">
            {GLOBALS.map((it) => railItem(globalSlug === it.slug, it.label, () => openGlobal(it.slug)))}
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1 overflow-y-auto">
          {!coll && !globalSlug && (
            <div className="p-6">
              <EmptyState
                title="Pick a collection"
                description="Every collection and global is editable here through the Payload API — choose one on the left to browse, edit or create records."
                media="featured-icon"
                icon={<Database />}
              />
            </div>
          )}

          {/* Record editor (collection or global) */}
          {doc && (
            <div className="p-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-foreground">
                  {globalSlug ? `Global · ${globalSlug}` : isNew ? `New ${label}` : `Edit ${label} #${doc.id}`}
                </h3>
                {!globalSlug && (
                  <Button
                    appearance="outline"
                    variant="secondary"
                    size="sm"
                    startIcon={<ArrowLeft className="size-4" />}
                    onClick={() => setDoc(null)}
                  >
                    Back to list
                  </Button>
                )}
              </div>

              <div className="grid gap-3">
                {Object.keys(editVals).map((k) => {
                  const orig = doc[k];
                  const complex = !isScalar(orig) || (isNew && (editVals[k].trim().startsWith("{") || editVals[k].trim().startsWith("[")));
                  const hint = typeof orig === "boolean" ? " (true/false)" : complex ? " (JSON)" : "";
                  return (
                    <Field key={k}>
                      <Field.Label>{k}{hint}</Field.Label>
                      {complex ? (
                        <Textarea
                          value={editVals[k]}
                          onChange={(e) => setEditVals((v) => ({ ...v, [k]: e.target.value }))}
                          rows={4}
                          className="font-mono"
                        />
                      ) : String(editVals[k]).length > 80 ? (
                        <Textarea
                          value={editVals[k]}
                          onChange={(e) => setEditVals((v) => ({ ...v, [k]: e.target.value }))}
                          rows={3}
                        />
                      ) : (
                        <Input
                          value={editVals[k]}
                          onChange={(e) => setEditVals((v) => ({ ...v, [k]: e.target.value }))}
                        />
                      )}
                    </Field>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button loading={busy === "save"} disabled={!!busy} onClick={globalSlug ? saveGlobal : save}>
                  {busy === "save" ? "Saving…" : globalSlug ? "Save global" : isNew ? "Create" : "Save"}
                </Button>
                {!globalSlug && !isNew && (
                  <Button
                    appearance="outline"
                    variant="destructive"
                    startIcon={<Trash2 className="size-4" />}
                    onClick={() => setConfirmDel(true)}
                  >
                    Delete
                  </Button>
                )}
                {msg && <span className="text-sm text-secondary-foreground">{msg}</span>}
              </div>
            </div>
          )}

          {/* List */}
          {coll && !doc && (
            <>
              {/* One padded toolbar between the header and the table, per the
                  package's data-panel contract. */}
              <div className="flex flex-wrap items-center gap-2 border-b border-border px-6 py-4">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadList(coll, 1, q)}
                  placeholder="Search…"
                  aria-label={`Search ${label}`}
                  size="sm"
                  startIcon={<Search className="size-4" />}
                  className="max-w-xs"
                />
                <Button size="sm" startIcon={<Plus className="size-4" />} onClick={newDoc}>New</Button>
                {msg && <span className="text-sm text-secondary-foreground">{msg}</span>}
              </div>

              {rows.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title={busy ? "Loading…" : q.trim() ? "No matching records" : "No records"}
                    description={
                      q.trim()
                        ? "No record in this collection matches that search."
                        : "This collection is empty. Create the first record with New."
                    }
                    media="featured-icon"
                    icon={<Database />}
                    primaryAction={{ label: "New record", startIcon: <Plus className="size-4" />, onClick: newDoc }}
                    secondaryAction={q.trim() ? { label: "Clear search", onClick: () => { setQ(""); loadList(coll, 1, ""); } } : undefined}
                  />
                </div>
              ) : (
                <>
                  <DataTable columns={columns} data={rows} getRowId={(r) => String(r.id)} enableSorting />
                  {totalPages > 1 && (
                    // Server-side paging, so the package Pagination drives
                    // loadList rather than DataTable's own client pagination.
                    <div className="flex justify-center px-6 py-4">
                      <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={(p) => loadList(coll, p, q)}
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <AlertDialog open={confirmDel} onOpenChange={setConfirmDel}>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop />
          <AlertDialog.Popup>
            <AlertDialog.Header>
              <AlertDialog.Title>Delete this record?</AlertDialog.Title>
              <AlertDialog.Description>
                {label} #{doc?.id} is removed from the collection. This cannot be undone.
              </AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer>
              <AlertDialog.Cancel size="default" appearance="outline" variant="secondary" shape="rounded">
                Cancel
              </AlertDialog.Cancel>
              <AlertDialog.Action variant="destructive" onClick={() => doc && del(doc.id)}>
                Delete record
              </AlertDialog.Action>
            </AlertDialog.Footer>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog>
    </AppShellCard>
  );
}
