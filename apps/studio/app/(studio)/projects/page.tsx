import { redirect } from "next/navigation";
import { getCurrentUser, payloadFetch } from "@/lib/payload";
import { StudioPanel, StudioPageCard } from "@/components/studio/studio-app-shell";
import ProjectsGrid, { type Project } from "@/components/studio/projects-grid";
import ConsoleFrame from "@/components/studio/console-frame";

export const metadata = { title: "Projects · HUMAIN" };
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let projects: Project[] = [];
  try {
    const res = await payloadFetch("/api/projects?sort=-createdAt&limit=60&depth=0");
    if (res.ok) {
      // Map project -> its conversation so a project can re-open in chat.
      const convByProject = new Map<string, string | number>();
      try {
        const cr = await payloadFetch("/api/conversations?depth=0&limit=200");
        if (cr.ok) for (const c of ((await cr.json()).docs ?? [])) if (c.projectId) convByProject.set(String(c.projectId), c.id);
      } catch { /* ignore */ }
      projects = ((await res.json()).docs ?? []).map((d: any) => ({
        id: d.id, title: d.title, type: d.type, updatedAt: d.updatedAt,
        status: d.status ?? "draft",
        text: typeof d.asset?.text === "string" ? d.asset.text : "",
        preview: Boolean(d.asset?.preview),
        deckId: d.asset?.deckId, siteId: d.asset?.siteId, sitePath: d.asset?.path,
        html: typeof d.asset?.html === "string" ? d.asset.html : undefined,
        doc: d.asset?.doc ?? undefined,
        conversationId: convByProject.get(String(d.id)),
      }));
    }
  } catch {
    /* ignore */
  }

  return (
    <ConsoleFrame>
      <StudioPanel label="Projects">
        <StudioPageCard padding="36px 40px">
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Projects</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13.5, margin: "4px 0 24px" }}>
            {projects.length} project{projects.length === 1 ? "" : "s"} · click <strong style={{ color: "var(--studio-teal-dark)" }}>New project</strong> to create one with Claude or start blank.
          </p>

          <ProjectsGrid projects={projects} />
        </StudioPageCard>
      </StudioPanel>
    </ConsoleFrame>
  );
}
