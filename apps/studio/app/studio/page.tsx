import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getCurrentUser, payloadFetch } from "@/lib/payload";
import { tr, LOCALES, type Locale } from "@/lib/i18n";
import Sidebar from "@/components/studio/sidebar";
import StudioWorkspace from "@/components/studio/studio-workspace";
import { type Project } from "@/components/studio/continue-creating";

export const metadata = { title: "Create Studio · HUMAIN" };
export const dynamic = "force-dynamic";

function greeting(name: string | undefined, locale: Locale) {
  const h = new Date().getHours();
  const part = tr(locale, h < 12 ? "greet.morning" : h < 18 ? "greet.afternoon" : "greet.evening");
  const first = (name || "").split(" ")[0];
  return first ? `${part} ${first}!` : `${part}!`;
}

async function recentProjects(): Promise<Project[]> {
  try {
    const res = await payloadFetch("/api/projects?sort=-createdAt&limit=5&depth=0");
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
  const raw = (await headers()).get("x-humain-locale") || (await cookies()).get("humain-locale")?.value || "en";
  const locale: Locale = (LOCALES.find((l) => l.code === raw)?.code || "en") as Locale;

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
          <StudioWorkspace greeting={`${greeting(user.name, locale)} ${tr(locale, "home.q")}`} projects={projects} />
        </div>
      </main>
    </div>
  );
}
