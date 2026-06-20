"use client";
import {
  MonitorIcon, ImageIcon, GlobeIcon, MailIcon, PaletteIcon, FileIcon, TranslateIcon,
  CalendarIcon, MegaphoneIcon, BookmarkIcon, CodeIcon, VideoIcon, BuildingIcon,
} from "@/components/icons";
import { useT } from "@/lib/i18n-client";

export type Project = { id: string | number; title: string; type: string; updatedAt?: string };

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

function ago(iso?: string) {
  if (!iso) return "";
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 3600) return `Updated ${Math.max(1, Math.round(d / 60))}m ago`;
  if (d < 86400) return `Updated ${Math.round(d / 3600)}h ago`;
  return `Updated ${Math.round(d / 86400)}d ago`;
}

export default function ContinueCreating({ projects }: { projects: Project[] }) {
  const t = useT();
  if (!projects.length) return null;
  return (
    <div style={{ maxWidth: 1080, margin: "48px auto 0", padding: "0 8px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", margin: 0 }}>{t("home.continue")}</h2>
        <a href="/studio?panel=projects" style={{ fontSize: 14, color: "var(--muted)", textDecoration: "none" }}>{t("home.seeall")}</a>
      </div>
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
        {projects.map((p) => {
          const m = META[p.type] ?? META.writing;
          const Icon = m.Icon;
          return (
            <a key={p.id} href="/projects" style={{ textDecoration: "none", border: "1px solid var(--hairline)", borderRadius: 14, overflow: "hidden", background: "#fff", display: "block" }}>
              <div style={{ height: 92, background: m.grad, display: "grid", placeItems: "center", color: "var(--studio-teal-dark)" }}>
                <Icon size={26} />
              </div>
              <div style={{ padding: "10px 12px 12px" }}>
                <span style={{ display: "inline-block", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", color: "var(--studio-teal-dark)", background: "var(--mint-pill)", padding: "2px 8px", borderRadius: 999 }}>{m.label}</span>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)", marginTop: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{ago(p.updatedAt)}</div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
