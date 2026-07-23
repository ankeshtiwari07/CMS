"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { HumainWordmark } from "@/components/brand";
import { ChevronDownIcon } from "@/components/icons";
import NotificationsBell from "@/components/notifications/notifications-bell";

function initials(name?: string, email?: string) {
  const src = (name || email || "U").trim();
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] || "U") + (parts[1]?.[0] || "")).toUpperCase();
}

export default function TopBar({ user }: { user: { name?: string; email: string } }) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);

  return (
    <header
      style={{
        height: 60,
        background: "var(--cms-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
      }}
    >
      {/* Left: logo (home) + explicit Create Studio link back to the main landing */}
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <button onClick={() => router.push("/studio")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }} aria-label="HUMAIN home">
          <HumainWordmark size={22} onDark />
        </button>
        <span style={{ color: "rgba(255,255,255,0.22)" }}>|</span>
        <button
          onClick={() => router.push("/studio")}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "rgba(255,255,255,0.82)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          ← Create Studio
        </button>
      </div>

      {/* Right: notifications + account menu */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
        <NotificationsBell variant="topbar" />
        <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
        <button
          onClick={() => setMenu((m) => !m)}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer" }}
          title={user.email}
        >
          <span
            style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--studio-primary), var(--lime))",
              color: "var(--primary-foreground)", fontWeight: 700, fontSize: 12.5, display: "grid", placeItems: "center",
            }}
          >
            {initials(user.name, user.email)}
          </span>
          <ChevronDownIcon size={16} color="rgba(255,255,255,0.7)" />
        </button>
        {menu && (
          <div
            style={{
              position: "absolute", top: 46, right: 0, width: 200, background: "var(--card)",
              border: "1px solid var(--hairline)", borderRadius: 12, boxShadow: "var(--shadow-card)", padding: 8, zIndex: 60,
            }}
          >
            <div style={{ padding: "6px 10px 8px", fontSize: 12, color: "var(--text-muted)" }}>{user.email}</div>
            {[
              ["Create Studio", "/studio"],
              ["Projects", "/projects"],
              ["Search", "/search"],
              ["Settings", "/settings"],
            ].map(([label, href]) => (
              <button key={href} onClick={() => router.push(href)} style={{ width: "100%", textAlign: "left", padding: "9px 10px", border: "none", borderRadius: 8, background: "transparent", color: "var(--ink)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                {label}
              </button>
            ))}
            <button
              onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.replace("/login"); router.refresh(); }}
              style={{ width: "100%", textAlign: "left", padding: "9px 10px", border: "none", borderRadius: 8, background: "transparent", color: "var(--destructive)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
