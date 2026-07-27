"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Markdown from "@/components/studio/markdown";
import ContentManager from "@/components/cms/content-manager";
import { R, TYPE } from "@/components/cms/cms-tokens";
import {
  Button,
  EmptyState,
  LoadingIndicator,
  Select,
  SelectItem,
  Separator,
} from "@humain/ui";
import { Baseline, Code2, Download, FileText, Image as ImageIcon, Maximize2, Monitor, Redo2, Smartphone, Sparkles, Undo2, X } from "lucide-react";
import { MonitorIcon, GridIcon, SparkIcon, CheckIcon, ClockIcon, GlobeIcon, VideoIcon, PencilIcon, XIcon } from "@/components/icons";

export type Artifact =
  | { kind: "html"; html: string; title?: string }
  | { kind: "doc"; doc: any; title?: string }
  | { kind: "image"; imagePrompt: string; ratio?: string; title?: string }
  | { kind: "brand"; brand: any; title?: string }
  | { kind: "theme"; theme: any; title?: string }
  | { kind: "video"; videoPrompt: string; script?: string; title?: string };

export type CmsTab = "preview" | "outline" | "editor" | "seo" | "publish" | "versions" | "assets";
export type Tier = "Standard" | "Marketer" | "Editor" | "Admin";
export type Phase = "setup" | "generating" | "ready";

function SetupState() {
  return (
    <div className="grid flex-1 place-items-center p-10">
      <EmptyState
        title="Nothing drafted yet"
        description="Describe what to create — or answer the setup questions — and I’ll start drafting here."
        media="featured-icon"
        icon={<FileText />}
      />
    </div>
  );
}

function GeneratingState() {
  return (
    <div className="grid flex-1 place-items-center p-10">
      <div className="grid justify-items-center gap-3 text-center">
        {/* LoadingIndicator replaces a hand-rolled spinner that injected its own
            @keyframes into the document from inside render. */}
        <LoadingIndicator />
        <div className="text-sm font-semibold text-foreground">Generating…</div>
        <div className="text-sm text-secondary-foreground">The CMS agent is drafting your content.</div>
      </div>
    </div>
  );
}

const DownloadIcon = ({ s = 16 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>);
const ExpandIcon = ({ s = 16 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3" /></svg>);
const CodeIcon = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m8 6-6 6 6 6M16 6l6 6-6 6" /></svg>);
const ListIcon = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>);

function OutlineView({ artifact, onEditHtml }: { artifact: Artifact | null; onEditHtml: (h: string) => void }) {
  const html = artifact?.kind === "html" ? artifact.html : "";
  const sections = useMemo(() => parseSections(html), [html]);
  const [drag, setDrag] = useState<number | null>(null);
  if (artifact?.kind !== "html") return <div style={{ padding: 28, color: muted, ...TYPE.sm }}>Outline is available for page (HTML) artifacts. Ask the agent to build a page, then reorder its sections here.</div>;
  const drop = (to: number) => { if (drag == null || drag === to) { setDrag(null); return; } const o = sections.map((s) => s.i); const [x] = o.splice(drag, 1); o.splice(to, 0, x); onEditHtml(reorderSections(html, o)); setDrag(null); };
  return (
    <div style={{ padding: 24, overflow: "auto" }}>
      <div style={{ fontWeight: 800, color: fg, fontSize: 18, marginBottom: 4 }}>Review your outline</div>
      <div style={{ color: muted, ...TYPE.sm, marginBottom: 16 }}>{sections.length} sections · drag to reorder, edit a title to rename.</div>
      {sections.map((s, pos) => (
        <div key={pos} draggable onDragStart={() => setDrag(pos)} onDragOver={(e) => e.preventDefault()} onDrop={() => drop(pos)}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", marginBottom: 8, borderRadius: R.xl, border: `1px solid ${drag === pos ? primary : border}`, background: card, cursor: "grab" }}>
          <span style={{ color: muted, cursor: "grab", fontSize: 16 }}>⠿</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: muted, width: 22 }}>{String(pos + 1).padStart(2, "0")}</span>
          <input key={s.label} defaultValue={s.label} onBlur={(e) => { if (e.target.value.trim() && e.target.value !== s.label) onEditHtml(renameSection(html, pos, e.target.value)); }}
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", color: fg, ...TYPE.sm, fontWeight: 600 }} />
        </div>
      ))}
    </div>
  );
}
const TIER_RANK: Record<Tier, number> = { Standard: 0, Marketer: 1, Editor: 2, Admin: 3 };

const TABS: { key: CmsTab; label: string; Icon: any; minTier: Tier }[] = [
  { key: "preview", label: "Live Preview", Icon: MonitorIcon, minTier: "Standard" },
  { key: "outline", label: "Outline", Icon: ListIcon, minTier: "Standard" },
  { key: "editor", label: "Page Editor", Icon: GridIcon, minTier: "Standard" },
  { key: "assets", label: "Assets", Icon: ImageIcon, minTier: "Standard" },
  { key: "seo", label: "SEO", Icon: SparkIcon, minTier: "Marketer" },
  { key: "publish", label: "Publishing", Icon: CheckIcon, minTier: "Marketer" },
  { key: "versions", label: "Versions", Icon: ClockIcon, minTier: "Editor" },
];

const EDIT_SCRIPT = `<style id="__cmsedit">*{cursor:default}[data-cmsh]{outline:2px dashed #009688!important;outline-offset:2px}[data-cmss]{outline:2px solid #009688!important;outline-offset:2px}</style>
<script id="__cmsjs">(function(){var sel=null;function post(t,x){parent.postMessage(Object.assign({__cms:t},x),'*')}
document.addEventListener('mouseover',function(e){if(e.target.setAttribute)e.target.setAttribute('data-cmsh','')},true);
document.addEventListener('mouseout',function(e){if(e.target.removeAttribute)e.target.removeAttribute('data-cmsh')},true);
document.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();if(sel){sel.removeAttribute('data-cmss');sel.removeAttribute('contenteditable')}sel=e.target;sel.setAttribute('data-cmss','');sel.setAttribute('contenteditable','true');sel.focus();post('select',{tag:(sel.tagName||'').toLowerCase(),text:(sel.innerText||'').slice(0,500),src:(sel.tagName=='IMG'&&sel.getAttribute?(sel.getAttribute('src')||''):'')})},true);
document.addEventListener('input',function(){post('edit',{html:'<!doctype html>'+document.documentElement.outerHTML})},true);
window.addEventListener('message',function(e){var d=e.data||{};if(d.__cmscmd){try{document.execCommand(d.__cmscmd,false,d.val||null)}catch(x){}post('edit',{html:'<!doctype html>'+document.documentElement.outerHTML})}else if(d.__cmsscroll!=null){var b=document.body.children[d.__cmsscroll];if(b&&b.scrollIntoView)b.scrollIntoView({behavior:'smooth',block:'start'})}},false);})();</script>`;
function stripEdit(html: string): string {
  return (html || "").replace(/<style id="__cmsedit">[\s\S]*?<\/style>/g, "").replace(/<script id="__cmsjs">[\s\S]*?<\/script>/g, "").replace(/\s*data-cms[hs]=""/g, "").replace(/\s*contenteditable="true"/g, "");
}

const fg = "var(--hc-fg)", muted = "var(--hc-fg-muted)", primary = "var(--hc-primary)", border = "var(--hc-border)", card = "var(--hc-card)", soft = "var(--hc-muted)", pill = "var(--hc-primary-10)";

// ---- Section model: treat top-level <body> children as reorderable "sections" ----
type Section = { i: number; label: string };
function parseDoc(html: string): { doc: Document | null; body: HTMLElement | null } {
  try { const d = new DOMParser().parseFromString(html || "<html><body></body></html>", "text/html"); return { doc: d, body: d.body }; } catch { return { doc: null, body: null }; }
}
function sectionLabel(el: Element, i: number): string {
  const h = el.querySelector("h1,h2,h3,header") as HTMLElement | null;
  const t = (h?.innerText || (el as HTMLElement).innerText || "").trim().replace(/\s+/g, " ");
  return t ? t.slice(0, 48) : `${el.tagName.toLowerCase()} block ${i + 1}`;
}
function parseSections(html: string): Section[] {
  const { body } = parseDoc(html); if (!body) return [];
  return Array.from(body.children).map((el, i) => ({ i, label: sectionLabel(el, i) }));
}
// Head styles + each section's own markup — used to render true mini-previews.
type PageSection = { i: number; label: string; html: string };
function parsePage(html: string): { head: string; sections: PageSection[] } {
  const { doc, body } = parseDoc(html); if (!doc || !body) return { head: "", sections: [] };
  const head = doc.head ? doc.head.innerHTML : "";
  const sections = Array.from(body.children).map((el, i) => ({ i, label: sectionLabel(el, i), html: (el as HTMLElement).outerHTML }));
  return { head, sections };
}
function reorderSections(html: string, order: number[]): string {
  const { doc, body } = parseDoc(html); if (!doc || !body) return html;
  const kids = Array.from(body.children); const frag = doc.createDocumentFragment();
  order.forEach((idx) => { if (kids[idx]) frag.appendChild(kids[idx]); });
  body.innerHTML = ""; body.appendChild(frag);
  return "<!doctype html>" + doc.documentElement.outerHTML;
}
function renameSection(html: string, i: number, label: string): string {
  const { doc, body } = parseDoc(html); if (!doc || !body) return html;
  const el = body.children[i]; if (!el) return html;
  const h = el.querySelector("h1,h2,h3") as HTMLElement | null;
  if (h) h.textContent = label;
  return "<!doctype html>" + doc.documentElement.outerHTML;
}

const FONT_SIZES = [{ v: "2", px: 13 }, { v: "3", px: 16 }, { v: "4", px: 18 }, { v: "5", px: 24 }, { v: "6", px: 32 }, { v: "7", px: 48 }];
function EditToolbar({ onCmd }: { onCmd: (c: string, v?: string) => void }) {
  return (
    <div className="flex items-center gap-1 border-b border-border px-3 py-1.5">
      <Select defaultValue="3" onValueChange={(v) => onCmd("fontSize", String(v))}>
        {FONT_SIZES.map((f) => <SelectItem key={f.v} value={f.v}>{String(f.px)}</SelectItem>)}
      </Select>
      <Separator orientation="vertical" className="mx-1 h-5" />
      <Button appearance="ghost" variant="secondary" size="icon-sm" title="Bold" aria-label="Bold" onClick={() => onCmd("bold")}>
        <span className="font-bold">B</span>
      </Button>
      <Button appearance="ghost" variant="secondary" size="icon-sm" title="Italic" aria-label="Italic" onClick={() => onCmd("italic")}>
        <span className="italic">I</span>
      </Button>
      <Button appearance="ghost" variant="secondary" size="icon-sm" title="Underline" aria-label="Underline" onClick={() => onCmd("underline")}>
        <span className="underline">U</span>
      </Button>
      <Separator orientation="vertical" className="mx-1 h-5" />
      {/* Native colour input: the package ships no colour picker. */}
      <label title="Text colour" className="relative grid size-8 cursor-pointer place-items-center rounded-md text-secondary-foreground hover:bg-muted">
        <Baseline className="size-4" />
        <input
          type="color"
          aria-label="Text colour"
          onChange={(e) => onCmd("foreColor", e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <Separator orientation="vertical" className="mx-1 h-5" />
      <Button appearance="ghost" variant="secondary" size="icon-sm" title="Undo" aria-label="Undo" onClick={() => onCmd("undo")}>
        <Undo2 className="size-4" />
      </Button>
      <Button appearance="ghost" variant="secondary" size="icon-sm" title="Redo" aria-label="Redo" onClick={() => onCmd("redo")}>
        <Redo2 className="size-4" />
      </Button>
      <div className="flex-1" />
      <span className="text-xs text-secondary-foreground">Select text in the page, then format</span>
    </div>
  );
}

// Scaled, sandboxed mini-render of one section using the page's own head styles.
function SectionThumb({ head, html, index, label, onClick, dragging, onDragStart, onDragOver, onDrop }: {
  head: string; html: string; index: number; label: string; onClick: () => void;
  dragging?: boolean; onDragStart?: () => void; onDragOver?: (e: React.DragEvent) => void; onDrop?: () => void;
}) {
  const PW = 1280, TW = 150, TH = 94; // virtual page width → thumb crop
  const scale = TW / PW;
  const doc = `<!doctype html><html><head>${head}<style>html,body{margin:0;padding:0;background:#fff}</style></head><body>${html}</body></html>`;
  return (
    <button onClick={onClick} title={label} draggable onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
      style={{ display: "block", width: "100%", padding: 0, border: "none", background: "transparent", cursor: "grab", marginBottom: 10, opacity: dragging ? 0.45 : 1 }}>
      <div style={{ position: "relative", width: TW, height: TH, margin: "0 auto", borderRadius: R.lg, overflow: "hidden", border: `1.5px solid ${dragging ? primary : border}`, background: "var(--card)", boxShadow: "var(--hc-shadow-sm)" }}>
        <iframe title={label} sandbox="allow-same-origin" scrolling="no" tabIndex={-1} srcDoc={doc}
          style={{ position: "absolute", top: 0, left: 0, width: PW, height: Math.round(TH / scale), border: "none", transform: `scale(${scale})`, transformOrigin: "top left", pointerEvents: "none", background: "var(--card)" }} />
        <span style={{ position: "absolute", top: 5, left: 5, minWidth: 18, height: 18, padding: "0 5px", borderRadius: R.md, background: "rgba(0,0,0,0.55)", color: "var(--primary-foreground)", fontSize: 11, fontWeight: 700, display: "grid", placeItems: "center" }}>{index + 1}</span>
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: muted, textAlign: "center", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: TW, marginLeft: "auto", marginRight: "auto" }}>{label}</div>
    </button>
  );
}
function SectionRail({ head, sections, onScroll, onReorder }: { head: string; sections: PageSection[]; onScroll: (i: number) => void; onReorder: (order: number[]) => void }) {
  const [drag, setDrag] = useState<number | null>(null);
  if (sections.length < 2) return null;
  const drop = (to: number) => { if (drag == null || drag === to) { setDrag(null); return; } const o = sections.map((s) => s.i); const [x] = o.splice(drag, 1); o.splice(to, 0, x); onReorder(o); setDrag(null); };
  return (
    <div style={{ width: 182, flexShrink: 0, borderRight: `1px solid ${border}`, overflow: "auto", padding: "10px 8px", background: card }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: muted, letterSpacing: ".06em", padding: "0 4px 8px" }}>{sections.length} SECTIONS · drag to reorder</div>
      {sections.map((s, pos) => (
        <SectionThumb key={s.i} head={head} html={s.html} index={s.i} label={s.label} onClick={() => onScroll(s.i)}
          dragging={drag === pos} onDragStart={() => setDrag(pos)} onDragOver={(e) => e.preventDefault()} onDrop={() => drop(pos)} />
      ))}
    </div>
  );
}

function PreviewEmptyState() {
  return (
    <div className="grid flex-1 place-items-center p-10">
      <EmptyState
        title="Live preview will appear here"
        description="Ask the CMS agent to create a page, generate content, or build a campaign — it appears here instantly, ready to refine."
        media="featured-icon"
        icon={<Monitor />}
      />
    </div>
  );
}

function DeviceFrame({ device, children }: { device: "desktop" | "mobile"; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, minHeight: 0, overflow: "auto", background: soft, display: "grid", placeItems: device === "mobile" ? "start center" : "stretch", padding: device === "mobile" ? "18px 0" : 0 }}>
      <div style={{ width: device === "mobile" ? 390 : "100%", maxWidth: "100%", height: device === "mobile" ? 760 : "100%", background: "var(--card)", borderRadius: device === "mobile" ? R.x3 : 0, overflow: "hidden", border: device === "mobile" ? `1px solid ${border}` : "none", boxShadow: device === "mobile" ? "var(--hc-shadow-lg)" : "none" }}>{children}</div>
    </div>
  );
}

function HtmlPreview({ html, device, editMode, onEditHtml, onSelect }: {
  html: string; device: "desktop" | "mobile"; editMode: boolean; onEditHtml: (html: string) => void; onSelect: (s: { tag: string; text: string; src?: string }) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (!editMode) return;
    const onMsg = (e: MessageEvent) => { const d = e.data || {}; if (d.__cms === "edit" && typeof d.html === "string") onEditHtml(stripEdit(d.html)); else if (d.__cms === "select") onSelect({ tag: d.tag, text: d.text, src: d.src }); };
    window.addEventListener("message", onMsg); return () => window.removeEventListener("message", onMsg);
  }, [editMode, onEditHtml, onSelect]);
  const page = useMemo(() => parsePage(html), [html]);
  const cmd = (c: string, v?: string) => iframeRef.current?.contentWindow?.postMessage({ __cmscmd: c, val: v }, "*");
  const scrollTo = (i: number) => { try { iframeRef.current?.contentDocument?.body?.children[i]?.scrollIntoView({ behavior: "smooth", block: "start" }); } catch {} };
  const srcDoc = editMode ? stripEdit(html) + EDIT_SCRIPT : html;
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {editMode && <EditToolbar onCmd={cmd} />}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <SectionRail head={page.head} sections={page.sections} onScroll={scrollTo} onReorder={(order) => onEditHtml(reorderSections(html, order))} />
        <DeviceFrame device={device}><iframe ref={iframeRef} title="preview" srcDoc={srcDoc} style={{ width: "100%", height: "100%", border: "none", display: "block" }} /></DeviceFrame>
      </div>
    </div>
  );
}

function ImageArt({ a }: { a: Extract<Artifact, { kind: "image" }> }) {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const s = await fetch("/api/image/render", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt: a.imagePrompt, ratio: a.ratio }) });
        const j = await s.json(); const id = j.id;
        if (!id) { setErr(j.message || "Image render unavailable."); return; }
        for (let i = 0; i < 25 && !stop; i++) { await new Promise((r) => setTimeout(r, 2500)); const st = await (await fetch(`/api/image/status/${id}`)).json(); if (st.status === "succeeded") { setUrl(st.url); return; } if (st.status === "failed") { setErr(st.message || "Render failed."); return; } }
      } catch (e: any) { setErr(e.message); }
    })();
    return () => { stop = true; };
  }, [a.imagePrompt, a.ratio]);
  return (
    <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 24, background: soft }}>
      {url ? <img src={url} alt={a.imagePrompt} style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: R.lg, boxShadow: "var(--hc-shadow-lg)" }} />
        : err ? <div style={{ color: muted, ...TYPE.sm, textAlign: "center", maxWidth: 320 }}>{err}<div style={{ marginTop: 8, color: fg }}>{a.imagePrompt}</div></div>
        : <div style={{ color: muted, ...TYPE.sm }}>Rendering image…</div>}
    </div>
  );
}

function PreviewBody({ artifact, device, editMode, onEditHtml, onSelect }: {
  artifact: Artifact | null; device: "desktop" | "mobile"; editMode: boolean; onEditHtml: (html: string) => void; onSelect: (s: { tag: string; text: string; src?: string }) => void;
}) {
  if (!artifact) return <PreviewEmptyState />;
  if (artifact.kind === "html") return <HtmlPreview html={artifact.html} device={device} editMode={editMode} onEditHtml={onEditHtml} onSelect={onSelect} />;
  if (artifact.kind === "doc") {
    const d = artifact.doc || {};
    return (
      <div style={{ flex: 1, overflow: "auto", padding: device === "mobile" ? "24px 18px" : "32px 44px", background: card }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {d.category && <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: primary }}>{d.category}</div>}
          <h1 style={{ fontSize: 30, fontWeight: 800, color: fg, margin: "8px 0 12px" }}>{d.title || "Untitled"}</h1>
          {d.summary && <p style={{ ...TYPE.base, color: muted, margin: "0 0 18px" }}>{d.summary}</p>}
          <div style={{ color: fg, lineHeight: 1.7 }}><Markdown text={d.bodyMarkdown || ""} /></div>
        </div>
      </div>
    );
  }
  if (artifact.kind === "image") return <ImageArt a={artifact} />;
  if (artifact.kind === "brand") {
    const b = artifact.brand || {};
    return (
      <div style={{ flex: 1, overflow: "auto", padding: 28, background: card }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: fg, margin: "0 0 6px" }}>{b.name || "Brand Guideline"}</h2>
        <p style={{ color: muted, margin: "0 0 18px" }}>{b.summary}</p>
        {Array.isArray(b.palette) && <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>{b.palette.map((c: any, i: number) => (<div key={i} style={{ textAlign: "center" }}><div style={{ width: 64, height: 64, borderRadius: R.xl, background: typeof c === "string" ? c : c.hex, border: `1px solid ${border}` }} /><div style={{ fontSize: 11, color: muted, marginTop: 4 }}>{typeof c === "string" ? c : c.hex}</div></div>))}</div>}
        {Array.isArray(b.sections) && b.sections.map((s: any, i: number) => (<div key={i} style={{ marginBottom: 14 }}><div style={{ fontWeight: 700, color: fg }}>{s.title}</div><div style={{ color: muted, ...TYPE.sm }}><Markdown text={s.content || ""} /></div></div>))}
      </div>
    );
  }
  if (artifact.kind === "theme") {
    const t = artifact.theme || {}; const colors = t.colors || t.palette || t;
    const entries = colors && typeof colors === "object" ? Object.entries(colors).filter(([, v]) => typeof v === "string") : [];
    return (
      <div style={{ flex: 1, overflow: "auto", padding: 28, background: card }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: fg, margin: "0 0 18px" }}>{artifact.title || "Theme"}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px,1fr))", gap: 12 }}>{entries.map(([k, v]: any) => (<div key={k} style={{ borderRadius: R.xl, overflow: "hidden", border: `1px solid ${border}` }}><div style={{ height: 64, background: v }} /><div style={{ padding: "6px 8px", fontSize: 12, color: fg }}><b>{k}</b><div style={{ color: muted }}>{v}</div></div></div>))}</div>
      </div>
    );
  }
  return (
    <div style={{ flex: 1, overflow: "auto", padding: 28, background: card }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: primary, fontWeight: 700, marginBottom: 12 }}><VideoIcon size={18} /> Video storyboard</div>
      <div style={{ color: fg, lineHeight: 1.7 }}><Markdown text={artifact.kind === "video" ? (artifact.script || artifact.videoPrompt) : ""} /></div>
    </div>
  );
}

function SeoView({ artifact }: { artifact: Artifact | null }) {
  const seo = useMemo(() => {
    if (artifact?.kind === "doc") return artifact.doc?.seo || {};
    if (artifact?.kind === "html") { const h = artifact.html || ""; return { title: h.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || "", description: h.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] || "" }; }
    return {};
  }, [artifact]);
  const checks = [
    { ok: !!seo.title && seo.title.length <= 60, label: `Title tag ${seo.title ? `(${seo.title.length} chars)` : "missing"}` },
    { ok: !!seo.description && seo.description.length <= 160, label: `Meta description ${seo.description ? `(${seo.description.length} chars)` : "missing"}` },
    { ok: Array.isArray(seo.keywords) && seo.keywords.length > 0, label: "Keywords / tags" },
    { ok: artifact?.kind === "html", label: "Renderable page output" },
  ];
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  return (
    <div style={{ padding: 28, overflow: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: `conic-gradient(${primary} ${score * 3.6}deg, var(--hc-muted) 0)`, display: "grid", placeItems: "center" }}><div style={{ width: 48, height: 48, borderRadius: "50%", background: card, display: "grid", placeItems: "center", fontWeight: 800, color: fg }}>{score}</div></div>
        <div><div style={{ fontWeight: 800, color: fg, ...TYPE.base }}>SEO readiness</div><div style={{ color: muted, ...TYPE.sm }}>Ask the agent: “improve SEO for this page”.</div></div>
      </div>
      {seo.title && <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, color: muted, fontWeight: 700 }}>TITLE</div><div style={{ color: fg }}>{seo.title}</div></div>}
      {seo.description && <div style={{ marginBottom: 16 }}><div style={{ fontSize: 12, color: muted, fontWeight: 700 }}>DESCRIPTION</div><div style={{ color: fg }}>{seo.description}</div></div>}
      <div style={{ display: "grid", gap: 8 }}>{checks.map((c, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: 10, ...TYPE.sm, color: fg }}><span style={{ width: 20, height: 20, borderRadius: "50%", background: c.ok ? primary : soft, color: "var(--primary-foreground)", display: "grid", placeItems: "center" }}>{c.ok ? <CheckIcon size={13} color="var(--primary-foreground)" /> : ""}</span>{c.label}</div>))}</div>
    </div>
  );
}

// Derive a publishable {title, bodyMarkdown} from the current artifact.
function artifactToPublish(a: Artifact | null): { title: string; body: string; category?: string } | null {
  if (!a) return null;
  if (a.kind === "doc") return { title: a.doc?.title || "Untitled", body: a.doc?.bodyMarkdown || a.doc?.summary || "", category: a.doc?.category };
  if (a.kind === "html") {
    const { doc, body } = parseDoc(a.html);
    const title = doc?.querySelector("title")?.textContent || doc?.querySelector("h1")?.textContent || a.title || "Untitled page";
    let md = "";
    body?.querySelectorAll("h1,h2,h3,p,li").forEach((el) => { const t = (el.textContent || "").trim(); if (!t) return; const tag = el.tagName.toLowerCase(); md += (tag[0] === "h" ? "## " : tag === "li" ? "- " : "") + t + "\n\n"; });
    return { title: title.trim(), body: md.trim() };
  }
  return null;
}
const MODULES: [string, string][] = [["articles", "Article"], ["blogPosts", "Blog post"], ["pressReleases", "Press release"], ["events", "Event"], ["caseStudies", "Case study"], ["faqs", "FAQ"], ["products", "Product"]];

function PublishView({ artifact, canPublish }: { artifact: Artifact | null; canPublish: boolean }) {
  const pub = useMemo(() => artifactToPublish(artifact), [artifact]);
  const [coll, setColl] = useState("articles");
  const [busy, setBusy] = useState(false);
  const [sched, setSched] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const can = !!pub;

  async function send(schedule: boolean) {
    if (!pub || busy) return; setBusy(true); setMsg(null);
    const scheduledAt = schedule && sched ? new Date(sched).toISOString() : undefined;
    try {
      const r = await fetch("/api/publish", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ collection: coll, title: pub.title, bodyMarkdown: pub.body, category: pub.category, scheduledAt }) });
      const j = await r.json();
      const label = MODULES.find((m) => m[0] === coll)?.[1] || coll;
      if (!r.ok) setMsg({ ok: false, text: j.error || "Could not create the draft." });
      else if (j.scheduled) setMsg({ ok: true, text: `Draft #${j.id} created in ${label} and scheduled to auto-publish at ${new Date(sched).toLocaleString()}.` });
      else setMsg({ ok: true, text: `Draft #${j.id} created in ${label}. It’s a governed, AI-flagged draft in the Review queue.` });
    } catch { setMsg({ ok: false, text: "Publish service unavailable." }); }
    setBusy(false);
  }

  return (
    <div style={{ padding: 28, overflow: "auto" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: R.full, background: can ? pill : soft, color: primary, fontWeight: 700, fontSize: 13 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: can ? "var(--hc-warning)" : muted }} /> {can ? "Ready to send for review" : "Generate a page or content first"}</div>
      <div style={{ marginTop: 16, color: muted, ...TYPE.sm, maxWidth: 480, lineHeight: 1.6 }}>Content moves through <b>Draft → In Review → Approved → Published</b>. Sending here creates a real, versioned draft (AI-flagged, so a human must approve before it goes live) — it then appears in the <b>Review</b> queue.</div>

      <div style={{ marginTop: 20, display: "grid", gap: 12, maxWidth: 460 }}>
        <label style={{ ...TYPE.sm }}>
          <div style={{ fontWeight: 700, color: fg, marginBottom: 6 }}>Publish into module</div>
          <select value={coll} onChange={(e) => setColl(e.target.value)} disabled={!can} style={{ width: "100%", height: 38, borderRadius: R.lg, border: `1px solid ${border}`, background: card, color: fg, padding: "0 10px", ...TYPE.sm }}>
            {MODULES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label style={{ ...TYPE.sm }}>
          <div style={{ fontWeight: 700, color: fg, marginBottom: 6 }}>Schedule (optional)</div>
          <input type="datetime-local" value={sched} onChange={(e) => setSched(e.target.value)} disabled={!can} style={{ width: "100%", height: 38, borderRadius: R.lg, border: `1px solid ${border}`, background: card, color: fg, padding: "0 10px", ...TYPE.sm }} />
        </label>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <Button loading={busy} disabled={!can || busy} onClick={() => send(false)}>{busy ? "Sending…" : "Send for review"}</Button>
        <Button appearance="outline" variant="secondary" disabled={!can || busy || !sched} title={!sched ? "Pick a date first" : undefined} onClick={() => send(true)}>Schedule</Button>
      </div>

      {msg && <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: R.lg, background: msg.ok ? pill : "rgba(220,38,38,0.08)", color: msg.ok ? primary : "var(--hc-destructive)", ...TYPE.sm, display: "flex", alignItems: "center", gap: 10 }}>
        <span>{msg.text}</span>
        {msg.ok && <a href="/review" style={{ color: primary, fontWeight: 700, whiteSpace: "nowrap" }}>Open Review →</a>}
      </div>}

      <div style={{ marginTop: 14, fontSize: 12.5, color: muted }}>{canPublish ? "As a publisher, you can approve & publish it from the Review queue (you can’t approve your own content — separation of duties)." : "Your role can draft & request review; approval and go-live happen in Review, by a Publisher / Admin."} Scheduled items auto-publish at the chosen time via the governed workflow (a 60s sweeper records the editorial approval and takes it live).</div>
    </div>
  );
}

// ---- Version history (LEAP D4): real DB-backed snapshots ----
// A stable identity for the current artifact so snapshots group together.
function slugify(s: string): string { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "untitled"; }
function titleOf(a: Artifact | null): string {
  if (!a) return "";
  if ("title" in a && a.title) return a.title as string;
  if (a.kind === "doc") return a.doc?.title || "document";
  if (a.kind === "html") { const m = (a.html || "").match(/<title[^>]*>([^<]*)<\/title>/i) || (a.html || "").match(/<h1[^>]*>([^<]*)<\/h1>/i); return (m?.[1] || "page").trim(); }
  return a.kind;
}
function artifactKeyOf(a: Artifact | null): string | null { if (!a) return null; return `${a.kind}:${slugify(titleOf(a))}`; }
function htmlOf(a: Artifact | null): string {
  if (!a) return "";
  if (a.kind === "html") return a.html || "";
  if (a.kind === "doc") return `<!doctype html><meta charset="utf-8"><title>${(a.doc?.title || "Document")}</title><body><article style="max-width:720px;margin:40px auto;font-family:system-ui"><h1>${a.doc?.title || ""}</h1><div>${(a.doc?.bodyMarkdown || a.doc?.summary || "").replace(/\n/g, "<br>")}</div></article>`;
  return "";
}
function relTime(iso: string): string {
  const t = new Date(iso).getTime(); if (!t) return "";
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`; const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`; const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`; return new Date(iso).toLocaleString();
}
function downloadHtml(html: string, filename: string) {
  const blob = new Blob([html || ""], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
function openHtml(html: string) {
  const blob = new Blob([html || ""], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function VersionsView({ artifact, onRestore }: { artifact: Artifact | null; onRestore: (html: string) => void }) {
  const key = useMemo(() => artifactKeyOf(artifact), [artifact]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const load = async () => {
    if (!key) { setRows([]); return; }
    setLoading(true);
    try { const r = await fetch(`/api/versions?key=${encodeURIComponent(key)}`); const j = await r.json(); setRows(j.versions || []); } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [key]);

  const saveNow = async () => {
    if (!key || !artifact) return; setBusy("save"); setMsg("");
    try {
      await fetch("/api/versions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key, kind: artifact.kind, title: titleOf(artifact), label: "checkpoint", html: htmlOf(artifact), doc: artifact.kind === "doc" ? artifact.doc : undefined }) });
      setMsg("Checkpoint saved."); await load();
    } catch { setMsg("Could not save checkpoint."); }
    setBusy(null);
  };
  const restore = async (id: string) => {
    setBusy(`r${id}`); setMsg("");
    try { const r = await fetch(`/api/versions/${id}`); const j = await r.json(); if (j.html) { onRestore(j.html); setMsg("Restored this version into the editor."); } else setMsg("This version has no HTML to restore."); } catch { setMsg("Restore failed."); }
    setBusy(null);
  };
  const download = async (id: string, title: string) => {
    setBusy(`d${id}`);
    try { const r = await fetch(`/api/versions/${id}`); const j = await r.json(); downloadHtml(j.html || "", `${slugify(title || "version")}.html`); } catch {}
    setBusy(null);
  };

  return (
    <div style={{ padding: 28, overflow: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, gap: 12 }}>
        <div style={{ fontWeight: 800, color: fg, ...TYPE.base }}>Version history</div>
        <Button size="sm" loading={busy === "save"} disabled={!artifact || busy === "save"} onClick={saveNow}>{busy === "save" ? "Saving…" : "Save version"}</Button>
      </div>
      <div style={{ color: muted, ...TYPE.sm, marginBottom: 16 }}>Snapshots are captured automatically as you edit (and whenever you save a checkpoint). Restore any version into the editor, or download it as a standalone file.</div>
      {msg && <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: R.lg, background: pill, color: primary, ...TYPE.sm }}>{msg}</div>}
      {loading ? <div style={{ color: muted, ...TYPE.sm }}>Loading versions…</div>
        : rows.length === 0 ? <div style={{ color: muted, ...TYPE.sm }}>No versions yet — edit or save a checkpoint to start the history.</div>
          : rows.map((r, i) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: R.xl, border: `1px solid ${border}`, marginBottom: 8, gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: fg }}>{i === 0 ? "Latest" : `Version ${rows.length - i}`} · {r.label || "autosave"}</div>
                <div style={{ fontSize: 12.5, color: muted }}>{relTime(r.createdAt)}{r.by ? ` · ${r.by}` : ""}</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <Button appearance="outline" variant="secondary" size="sm" disabled={busy === `d${r.id}`} title="Download this version" onClick={() => download(r.id, r.title)}>{busy === `d${r.id}` ? "…" : "Download"}</Button>
                <Button appearance="soft" variant="primary" size="sm" disabled={busy === `r${r.id}`} onClick={() => restore(r.id)}>{busy === `r${r.id}` ? "Restoring…" : "Restore"}</Button>
              </div>
            </div>
          ))}
    </div>
  );
}

function AssetsView() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { (async () => { try { const r = await fetch("/api/projects?limit=12&sort=-createdAt"); const j = await r.json(); setItems(j.docs || []); } catch {} })(); }, []);
  return (
    <div style={{ padding: 28, overflow: "auto" }}>
      <div style={{ fontWeight: 800, color: fg, ...TYPE.base, marginBottom: 14 }}>Asset library</div>
      {items.length === 0 ? <div style={{ color: muted, ...TYPE.sm }}>No assets yet. Generated pages, images and content are saved here automatically.</div> :
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 12 }}>{items.map((it: any, i: number) => (<div key={i} style={{ borderRadius: R.xl, border: `1px solid ${border}`, overflow: "hidden" }}><div style={{ height: 84, background: soft, display: "grid", placeItems: "center", color: primary }}><GlobeIcon size={22} /></div><div style={{ padding: "8px 10px", fontSize: 12.5 }}><div style={{ fontWeight: 700, color: fg, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.title || it.name || "Untitled"}</div><div style={{ color: muted }}>{it.type || "asset"}</div></div></div>))}</div>}
    </div>
  );
}

export default function CmsPreview({
  phase, artifact, tab, setTab, device, setDevice, canEdit, canPublish, tier, onClose, onEditHtml, onAskAboutSelection,
}: {
  phase: Phase; artifact: Artifact | null;
  tab: CmsTab; setTab: (t: CmsTab) => void;
  device: "desktop" | "mobile"; setDevice: (d: "desktop" | "mobile") => void;
  canEdit: boolean; canPublish: boolean; tier: Tier;
  onClose: () => void; onEditHtml: (html: string) => void; onAskAboutSelection: (text: string) => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [sel, setSel] = useState<{ tag: string; text: string; src?: string } | null>(null);
  const [srcOpen, setSrcOpen] = useState(false);
  const [imgBusy, setImgBusy] = useState(false);
  const isHtml = artifact?.kind === "html";
  const canDownload = !!htmlOf(artifact);

  // Per-image AI generation (gamma-style): select an <img> in the canvas, then
  // "Regenerate image" — renders a new image via the image pipeline and swaps it
  // into the page HTML in place. No page rebuild; the edit persists via onEditHtml.
  async function regenImage() {
    if (!sel || sel.tag !== "img" || !sel.src || artifact?.kind !== "html" || imgBusy) return;
    const desc = window.prompt("Describe the image to generate for this spot:", sel.text || "");
    if (!desc || !desc.trim()) return;
    setImgBusy(true);
    try {
      const r = await fetch("/api/image/render", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt: desc.trim() }) });
      const j = await r.json();
      if (!j.id) { window.alert(j.message || "Image service is not configured."); setImgBusy(false); return; }
      let url = "";
      for (let i = 0; i < 40; i++) {
        await new Promise((res) => setTimeout(res, 2500));
        const st = await (await fetch(`/api/image/status/${j.id}`)).json();
        if (st.status === "succeeded") { url = st.url; break; }
        if (st.status === "failed") { window.alert(st.message || "Image render failed."); break; }
      }
      if (url && artifact?.kind === "html") {
        const cur = artifact.html;
        const attr = `src="${sel.src}"`;
        onEditHtml(cur.includes(attr) ? cur.replace(attr, `src="${url}"`) : cur.split(sel.src).join(url));
        setSel((s) => (s ? { ...s, src: url } : s));
      }
    } catch (e: any) { window.alert(e?.message || "Image render error."); }
    setImgBusy(false);
  }

  // D4 — auto-capture a version snapshot 2.5s after edits settle (debounced),
  // de-duplicated so identical content isn't re-saved.
  const lastSnap = useRef<string>("");
  useEffect(() => {
    if (!artifact || (artifact.kind !== "html" && artifact.kind !== "doc")) return;
    const key = artifactKeyOf(artifact);
    const content = htmlOf(artifact);
    if (!key || !content || content.length < 40) return;
    const sig = `${key}|${content.length}|${content.slice(0, 64)}|${content.slice(-64)}`;
    if (sig === lastSnap.current) return;
    const t = setTimeout(() => {
      lastSnap.current = sig;
      fetch("/api/versions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key, kind: artifact.kind, title: titleOf(artifact), label: "autosave", html: content, doc: artifact.kind === "doc" ? artifact.doc : undefined }) }).catch(() => {});
    }, 2500);
    return () => clearTimeout(t);
  }, [artifact]);
  const tabs = TABS.filter((t) => TIER_RANK[tier] >= TIER_RANK[t.minTier]);
  useEffect(() => { if (!tabs.some((t) => t.key === tab)) setTab("preview"); }, [tier]); // eslint-disable-line
  const editable = tab === "preview" && artifact?.kind === "html";
  const showCanvas = !!artifact || (phase === "ready");
  const title = artifact ? (("title" in artifact && artifact.title) || (artifact.kind === "doc" ? artifact.doc?.title : "") || `${artifact.kind[0].toUpperCase()}${artifact.kind.slice(1)} preview`) : "CMS setup";
  const status = phase === "setup" ? "Setup in progress" : phase === "generating" ? "Generating…" : editMode ? "Editing" : "Ready";
  const statusBg = phase === "generating" ? "var(--hc-warning)" : phase === "ready" ? "var(--hc-primary)" : "var(--hc-fg-muted)";

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0, borderRadius: R.x2, background: card, border: `1px solid ${border}`, overflow: "hidden", boxShadow: "var(--hc-shadow-md)" }}>
      {/* Decks-style header: title + subtitle + status badge + download/expand/close */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderBottom: `1px solid ${border}` }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, color: fg, ...TYPE.sm, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
          <div style={{ color: muted, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Live preview · {artifact?.kind ?? "workspace"}</div>
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: R.full, background: pill, color: primary, fontWeight: 700, fontSize: 12 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusBg }} /> {status}
        </span>
        {isHtml && (
          <Button appearance={srcOpen ? "soft" : "ghost"} variant={srcOpen ? "primary" : "secondary"} size="icon-sm" title="HTML source" aria-label="HTML source" onClick={() => setSrcOpen((v) => !v)}>
            <Code2 className="size-4" />
          </Button>
        )}
        {showCanvas && (
          <Button appearance="ghost" variant="secondary" size="icon-sm" title="Download HTML" aria-label="Download HTML" disabled={!canDownload} onClick={() => downloadHtml(htmlOf(artifact), `${slugify(titleOf(artifact))}.html`)}>
            <Download className="size-4" />
          </Button>
        )}
        {showCanvas && (
          <Button appearance="ghost" variant="secondary" size="icon-sm" title="Open full page in a new tab" aria-label="Open full page in a new tab" disabled={!canDownload} onClick={() => openHtml(htmlOf(artifact))}>
            <Maximize2 className="size-4" />
          </Button>
        )}
        <Button appearance="ghost" variant="secondary" size="icon-sm" title="Close" aria-label="Close preview" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {phase === "setup" && !artifact ? <SetupState />
        : phase === "generating" && !artifact ? <GeneratingState />
        : (
          <>
            {/* Tab bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "6px 10px", borderBottom: `1px solid ${border}` }}>
              {tabs.map(({ key, label, Icon }) => (
                <Button
                  key={key}
                  size="sm"
                  appearance={tab === key ? "soft" : "ghost"}
                  variant={tab === key ? "primary" : "secondary"}
                  onClick={() => setTab(key)}
                >
                  <Icon size={16} /> {label}
                </Button>
              ))}
              <div style={{ flex: 1 }} />
              {editable && (
                <button onClick={() => { setEditMode((v) => !v); setSel(null); }} title="Visually edit elements"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 30, padding: "0 11px", borderRadius: R.lg, border: "none", background: editMode ? primary : soft, color: editMode ? "var(--primary-foreground)" : primary, fontWeight: 700, fontSize: 12.5, cursor: "pointer", marginRight: 8 }}>
                  <PencilIcon size={14} color={editMode ? "var(--primary-foreground)" : primary} /> {editMode ? "Editing" : "Edit"}
                </button>
              )}
              {tab === "preview" && (
                <div style={{ display: "inline-flex", background: soft, borderRadius: R.lg, padding: 3 }}>
                  {(["desktop", "mobile"] as const).map((d) => (
                    <Button
                      key={d}
                      size="icon-sm"
                      appearance={device === d ? "soft" : "ghost"}
                      variant={device === d ? "primary" : "secondary"}
                      title={d}
                      aria-label={`${d} preview`}
                      onClick={() => setDevice(d)}
                    >
                      {d === "mobile" ? <Smartphone className="size-4" /> : <Monitor className="size-4" />}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Selection toolbar (visual editing) */}
            {sel && ((tab === "preview" && editMode) || tab === "editor") && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: pill, borderBottom: `1px solid ${border}`, fontSize: 13 }}>
                <span style={{ fontWeight: 700, color: primary }}>&lt;{sel.tag}&gt;</span>
                <span style={{ color: muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{sel.tag === "img" ? "(image selected — regenerate it with AI)" : sel.text.slice(0, 70) || "(selected — type to edit inline)"}</span>
                {sel.tag === "img" && (
                  <Button size="xs" loading={imgBusy} disabled={imgBusy} startIcon={<ImageIcon className="size-3.5" />} onClick={regenImage}>
                    {imgBusy ? "Generating…" : "Regenerate image"}
                  </Button>
                )}
                <Button size="xs" startIcon={<Sparkles className="size-3.5" />} onClick={() => onAskAboutSelection(sel.text)}>
                  Ask AI to change this
                </Button>
              </div>
            )}

            {/* Body (content column + optional HTML source panel) */}
            <div style={{ flex: 1, minHeight: 0, display: "flex", background: card }}>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                {tab === "preview" && <PreviewBody artifact={artifact} device={device} editMode={editMode} onEditHtml={onEditHtml} onSelect={setSel} />}
                {tab === "outline" && <OutlineView artifact={artifact} onEditHtml={onEditHtml} />}
                {tab === "editor" && (isHtml
                  ? <PreviewBody artifact={artifact} device={device} editMode={true} onEditHtml={onEditHtml} onSelect={setSel} />
                  : <div style={{ flex: 1, overflow: "auto" }}><ContentManager initialType={artifact?.kind === "doc" ? (artifact.doc?.type || "blog") : "blog"} canEdit={canEdit} canPublish={canPublish} /></div>)}
                {tab === "seo" && <SeoView artifact={artifact} />}
                {tab === "publish" && <PublishView artifact={artifact} canPublish={canPublish} />}
                {tab === "versions" && <VersionsView artifact={artifact} onRestore={onEditHtml} />}
                {tab === "assets" && <AssetsView />}
              </div>
              {srcOpen && artifact?.kind === "html" && (
                <div style={{ width: 340, flexShrink: 0, borderLeft: `1px solid ${border}`, display: "flex", flexDirection: "column", background: card }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: `1px solid ${border}` }}>
                    <span style={{ fontWeight: 700, color: fg, fontSize: 12, letterSpacing: ".05em" }}>HTML SOURCE</span>
                    <Button appearance="ghost" variant="secondary" size="icon-xs" aria-label="Close source view" onClick={() => setSrcOpen(false)}>
                      <X className="size-3.5" />
                    </Button>
                  </div>
                  <textarea value={artifact.html} onChange={(e) => onEditHtml(e.target.value)} spellCheck={false}
                    style={{ flex: 1, border: "none", outline: "none", resize: "none", padding: 12, background: "var(--hc-muted)", color: fg, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12, lineHeight: 1.5 }} />
                </div>
              )}
            </div>
          </>
        )}
    </div>
  );
}
