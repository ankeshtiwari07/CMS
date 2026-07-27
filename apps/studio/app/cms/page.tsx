import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/payload";
import CmsWorkspace from "@/components/cms/cms-workspace";
import type { Tier } from "@/components/cms/cms-preview";

export const metadata = { title: "Content Management · HUMAIN" };
export const dynamic = "force-dynamic";

// Map the user's RBAC roles to the CMS workspace tier (gates starters/actions).
function tierFor(roles: string[]): Tier {
  if (roles.includes("admin") || roles.includes("siteAdmin")) return "Admin";
  if (roles.includes("publisher") || roles.includes("reviewer") || roles.includes("compliance")) return "Editor";
  if (roles.includes("author") || roles.includes("brand")) return "Marketer";
  return "Standard";
}

/**
 * The CMS landing is the agentic composer, not a tile grid.
 *
 * It used to be a grid of content-type tiles; those content types are still
 * reachable — Templates in the sidebar goes to /cms/manage, and every collection
 * is under the CMS row's sub-navigation and CMS Admin.
 */
export default async function CmsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const roles = user.roles ?? [];
  const canEdit = roles.some((r) => ["author", "reviewer", "publisher", "brand", "siteAdmin", "admin"].includes(r));
  const canPublish = roles.some((r) => ["publisher", "siteAdmin", "admin"].includes(r));

  // CmsWorkspace returns the two sibling panels itself — the conversation rail
  // and the generated-output card — which is the shape the package prescribes
  // for a chat workspace that produces output.
  return (
    <>
      <CmsWorkspace
        user={{ name: user.name, email: user.email, roles }}
        canEdit={canEdit}
        canPublish={canPublish}
        tier={tierFor(roles)}
      />
    </>
  );
}
