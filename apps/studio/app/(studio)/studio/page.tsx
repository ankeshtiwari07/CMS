import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getCurrentUser, payloadFetch } from "@/lib/payload";
import { tr, LOCALES, type Locale } from "@/lib/i18n";
import { StudioPanel, StudioPageCard } from "@/components/studio/studio-app-shell";
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

// The sidebar and the shell now come from the route-group layout, on the
// @humain/ui AppShell; this page supplies only its panel. The getCurrentUser
// guard stays because the page passes the user down — the layout's redirect is
// the gate, this narrows the type.
export default async function StudioHome() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const projects = await recentProjects();
  const raw = (await headers()).get("x-humain-locale") || (await cookies()).get("humain-locale")?.value || "en";
  const locale: Locale = (LOCALES.find((l) => l.code === raw)?.code || "en") as Locale;

  return (
    <StudioPanel label="Create">
      <StudioPageCard
        padding="72px 40px 56px"
        background="linear-gradient(180deg, var(--mint-tint) 0%, var(--hero-mid) 7%, var(--hero-end) 16%, var(--hero-end) 100%)"
      >
        <StudioWorkspace
          greeting={`${greeting(user.name, locale)} ${tr(locale, "home.q")}`}
          projects={projects}
          user={{ name: user.name, email: user.email, roles: user.roles }}
        />
      </StudioPageCard>
    </StudioPanel>
  );
}
