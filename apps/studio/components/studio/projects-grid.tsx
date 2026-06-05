"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MonitorIcon, ImageIcon, GlobeIcon, MailIcon, PaletteIcon, FileIcon, TranslateIcon,
  XIcon, TrashIcon, PlusIcon, SparkIcon, CalendarIcon, MegaphoneIcon, BookmarkIcon,
  CodeIcon, VideoIcon, BuildingIcon,
} from "@/components/icons";

export type Project = { id: string | number; title: string; type: string; updatedAt?: string; text?: string; preview?: boolean };

const META: Record<string, { label: string; Icon: any; grad: string }> = {
  deck: { label: "DECK", Icon: MonitorIcon, grad: "linear-gradient(135deg,#e7f5ef,#d3ecdd)" },
  image: { label: "IMAGE", Icon: ImageIcon, grad: "linear-gradient(135deg,#eaf6e8,#dfeed6)" },
  website: { label: "WEBSITE", Icon: GlobeIcon, grad: "linear-gradient(135deg,#e6f4f1,#d6ece4)" },
  email: { label: "EMAIL", Icon: MailIcon, grad: "linear-gradient(135deg,#eef0f2,#e3e7ea)" },
  brand: { label: "BRAND", Icon: PaletteIcon, grad: "linear-gradient(135deg,#e8f5ee,#dceedd)" },
  designSystem: { label: "DESIGN SYSTEM", Icon: PaletteIcon, grad: "linear-gradient(135deg,#eef7d9,#e3f0c8)" },
  writing: { label: "WRITING", Icon: FileIcon, grad: "linear-gradient(135deg,#f3f1ec,#e7e2d8)" },
  translation: { label: "TRANSLATION", Icon: TranslateIcon, grad: "linear-gradient(135deg,#f6efd6,#ece0bf)" },
  event: { label: "EVENT", Icon: CalendarIcon, grad: "linear-gradient(135deg,#e7f5ef,#d6ecdf)" },
  webinar: { label: "WEBINAR", Icon: MonitorIcon, grad: "linear-gradient(135deg,#e6f2f4,#d6e9ec)" },
  conference: { label: "CONFERENCE", Icon: CalendarIcon, grad: "linear-gradient(135deg,#e7f1f5,#d6e7ee)" },
  summit: { label: "SUMMIT", Icon: BuildingIcon, grad: "linear-gradient(135deg,#eef2e6,#e1ead2)" },
  campaign: { label: "CAMPAIGN", Icon: MegaphoneIcon, grad: "linear-gradient(135deg,#f0ece6,#e6ddd0)" },
  brandGuideline: { label: "BRAND GUIDELINE", Icon: BookmarkIcon, grad: "linear-gradient(135deg,#e9f5ee,#dceede)" },
  websiteBuild: { label: "WEBSITE BUILD", Icon: CodeIcon, grad: "linear-gradient(135deg,#e6f4f1,#d3ece4)" },
  video: { label: "VIDEO", Icon: VideoIcon, grad: "linear-gradient(135deg,#1a2a2e,#0e2a2e)" },
};

const TYPE_OPTIONS = [
  { key: "writing", label: "Content" },
  { key: "websiteBuild", label: "Website" },
  { key: "email", label: "Email" },
  { key: "event", label: "Event" },
  { key: "webinar", label: "Webinar" },
  { key: "conference", label: "Conference" },
  { key: "summit", label: "Summit" },
  { key: "campaign", label: "Campaign" },
  { key: "brandGuideline", label: "Brand Guideline" },
  { key: "video", label: "Video" },
  { key: "deck", label: "Deck" },
  { key: "image", label: "Image" },
  { key: "translation", label: "Translation" },
  { key: "designSystem", label: "Design System" },
];

function ago(iso?: string) {
  if (!iso) return "";
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.max(1, Math.round(d / 60))}m ago`;
  if (d < 86400) return `${Math.round(d / 3600)}h ago`;
  return `${Math.round(d / 86400)}d ago`;
}

export default function ProjectsGrid({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | number | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | number | null>(null);
  const open = projects.find((p) => p.id === openId) || null;

  async function remove(id: string | number) {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (openId === id) setOpenId(null);
        router.refresh();
      } else {
        alert("Could not delete the project.");
      }
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
        {/* New project tile — always first */}
        <button
          onClick={() => setCreating(true)}
          style={{
            border: "1.5px dashed var(--studio-primary)", borderRadius: 14, background: "var(--mint-pill)",
            cursor: "pointer", minHeight: 188, display: "grid", placeItems: "center", color: "var(--studio-teal-dark)",
            padding: 16,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 46, height: 46, borderRadius: "50%", background: "var(--studio-primary)", color: "#fff", display: "grid", placeItems: "center", margin: "0 auto 10px" }}>
              <PlusIcon size={24} color="#fff" />
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 700 }}>New project</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>Generate with Claude or start blank</div>
          </div>
        </button>

        {projects.map((p) => {
          const m = META[p.type] ?? META.writing;
          const Icon = m.Icon;
          return (
            <div key={p.id} style={{ position: "relative", border: "1px solid var(--hairline)", borderRadius: 14, overflow: "hidden", background: "#fff" }}>
              <button
                onClick={() => setOpenId(p.id)}
                style={{ display: "block", width: "100%", textAlign: "left", border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
              >
                <div style={{ height: 84, background: m.grad, display: "grid", placeItems: "center", color: "var(--studio-teal-dark)" }}>
                  <Icon size={26} />
                </div>
                <div style={{ padding: "12px 14px 14px" }}>
                  <span style={{ display: "inline-block", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", color: "var(--studio-teal-dark)", background: "var(--mint-pill)", padding: "2px 8px", borderRadius: 999 }}>{m.label}</span>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)", marginTop: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                  {p.text && <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 6, lineHeight: 1.5, maxHeight: 54, overflow: "hidden" }}>{p.text.slice(0, 120)}</div>}
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 8 }}>Updated {ago(p.updatedAt)} · Open →</div>
                </div>
              </button>
              <button
                onClick={() => remove(p.id)}
                disabled={deleting === p.id}
                aria-label="Delete project"
                title="Delete"
                style={{ position: "absolute", top: 8, right: 8, width: 30, height: 30, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.9)", color: "#b42318", display: "grid", placeItems: "center", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }}
              >
                <TrashIcon size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {creating && <CreateModal onClose={() => setCreating(false)} onDone={() => { setCreating(false); router.refresh(); }} />}

      {open && (
        <div onClick={() => setOpenId(null)} style={{ position: "fixed", inset: 0, background: "rgba(11,20,22,0.45)", display: "grid", placeItems: "center", zIndex: 100, padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 760, maxHeight: "86vh", overflow: "auto", background: "#fff", borderRadius: 18, padding: "24px 26px", boxShadow: "var(--shadow-card)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div>
                <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", color: "var(--studio-teal-dark)", background: "var(--mint-pill)", padding: "3px 9px", borderRadius: 999 }}>
                  {(META[open.type] ?? META.writing).label}{open.preview ? " · PREVIEW" : ""}
                </span>
                <h2 style={{ fontSize: 19, fontWeight: 700, color: "var(--ink)", margin: "10px 0 0" }}>{open.title}</h2>
                <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>Updated {ago(open.updatedAt)}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => navigator.clipboard?.writeText(open.text || "")} style={{ border: "1px solid var(--hairline)", background: "#fff", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Copy</button>
                <button onClick={() => remove(open.id)} style={{ border: "1px solid #f4cdcb", background: "#fff", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, color: "#b42318", cursor: "pointer" }}>Delete</button>
                <button onClick={() => setOpenId(null)} aria-label="Close" style={{ border: "1px solid var(--hairline)", background: "#fff", borderRadius: 8, width: 32, height: 32, display: "grid", placeItems: "center", cursor: "pointer" }}><XIcon size={16} /></button>
              </div>
            </div>
            <div style={{ marginTop: 18, whiteSpace: "pre-wrap", color: "var(--ink)", lineHeight: 1.7, fontSize: 14.5 }}>
              {open.text || "(No content stored for this project.)"}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CreateModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("writing");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState<null | "gen" | "blank">(null);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    if (!prompt.trim()) { setErr("Enter a prompt to generate."); return; }
    setBusy("gen"); setErr(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: type, prompt, options: { title } }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Generation failed."); setBusy(null); return; }
      onDone();
    } catch {
      setErr("Could not reach the generation service."); setBusy(null);
    }
  }

  async function blank() {
    if (!title.trim()) { setErr("Enter a project title."); return; }
    setBusy("blank"); setErr(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, type, prompt }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Create failed."); setBusy(null); return; }
      onDone();
    } catch {
      setErr("Could not create the project."); setBusy(null);
    }
  }

  const field: React.CSSProperties = {
    width: "100%", border: "1px solid var(--hairline)", borderRadius: 10, padding: "10px 12px",
    fontSize: 14, color: "var(--ink)", outline: "none", background: "#fff",
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(11,20,22,0.45)", display: "grid", placeItems: "center", zIndex: 110, padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 540, background: "#fff", borderRadius: 18, padding: "24px 26px", boxShadow: "var(--shadow-card)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: "var(--ink)", margin: 0 }}>New project</h2>
          <button onClick={onClose} aria-label="Close" style={{ border: "1px solid var(--hairline)", background: "#fff", borderRadius: 8, width: 32, height: 32, display: "grid", placeItems: "center", cursor: "pointer" }}><XIcon size={16} /></button>
        </div>

        <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Q3 launch announcement" style={{ ...field, marginBottom: 14 }} />

        <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Type</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {TYPE_OPTIONS.map((t) => (
            <button key={t.key} onClick={() => setType(t.key)}
              style={{
                height: 32, padding: "0 12px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer",
                border: `1px solid ${type === t.key ? "var(--studio-primary)" : "var(--hairline)"}`,
                background: type === t.key ? "var(--mint-pill)" : "#fff",
                color: type === t.key ? "var(--studio-teal-dark)" : "var(--ink)",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Prompt</label>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe what you want to create…" rows={3} style={{ ...field, resize: "vertical", marginBottom: 6 }} />

        {err && <div style={{ color: "#b42318", fontSize: 13, margin: "6px 0" }}>{err}</div>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
          <button onClick={blank} disabled={!!busy}
            style={{ height: 42, padding: "0 16px", borderRadius: 10, border: "1px solid var(--hairline)", background: "#fff", color: "var(--ink)", fontSize: 14, fontWeight: 600, cursor: busy ? "default" : "pointer" }}>
            {busy === "blank" ? "Creating…" : "Create blank"}
          </button>
          <button onClick={generate} disabled={!!busy}
            style={{ height: 42, padding: "0 18px", borderRadius: 10, border: "none", background: "var(--studio-primary)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: busy ? "default" : "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <SparkIcon size={16} color="#fff" /> {busy === "gen" ? "Generating…" : "Generate with Claude"}
          </button>
        </div>
      </div>
    </div>
  );
}
