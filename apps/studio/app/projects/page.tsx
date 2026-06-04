import { redirect } from "next/navigation";
import { getCurrentUser, payloadFetch } from "@/lib/payload";
import Sidebar from "@/components/studio/sidebar";
import ProjectsGrid, { type Project } from "@/components/studio/projects-grid";

export const metadata = { title: "Projects · HUMAIN" };
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let projects: Project[] = [];
  try {
    const res = await payloadFetch("/api/projects?sort=-updatedAt&limit=60&depth=0");
    if (res.ok) {
      projects = ((await res.json()).docs ?? []).map((d: any) => ({
        id: d.id, title: d.title, type: d.type, updatedAt: d.updatedAt,
        text: typeof d.asset?.text === "string" ? d.asset.text : "",
        preview: Boolean(d.asset?.preview),
      }));
    }
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
            <ProjectsGrid projects={projects} />
          )}
        </div>
      </main>
    </div>
  );
}
