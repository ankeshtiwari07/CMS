"use client";
import { useState } from "react";
import PromptBox from "@/components/studio/prompt-box";
import QuickCreate from "@/components/studio/quick-create";
import ContinueCreating, { type Project } from "@/components/studio/continue-creating";

// Landing vs. focused-chat: once a conversation starts, the hero + project rails
// fall away so the conversation becomes the focus (Claude-style).
export default function StudioWorkspace({ greeting, projects }: { greeting: string; projects: Project[] }) {
  const [active, setActive] = useState(false);
  return (
    <>
      {!active && (
        <h1 style={{ textAlign: "center", fontSize: 30, fontWeight: 700, color: "var(--ink)", margin: "40px 0 34px" }}>
          {greeting}
        </h1>
      )}
      <PromptBox onActive={setActive} />
      {!active && (
        <>
          <ContinueCreating projects={projects} />
          <QuickCreate />
        </>
      )}
    </>
  );
}
