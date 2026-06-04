import { redirect } from "next/navigation";
import { getCurrentUser, payloadFetch } from "@/lib/payload";
import Sidebar from "@/components/studio/sidebar";
import PromptBox from "@/components/studio/prompt-box";
import QuickCreate from "@/components/studio/quick-create";
import ContinueCreating, { type Project } from "@/components/studio/continue-creating";

export const metadata = { title: "Create Studio · HUMAIN" };
export const dynamic = "force-dynamic";

function greeting(name?: string) {
  const h = new Date().getHours();
  const part = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const first = (name || "").split(" ")[0];
  return first ? `${part} ${first}!` : `${part}!`;
}

async function recentProjects(): Promise<Project[]> {
  try {
    const res = await payloadFetch("/api/projects?sort=-updatedAt&limit=5&depth=0");
    if (!res.ok) return [];
    const data = await res.json();
    return (data.docs ?? []).map((d: any) => ({ id: d.id, title: d.title, type: d.type, updatedAt: d.updatedAt }));
  } catch {
    return [];
  }
}

export default async function StudioHome() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const projects = await recentProjects();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#eef4f3" }}>
      <Sidebar user={{ name: user.name, email: user.email, roles: user.roles }} active="create" />

      <main style={{ flex: 1, padding: "10px 10px 10px 0" }}>
        <div
          style={{
            minHeight: "calc(100vh - 20px)",
            borderRadius: 22,
            background: "linear-gradient(180deg, var(--mint-tint) 0%, #eafaf6 7%, #ffffff 16%, #ffffff 100%)",
            border: "1px solid var(--hairline)",
            padding: "72px 40px 56px",
          }}
        >
          <h1 style={{ textAlign: "center", fontSize: 30, fontWeight: 700, color: "var(--ink)", margin: "40px 0 34px" }}>
            {greeting(user.name)} What do you want to create today?
          </h1>

          <PromptBox />
          <ContinueCreating projects={projects} />
          <QuickCreate />
        </div>
      </main>
    </div>
  );
}
