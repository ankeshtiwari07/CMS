"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AppShell,
  AppSidebar,
  DropdownMenu,
  SidebarProvider,
  cn,
  navItemVariants,
  useSidebar,
} from "@humain/ui";
import {
  Bookmark,
  Blocks,
  Check,
  Clock,
  Database,
  FolderClosed,
  Globe,
  Grid2x2,
  Image as ImageIcon,
  Images,
  Languages,
  Layers,
  LayoutGrid,
  Mail,
  Monitor,
  Palette,
  Paperclip,
  Plus,
  Search,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { HumainLockup } from "@/components/brand";
import ChatHistory from "@/components/studio/chat-history";
import NotificationsBell from "@/components/notifications/notifications-bell";
import SidebarAccountMenu, { type ShellUser } from "@/components/studio/sidebar-account-menu";
import { useT } from "@/lib/i18n-client";

/* =============================================================================
   Create Studio shell — the same @humain/ui app layout the CMS already uses.

     AppShell.Root
       AppShell.Sidebar > SidebarProvider(connected) > AppSidebar
         AppSidebar.Nav > AppSidebar.NavItem…
         ChatHistory (AppSidebar.ChatList)
         AppSidebar.Footer > notifications + SidebarAccountMenu
       {children}  ->  StudioPanel (AppShell.Panel)

   This replaces components/studio/sidebar.tsx, a 484-line hand-rolled <nav> of
   inline styles that each of the seven studio surfaces mounted itself inside its
   own bespoke flex wrapper. Every feature that sidebar grew is re-homed on a
   package primitive rather than dropped:

     collapse + persistence  -> SidebarProvider open/onOpenChange (see below)
     "+" create menu         -> DropdownMenu, same events, same options
     CMS Admin tree          -> NavSection + NavItem/NavSub (two-level, admin-only)
     chat history            -> AppSidebar.ChatList (components/studio/chat-history)
     notifications bell      -> AppSidebar.Footer
     theme / language        -> SidebarAccountMenu (shared with the CMS shell)
     settings / sign out     -> SidebarAccountMenu

   Icons are lucide, matching cms-app-shell, and the destinations the two navs
   share (Pages, Data, Assets, Governance, Components) deliberately reuse the
   CMS shell's icon for that destination so the two sidebars agree.
   ============================================================================= */

/** Same key and same values as the old sidebar, so an existing user's collapse
    preference carries across the migration instead of silently resetting. */
const SIDEBAR_KEY = "humain-sidebar";

const NAV = [
  { key: "cms", Icon: Layers, href: "/cms/studio" },
  { key: "search", Icon: Search, href: "/search" },
  { key: "projects", Icon: FolderClosed, href: "/projects" },
  { key: "templates", Icon: LayoutGrid, href: "/cms" },
  { key: "review", Icon: Check, href: "/review", approverOnly: true },
  { key: "brand", Icon: Bookmark, href: "/brand" },
  { key: "pages", Icon: Globe, href: "/cms/pages" },
  { key: "data", Icon: Database, href: "/cms/data" },
  { key: "governance", Icon: ShieldCheck, href: "/cms/governance" },
  { key: "dam", Icon: Images, href: "/cms/dam" },
  { key: "design", Icon: Palette, href: "/design" },
] as const;

const APPROVER_ROLES = ["reviewer", "publisher", "brand", "siteAdmin", "compliance", "admin"];

/** Create-new menu (mirrors the Figma "+" menu). `sep` starts a new group. */
const CREATE_OPTIONS: {
  tkey: string;
  Icon: typeof Plus;
  mode?: string;
  href?: string;
  action?: string;
  sep?: boolean;
}[] = [
  { tkey: "create.addfiles", Icon: Paperclip, action: "addfiles" },
  { tkey: "create.recent", Icon: Clock, href: "/projects" },
  { tkey: "create.deck", Icon: Monitor, href: "/cms/deck", sep: true },
  { tkey: "create.image", Icon: ImageIcon, mode: "image" },
  { tkey: "create.website", Icon: Globe, mode: "website" },
  { tkey: "create.email", Icon: Mail, mode: "email" },
  { tkey: "create.template", Icon: Grid2x2, href: "/cms" },
  { tkey: "create.designSystem", Icon: Palette, mode: "designSystem" },
  { tkey: "create.translation", Icon: Languages, mode: "translation" },
];

// The full Payload CMS surface, exposed in the HUMAIN sidebar for ADMINS only.
// Each item opens that collection inside HUMAIN's own chrome on the shared
// console session — no separate Payload login.
const CMS_ADMIN: { group: string; Icon: typeof Plus; items: { slug: string; label: string }[] }[] = [
  { group: "Content", Icon: Globe, items: [
    { slug: "collections/pages", label: "Pages" },
    { slug: "collections/articles", label: "Articles" },
    { slug: "collections/blogPosts", label: "Blog Posts" },
    { slug: "collections/pressReleases", label: "Press Releases" },
    { slug: "collections/events", label: "Events" },
    { slug: "collections/caseStudies", label: "Case Studies" },
    { slug: "collections/products", label: "Products" },
    { slug: "collections/faqs", label: "FAQs" },
    { slug: "collections/careers", label: "Careers" },
    { slug: "collections/leadership", label: "Leadership" },
    { slug: "collections/mediaGalleries", label: "Media Galleries" },
    { slug: "collections/campaignMicrosites", label: "Campaign Microsites" },
    { slug: "collections/tags", label: "Tags" },
  ] },
  { group: "Building blocks", Icon: Layers, items: [
    { slug: "collections/components", label: "Components" },
    { slug: "collections/media", label: "Media" },
  ] },
  { group: "Structure", Icon: Grid2x2, items: [
    { slug: "globals/navigation", label: "Navigation" },
    { slug: "globals/settings", label: "Site Settings" },
    { slug: "collections/sites", label: "Sites" },
  ] },
  { group: "Studio", Icon: Bookmark, items: [
    { slug: "collections/brandGuidelines", label: "Brand Guidelines" },
    { slug: "collections/projects", label: "Projects" },
  ] },
  { group: "Governance", Icon: ShieldCheck, items: [
    { slug: "collections/approvals", label: "Approvals" },
    { slug: "collections/auditLog", label: "Audit Log" },
  ] },
  { group: "Access", Icon: UserCircle, items: [
    { slug: "collections/users", label: "Users" },
  ] },
];

/** The active nav key, derived from the URL so the highlight is correct on load
    and on navigation. Longest-prefix-first, exactly as before. */
function activeKeyFor(pathname: string, fallback: string) {
  const map: [string, string][] = [
    ["/cms/pages", "pages"], ["/cms/data", "data"], ["/cms/governance", "governance"], ["/cms/dam", "dam"],
    ["/cms/deck", "cms"], ["/cms/website", "cms"], ["/cms/studio", "cms"], ["/cms", "cms"],
    ["/design", "design"], ["/search", "search"], ["/projects", "projects"], ["/brand", "brand"],
    ["/review", "review"], ["/settings", "settings"], ["/studio", "create"],
  ];
  for (const [prefix, key] of map) if (pathname.startsWith(prefix)) return key;
  return fallback;
}

/** The package's own nav-row styling, so a DropdownMenu trigger and a real
    NavItem are visually the same row. Mirrors AppSidebarNavItem's itemClassName. */
function navRowClass(active: boolean) {
  return cn(
    navItemVariants({ state: active ? "active" : "default" }),
    "min-h-11 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "group-data-[collapsible=icon]:h-11 group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2",
  );
}

/** "+ Create new" — a DropdownMenu rather than AppSidebar.NavItem children,
    because NavSub rows carry no icon and this menu is icon-led by design. */
function CreateMenu() {
  const t = useT();
  const router = useRouter();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  function run(o: { mode?: string; href?: string; action?: string }) {
    if (o.href) return router.push(o.href);
    router.push("/studio");
    setTimeout(() => {
      if (o.action === "addfiles") globalThis.dispatchEvent(new CustomEvent("humain:addfiles"));
      else globalThis.dispatchEvent(new CustomEvent("humain:prefill", { detail: { mode: o.mode, prompt: "" } }));
    }, 90);
  }

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger
        className={navRowClass(false)}
        aria-label={t("nav.create")}
        title={collapsed ? t("nav.create") : undefined}
      >
        <span data-slot="nav-icon" className="flex shrink-0 items-center p-0.5 [&>svg]:size-4">
          <Plus />
        </span>
        <span className="flex-1 text-start group-data-[collapsible=icon]:hidden">{t("nav.create")}</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Popup
        side={collapsed ? "right" : "bottom"}
        align="start"
        width="md"
      >
        {/* flatMap, not a wrapper <div> per row: the separator has to be a
            sibling of the items so the menu's own keyboard navigation still
            sees a flat list of items. */}
        {CREATE_OPTIONS.flatMap((o) => [
          ...(o.sep ? [<DropdownMenu.Separator key={`${o.tkey}-sep`} />] : []),
          <DropdownMenu.Item key={o.tkey} icon={<o.Icon />} onClick={() => run(o)}>
            {t(o.tkey)}
          </DropdownMenu.Item>,
        ])}
      </DropdownMenu.Popup>
    </DropdownMenu>
  );
}

/** The bell needs to know whether it is on the icon rail; only a child of
    SidebarProvider can read that. */
function FooterBell() {
  const { state } = useSidebar();
  return <NotificationsBell variant="sidebar" collapsed={state === "collapsed"} />;
}

export default function StudioAppShell({
  user,
  active = "create",
  children,
}: {
  user: ShellUser;
  active?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const t = useT();
  const activeKey = activeKeyFor(pathname, active);
  const roles = user.roles ?? [];
  const isAdmin = roles.includes("admin");

  // SidebarProvider has no persistence of its own, so the app keeps owning it.
  // Reading localStorage during render would desync SSR markup from the client,
  // so the first paint is expanded and the stored preference is applied on mount
  // — the same one-frame behaviour the old sidebar had.
  const [open, setOpen] = useState(true);
  useEffect(() => {
    try {
      setOpen(localStorage.getItem(SIDEBAR_KEY) !== "collapsed");
    } catch { /* ignore */ }
  }, []);
  function onOpenChange(next: boolean) {
    setOpen(next);
    try {
      localStorage.setItem(SIDEBAR_KEY, next ? "expanded" : "collapsed");
    } catch { /* ignore */ }
  }

  const items = NAV.filter((n) => !("approverOnly" in n) || roles.some((r) => APPROVER_ROLES.includes(r)));

  return (
    <AppShell.Root gap={12}>
      <AppShell.Sidebar>
        <SidebarProvider connected open={open} onOpenChange={onOpenChange}>
          <AppSidebar
            logoSubtext="Create Studio"
            logo={
              // The package turns the compacted logomark into the expand
              // affordance, so "go home" is only offered while expanded.
              <button
                type="button"
                onClick={() => router.push("/studio")}
                aria-label="HUMAIN home"
                title="Home"
                className="cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <HumainLockup color="var(--foreground)" />
              </button>
            }
          >
            <AppSidebar.Nav aria-label="Create Studio">
              <CreateMenu />
              {items.map(({ key, Icon, href }) => (
                <AppSidebar.NavItem
                  key={key}
                  icon={<Icon />}
                  label={t(`nav.${key}`)}
                  isActive={key === activeKey}
                  onClick={() => router.push(href)}
                />
              ))}

              {/* Full Payload surface, admin-only. Two-level: each group is a
                  collapsible NavItem whose NavSub rows open that collection in
                  HUMAIN's own data browser.

                  An ARRAY, not a fragment: AppSidebar.Nav wraps each of its
                  children in its own <li> via React.Children.map, which flattens
                  arrays but treats a fragment as a single child — so a fragment
                  here would cram every admin row into one list item and lose the
                  row gap. */}
              {isAdmin && [
                <AppSidebar.NavSection key="cms-admin" label="CMS Admin" />,
                <AppSidebar.NavItem
                  key="component-studio"
                  icon={<Blocks />}
                  label="Component Studio"
                  isActive={pathname.startsWith("/cms/build")}
                  onClick={() => router.push("/cms/build")}
                />,
                ...CMS_ADMIN.map((g) => (
                  <AppSidebar.NavItem key={g.group} icon={<g.Icon />} label={g.group}>
                    {g.items.map((it) => (
                      <AppSidebar.NavSub
                        key={it.slug}
                        label={it.label}
                        onClick={() =>
                          router.push(
                            it.slug.startsWith("collections/")
                              ? `/cms/data?collection=${it.slug.slice(12)}`
                              : "/cms/data",
                          )
                        }
                      />
                    ))}
                  </AppSidebar.NavItem>
                )),
              ]}
            </AppSidebar.Nav>

            <ChatHistory />

            <AppSidebar.Footer>
              <FooterBell />
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
 * A bare AppShell.Panel, for the same reason CmsPanel is: every studio surface
 * already draws its own rounded card with its own padding, and nesting that in
 * AppShellCard gives a card inside a card. What the pages must give up is their
 * `minHeight: calc(100vh - 20px)` — AppShell.Root is height:100dvh with padding,
 * so the panel is already the right height and the page card becomes
 * `height:100%` with its own internal scroll.
 */
export function StudioPanel({
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

/**
 * The rounded page card each studio surface used to declare inline, in one
 * place. The height is the part that matters: AppShell.Panel is
 * `flex h-full flex-col` with no overflow of its own, so the card owns
 * `height:100%` plus its own scroll. A surface that keeps `minHeight:100vh`
 * inside the panel overflows it by the shell's padding and pushes the page into
 * a second, outer scrollbar.
 */
export function StudioPageCard({
  padding,
  background = "var(--card)",
  children,
}: {
  padding?: string;
  background?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        borderRadius: 22,
        background,
        border: "1px solid var(--hairline)",
        padding,
      }}
    >
      {children}
    </div>
  );
}
