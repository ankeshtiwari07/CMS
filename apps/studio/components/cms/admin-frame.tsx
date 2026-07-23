"use client";
import { useState } from "react";

// Embeds a Payload admin view inside the HUMAIN CMS chrome. Same-origin iframe
// (cms host) authenticated by the shared `payload-token` cookie set at console
// login — so admins manage the full Payload surface WITHOUT a second login.
export default function AdminFrame({ src, title }: { src: string; title: string }) {
  const [loading, setLoading] = useState(true);
  return (
    <div
      style={{
        height: "calc(100vh - 20px)",
        borderRadius: 22,
        overflow: "hidden",
        border: "1px solid var(--hairline)",
        background: "var(--card)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", borderBottom: "1px solid var(--hairline)", background: "linear-gradient(180deg,var(--mint-tint),var(--background))" }}>
        <span style={{ fontWeight: 800, color: "var(--studio-teal-dark)", fontSize: 14 }}>HUMAIN CMS Admin</span>
        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>· {title}</span>
        <div style={{ flex: 1 }} />
        <a href={src} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: "var(--text-muted)", textDecoration: "none" }}>Open full ↗</a>
      </div>
      <div style={{ position: "relative", flex: 1 }}>
        {loading && (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--text-muted)", fontSize: 14 }}>Loading {title}…</div>
        )}
        <iframe
          src={src}
          title={title}
          onLoad={() => setLoading(false)}
          style={{ width: "100%", height: "100%", border: "none" }}
        />
      </div>
    </div>
  );
}
