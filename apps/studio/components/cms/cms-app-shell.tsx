"use client";
import { usePathname, useRouter } from "next/navigation";
import {
  AppShell,
  AppShellCard,
  AppSidebar,
  SidebarProvider,
} from "@humain/ui";
import {
  Blocks,
  Database,
  FileText,
  Globe,
  Home,
  Images,
  Layers,
  PanelsTopLeft,
  Presentation,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import SidebarAccountMenu, { type ShellUser } from "@/components/studio/sidebar-account-menu";

/* =============================================================================
   HUMAIN CMS shell — the canonical @humain/ui app layout.

   This is the recipe from the package verbatim (references/recipes/pages.md):

     AppShell.Root
       AppShell.Sidebar > SidebarProvider(connected) > AppSidebar
         AppSidebar.Nav > AppSidebar.NavItem…
         AppSidebar.Account
       AppShell.Panel > AppShellCard

   Nothing here hand-rolls chrome. The previous CMS surface built its own 60px
   TopBar, its own gradient canvas and its own 484-line sidebar; all of that is
   replaced by the library's own shell so the CMS matches Foundation exactly.

   AppShell.Root deliberately gets no `background` prop — it already applies
   `var(--app-background)` in both themes, and the docs are explicit that app
   pages should not override it.
   ============================================================================= */

export type CmsUser = ShellUser;

const NAV = [
  { href: "/cms", label: "Overview", Icon: Home, exact: true },
  { href: "/cms/studio", label: "Studio", Icon: Sparkles },
  { href: "/cms/pages", label: "Pages", Icon: Globe },
  { href: "/cms/content", label: "Content", Icon: FileText },
  { href: "/cms/website", label: "Website", Icon: PanelsTopLeft },
  { href: "/cms/deck", label: "Decks", Icon: Presentation },
  { href: "/cms/build", label: "Components", Icon: Blocks },
  { href: "/cms/data", label: "Data", Icon: Database },
  { href: "/cms/dam", label: "Assets", Icon: Images },
  { href: "/cms/governance", label: "Governance", Icon: ShieldCheck },
  { href: "/cms/admin/collections/pages", label: "Manage CMS", Icon: Layers, adminOnly: true },
];

export default function CmsAppShell({
  user,
  children,
}: {
  user: CmsUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = (user.roles || []).some((r) => r === "admin" || r === "siteAdmin");

  const items = NAV.filter((n) => !n.adminOnly || isAdmin);
  const active =
    items.find((n) => (n.exact ? pathname === n.href : pathname.startsWith(n.href)))?.href ??
    "/cms";

  return (
    <AppShell.Root gap={12}>
      <AppShell.Sidebar>
        <SidebarProvider connected>
          <AppSidebar logoSubtext="Content Management">
            <AppSidebar.Nav>
              {items.map(({ href, label, Icon }) => (
                <AppSidebar.NavItem
                  key={href}
                  icon={<Icon />}
                  label={label}
                  isActive={active === href}
                  onClick={() => router.push(href)}
                />
              ))}
            </AppSidebar.Nav>
            {/* Was a bare AppSidebar.Account whose only action was onExpand ->
                /settings, which left /cms with no sign-out, theme or language.
                It now shares the studio shell's account menu, so both sidebars
                offer the same four things. */}
            <AppSidebar.Footer>
              <SidebarAccountMenu user={user} />
            </AppSidebar.Footer>
          </AppSidebar>
        </SidebarProvider>
      </AppShell.Sidebar>
      {children}
    </AppShell.Root>
  );
}

/**
 * Page body.
 *
 * DELIBERATELY a bare AppShell.Panel, not AppShellCard — and that is a
 * behaviour-preserving decision, not laziness:
 *
 *  1. Every existing CMS workspace already draws its own card chrome (radius,
 *     border, background, its own header). Nesting them in AppShellCard gives a
 *     visible card-inside-a-card.
 *  2. More importantly, they are full-height flex layouts with internal
 *     scrollers. AppShell.Root is `height:100dvh` with `padding:16`, so the
 *     panel is `100dvh - 32px`. Those components used to hardcode
 *     `calc(100vh - 20px)`, sized for the old bare <main>; left alone inside a
 *     panel they overflow by 12px and their internal scroll regions compute
 *     against the wrong height — which is how the agentic chat panes break.
 *     Their roots are now `height:100%` so the Panel owns the height.
 *
 * The package shell itself — Root, Sidebar, AppSidebar, Panel — is adopted
 * exactly as the recipe specifies. AppShellCard is available (and imported) for
 * new surfaces that do not bring their own chrome.
 */
export function CmsPanel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <AppShell.Panel flex={1} label={label}>
      {children}
    </AppShell.Panel>
  );
}

/** Card-wrapped panel, per the recipe, for content that has no chrome of its own. */
export function CmsCardPanel({
  title,
  subtitle,
  label,
  bodyPadding = "md",
  children,
}: {
  title: string;
  subtitle?: string;
  label?: string;
  bodyPadding?: "none" | "md";
  children: React.ReactNode;
}) {
  return (
    <AppShell.Panel flex={1} label={label ?? title}>
      <AppShellCard bodyPadding={bodyPadding}>
        <AppShellCard.Header>
          <AppShellCard.Title>{title}</AppShellCard.Title>
          {subtitle ? <AppShellCard.Subtitle>{subtitle}</AppShellCard.Subtitle> : null}
        </AppShellCard.Header>
        {children}
      </AppShellCard>
    </AppShell.Panel>
  );
}
