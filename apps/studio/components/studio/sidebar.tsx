"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HumainLockup, HumainMark } from "@/components/brand";
import {
  PlusIcon,
  SearchIcon,
  FolderIcon,
  GridIcon,
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
} from "@/components/icons";

// Create-new menu (mirrors the Figma "+" menu).
const CREATE_OPTIONS: { label: string; Icon: any; mode?: string; href?: string; action?: string }[] = [
  { label: "Add photos & files", Icon: PaperclipIcon, action: "addfiles" },
  { label: "Recent projects", Icon: ClockIcon, href: "/projects" },
  { label: "Create Deck", Icon: MonitorIcon, mode: "deck" },
  { label: "Create Image", Icon: ImageIcon, mode: "image" },
  { label: "Create Website", Icon: GlobeIcon, mode: "website" },
  { label: "Create Email", Icon: MailIcon, mode: "email" },
  { label: "Use template", Icon: GridIcon, href: "/cms" },
  { label: "Design System", Icon: PaletteIcon, mode: "designSystem" },
  { label: "Translate", Icon: TranslateIcon, mode: "translation" },
];

function initials(name?: string, email?: string) {
  const src = (name || email || "U").trim();
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] || "U") + (parts[1]?.[0] || "")).toUpperCase();
}

const NAV = [
  { key: "create", Icon: PlusIcon, label: "Create new", href: "/studio" },
  { key: "search", Icon: SearchIcon, label: "Search", href: "/search" },
  { key: "projects", Icon: FolderIcon, label: "Projects", href: "/projects" },
  { key: "templates", Icon: GridIcon, label: "Templates", href: "/cms" },
  { key: "design", Icon: PaletteIcon, label: "Design", href: "/design" },
];

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  publisher: "Publisher",
  reviewer: "Reviewer",
  author: "Author",
  brand: "Brand",
  viewer: "Viewer",
};

export default function Sidebar({
  user,
  active = "create",
  notifications = 3,
}: {
  user: { name?: string; email: string; roles?: string[] };
  active?: string;
  notifications?: number;
}) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [menu, setMenu] = useState(false);
  const [createMenu, setCreateMenu] = useState(false);
  const [hover, setHover] = useState<string | null>(null);

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
      {/* Brand + collapse toggle */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, minHeight: 40 }}>
        {collapsed ? <HumainMark size={24} color="var(--ink)" /> : <HumainLockup color="var(--ink)" />}
        <button
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
          style={{
            border: "none",
            background: "transparent",
            color: "var(--muted)",
            display: collapsed ? "none" : "grid",
            placeItems: "center",
            padding: 4,
          }}
        >
          <PanelLeftIcon size={20} />
        </button>
      </div>

      {/* Nav */}
      <div style={{ display: "grid", gap: 4 }}>
        {NAV.map(({ key, Icon, label, href }) => {
          if (key === "create") {
            return (
              <div key={key} style={{ position: "relative" }}>
                <button
                  title={collapsed ? "Create new" : undefined}
                  onClick={() => setCreateMenu((v) => !v)}
                  onMouseEnter={() => setHover(key)}
                  onMouseLeave={() => setHover(null)}
                  style={row(createMenu || hover === key)}
                >
                  <Icon size={21} color={createMenu ? "var(--studio-teal-dark)" : "var(--ink)"} />
                  {!collapsed && <span style={{ flex: 1, textAlign: "left" }}>{label}</span>}
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
                      <div key={o.label}>
                        {i === 2 && <div style={{ height: 1, background: "var(--hairline)", margin: "4px 6px" }} />}
                        <button
                          onClick={() => runCreate(o)}
                          style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "9px 10px", border: "none", background: "transparent", borderRadius: 8, fontSize: 14, color: "var(--ink)", cursor: "pointer", textAlign: "left" }}
                        >
                          <o.Icon size={17} color="var(--muted)" /> {o.label}
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
              title={collapsed ? label : undefined}
              onClick={() => router.push(href)}
              onMouseEnter={() => setHover(key)}
              onMouseLeave={() => setHover(null)}
              style={row(key === active || (hover === key && key !== active))}
            >
              <Icon size={21} color={key === active ? "var(--studio-teal-dark)" : "var(--ink)"} />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />

      {/* Notifications */}
      <button style={row(false)} title={collapsed ? "Notifications" : undefined}>
        <span style={{ position: "relative", display: "grid", placeItems: "center" }}>
          <BellIcon size={21} />
          {notifications > 0 && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -6,
                minWidth: 16,
                height: 16,
                padding: "0 4px",
                borderRadius: 999,
                background: "var(--studio-primary)",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                display: "grid",
                placeItems: "center",
              }}
            >
              {notifications}
            </span>
          )}
        </span>
        {!collapsed && <span style={{ fontWeight: 500 }}>Notification</span>}
      </button>

      {/* User block */}
      <div style={{ position: "relative", marginTop: 4 }}>
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
            <button
              onClick={() => router.push("/settings")}
              style={{ width: "100%", textAlign: "left", padding: "9px 10px", border: "none", borderRadius: 8, background: "transparent", color: "var(--ink)", fontSize: 13.5, fontWeight: 600 }}
            >
              Settings
            </button>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.replace("/login");
                router.refresh();
              }}
              style={{ width: "100%", textAlign: "left", padding: "9px 10px", border: "none", borderRadius: 8, background: "transparent", color: "#b42318", fontSize: 13.5, fontWeight: 600 }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
