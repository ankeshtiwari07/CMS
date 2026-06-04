"use client";
import { useRouter } from "next/navigation";
import { HumainWordmark } from "@/components/brand";
import { BellIcon } from "@/components/icons";

function initials(name?: string, email?: string) {
  const src = (name || email || "U").trim();
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] || "U") + (parts[1]?.[0] || "")).toUpperCase();
}

export default function TopBar({ user }: { user: { name?: string; email: string } }) {
  const router = useRouter();
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
      <button
        onClick={() => router.push("/studio")}
        style={{ background: "none", border: "none", padding: 0 }}
        aria-label="HUMAIN home"
      >
        <HumainWordmark size={22} onDark />
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <BellIcon size={21} color="#ffffff" />
        <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--studio-primary), var(--lime))",
            color: "#fff",
            fontWeight: 700,
            fontSize: 12.5,
            display: "grid",
            placeItems: "center",
          }}
          title={user.email}
        >
          {initials(user.name, user.email)}
        </div>
      </div>
    </header>
  );
}
