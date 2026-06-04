import {
  MonitorIcon, ImageIcon, GlobeIcon, MailIcon, PaletteIcon, FileIcon, TranslateIcon,
} from "@/components/icons";

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
};

function ago(iso?: string) {
  if (!iso) return "";
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 3600) return `Updated ${Math.max(1, Math.round(d / 60))}m ago`;
  if (d < 86400) return `Updated ${Math.round(d / 3600)}h ago`;
  return `Updated ${Math.round(d / 86400)}d ago`;
}

export default function ContinueCreating({ projects }: { projects: Project[] }) {
  if (!projects.length) return null;
  return (
    <div style={{ maxWidth: 1080, margin: "48px auto 0", padding: "0 8px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Continue creating</h2>
        <a href="/studio?panel=projects" style={{ fontSize: 14, color: "var(--muted)", textDecoration: "none" }}>See all projects</a>
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
