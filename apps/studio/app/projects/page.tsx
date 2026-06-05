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
    const res = await payloadFetch("/api/projects?sort=-createdAt&limit=60&depth=0");
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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Projects</h1>
          <p style={{ color: "var(--muted)", fontSize: 13.5, margin: "4px 0 24px" }}>
            {projects.length} project{projects.length === 1 ? "" : "s"} · click <strong style={{ color: "var(--studio-teal-dark)" }}>New project</strong> to create one with Claude or start blank.
          </p>

          <ProjectsGrid projects={projects} />
        </div>
      </main>
    </div>
  );
}
