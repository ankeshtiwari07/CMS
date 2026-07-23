"use client";
import { useRouter, usePathname } from "next/navigation";

const TABS = [
  { key: "users", label: "Users", href: "/settings/users" },
  { key: "general", label: "Site Settings", href: "/settings/general" },
  { key: "access", label: "Access & Roles", href: "/settings/access" },
];

export default function SettingsNav() {
  const router = useRouter();
  const path = usePathname();
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid var(--hairline)" }}>
      {TABS.map((t) => {
        const active = path.startsWith(t.href);
        return (
          <button
            key={t.key}
            onClick={() => router.push(t.href)}
            style={{
              padding: "10px 16px",
              border: "none",
              borderBottom: `2px solid ${active ? "var(--studio-primary)" : "transparent"}`,
              background: "transparent",
              color: active ? "var(--studio-primary)" : "var(--text-muted)",
              fontWeight: 600,
              fontSize: 14.5,
              cursor: "pointer",
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
