"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { HumainMark } from "@/components/brand";
import {
  PlusIcon,
  SearchIcon,
  FolderIcon,
  GridIcon,
  PaletteIcon,
  BellIcon,
} from "@/components/icons";

function initials(name?: string, email?: string) {
  const src = (name || email || "U").trim();
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] || "U") + (parts[1]?.[0] || "")).toUpperCase();
}

const items = [
  { key: "create", Icon: PlusIcon, href: "/studio", label: "Create" },
  { key: "search", Icon: SearchIcon, href: "/studio?panel=search", label: "Search" },
  { key: "projects", Icon: FolderIcon, href: "/studio?panel=projects", label: "Projects" },
  { key: "cms", Icon: GridIcon, href: "/cms", label: "Content Management" },
  { key: "brand", Icon: PaletteIcon, href: "/studio?panel=brand", label: "Brand" },
];

export default function Rail({ user }: { user: { name?: string; email: string } }) {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);

  return (
    <nav
      style={{
        width: 64,
        flexShrink: 0,
        background: "var(--canvas)",
        height: "100vh",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 0 18px",
        gap: 8,
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <HumainMark size={22} color="var(--ink)" />
      </div>

      {items.map(({ key, Icon, href, label }) => (
        <button
          key={key}
          title={label}
          aria-label={label}
          onClick={() => router.push(href)}
          onMouseEnter={() => setHover(key)}
          onMouseLeave={() => setHover(null)}
          style={{
            width: 40,
            height: 40,
            display: "grid",
            placeItems: "center",
            borderRadius: 12,
            border: "none",
            background: hover === key ? "var(--mint-pill)" : "transparent",
            color: hover === key ? "var(--studio-primary)" : "var(--ink)",
            transition: "all .12s",
          }}
        >
          <Icon size={21} />
        </button>
      ))}

      <div style={{ flex: 1 }} />

      <button
        aria-label="Notifications"
        style={{
          width: 40,
          height: 40,
          display: "grid",
          placeItems: "center",
          borderRadius: 12,
          border: "none",
          background: "transparent",
          color: "var(--ink)",
        }}
      >
        <BellIcon size={21} />
      </button>

      <div style={{ position: "relative", marginTop: 6 }}>
        <button
          onClick={() => setMenu((m) => !m)}
          aria-label="Account"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "2px solid var(--mint-tint)",
            background: "linear-gradient(135deg, var(--studio-primary), var(--lime))",
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {initials(user.name, user.email)}
        </button>
        {menu && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 48,
              width: 200,
              background: "#fff",
              border: "1px solid var(--hairline)",
              borderRadius: 12,
              boxShadow: "var(--shadow-card)",
              padding: 8,
              zIndex: 50,
            }}
          >
            <div style={{ padding: "8px 10px", fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>
              {user.name || user.email}
            </div>
            <div style={{ padding: "0 10px 8px", fontSize: 12, color: "var(--muted)" }}>{user.email}</div>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.replace("/login");
                router.refresh();
              }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "9px 10px",
                border: "none",
                borderRadius: 8,
                background: "transparent",
                color: "#b42318",
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
