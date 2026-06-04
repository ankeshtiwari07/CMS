"use client";
import { useState } from "react";
import { ArrowUpRightIcon } from "@/components/icons";

type Card = {
  tag: string;
  title: string;
  subtitle: string;
  bg: string;
  dark?: boolean;
  prompt: string;
  mode: "auto" | "image";
};

const cards: Card[] = [
  {
    tag: "DECK",
    title: "Create Deck",
    subtitle: "Generate polished presentations from a prompt",
    bg: "linear-gradient(135deg, #e9f6f2 0%, #d6efe8 55%, #c2e54b22 100%)",
    prompt: "Create a 10-slide investor deck for ",
    mode: "auto",
  },
  {
    tag: "IMAGE",
    title: "Create Image",
    subtitle: "Turn ideas into high-quality visuals",
    bg: "radial-gradient(120% 120% at 70% 20%, #11515a 0%, #0e2a2e 60%, #0b1416 100%)",
    dark: true,
    prompt: "A high-quality product visual of ",
    mode: "image",
  },
  {
    tag: "WEBSITE",
    title: "Create Website / App",
    subtitle: "Create landing pages, apps, and UI flows",
    bg: "linear-gradient(120deg, #bfe0ff 0%, #d7c2f0 45%, #ffd4c2 100%)",
    prompt: "Build a responsive landing page for ",
    mode: "auto",
  },
  {
    tag: "EMAIL",
    title: "Email",
    subtitle: "Draft campaigns and announcements",
    bg: "linear-gradient(135deg, #eef0f2 0%, #dfe3e7 100%)",
    prompt: "Write a marketing email announcing ",
    mode: "auto",
  },
  {
    tag: "WRITING",
    title: "Writing",
    subtitle: "Articles, blogs, and long-form content",
    bg: "linear-gradient(135deg, #f3f1ec 0%, #e7e2d8 100%)",
    prompt: "Write a long-form article about ",
    mode: "auto",
  },
  {
    tag: "TRANSLATION",
    title: "Translation",
    subtitle: "Localize content into Arabic and back",
    bg: "linear-gradient(135deg, #f6e7a8 0%, #e9c84b 60%, #1b4db8 100%)",
    dark: true,
    prompt: "Translate the following into Arabic: ",
    mode: "auto",
  },
];

export default function QuickCreate() {
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div style={{ maxWidth: 1080, margin: "56px auto 0", padding: "0 8px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Quick create</h2>
        <a href="/studio?panel=explore" style={{ fontSize: 14, color: "var(--muted)", textDecoration: "none" }}>
          Explore
        </a>
      </div>

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
        }}
      >
        {cards.map((c) => (
          <button
            key={c.title}
            onMouseEnter={() => setHover(c.title)}
            onMouseLeave={() => setHover(null)}
            onClick={() =>
              globalThis.dispatchEvent(
                new CustomEvent("humain:prefill", { detail: { prompt: c.prompt, mode: c.mode } }),
              )
            }
            style={{
              position: "relative",
              textAlign: "left",
              height: 188,
              borderRadius: "var(--r-card)",
              border: "none",
              padding: 18,
              background: c.bg,
              color: c.dark ? "#fff" : "var(--ink)",
              overflow: "hidden",
              transform: hover === c.title ? "translateY(-2px)" : "none",
              boxShadow: hover === c.title ? "var(--shadow-card)" : "0 1px 2px rgba(0,0,0,0.05)",
              transition: "all .15s",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  padding: "5px 10px",
                  borderRadius: "var(--r-pill)",
                  background: c.dark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.7)",
                  color: c.dark ? "#fff" : "var(--ink)",
                }}
              >
                {c.tag}
              </span>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: c.dark ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.8)",
                  display: "grid",
                  placeItems: "center",
                  color: c.dark ? "#fff" : "var(--ink)",
                }}
              >
                <ArrowUpRightIcon size={16} />
              </span>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{c.title}</div>
              <div style={{ fontSize: 13.5, opacity: c.dark ? 0.85 : 0.7, marginTop: 3 }}>{c.subtitle}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
