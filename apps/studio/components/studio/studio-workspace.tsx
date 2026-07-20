"use client";
import { useState } from "react";
import PromptBox from "@/components/studio/prompt-box";
import QuickCreate from "@/components/studio/quick-create";
import HeroCards from "@/components/studio/hero-cards";
import ContinueCreating, { type Project } from "@/components/studio/continue-creating";
import CmsPreview, { type Artifact, type CmsTab, type Tier } from "@/components/cms/cms-preview";
import { cmsVars } from "@/components/cms/cms-tokens";

type User = { name?: string; email: string; roles?: string[] };

function tierFor(roles: string[]): Tier {
  if (roles.includes("admin") || roles.includes("siteAdmin")) return "Admin";
  if (roles.includes("publisher") || roles.includes("reviewer") || roles.includes("compliance")) return "Editor";
  if (roles.includes("author") || roles.includes("brand")) return "Marketer";
  return "Standard";
}

// Landing vs. focused-chat: once a conversation starts, the hero + project rails
// fall away so the conversation becomes the focus (Claude-style). When the agent
// builds a WEBSITE, it opens in a right-side canvas (edit / publish / versions) —
// the same CmsPreview surface as the CMS studio, unified into the main chat.
export default function StudioWorkspace({ greeting, projects, user }: { greeting: string; projects: Project[]; user?: User }) {
  const [active, setActive] = useState(false);
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [tab, setTab] = useState<CmsTab>("preview");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [seed, setSeed] = useState<string>("");

  const roles = user?.roles ?? [];
  const tier = tierFor(roles);
  const canEdit = roles.some((r) => ["author", "reviewer", "publisher", "brand", "siteAdmin", "admin"].includes(r));
  const canPublish = roles.some((r) => ["publisher", "siteAdmin", "admin"].includes(r));
  const paneled = !!artifact;

  // With a canvas open: two-column (chat left, live editable preview right).
  if (paneled) {
    return (
      <div style={{ ...cmsVars("light"), display: "flex", gap: 14, alignItems: "stretch", height: "calc(100vh - 150px)", minHeight: 520 } as React.CSSProperties}>
        <div style={{ flex: "0 0 clamp(360px, 32%, 460px)", minWidth: 0, overflow: "auto", paddingRight: 4 }}>
          <PromptBox onActive={setActive} onArtifact={setArtifact} seedPrompt={seed} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <CmsPreview
            phase="ready" artifact={artifact} tab={tab} setTab={setTab} device={device} setDevice={setDevice}
            canEdit={canEdit} canPublish={canPublish} tier={tier}
            onClose={() => setArtifact(null)}
            onEditHtml={(html) => setArtifact((a) => (a && a.kind === "html" ? { ...a, html } : a))}
            onAskAboutSelection={(text) => setSeed(`Update the selected element ("${text.slice(0, 120)}") — `)}
          />
        </div>
      </div>
    );
  }

  // Landing / plain chat (no website artifact yet).
  return (
    <>
      {!active && <HeroCards />}
      {!active && (
        <h1 style={{ textAlign: "center", fontSize: 30, fontWeight: 700, color: "var(--ink)", margin: "18px 0 30px" }}>
          {greeting}
        </h1>
      )}
      <PromptBox onActive={setActive} onArtifact={setArtifact} seedPrompt={seed} />
      {!active && (
        <>
          <ContinueCreating projects={projects} />
          <QuickCreate />
        </>
      )}
    </>
  );
}
