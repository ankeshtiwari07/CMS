import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/payload";
import CmsWorkspace from "@/components/cms/cms-workspace";
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
// CMS design tokens. Clicking "CMS" in the sidebar lands here — a Claude-like
// chat with a live, editable preview.
export default async function CmsStudioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const roles = user.roles ?? [];
  const tier = tierFor(roles);
  const canEdit = roles.some((r) => ["author", "reviewer", "publisher", "brand", "siteAdmin", "admin"].includes(r));
  const canPublish = roles.some((r) => ["publisher", "siteAdmin", "admin"].includes(r));

  // Rendered DIRECTLY, not inside CmsPanel: CmsWorkspace returns the two
  // sibling AppShell.Panels itself (conversation rail + generated output).
  // Wrapping it in another panel nested them, so the chat and preview were laid
  // out INSIDE one panel instead of being siblings the shell can size.
  return (
    <>
      <CmsWorkspace
        user={{ name: user.name, email: user.email, roles }}
        canEdit={canEdit}
        canPublish={canPublish}
        tier={tier}
      />
    </>
  );
}
