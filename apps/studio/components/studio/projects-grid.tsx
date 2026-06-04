"use client";
import { useState } from "react";
import {
  MonitorIcon, ImageIcon, GlobeIcon, MailIcon, PaletteIcon, FileIcon, TranslateIcon, XIcon,
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
};

function ago(iso?: string) {
  if (!iso) return "";
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 3600) return `${Math.max(1, Math.round(d / 60))}m ago`;
  if (d < 86400) return `${Math.round(d / 3600)}h ago`;
  return `${Math.round(d / 86400)}d ago`;
}

export default function ProjectsGrid({ projects }: { projects: Project[] }) {
  const [openId, setOpenId] = useState<string | number | null>(null);
  const open = projects.find((p) => p.id === openId) || null;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
        {projects.map((p) => {
          const m = META[p.type] ?? META.writing;
          const Icon = m.Icon;
          return (
            <button
              key={p.id}
              onClick={() => setOpenId(p.id)}
              style={{ textAlign: "left", border: "1px solid var(--hairline)", borderRadius: 14, overflow: "hidden", background: "#fff", cursor: "pointer", padding: 0 }}
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
          );
        })}
      </div>

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
