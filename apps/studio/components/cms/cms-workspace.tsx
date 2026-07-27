"use client";
import { useEffect, useRef, useState } from "react";
import CmsPreview, { type Artifact, type CmsTab, type Phase } from "@/components/cms/cms-preview";
import {
  AIContainer,
  AIEmptyState,
  AIMessage,
  AIPromptSuggestion,
  AppShell,
  AppShellCard,
  Badge,
  Button,
  DropdownMenu,
} from "@humain/ui";
import {
  Grid2x2, Globe, Languages, Layers, Megaphone, CircleHelp, Sparkles, Square,
} from "lucide-react";
import { CmsSectionNav } from "@/components/cms/cms-app-shell";

/* =============================================================================
   The CMS agent workspace — the /cms landing.

   Restructured to the shape the package skill prescribes for a chat application
   that produces generated output: TWO sibling AppShell.Panels, an AIContainer
   living directly in the left conversation rail and the generated output in a
   right AppShellCard. It previously hand-rolled both halves inside one div,
   with its own transcript bubbles, its own composer and its own token wrapper.

     transcript bubbles -> AIMessage (markdown rendering included)
     starters           -> AIPromptSuggestion inside AIEmptyState
     composer           -> AIContainer.Input
     model picker       -> DropdownMenu
     chips              -> Badge / Button
     --hc-* wrapper     -> gone; AppShell owns the canvas

   REMOVED: this surface's own light/dark toggle. It is not a lost feature — the
   console sidebar now owns the theme with a Dark mode row, and keeping a second
   control here meant two switches disagreeing about the same state.

   Unchanged: the /api/chat SSE contract and every event it handles, the guided
   setup questions, the tier gating on starters, the artifact plumbing into
   CmsPreview and the edit_site round-trip through siteRef.
   ============================================================================= */

type Turn = { role: "user" | "assistant"; text: string; streaming?: boolean; made?: string; time?: string };
type Tier = "Standard" | "Marketer" | "Editor" | "Admin";
type ModelOpt = { id: string; label: string; family: string; configured: boolean };

const STARTERS: { label: string; prompt: string; Icon: any; minTier: Tier; guided?: boolean }[] = [
  { label: "Create a landing page", prompt: "Create a landing page for our new campaign", Icon: Globe, minTier: "Standard", guided: true },
  { label: "Product page from brand", prompt: "Generate a product page using our brand guidelines", Icon: Grid2x2, minTier: "Standard", guided: true },
  { label: "Add an FAQ section", prompt: "Write an FAQ section for our product with 6 common questions. Build it now.", Icon: CircleHelp, minTier: "Standard" },
  { label: "Improve SEO", prompt: "Improve the SEO for this page — propose a stronger title, meta description and keywords.", Icon: Sparkles, minTier: "Marketer" },
  { label: "Translate to Arabic", prompt: "Translate the homepage into Arabic, keeping it on-brand and RTL-correct.", Icon: Languages, minTier: "Standard" },
  { label: "Campaign microsite", prompt: "Create a campaign microsite for our product launch", Icon: Megaphone, minTier: "Marketer", guided: true },
];
const TIER_RANK: Record<Tier, number> = { Standard: 0, Marketer: 1, Editor: 2, Admin: 3 };
const clock = () => new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

// Client-side setup questions (mirrors the Decks "setup" clarifying step).
const SETUP = [
  { key: "style", q: "What style should it be?", opts: ["Minimal", "Bold", "Editorial", "Corporate"] },
  { key: "length", q: "How much content?", opts: ["Short", "Standard", "In-depth"] },
  { key: "locale", q: "Language?", opts: ["English", "Arabic", "Bilingual EN/AR"] },
] as const;

export default function CmsWorkspace({
  user, canEdit, canPublish, tier,
}: {
  user: { name?: string; email: string; roles?: string[] };
  canEdit: boolean; canPublish: boolean; tier: Tier;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [focus, setFocus] = useState(false);
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [tab, setTab] = useState<CmsTab>("preview");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [locale, setLocale] = useState<"EN" | "AR">("EN");
  const [models, setModels] = useState<ModelOpt[]>([]);
  const [modelId, setModelId] = useState<string>("");
  const [modelOpen, setModelOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [setup, setSetup] = useState<{ base: string; answers: Record<string, string> } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const siteRef = useRef<{ title?: string; brand?: any; sections?: any[] } | null>(null); // current built site → edit_site edits in place
  const started = turns.length > 0 || !!setup;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "auto", block: "end" }); }, [turns, setup]);
  useEffect(() => {
    (async () => { try { const r = await fetch("/api/models"); const j = await r.json(); const ms: ModelOpt[] = (j.models || []).filter((m: any) => m.configured); setModels(ms); setModelId(ms[0]?.id || ""); } catch {} })();
  }, []);

  const phase: Phase = busy && !artifact ? "generating" : setup ? "setup" : artifact ? "ready" : turns.length ? "ready" : "setup";
  const modelLabel = models.find((m) => m.id === modelId)?.label || "Auto";

  function patchLast(fn: (t: Turn) => Turn) {
    setTurns((p) => { const i = p.length - 1; if (i < 0 || p[i].role !== "assistant") return p; const n = p.slice(); n[i] = fn(n[i]); return n; });
  }

  async function send(text: string) {
    if (!text.trim() || busy) return;
    setBusy(true); setSetup(null);
    const history = turns.slice(-6).map((t) => ({ role: t.role, content: (t.text || "").slice(0, 6000) }));
    setTurns((p) => [...p, { role: "user", text, time: clock() }, { role: "assistant", text: "", streaming: true, time: clock() }]);
    const ctrl = new AbortController(); abortRef.current = ctrl;
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "auto", prompt: text, model: modelId || undefined, history, currentSite: siteRef.current }), signal: ctrl.signal });
      if (!res.ok || !res.body) { const d = await res.json().catch(() => ({})); patchLast((t) => ({ ...t, text: d.error || "The CMS agent is unavailable.", streaming: false })); setBusy(false); return; }
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = "";
      for (;;) {
        const { value, done } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n\n")) !== -1) {
          const raw = buf.slice(0, idx); buf = buf.slice(idx + 2);
          const line = raw.startsWith("data:") ? raw.slice(5).trim() : raw.trim();
          if (!line) continue;
          let ev: any; try { ev = JSON.parse(line); } catch { continue; }
          if (ev.type === "delta") patchLast((t) => ({ ...t, text: (t.text || "") + ev.text }));
          else if (ev.type === "reset") patchLast((t) => ({ ...t, text: "" }));
          else if (ev.type === "artifact") {
            if (ev.kind === "html") { setArtifact({ kind: "html", html: ev.html, title: ev.title }); patchLast((t) => ({ ...t, made: "page" })); if (ev.sections) siteRef.current = { title: ev.title, brand: ev.brand, sections: ev.sections }; }
            else if (ev.kind === "doc") { setArtifact({ kind: "doc", doc: ev.doc, title: ev.title }); patchLast((t) => ({ ...t, made: "content" })); }
            else if (ev.kind === "image") { setArtifact({ kind: "image", imagePrompt: ev.imagePrompt, ratio: ev.ratio, title: ev.title }); patchLast((t) => ({ ...t, made: "image" })); }
            else if (ev.kind === "brand") { setArtifact({ kind: "brand", brand: ev.brand, title: ev.title }); patchLast((t) => ({ ...t, made: "brand" })); }
            else if (ev.kind === "theme") { setArtifact({ kind: "theme", theme: ev.theme, title: ev.title }); patchLast((t) => ({ ...t, made: "theme" })); }
            else if (ev.kind === "video") { setArtifact({ kind: "video", videoPrompt: ev.videoPrompt, script: ev.script, title: ev.title }); patchLast((t) => ({ ...t, made: "video" })); }
            setTab("preview");
          }
          else if (ev.type === "error") patchLast((t) => ({ ...t, text: `${t.text ? t.text + "\n\n" : ""}⚠️ ${ev.message}`, streaming: false }));
          else if (ev.type === "done") patchLast((t) => ({ ...t, streaming: false }));
        }
      }
      patchLast((t) => ({ ...t, streaming: false }));
    } catch (e: any) {
      if (e?.name !== "AbortError" && !ctrl.signal.aborted) patchLast((t) => ({ ...t, text: (t.text || "") || "Could not reach the CMS agent.", streaming: false }));
      else patchLast((t) => ({ ...t, streaming: false }));
    }
    abortRef.current = null; setBusy(false);
  }

  function startGuided(base: string) { setSetup({ base, answers: {} }); setTurns((p) => [...p, { role: "user", text: base, time: clock() }, { role: "assistant", text: "Let me ask a few quick questions to shape it.", time: clock() }]); }
  function runSetup() {
    if (!setup) return;
    const a = setup.answers;
    const enriched = `${setup.base}. Style: ${a.style || "Minimal"}. Length: ${a.length || "Standard"}. Language: ${a.locale || (locale === "AR" ? "Arabic" : "English")}. Build it now.`;
    send(enriched);
  }
  function submit() { const t = prompt.trim(); if (!t || busy) return; setPrompt(""); send(locale === "AR" ? `${t} (in Arabic)` : t); }


  // The transcript, mapped onto the package's chat primitives.
  const transcript = turns.map((t, i) => (
    <AIMessage
      key={i}
      type={t.role === "user" ? "sent" : "received"}
      content={t.text || (t.streaming ? "" : " ")}
      senderName={t.role === "user" ? "You" : "HUMAIN"}
      isAgent={t.role !== "user"}
      isTyping={!!t.streaming && !t.text}
      timestamp={t.time}
    />
  ));

  return (
    <>
      {/* LEFT — conversation rail. AIContainer sits directly in the panel, per
          references/recipes/chat.md; it is not wrapped in a card. */}
      <AppShell.Panel minWidth={360} label="CMS agent">
        <CmsSectionNav />
        <div className="min-h-0 flex-1">
          <AIContainer>
            <AIContainer.Messages
              autoScrollKey={turns.at(-1)?.text?.length ?? null}
              emptyContent={
                <AIEmptyState title={`What would you like to manage${user.name ? `, ${user.name.split(" ")[0]}` : ""}?`}>
                  {STARTERS.filter((st) => TIER_RANK[tier] >= TIER_RANK[st.minTier]).map((st) => (
                    <AIPromptSuggestion key={st.label} onClick={() => (st.guided ? startGuided(st.prompt) : send(st.prompt))}>
                      {st.label}
                    </AIPromptSuggestion>
                  ))}
                </AIEmptyState>
              }
            >
              {transcript}

              {/* Guided setup — the clarifying step before generation. */}
              {setup && (
                <div className="rounded-xl border border-border p-4">
                  <div className="text-sm font-bold text-foreground">Set up</div>
                  <div className="mb-3 text-sm text-secondary-foreground">
                    Answer a few quick questions so I can tailor it.
                  </div>
                  {SETUP.map((g) => (
                    <div key={g.key} className="mb-3">
                      <div className="mb-1.5 text-sm font-semibold text-foreground">{g.q}</div>
                      <div className="flex flex-wrap gap-2">
                        {g.opts.map((o) => {
                          const on = setup.answers[g.key] === o;
                          return (
                            <Button
                              key={o}
                              size="sm"
                              shape="round"
                              appearance={on ? "soft" : "outline"}
                              variant={on ? "primary" : "secondary"}
                              onClick={() => setSetup((sx) => (sx ? { ...sx, answers: { ...sx.answers, [g.key]: o } } : sx))}
                            >
                              {o}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div className="mt-2 flex justify-end gap-2">
                    <Button appearance="outline" variant="secondary" size="sm" onClick={() => setSetup(null)}>Cancel</Button>
                    <Button size="sm" onClick={runSetup}>Generate</Button>
                  </div>
                </div>
              )}
            </AIContainer.Messages>

            <AIContainer.Input
              before={
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="soft" color="primary" size="sm">
                    <Sparkles className="me-1 inline size-3 align-middle" /> HUMAIN Brand
                  </Badge>
                  <Button
                    size="xs"
                    shape="round"
                    appearance="soft"
                    variant="primary"
                    startIcon={<Languages className="size-3.5" />}
                    onClick={() => setLocale((l) => (l === "EN" ? "AR" : "EN"))}
                  >
                    {locale === "EN" ? "English" : "العربية"}
                  </Button>
                  <div className="flex-1" />
                  {models.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenu.Trigger
                        render={<Button size="xs" shape="round" appearance="soft" variant="primary" />}
                      >
                        {modelLabel}
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Popup align="end" width="md">
                        {models.map((m) => (
                          <DropdownMenu.Item key={m.id} onClick={() => setModelId(m.id)}>
                            {m.id === modelId ? `✓ ${m.label}` : m.label}
                          </DropdownMenu.Item>
                        ))}
                      </DropdownMenu.Popup>
                    </DropdownMenu>
                  )}
                  {busy && (
                    <Button
                      appearance="ghost"
                      variant="secondary"
                      size="icon-xs"
                      aria-label="Stop generating"
                      title="Stop"
                      onClick={() => abortRef.current?.abort()}
                    >
                      <Square className="size-3.5" />
                    </Button>
                  )}
                </div>
              }
              inputProps={{
                value: prompt,
                onChange: setPrompt,
                onSubmit: submit,
                disabled: busy,
                placeholder: started
                  ? "Refine this page, a section, or create a new one…"
                  : "Describe what you want to create…",
              }}
            />
          </AIContainer>
        </div>
      </AppShell.Panel>

      {/* RIGHT — generated output, in its own card as the recipe requires. */}
      <AppShell.Panel minWidth="45%" label="Preview">
        <AppShellCard bodyPadding="none">
          <AppShellCard.Header>
            <AppShellCard.Title>Preview</AppShellCard.Title>
            <AppShellCard.Subtitle>
              {artifact ? "Live and editable — publish when it is ready." : `HUMAIN CMS · ${tier}`}
            </AppShellCard.Subtitle>
          </AppShellCard.Header>
          <div className="min-h-0 flex-1">
            <CmsPreview
              phase={phase}
              artifact={artifact}
              tab={tab}
              setTab={setTab}
              device={device}
              setDevice={setDevice}
              canEdit={canEdit}
              canPublish={canPublish}
              tier={tier}
              onClose={() => setArtifact(null)}
              onEditHtml={(html) => setArtifact((a) => (a && a.kind === "html" ? { ...a, html } : a))}
              onAskAboutSelection={(text) => {
                setPrompt(`Update the selected element ("${text.slice(0, 120)}") — `);
              }}
            />
          </div>
        </AppShellCard>
      </AppShell.Panel>
    </>
  );
}
