"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HumainLockup, HumainMark } from "@/components/brand";
import NotificationsBell from "@/components/notifications/notifications-bell";
import ChatHistory from "@/components/studio/chat-history";
import ThemeToggle from "@/components/studio/theme-toggle";
import { useT, LanguageSwitcher } from "@/lib/i18n-client";
import {
  PlusIcon,
  SearchIcon,
  FolderIcon,
  GridIcon,
  LayersIcon,
  ChevronDownIcon,
  UserCircleIcon,
  PaletteIcon,
  BellIcon,
  PanelLeftIcon,
  DotsVerticalIcon,
  MonitorIcon,
  ImageIcon,
  GlobeIcon,
  MailIcon,
  TranslateIcon,
  PaperclipIcon,
  ClockIcon,
  BookmarkIcon,
  CheckIcon,
} from "@/components/icons";

// Create-new menu (mirrors the Figma "+" menu).
const CREATE_OPTIONS: { tkey: string; Icon: any; mode?: string; href?: string; action?: string }[] = [
  { tkey: "create.addfiles", Icon: PaperclipIcon, action: "addfiles" },
  { tkey: "create.recent", Icon: ClockIcon, href: "/projects" },
  { tkey: "create.deck", Icon: MonitorIcon, mode: "deck" },
  { tkey: "create.image", Icon: ImageIcon, mode: "image" },
  { tkey: "create.website", Icon: GlobeIcon, mode: "website" },
  { tkey: "create.email", Icon: MailIcon, mode: "email" },
  { tkey: "create.template", Icon: GridIcon, href: "/cms" },
  { tkey: "create.designSystem", Icon: PaletteIcon, mode: "designSystem" },
  { tkey: "create.translation", Icon: TranslateIcon, mode: "translation" },
];

function initials(name?: string, email?: string) {
  const src = (name || email || "U").trim();
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] || "U") + (parts[1]?.[0] || "")).toUpperCase();
}

const NAV = [
  { key: "create", Icon: PlusIcon, label: "Create new", href: "/studio" },
  { key: "cms", Icon: LayersIcon, label: "CMS", href: "/cms/studio" },
  { key: "search", Icon: SearchIcon, label: "Search", href: "/search" },
  { key: "projects", Icon: FolderIcon, label: "Projects", href: "/projects" },
  { key: "templates", Icon: GridIcon, label: "Templates", href: "/cms" },
  { key: "review", Icon: CheckIcon, label: "Review", href: "/review", approverOnly: true },
  { key: "brand", Icon: BookmarkIcon, label: "Brand", href: "/brand" },
  { key: "pages", Icon: GlobeIcon, label: "Pages", href: "/cms/pages" },
  { key: "data", Icon: GridIcon, label: "Data", href: "/cms/data" },
  { key: "governance", Icon: CheckIcon, label: "Governance", href: "/cms/governance" },
  { key: "dam", Icon: ImageIcon, label: "Assets", href: "/cms/dam" },
  { key: "design", Icon: PaletteIcon, label: "Design", href: "/design" },
];

// The full Payload CMS surface, exposed in the HUMAIN sidebar for ADMINS only.
// Each item opens that collection/global embedded inside HUMAIN's chrome
// (/cms/admin/...), on the shared console session — no separate Payload login.
const CMS_ADMIN: { group: string; Icon: any; items: { slug: string; label: string }[] }[] = [
  { group: "Content", Icon: GlobeIcon, items: [
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
  { group: "Building blocks", Icon: LayersIcon, items: [
    { slug: "collections/components", label: "Components" },
    { slug: "collections/media", label: "Media" },
  ] },
  { group: "Structure", Icon: GridIcon, items: [
    { slug: "globals/navigation", label: "Navigation" },
    { slug: "globals/settings", label: "Site Settings" },
    { slug: "collections/sites", label: "Sites" },
  ] },
  { group: "Studio", Icon: BookmarkIcon, items: [
    { slug: "collections/brandGuidelines", label: "Brand Guidelines" },
    { slug: "collections/projects", label: "Projects" },
  ] },
  { group: "Governance", Icon: CheckIcon, items: [
    { slug: "collections/approvals", label: "Approvals" },
    { slug: "collections/auditLog", label: "Audit Log" },
  ] },
  { group: "Access", Icon: UserCircleIcon, items: [
    { slug: "collections/users", label: "Users" },
  ] },
];

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  siteAdmin: "Site Administrator",
  compliance: "Legal / Compliance",
  publisher: "Publisher",
  reviewer: "Reviewer",
  author: "Author",
  brand: "Brand",
  viewer: "Viewer",
};

export default function Sidebar({
  user,
  active = "create",
}: {
  user: { name?: string; email: string; roles?: string[] };
  active?: string;
}) {
  const router = useRouter();
  const t = useT();
  const [collapsed, setCollapsed] = useState(false);
  const [menu, setMenu] = useState(false);
  const [createMenu, setCreateMenu] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [cmsAdminOpen, setCmsAdminOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const isAdmin = (user.roles || []).includes("admin");
  const createRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close the open menus on an outside click or Escape.
  useEffect(() => {
    if (!createMenu && !menu) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (createMenu && createRef.current && !createRef.current.contains(t)) setCreateMenu(false);
      if (menu && userRef.current && !userRef.current.contains(t)) setMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setCreateMenu(false); setMenu(false); }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [createMenu, menu]);

  function runCreate(o: { mode?: string; href?: string; action?: string }) {
    setCreateMenu(false);
    if (o.href) return router.push(o.href);
    router.push("/studio");
    setTimeout(() => {
      if (o.action === "addfiles") globalThis.dispatchEvent(new CustomEvent("humain:addfiles"));
      else globalThis.dispatchEvent(new CustomEvent("humain:prefill", { detail: { mode: o.mode, prompt: "" } }));
    }, 90);
  }

  useEffect(() => {
    setCollapsed(localStorage.getItem("humain-sidebar") === "collapsed");
  }, []);
  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("humain-sidebar", next ? "collapsed" : "expanded");
      return next;
    });
  };

  const role = (user.roles ?? []).map((r) => ROLE_LABEL[r]).find(Boolean) ?? "Member";
  const W = collapsed ? 76 : 256;

  const row = (activeRow: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    height: 44,
    padding: collapsed ? 0 : "0 14px",
    justifyContent: collapsed ? "center" : "flex-start",
    borderRadius: 12,
    border: "none",
    background: activeRow ? "var(--mint-pill)" : "transparent",
    color: activeRow ? "var(--studio-teal-dark)" : "var(--ink)",
    fontSize: 14.5,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background .12s",
  });

  return (
    <nav
      style={{
        width: W,
        flexShrink: 0,
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "var(--canvas)",
        display: "flex",
        flexDirection: "column",
        padding: collapsed ? "20px 14px 16px" : "22px 16px 16px",
        gap: 6,
        transition: "width .16s ease",
      }}
    >
      {/* Brand (links to landing page) + collapse toggle */}
      <div style={{ display: "flex", flexDirection: collapsed ? "column" : "row", alignItems: "center", gap: collapsed ? 12 : 0, justifyContent: "space-between", marginBottom: 14, minHeight: 40 }}>
        <button
          onClick={() => router.push("/studio")}
          aria-label="HUMAIN home"
          title="Home"
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "grid", placeItems: "center" }}
        >
          {collapsed ? <HumainMark size={24} color="var(--ink)" /> : <HumainLockup color="var(--ink)" />}
        </button>
        <button
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
          style={{
            border: "none",
            background: "transparent",
            color: "var(--muted)",
            display: "grid",
            placeItems: "center",
            padding: 4,
            cursor: "pointer",
            transform: collapsed ? "rotate(180deg)" : "none",
          }}
        >
          <PanelLeftIcon size={20} />
        </button>
      </div>

      {/* Scrollable middle: nav + CMS Admin accordion + chat history all share
          one scroll region so expanding CMS Admin (or a long chat list) scrolls
          instead of being clipped. Brand stays pinned above, user footer below. */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column", gap: 6, marginRight: -6, paddingRight: 6 }}>
      {/* Nav */}
      <div style={{ display: "grid", gap: 4 }}>
        {NAV.filter((n) => !(n as any).approverOnly || (user.roles || []).some((r) => ["reviewer", "publisher", "brand", "siteAdmin", "compliance", "admin"].includes(r))).map(({ key, Icon, label, href }) => {
          if (key === "create") {
            return (
              <div key={key} ref={createRef} style={{ position: "relative" }}>
                <button
                  title={collapsed ? t("nav.create") : undefined}
                  onClick={() => setCreateMenu((v) => !v)}
                  onMouseEnter={() => setHover(key)}
                  onMouseLeave={() => setHover(null)}
                  style={row(createMenu || hover === key)}
                >
                  <Icon size={21} color={createMenu ? "var(--studio-teal-dark)" : "var(--ink)"} />
                  {!collapsed && <span style={{ flex: 1, textAlign: "start" }}>{t("nav.create")}</span>}
                  {!collapsed && <DotsVerticalIcon size={4} color="transparent" />}
                </button>
                {createMenu && (
                  <div
                    style={{
                      position: "absolute",
                      top: collapsed ? 0 : 48,
                      left: collapsed ? 60 : 0,
                      zIndex: 70,
                      width: 232,
                      background: "#fff",
                      border: "1px solid var(--hairline)",
                      borderRadius: 12,
                      boxShadow: "var(--shadow-card)",
                      padding: 6,
                    }}
                  >
                    {CREATE_OPTIONS.map((o, i) => (
                      <div key={o.tkey}>
                        {i === 2 && <div style={{ height: 1, background: "var(--hairline)", margin: "4px 6px" }} />}
                        <button
                          onClick={() => runCreate(o)}
                          style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "9px 10px", border: "none", background: "transparent", borderRadius: 8, fontSize: 14, color: "var(--ink)", cursor: "pointer", textAlign: "left" }}
                        >
                          <o.Icon size={17} color="var(--muted)" /> {t(o.tkey)}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <button
              key={key}
              title={collapsed ? t(`nav.${key}`) : undefined}
              onClick={() => router.push(href)}
              onMouseEnter={() => setHover(key)}
              onMouseLeave={() => setHover(null)}
              style={row(key === active || (hover === key && key !== active))}
            >
              <Icon size={21} color={key === active ? "var(--studio-teal-dark)" : "var(--ink)"} />
              {!collapsed && <span>{t(`nav.${key}`)}</span>}
            </button>
          );
        })}
      </div>

      {/* CMS Admin — full Payload surface, admin-only, embedded in HUMAIN.
          Two-level accordion: collapsed by default, one group open at a time,
          so the sidebar stays calm until the admin drills in. */}
      {isAdmin && !collapsed && (
        <div style={{ marginTop: 10 }}>
          <button
            onClick={() => setCmsAdminOpen((v) => !v)}
            title="Manage the full CMS"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "8px 10px", border: "none", background: cmsAdminOpen ? "var(--mint-tint)" : "transparent", borderRadius: 8, cursor: "pointer" }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 11 }}>
              <GridIcon size={21} color={cmsAdminOpen ? "var(--studio-teal-dark)" : "var(--ink)"} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>CMS Admin</span>
            </span>
            <ChevronDownIcon size={14} color="var(--muted)" />
          </button>
          {cmsAdminOpen && (
            <div style={{ display: "grid", gap: 1, marginTop: 2 }}>
              <button
                onClick={() => router.push("/cms/build")}
                onMouseEnter={() => setHover("cmsadmin:build")}
                onMouseLeave={() => setHover(null)}
                title="Component Studio — drag-and-drop page builder + AI components"
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "7px 10px 7px 16px", border: "none", background: hover === "cmsadmin:build" ? "var(--mint-tint)" : "transparent", borderRadius: 8, cursor: "pointer" }}
              >
                <LayersIcon size={16} color="var(--studio-teal-dark)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--studio-teal-dark)" }}>Component Studio</span>
              </button>
              {CMS_ADMIN.map((g) => {
                const on = openGroup === g.group;
                return (
                  <div key={g.group}>
                    <button
                      onClick={() => setOpenGroup((cur) => (cur === g.group ? null : g.group))}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "7px 10px 7px 16px", border: "none", background: on ? "var(--mint-tint)" : "transparent", borderRadius: 8, cursor: "pointer" }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                        <g.Icon size={16} color={on ? "var(--studio-teal-dark)" : "var(--muted)"} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{g.group}</span>
                      </span>
                      <ChevronDownIcon size={12} color="var(--muted)" />
                    </button>
                    {on && g.items.map((it) => {
                      const k = `cmsadmin:${it.slug}`;
                      return (
                        <button
                          key={it.slug}
                          onClick={() => router.push(it.slug.startsWith("collections/") ? `/cms/data?collection=${it.slug.slice(12)}` : "/cms/data")}
                          onMouseEnter={() => setHover(k)}
                          onMouseLeave={() => setHover(null)}
                          title={it.label}
                          style={{ display: "flex", alignItems: "center", width: "100%", padding: "6px 10px 6px 42px", border: "none", background: hover === k ? "var(--mint-tint)" : "transparent", borderRadius: 8, fontSize: 13, color: "var(--muted)", cursor: "pointer", textAlign: "left" }}
                        >
                          {it.label}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Per-user chat history (topics) */}
      <ChatHistory collapsed={collapsed} />
      </div>{/* end scrollable middle */}

      {/* Theme: light / dark / system */}
      <div style={{ marginTop: 6 }}><ThemeToggle collapsed={collapsed} /></div>

      {/* Notifications (real activity feed) */}
      <NotificationsBell variant="sidebar" collapsed={collapsed} />

      {/* User block */}
      <div ref={userRef} style={{ position: "relative", marginTop: 4 }}>
        <button
          onClick={() => setMenu((m) => !m)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: collapsed ? 0 : "8px 10px",
            justifyContent: collapsed ? "center" : "flex-start",
            border: "none",
            borderRadius: 12,
            background: menu ? "var(--mint-pill)" : "transparent",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              flexShrink: 0,
              background: "linear-gradient(135deg, var(--studio-primary), var(--lime))",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              display: "grid",
              placeItems: "center",
              border: "2px solid var(--mint-tint)",
            }}
          >
            {initials(user.name, user.email)}
          </span>
          {!collapsed && (
            <span style={{ flex: 1, textAlign: "left", overflow: "hidden" }}>
              <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                {user.name || user.email}
              </span>
              <span style={{ display: "block", fontSize: 12, color: "var(--muted)" }}>{role}</span>
            </span>
          )}
          {!collapsed && <DotsVerticalIcon size={18} color="var(--muted)" />}
        </button>
        {menu && (
          <div
            style={{
              position: "absolute",
              bottom: 48,
              left: 0,
              width: 200,
              background: "#fff",
              border: "1px solid var(--hairline)",
              borderRadius: 12,
              boxShadow: "var(--shadow-card)",
              padding: 8,
              zIndex: 60,
            }}
          >
            <div style={{ padding: "6px 10px", fontSize: 12, color: "var(--muted)" }}>{user.email}</div>
            <div style={{ padding: "4px 10px 2px", fontSize: 11, fontWeight: 700, letterSpacing: ".04em", color: "var(--muted)", textTransform: "uppercase" }}>{t("menu.language")}</div>
            <LanguageSwitcher />
            <div style={{ height: 1, background: "var(--hairline)", margin: "4px 6px" }} />
            <button
              onClick={() => router.push("/settings")}
              style={{ width: "100%", textAlign: "start", padding: "9px 10px", border: "none", borderRadius: 8, background: "transparent", color: "var(--ink)", fontSize: 13.5, fontWeight: 600 }}
            >
              {t("menu.settings")}
            </button>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.replace("/login");
                router.refresh();
              }}
              style={{ width: "100%", textAlign: "start", padding: "9px 10px", border: "none", borderRadius: 8, background: "transparent", color: "#b42318", fontSize: 13.5, fontWeight: 600 }}
            >
              {t("menu.signout")}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
