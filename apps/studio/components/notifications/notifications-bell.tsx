"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BellIcon, VideoIcon, FileIcon, MegaphoneIcon, MonitorIcon, CalendarIcon,
  GlobeIcon, BookmarkIcon, PaletteIcon, MailIcon, ImageIcon, CheckIcon, BuildingIcon,
} from "@/components/icons";

type Item = { id: string; type: string; title: string; detail?: string; ts: string; href?: string; unread?: boolean };

const ICON: Record<string, any> = {
  video: VideoIcon, writing: FileIcon, campaign: MegaphoneIcon, webinar: MonitorIcon,
  event: CalendarIcon, conference: CalendarIcon, summit: BuildingIcon,
  website: GlobeIcon, websiteBuild: GlobeIcon, brandGuideline: BookmarkIcon,
  brand: BookmarkIcon, designSystem: PaletteIcon, email: MailIcon, image: ImageIcon,
  publish: MegaphoneIcon, create: FileIcon, update: FileIcon, delete: FileIcon,
};

function ago(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.max(1, Math.round(d / 60))}m ago`;
  if (d < 86400) return `${Math.round(d / 3600)}h ago`;
  return `${Math.round(d / 86400)}d ago`;
}

export default function NotificationsBell({
  variant = "topbar", collapsed = false,
}: { variant?: "topbar" | "sidebar"; collapsed?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const onDark = variant === "topbar";

  async function load() {
    try {
      const r = await fetch("/api/notifications", { cache: "no-store" });
      if (!r.ok) return;
      const d = await r.json();
      setItems(d.items || []);
      setUnread(d.unreadCount || 0);
    } catch {
      /* ignore */
    }
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 45000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  async function markRead() {
    setUnread(0);
    setItems((p) => p.map((i) => ({ ...i, unread: false })));
    try { await fetch("/api/notifications/read", { method: "POST" }); } catch { /* ignore */ }
  }

  const bellColor = onDark ? "#ffffff" : "var(--ink)";
  const panel: React.CSSProperties = {
    position: "absolute",
    width: 340,
    maxHeight: 420,
    overflow: "auto",
    background: "var(--card-bg)",
    border: "1px solid var(--hairline)",
    borderRadius: 14,
    boxShadow: "var(--shadow-card)",
    zIndex: 80,
    padding: 0,
    ...(onDark ? { top: 40, right: 0 } : { bottom: 0, left: "calc(100% + 10px)" }),
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => { setOpen((o) => !o); }}
        title="Notifications"
        style={
          onDark
            ? { background: "none", border: "none", cursor: "pointer", position: "relative", display: "grid", placeItems: "center", padding: 0 }
            : { display: "flex", alignItems: "center", gap: 14, width: "100%", padding: collapsed ? "11px 0" : "11px 12px", justifyContent: collapsed ? "center" : "flex-start", border: "none", background: open ? "var(--mint-pill)" : "transparent", borderRadius: 12, cursor: "pointer", color: "var(--ink)", fontWeight: 500 }
        }
      >
        <span style={{ position: "relative", display: "grid", placeItems: "center" }}>
          <BellIcon size={21} color={bellColor} />
          {unread > 0 && (
            <span style={{ position: "absolute", top: -5, right: -7, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 999, background: onDark ? "var(--lime)" : "var(--studio-primary)", color: onDark ? "#0b1416" : "#fff", fontSize: 10, fontWeight: 700, display: "grid", placeItems: "center" }}>
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </span>
        {!onDark && !collapsed && <span>Notifications</span>}
      </button>

      {open && (
        <div style={panel}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid var(--hairline)", position: "sticky", top: 0, background: "var(--card-bg)" }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>Notifications</span>
            {unread > 0 && (
              <button onClick={markRead} style={{ display: "inline-flex", alignItems: "center", gap: 5, border: "none", background: "transparent", color: "var(--studio-primary)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                <CheckIcon size={14} /> Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div style={{ padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>No activity yet.</div>
          ) : (
            <div>
              {items.map((i) => {
                const Icon = ICON[i.type] || FileIcon;
                return (
                  <button
                    key={i.id}
                    onClick={() => { setOpen(false); if (i.href) router.push(i.href); }}
                    style={{ display: "flex", gap: 11, width: "100%", textAlign: "left", padding: "11px 14px", border: "none", borderBottom: "1px solid var(--hairline)", background: i.unread ? "var(--mint-tint)" : "var(--card-bg)", cursor: "pointer" }}
                  >
                    <span style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, background: "var(--mint-pill)", color: "var(--studio-teal-dark)", display: "grid", placeItems: "center" }}>
                      <Icon size={16} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{i.title}</span>
                      {i.detail && <span style={{ display: "block", fontSize: 12.5, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.detail}</span>}
                      <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{ago(i.ts)}</span>
                    </span>
                    {i.unread && <span style={{ flexShrink: 0, width: 8, height: 8, borderRadius: "50%", background: "var(--studio-primary)", marginTop: 6 }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
