import { redirect } from "next/navigation";
import { getCurrentUser, payloadFetch } from "@/lib/payload";
import Sidebar from "@/components/studio/sidebar";
import {
  MonitorIcon, ImageIcon, GlobeIcon, MailIcon, PaletteIcon, FileIcon, TranslateIcon,
} from "@/components/icons";

export const metadata = { title: "Projects · HUMAIN" };
export const dynamic = "force-dynamic";

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

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let projects: any[] = [];
  try {
    const res = await payloadFetch("/api/projects?sort=-updatedAt&limit=60&depth=0");
    if (res.ok) projects = (await res.json()).docs ?? [];
  } catch {
    /* ignore */
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#eef4f3" }}>
      <Sidebar user={{ name: user.name, email: user.email, roles: user.roles }} active="projects" />
      <main style={{ flex: 1, padding: "10px 10px 10px 0" }}>
        <div style={{ minHeight: "calc(100vh - 20px)", borderRadius: 22, background: "#fff", border: "1px solid var(--hairline)", padding: "36px 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Projects</h1>
            <a href="/studio" style={{ fontSize: 14, color: "var(--studio-primary)", fontWeight: 600, textDecoration: "none" }}>+ Create new</a>
          </div>
          <p style={{ color: "var(--muted)", fontSize: 13.5, margin: "0 0 24px" }}>{projects.length} project{projects.length === 1 ? "" : "s"} from Create Studio.</p>

          {projects.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--muted)", padding: "60px 0" }}>
              No projects yet. <a href="/studio" style={{ color: "var(--studio-primary)", fontWeight: 600 }}>Create your first one →</a>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
              {projects.map((p) => {
                const m = META[p.type] ?? META.writing;
                const Icon = m.Icon;
                const text = typeof p.asset?.text === "string" ? p.asset.text : "";
                return (
                  <div key={p.id} style={{ border: "1px solid var(--hairline)", borderRadius: 14, overflow: "hidden", background: "#fff" }}>
                    <div style={{ height: 84, background: m.grad, display: "grid", placeItems: "center", color: "var(--studio-teal-dark)" }}>
                      <Icon size={26} />
                    </div>
                    <div style={{ padding: "12px 14px 14px" }}>
                      <span style={{ display: "inline-block", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", color: "var(--studio-teal-dark)", background: "var(--mint-pill)", padding: "2px 8px", borderRadius: 999 }}>{m.label}</span>
                      <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)", marginTop: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                      {text && <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 6, lineHeight: 1.5, maxHeight: 54, overflow: "hidden" }}>{text.slice(0, 120)}</div>}
                      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 8 }}>Updated {ago(p.updatedAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
