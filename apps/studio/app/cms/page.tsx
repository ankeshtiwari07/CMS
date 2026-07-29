import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getCurrentUser, payloadFetch } from "@/lib/payload";
import { tr, LOCALES, type Locale } from "@/lib/i18n";
import { StudioPageCard } from "@/components/studio/studio-app-shell";
import StudioWorkspace from "@/components/studio/studio-workspace";
import { type Project } from "@/components/studio/continue-creating";
import ConsoleFrame from "@/components/studio/console-frame";

export const metadata = { title: "Content Management · HUMAIN" };
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

/**
 * The CMS landing, matching the supplied design: the Create Studio composer —
 * fanned preview cards, the greeting, and the prompt box — under the CMS nav
 * item, as a single full-width panel.
 *
 * It was briefly the CMS *agent* workspace (a two-panel chat + live preview).
 * That surface is not gone: it is the "Studio" entry in the CMS section nav at
 * /cms/studio, which is where an agentic drafting session with a live editable
 * preview belongs. This landing is the "what do you want to create" front door.
 */
export default async function CmsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const projects = await recentProjects();
  const raw = (await headers()).get("x-humain-locale") || (await cookies()).get("humain-locale")?.value || "en";
  const locale: Locale = (LOCALES.find((l) => l.code === raw)?.code || "en") as Locale;

  return (
    <ConsoleFrame label="CMS">
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
    </ConsoleFrame>
  );
}
