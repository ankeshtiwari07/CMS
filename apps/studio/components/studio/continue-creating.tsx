"use client";
import { useT, useLocale } from "@/lib/i18n-client";
import { relativeTime } from "@/lib/i18n";
import { META } from "./content-type-meta";

export type Project = { id: string | number; title: string; type: string; updatedAt?: string };


export default function ContinueCreating({ projects }: { projects: Project[] }) {
  const t = useT();
  const locale = useLocale();
  if (!projects.length) return null;
  return (
    <div style={{ maxWidth: 1080, margin: "48px auto 0", padding: "0 8px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", margin: 0 }}>{t("home.continue")}</h2>
        <a href="/studio?panel=projects" style={{ fontSize: 14, color: "var(--text-muted)", textDecoration: "none" }}>{t("home.seeall")}</a>
      </div>
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
        {projects.map((p) => {
          const m = META[p.type] ?? META.writing;
          const Icon = m.Icon;
          return (
            <a key={p.id} href="/projects" style={{ textDecoration: "none", border: "1px solid var(--hairline)", borderRadius: 14, overflow: "hidden", background: "var(--card)", display: "block" }}>
              <div style={{ height: 92, background: m.grad, display: "grid", placeItems: "center", color: "var(--studio-teal-dark)" }}>
                <Icon size={26} />
              </div>
              <div style={{ padding: "10px 12px 12px" }}>
                <span style={{ display: "inline-block", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", color: "var(--studio-teal-dark)", background: "var(--mint-pill)", padding: "2px 8px", borderRadius: 999, textTransform: "uppercase" }}>{t(`type.${p.type}`)}</span>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)", marginTop: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{t("card.updated")} {relativeTime(locale, p.updatedAt)}</div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
