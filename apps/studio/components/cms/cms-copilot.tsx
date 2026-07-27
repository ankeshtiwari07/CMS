"use client";
import { useEffect, useRef, useState } from "react";
import {
  AIContainer,
  AIEmptyState,
  AIMessage,
  AIPromptSuggestion,
  AISystemMessage,
  AppShell,
  AppShellCard,
  Button,
  DropdownMenu,
  type ChatMessage,
} from "@humain/ui";
import { MessagesSquare, PanelRightClose, Square } from "lucide-react";

/* =============================================================================
   The docked CMS copilot.

   /cms/studio is the full agentic surface: chat on the left, live editable
   preview on the right. Everywhere else in the CMS — Content, Website, Data,
   Assets — you had to leave your work and go there to ask anything. This docks
   the same agent beside those surfaces as a second AppShell.Panel, which is the
   composition the package prescribes for a chat rail next to a workspace
   (references/recipes/chat.md: two sibling AppShell.Panel children, AIContainer
   directly in the chat panel, the workspace in its own AppShellCard).

   It is the REAL agent, not a second implementation of one: the same
   POST /api/chat SSE stream that CmsWorkspace uses, the same event protocol
   (delta / reset / artifact / error / done / project), the same model list from
   /api/models, and the same one-project-per-conversation reuse via projectId.

   What it deliberately does NOT do is render artifacts. A built page or document
   needs the editable preview, tab switching and publish gating that CmsPreview
   owns, and half of that in a 380px rail would be worse than not having it. So
   when a turn produces something, the dock says so and links to the surface that
   can actually show it.
   ============================================================================= */

export type CopilotSurface = "content" | "website" | "data" | "dam";

const SURFACE: Record<CopilotSurface, { label: string; context: string; suggestions: string[] }> = {
  content: {
    label: "Content Studio",
    context: "the HUMAIN CMS Content Studio, writing and editing long-form content",
    suggestions: [
      "Tighten this draft without losing meaning",
      "Suggest three headline options",
      "What is missing before this can be published?",
    ],
  },
  website: {
    label: "Website Studio",
    context: "the HUMAIN CMS Website Studio, composing site pages and sections",
    suggestions: [
      "Which sections should this page have?",
      "Write copy for a hero section",
      "Review this page for on-brand tone",
    ],
  },
  data: {
    label: "Data",
    context: "the HUMAIN CMS data browser, working with collections and records",
    suggestions: [
      "Explain what this collection is for",
      "What fields should a case study have?",
      "How do I bulk-update a set of records?",
    ],
  },
  dam: {
    label: "Asset Library",
    context: "the HUMAIN CMS asset library, organising media and renditions",
    suggestions: [
      "Write alt text for this image",
      "How should we name and tag assets?",
      "Which renditions do we need for a hero image?",
    ],
  },
};

type ModelOpt = { id: string; label: string; family: string; configured: boolean };

/** Same key for every surface: the dock is one preference, not four. Default is
    CLOSED, so a surface looks exactly as it did until someone opens the rail. */
const DOCK_KEY = "humain-cms-copilot";
const OPEN_WIDTH = 380;

const clock = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export default function CmsCopilot({ surface }: { surface: CopilotSurface }) {
  const cfg = SURFACE[surface];
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ kind: "info" | "error"; text: string } | null>(null);
  const [models, setModels] = useState<ModelOpt[]>([]);
  const [modelId, setModelId] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const projectRef = useRef<string | number | null>(null);

  useEffect(() => {
    try {
      setOpen(localStorage.getItem(DOCK_KEY) === "open");
    } catch { /* ignore */ }
  }, []);
  function toggle(next: boolean) {
    setOpen(next);
    try {
      localStorage.setItem(DOCK_KEY, next ? "open" : "closed");
    } catch { /* ignore */ }
  }

  // Only load the model list once the rail is actually opened — a closed dock
  // should cost nothing.
  useEffect(() => {
    if (!open || models.length) return;
    (async () => {
      try {
        const r = await fetch("/api/models");
        const j = await r.json();
        const ms: ModelOpt[] = (j.models || []).filter((m: any) => m.configured);
        setModels(ms);
        setModelId((cur) => cur || ms[0]?.id || "");
      } catch { /* ignore */ }
    })();
  }, [open, models.length]);

  function patchLast(fn: (m: ChatMessage) => ChatMessage) {
    setMessages((p) => {
      const i = p.length - 1;
      if (i < 0 || p[i].type !== "received") return p;
      const n = p.slice();
      n[i] = fn(n[i]);
      return n;
    });
  }

  async function send(text: string) {
    const prompt = text.trim();
    if (!prompt || busy) return;
    setBusy(true);
    setNote(null);
    setInput("");

    const history = messages.slice(-6).map((m) => ({
      role: m.type === "sent" ? "user" : "assistant",
      content: (m.content || "").slice(0, 6000),
    }));
    // Tell the agent where the question is being asked from. This goes in the
    // history rather than glued onto the prompt, because the prompt is persisted
    // verbatim on the Project and should stay the user's own words.
    history.unshift({ role: "user", content: `Context: I am working in ${cfg.context}.` });

    const id = `${Date.now()}`;
    setMessages((p) => [
      ...p,
      { id: `u-${id}`, type: "sent", content: prompt, timestamp: clock() },
      { id: `a-${id}`, type: "received", content: "", senderName: "HUMAIN", isAgent: true, isTyping: true, timestamp: clock() },
    ]);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "auto",
          prompt,
          model: modelId || undefined,
          history,
          projectId: projectRef.current,
          surface,
        }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const d = await res.json().catch(() => ({}));
        patchLast((m) => ({ ...m, content: d.error || "The CMS agent is unavailable.", isTyping: false }));
        setBusy(false);
        abortRef.current = null;
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n\n")) !== -1) {
          const raw = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          const line = raw.startsWith("data:") ? raw.slice(5).trim() : raw.trim();
          if (!line) continue;
          let ev: any;
          try { ev = JSON.parse(line); } catch { continue; }
          if (ev.type === "delta") patchLast((m) => ({ ...m, content: (m.content || "") + ev.text, isTyping: false }));
          else if (ev.type === "reset") patchLast((m) => ({ ...m, content: "" }));
          else if (ev.type === "project") projectRef.current = ev.id ?? projectRef.current;
          else if (ev.type === "artifact") {
            setNote({
              kind: "info",
              text: `The agent built ${ev.title ? `“${ev.title}”` : `a ${ev.kind}`}. Open it in CMS Studio to preview, edit and publish it.`,
            });
          } else if (ev.type === "error") {
            patchLast((m) => ({ ...m, isTyping: false }));
            setNote({ kind: "error", text: ev.message || "The agent reported an error." });
          } else if (ev.type === "done") patchLast((m) => ({ ...m, isTyping: false }));
        }
      }
      patchLast((m) => ({ ...m, isTyping: false }));
    } catch (e: any) {
      if (e?.name !== "AbortError" && !ctrl.signal.aborted) {
        patchLast((m) => ({ ...m, content: m.content || "Could not reach the CMS agent.", isTyping: false }));
      } else {
        patchLast((m) => ({ ...m, isTyping: false }));
      }
    }
    abortRef.current = null;
    setBusy(false);
  }

  // Closed: a slim rail, so the dock is discoverable without taking space.
  if (!open) {
    return (
      <AppShell.Panel width={56} label="Copilot">
        <div className="flex h-full flex-col items-center justify-start pt-2">
          <Button
            appearance="ghost"
            variant="secondary"
            size="icon-sm"
            aria-label={`Open the ${cfg.label} copilot`}
            title={`Open the ${cfg.label} copilot`}
            onClick={() => toggle(true)}
          >
            <MessagesSquare className="size-4" />
          </Button>
        </div>
      </AppShell.Panel>
    );
  }

  return (
    <AppShell.Panel width={OPEN_WIDTH} minWidth={320} label="Copilot">
      <AppShellCard bodyPadding="none">
        <AppShellCard.Toolbar>
          <AppShellCard.Header>
            <AppShellCard.Title>Copilot</AppShellCard.Title>
            <AppShellCard.Subtitle>{cfg.label}</AppShellCard.Subtitle>
          </AppShellCard.Header>
          <AppShellCard.Actions>
            {/* Stop lives in the toolbar, NOT in AIContainer.Input's `after`
                slot: that slot renders as a plain block underneath the input, so
                an icon button there reads as a stray square floating below the
                composer rather than as a control. */}
            {busy && (
              <Button
                appearance="ghost"
                variant="secondary"
                size="icon-sm"
                aria-label="Stop generating"
                title="Stop generating"
                onClick={() => abortRef.current?.abort()}
              >
                <Square className="size-4" />
              </Button>
            )}
            <Button
              appearance="ghost"
              variant="secondary"
              size="icon-sm"
              aria-label="Close the copilot"
              title="Close"
              onClick={() => toggle(false)}
            >
              <PanelRightClose className="size-4" />
            </Button>
          </AppShellCard.Actions>
          {models.length > 1 && (
            <AppShellCard.Menu>
              {models.map((m) => (
                <DropdownMenu.Item key={m.id} onClick={() => setModelId(m.id)}>
                  {m.id === modelId ? `✓ ${m.label}` : m.label}
                </DropdownMenu.Item>
              ))}
            </AppShellCard.Menu>
          )}
        </AppShellCard.Toolbar>

        {/* The transcript is rendered as children, so AIContainer.Messages owns
            the auto-scroll key — one owner only, per the package's note. */}
        <AIContainer>
          <AIContainer.Messages
            autoScrollKey={messages.at(-1)?.content?.length ?? null}
            emptyContent={
              <AIEmptyState title={`Ask about ${cfg.label}`}>
                {cfg.suggestions.map((s) => (
                  <AIPromptSuggestion key={s} onClick={() => send(s)}>
                    {s}
                  </AIPromptSuggestion>
                ))}
              </AIEmptyState>
            }
          >
            {messages.map((m) => (
              <AIMessage
                key={m.id}
                type={m.type}
                content={m.content}
                senderName={m.senderName}
                isAgent={m.isAgent}
                isTyping={m.isTyping}
                timestamp={m.timestamp}
              />
            ))}
            {note && (
              <AISystemMessage variant={note.kind === "error" ? "error" : "info"}>
                {note.kind === "error" ? note.text : (
                  <>
                    {note.text} <a href="/cms/studio" className="underline">Open CMS Studio</a>
                  </>
                )}
              </AISystemMessage>
            )}
          </AIContainer.Messages>
          <AIContainer.Input
            inputProps={{
              variant: "compact",
              value: input,
              onChange: setInput,
              onSubmit: send,
              disabled: busy,
              placeholder: busy ? "Working…" : "Ask the CMS agent…",
            }}
          />
        </AIContainer>
      </AppShellCard>
    </AppShell.Panel>
  );
}
