import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/payload";
import { SIDEBAR_KEY } from "@/lib/sidebar-pref";
import CmsStudioRoute from "@/components/cms/cms-studio-route";
import type { Tier } from "@/components/cms/cms-preview";

export const metadata = { title: "CMS · HUMAIN" };
export const dynamic = "force-dynamic";

// Map the user's RBAC roles to the CMS workspace tier (gates starters/actions).
function tierFor(roles: string[]): Tier {
  if (roles.includes("admin") || roles.includes("siteAdmin")) return "Admin";
  if (roles.includes("publisher") || roles.includes("reviewer") || roles.includes("compliance")) return "Editor";
  if (roles.includes("author") || roles.includes("brand")) return "Marketer";
  return "Standard";
}

// The CMS section: the native, agentic component-management surface. It runs on
// the existing console session (no separate Payload login) and uses the HUMAIN
// CMS design tokens — a Claude-like chat with a live, editable preview.
export default async function CmsStudioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const roles = user.roles ?? [];
  const sidebarOpen = (await cookies()).get(SIDEBAR_KEY)?.value === "expanded";

  return (
    <CmsStudioRoute
      user={{ name: user.name, email: user.email, roles }}
      initialSidebarOpen={sidebarOpen}
      canEdit={roles.some((r) => ["author", "reviewer", "publisher", "brand", "siteAdmin", "admin"].includes(r))}
      canPublish={roles.some((r) => ["publisher", "siteAdmin", "admin"].includes(r))}
      tier={tierFor(roles)}
    />
  );
}
