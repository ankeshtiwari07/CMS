import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/payload";
import CmsWorkspace from "@/components/cms/cms-workspace";
import type { Tier } from "@/components/cms/cms-preview";
import ConsoleFrame from "@/components/studio/console-frame";

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

  // KNOWN GAP — this route does not get panel discovery yet.
  //
  // CmsWorkspace returns the two sibling AppShell.Panels itself, so Root sees a
  // single child with no __appShellType marker and counts zero panels. Marking
  // CmsWorkspace would be wrong (it is a pair, not a panel), and wrapping it in
  // one CmsPanel nests the pair, which is worse than the current state.
  //
  // The fix is to split its shared chat state out so the two panels can be
  // rendered as direct children here — tracked separately, deliberately not
  // bundled into the shell change.
  return (
    <ConsoleFrame>
      <>
        <CmsWorkspace
          user={{ name: user.name, email: user.email, roles }}
          canEdit={canEdit}
          canPublish={canPublish}
          tier={tier}
        />
      </>
    </ConsoleFrame>
  );
}
