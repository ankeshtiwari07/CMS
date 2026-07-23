"use client";
import { useState } from "react";
import { ArrowUpRightIcon } from "@/components/icons";
import { THUMBS } from "./quick-thumbs";
import { useT } from "@/lib/i18n-client";

type Card = {
  tag: string;
  title: string;
  subtitle: string;
  prompt: string;
  mode: "auto" | "image";
  href?: string; // if set, navigate to a dedicated studio instead of prefilling the prompt box
};

const cards: (Card & { k: string })[] = [
  { k: "deck", tag: "DECK", title: "Create Deck", subtitle: "Generate polished presentations from a prompt", prompt: "Create a 10-slide investor deck for ", mode: "auto", href: "/cms/deck" },
  { k: "image", tag: "IMAGE", title: "Create Image", subtitle: "Turn ideas into high-quality visuals", prompt: "A high-quality product visual of ", mode: "image" },
  { k: "website", tag: "WEBSITE", title: "Create Website / App", subtitle: "Create landing pages, apps, and UI flows", prompt: "Build a responsive landing page for ", mode: "auto", href: "/cms/website" },
  { k: "email", tag: "EMAIL", title: "Email", subtitle: "Draft campaigns and announcements", prompt: "Write a marketing email announcing ", mode: "auto" },
  { k: "writing", tag: "WRITING", title: "Writing", subtitle: "Articles, blogs, and long-form content", prompt: "Write a long-form article about ", mode: "auto", href: "/cms/content" },
  { k: "translation", tag: "TRANSLATION", title: "Translation", subtitle: "Localize content across languages", prompt: "Translate the following: ", mode: "auto" },
];

export default function QuickCreate() {
  const [hover, setHover] = useState<string | null>(null);
  const t = useT();

  return (
    <div style={{ maxWidth: 1080, margin: "56px auto 0", padding: "0 8px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", margin: 0 }}>{t("home.quickcreate")}</h2>
        <a href="/studio?panel=explore" style={{ fontSize: 14, color: "var(--text-muted)", textDecoration: "none" }}>
          {t("home.explore")}
        </a>
      </div>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {cards.map((c) => {
          const Thumb = THUMBS[c.title];
          const on = hover === c.title;
          return (
            <button
              key={c.title}
              onMouseEnter={() => setHover(c.title)}
              onMouseLeave={() => setHover(null)}
              onClick={() => {
                if (c.href) { window.location.href = c.href; return; }
                globalThis.dispatchEvent(
                  new CustomEvent("humain:prefill", { detail: { prompt: c.prompt, mode: c.mode } }),
                );
              }}
              style={{
                position: "relative",
                textAlign: "left",
                borderRadius: "var(--r-card)",
                border: "1px solid var(--hairline)",
                padding: 0,
                background: "var(--card)",
                color: "var(--ink)",
                overflow: "hidden",
                transform: on ? "translateY(-2px)" : "none",
                boxShadow: on ? "var(--shadow-card)" : "0 1px 2px rgba(0,0,0,0.05)",
                transition: "all .15s",
                cursor: "pointer",
              }}
            >
              {/* real preview thumbnail */}
              <div style={{ position: "relative", height: 116, overflow: "hidden" }}>
                {Thumb ? <Thumb /> : null}
                <span
                  style={{
                    position: "absolute", top: 10, left: 10, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em",
                    padding: "4px 9px", borderRadius: "var(--r-pill)", background: "rgba(255,255,255,0.85)",
                    color: "var(--ink)", backdropFilter: "blur(2px)",
                  }}
                >
                  {c.tag}
                </span>
                <span
                  style={{
                    position: "absolute", top: 9, right: 10, width: 30, height: 30, borderRadius: "50%",
                    background: on ? "var(--studio-primary)" : "rgba(255,255,255,0.9)",
                    color: on ? "var(--primary-foreground)" : "var(--ink)", display: "grid", placeItems: "center",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transition: "all .15s",
                  }}
                >
                  <ArrowUpRightIcon size={15} />
                </span>
              </div>
              {/* footer */}
              <div style={{ padding: "12px 14px 14px", borderTop: "1px solid var(--hairline)" }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{t(`qc.${c.k}.t`)}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{t(`qc.${c.k}.s`)}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
