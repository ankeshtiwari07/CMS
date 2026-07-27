"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AppShell,
  AppSidebar,
  DropdownMenu,
  Separator,
  SidebarProvider,
  cn,
  navItemVariants,
  useSidebar,
} from "@humain/ui";
import {
  Bell,
  Blocks,
  Bookmark,
  Check,
  Clock,
  Database,
  FileText,
  FolderClosed,
  Globe,
  Grid2x2,
  Images,
  Languages,
  Layers,
  LayoutGrid,
  Mail,
  Monitor,
  Moon,
  Palette,
  PanelsTopLeft,
  Paperclip,
  Plus,
  Presentation,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCircle,
} from "lucide-react";
import { HumainWordmark } from "@/components/brand";
import { ChatNavItems, ManageChatsDialog, useChats } from "@/components/studio/chat-history";
import NotificationsPanel from "@/components/notifications/notifications-bell";
import SidebarAccountMenu, { type ShellUser } from "@/components/studio/sidebar-account-menu";
import { useSidebarPref } from "@/components/studio/use-sidebar-pref";
import { useT } from "@/lib/i18n-client";
import { PREF_KEY, THEME_EVENT, readPref } from "@/lib/theme";

/* =============================================================================
   The console shell — ONE sidebar for Create Studio and the CMS.

   Built to the target design: HUMAIN wordmark alone (no product subtext), a rule
   under it, the nav in the given order, CMS Admin and Chats as COLLAPSED rows
   with chevrons, then a rule, then Notifications with its count, a Dark mode
   row, and the account row showing the user's ROLE.

   Previously /studio and /cms each had their own shell. They shared components
   but not composition, which is how they kept drifting apart. There is now one.

   Nothing was dropped to hit the design:
   - Pages, Data and Governance leave the top level but become children of the
     CMS row, so they live "inside the CMS section" and are one click away.
   - Chats collapses, and because AppSidebar.NavSub carries no per-row actions,
     rename/delete move into a Manage-chats dialog rather than disappearing.
   - The Dark mode row toggles light/dark. The app's tri-state choice (including
     "system") is still in the account menu, so Auto is not lost.
   ============================================================================= */

/** Same key and values as before, so the collapse preference carries over. */
const APPROVER_ROLES = ["reviewer", "publisher", "brand", "siteAdmin", "compliance", "admin"];

const NAV = [
  { key: "cms", Icon: Layers, href: "/cms" },
  { key: "search", Icon: Search, href: "/search" },
  { key: "projects", Icon: FolderClosed, href: "/projects" },
  { key: "templates", Icon: LayoutGrid, href: "/cms/manage" },
  { key: "assets", Icon: Images, href: "/cms/dam" },
  { key: "review", Icon: Check, href: "/review", approverOnly: true },
  { key: "brand", Icon: Bookmark, href: "/brand" },
  { key: "design", Icon: Palette, href: "/design" },
] as const;

/** The CMS section's own navigation — this is where Pages, Data and Governance
    now live, as children of the CMS row. */
const CMS_SECTION = [
  { href: "/cms", label: "Overview" },
  { href: "/cms/studio", label: "Studio" },
  { href: "/cms/pages", label: "Pages" },
  { href: "/cms/content", label: "Content" },
  { href: "/cms/website", label: "Website" },
  { href: "/cms/deck", label: "Decks" },
  { href: "/cms/build", label: "Components" },
  { href: "/cms/data", label: "Data" },
  { href: "/cms/dam", label: "Assets" },
  { href: "/cms/governance", label: "Governance" },
];

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
  { tkey: "create.image", Icon: Images, mode: "image" },
  { tkey: "create.website", Icon: Globe, mode: "website" },
  { tkey: "create.email", Icon: Mail, mode: "email" },
  { tkey: "create.template", Icon: Grid2x2, href: "/cms/manage" },
  { tkey: "create.designSystem", Icon: Palette, mode: "designSystem" },
  { tkey: "create.translation", Icon: Languages, mode: "translation" },
];

// The full Payload surface, admin-only, opened inside HUMAIN's own data browser.
const CMS_ADMIN: { group: string; items: { slug: string; label: string }[] }[] = [
  { group: "Content", items: [
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
  { group: "Building blocks", items: [
    { slug: "collections/components", label: "Components" },
    { slug: "collections/media", label: "Media" },
  ] },
  { group: "Structure", items: [
    { slug: "globals/navigation", label: "Navigation" },
    { slug: "globals/settings", label: "Site Settings" },
    { slug: "collections/sites", label: "Sites" },
  ] },
  { group: "Governance", items: [
    { slug: "collections/approvals", label: "Approvals" },
    { slug: "collections/auditLog", label: "Audit Log" },
  ] },
  { group: "Access", items: [
    { slug: "collections/users", label: "Users" },
  ] },
];

function activeKeyFor(pathname: string) {
  const map: [string, string][] = [
    ["/cms/dam", "assets"], ["/cms/manage", "templates"], ["/cms", "cms"],
    ["/design", "design"], ["/search", "search"], ["/projects", "projects"],
    ["/brand", "brand"], ["/review", "review"], ["/studio", "create"],
  ];
  for (const [prefix, key] of map) if (pathname.startsWith(prefix)) return key;
  return "create";
}

/** The package's own nav-row styling, so a DropdownMenu trigger and a real
    NavItem are visually the same row. Mirrors AppSidebarNavItem's class. */
function navRowClass(active: boolean) {
  return cn(
    navItemVariants({ state: active ? "active" : "default" }),
    "min-h-11 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "group-data-[collapsible=icon]:h-11 group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2",
  );
}

/** "+ Create new" — a DropdownMenu rather than NavItem children, because NavSub
    rows carry no icon and this menu is icon-led by design. */
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
      <DropdownMenu.Trigger className={navRowClass(false)} aria-label={t("nav.create")} title={collapsed ? t("nav.create") : undefined}>
        <span data-slot="nav-icon" className="flex shrink-0 items-center p-0.5 [&>svg]:size-4">
          <Plus />
        </span>
        <span className="flex-1 text-start group-data-[collapsible=icon]:hidden">{t("nav.create")}</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Popup side={collapsed ? "right" : "bottom"} align="start" width="md">
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

/** Dark mode as a nav row, per the design. The tri-state choice (with "system")
    remains in the account menu, so nothing is lost by having this shortcut. */
function ThemeRow() {
  const t = useT();
  const [dark, setDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );
  function toggle() {
    const next = dark ? "light" : "dark";
    setDark(!dark);
    try { localStorage.setItem(PREF_KEY, next); } catch { /* ignore */ }
    document.documentElement.setAttribute("data-theme", next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }
  return (
    <AppSidebar.NavItem
      icon={dark ? <Sun /> : <Moon />}
      label={dark ? t("nav.lightmode") : t("nav.darkmode")}
      onClick={toggle}
    />
  );
}

export default function ConsoleShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const t = useT();
  const activeKey = activeKeyFor(pathname);
  const roles = user.roles ?? [];
  const isAdmin = roles.includes("admin");
  const { open, onOpenChange } = useSidebarPref();
  const { chats, setChats, activeId, setActiveId } = useChats();
  const [manageChats, setManageChats] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  const items = NAV.filter((n) => !("approverOnly" in n) || roles.some((r) => APPROVER_ROLES.includes(r)));
  const inCms = pathname.startsWith("/cms");

  function openChat(id: string | number) {
    setActiveId(String(id));
    router.push("/studio");
    setTimeout(() => globalThis.dispatchEvent(new CustomEvent("humain:loadchat", { detail: { id } })), 90);
  }

  return (
    <AppShell.Root gap={12}>
      <AppShell.Sidebar>
        <SidebarProvider connected open={open} onOpenChange={onOpenChange}>
          <AppSidebar
            logo={
              <button
                type="button"
                onClick={() => router.push("/studio")}
                aria-label="HUMAIN home"
                title="Home"
                className="cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <HumainWordmark size={18} color="var(--foreground)" />
              </button>
            }
          >
            <AppSidebar.Content>
              <div className="-me-2 min-h-0 flex-1 overflow-y-auto overflow-x-hidden pe-2">
                <Separator className="mb-2" />

                <AppSidebar.Nav aria-label="Console">
                  <CreateMenu />

                  {items.map(({ key, Icon, href }) =>
                    key === "cms" ? (
                      // Pages / Data / Governance live here now — inside the CMS
                      // section rather than at the top level.
                      <AppSidebar.NavItem key={key} icon={<Icon />} label={t("nav.cms")} isActive={activeKey === "cms"}>
                        {CMS_SECTION.map((sub) => (
                          <AppSidebar.NavSub
                            key={sub.href}
                            label={sub.label}
                            isActive={inCms && pathname === sub.href}
                            onClick={() => router.push(sub.href)}
                          />
                        ))}
                      </AppSidebar.NavItem>
                    ) : (
                      <AppSidebar.NavItem
                        key={key}
                        icon={<Icon />}
                        label={t(`nav.${key}`)}
                        isActive={key === activeKey}
                        onClick={() => router.push(href)}
                      />
                    ),
                  )}

                  {isAdmin && (
                    <AppSidebar.NavItem
                      icon={<FileText />}
                      label="CMS Admin"
                      isActive={pathname.startsWith("/cms/admin") || pathname.startsWith("/cms/build")}
                    >
                      <AppSidebar.NavSub label="Component Studio" onClick={() => router.push("/cms/build")} />
                      {CMS_ADMIN.flatMap((g) =>
                        g.items.map((it) => (
                          <AppSidebar.NavSub
                            key={it.slug}
                            label={`${g.group} · ${it.label}`}
                            onClick={() =>
                              router.push(
                                it.slug.startsWith("collections/")
                                  ? `/cms/data?collection=${it.slug.slice(12)}`
                                  : "/cms/data",
                              )
                            }
                          />
                        )),
                      )}
                    </AppSidebar.NavItem>
                  )}

                  <AppSidebar.NavItem icon={<Clock />} label={t("chats.title")}>
                    <ChatNavItems
                      chats={chats}
                      activeId={activeId}
                      onOpen={openChat}
                      onManage={() => setManageChats(true)}
                    />
                  </AppSidebar.NavItem>
                </AppSidebar.Nav>
              </div>
            </AppSidebar.Content>

            <AppSidebar.Footer>
              <Separator />
              <AppSidebar.Nav aria-label="Preferences">
                <AppSidebar.NavItem
                  icon={<Bell />}
                  label={t("nav.notifications")}
                  badge={unread || undefined}
                  onClick={() => setNotifOpen(true)}
                />
                <ThemeRow />
              </AppSidebar.Nav>
              <SidebarAccountMenu user={user} />
            </AppSidebar.Footer>
          </AppSidebar>
        </SidebarProvider>
      </AppShell.Sidebar>

      {children}

      <ManageChatsDialog
        open={manageChats}
        onOpenChange={setManageChats}
        chats={chats}
        setChats={setChats}
        activeId={activeId}
        setActiveId={setActiveId}
      />
      <NotificationsPanel open={notifOpen} onOpenChange={setNotifOpen} onUnreadChange={setUnread} />
    </AppShell.Root>
  );
}

/** Page body — a bare AppShell.Panel, because every surface brings its own
    AppShellCard chrome. */
export function ConsolePanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <AppShell.Panel flex={1} label={label}>
      {children}
    </AppShell.Panel>
  );
}
