"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { XIcon, TrashIcon, PlusIcon, SparkIcon } from "@/components/icons";
import { useT, useLocale } from "@/lib/i18n-client";
import { relativeTime } from "@/lib/i18n";
import { META } from "./content-type-meta";

export type Project = { id: string | number; title: string; type: string; updatedAt?: string; text?: string; preview?: boolean; status?: string; deckId?: string | number; siteId?: string | number; sitePath?: string; html?: string; doc?: any; conversationId?: string | number };

// Status pill colors for project cards.
const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  draft: { bg: "var(--soft-gray)", fg: "var(--soft-gray-foreground)" },
  ready: { bg: "var(--brand-tint)", fg: "var(--studio-teal-dark)" },
  published: { bg: "color-mix(in srgb, var(--success) 12%, var(--background))", fg: "var(--success)" },
  promoted: { bg: "color-mix(in srgb, var(--success) 12%, var(--background))", fg: "var(--success)" },
};


const TYPE_OPTIONS = [
  { key: "writing", label: "Content" },
  { key: "websiteBuild", label: "Website" },
  { key: "email", label: "Email" },
  { key: "event", label: "Event" },
  { key: "webinar", label: "Webinar" },
  { key: "conference", label: "Conference" },
  { key: "summit", label: "Summit" },
  { key: "campaign", label: "Campaign" },
  { key: "brandGuideline", label: "Brand Guideline" },
  { key: "video", label: "Video" },
  { key: "deck", label: "Deck" },
  { key: "image", label: "Image" },
  { key: "translation", label: "Translation" },
  { key: "designSystem", label: "Design System" },
];

export default function ProjectsGrid({ projects }: { projects: Project[] }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [openId, setOpenId] = useState<string | number | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | number | null>(null);
  const [confirmId, setConfirmId] = useState<string | number | null>(null); // styled delete-confirm
  const [pEdit, setPEdit] = useState(false); // edit the opened project
  const [eTitle, setETitle] = useState("");
  const [eText, setEText] = useState("");
  const [pSaving, setPSaving] = useState(false);
  const open = projects.find((p) => p.id === openId) || null;
  const confirmProj = projects.find((p) => p.id === confirmId) || null;

  function beginEdit() { if (!open) return; setETitle(open.title || ""); setEText(open.text || ""); setPEdit(true); }
  async function saveProject() {
    if (!open) return; setPSaving(true);
    try {
      const res = await fetch(`/api/projects/${open.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: eTitle, asset: { text: eText } }) });
      if (res.ok) { setPEdit(false); router.refresh(); }
    } finally { setPSaving(false); }
  }

  // Clicking a project opens it where it can be worked on: deck/website projects
  // open their dedicated builder (loaded by id); everything else opens the reader.
  function openProject(p: Project) {
    if (p.type === "deck" && p.deckId != null) return router.push(`/cms/deck?id=${p.deckId}`);
    if ((p.type === "website" || p.type === "websiteBuild") && p.siteId != null) return router.push(`/cms/website?id=${p.siteId}`);
    // Re-open the discussion in the chat studio if this project has one.
    if (p.conversationId != null) {
      router.push("/studio");
      setTimeout(() => globalThis.dispatchEvent(new CustomEvent("humain:loadchat", { detail: { id: p.conversationId } })), 120);
      return;
    }
    setOpenId(p.id);
  }

  async function doRemove(id: string | number) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (openId === id) setOpenId(null);
        setConfirmId(null);
        router.refresh();
      } else {
        alert(t("pg.deleteFail"));
      }
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
        {/* New project tile — always first */}
        <button
          onClick={() => setCreating(true)}
          style={{
            border: "1.5px dashed var(--studio-primary)", borderRadius: 14, background: "var(--mint-pill)",
            cursor: "pointer", minHeight: 188, display: "grid", placeItems: "center", color: "var(--studio-teal-dark)",
            padding: 16,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 46, height: 46, borderRadius: "50%", background: "var(--studio-primary)", color: "var(--primary-foreground)", display: "grid", placeItems: "center", margin: "0 auto 10px" }}>
              <PlusIcon size={24} color="var(--primary-foreground)" />
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 700 }}>{t("pg.new")}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>{t("pg.newSub")}</div>
          </div>
        </button>

        {projects.map((p) => {
          const m = META[p.type] ?? META.writing;
          const Icon = m.Icon;
          return (
            <div key={p.id} style={{ position: "relative", border: "1px solid var(--hairline)", borderRadius: 14, overflow: "hidden", background: "var(--card)" }}>
              <button
                onClick={() => openProject(p)}
                style={{ display: "block", width: "100%", textAlign: "left", border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
              >
                <div style={{ height: 84, background: m.grad, display: "grid", placeItems: "center", color: "var(--studio-teal-dark)" }}>
                  <Icon size={26} />
                </div>
                <div style={{ padding: "12px 14px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ display: "inline-block", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", color: "var(--studio-teal-dark)", background: "var(--mint-pill)", padding: "2px 8px", borderRadius: 999, textTransform: "uppercase" }}>{t(`type.${p.type}`)}</span>
                    {p.status && (() => { const s = STATUS_STYLE[p.status] ?? STATUS_STYLE.draft; return (
                      <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", color: s.fg, background: s.bg, padding: "2px 8px", borderRadius: 999, textTransform: "capitalize" }}>{p.status}</span>
                    ); })()}
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)", marginTop: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                  {p.text && <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.5, maxHeight: 54, overflow: "hidden" }}>{p.text.slice(0, 120)}</div>}
                  <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 8 }}>{t("card.updated")} {relativeTime(locale, p.updatedAt)} · {t("pg.open")} →</div>
                </div>
              </button>
              <button
                onClick={() => setConfirmId(p.id)}
                disabled={deleting === p.id}
                aria-label="Delete project"
                title="Delete"
                style={{ position: "absolute", top: 8, right: 8, width: 30, height: 30, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.9)", color: "var(--destructive)", display: "grid", placeItems: "center", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }}
              >
                <TrashIcon size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {creating && <CreateModal onClose={() => setCreating(false)} onDone={() => { setCreating(false); router.refresh(); }} />}

      {/* styled delete-confirmation modal (replaces the native confirm()) */}
      {confirmProj && (
        <div onClick={() => setConfirmId(null)} style={{ position: "fixed", inset: 0, background: "rgba(11,20,22,0.45)", display: "grid", placeItems: "center", zIndex: 120, padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: "var(--card)", borderRadius: 16, padding: "22px 24px", boxShadow: "var(--shadow-card)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ width: 38, height: 38, borderRadius: "50%", background: "color-mix(in srgb, var(--destructive) 10%, var(--background))", color: "var(--destructive)", display: "grid", placeItems: "center" }}><TrashIcon size={18} /></span>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Delete project?</h2>
            </div>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.55, margin: "6px 0 18px" }}>
              “<strong style={{ color: "var(--ink)" }}>{confirmProj.title}</strong>” will be permanently deleted. This can’t be undone.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmId(null)} style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "1px solid var(--hairline)", background: "var(--card)", color: "var(--ink)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => doRemove(confirmProj.id)} disabled={deleting === confirmProj.id}
                style={{ height: 40, padding: "0 18px", borderRadius: 10, border: "none", background: "var(--destructive)", color: "var(--primary-foreground)", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                {deleting === confirmProj.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div onClick={() => setOpenId(null)} style={{ position: "fixed", inset: 0, background: "rgba(11,20,22,0.45)", display: "grid", placeItems: "center", zIndex: 100, padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 760, maxHeight: "86vh", overflow: "auto", background: "var(--card)", borderRadius: 18, padding: "24px 26px", boxShadow: "var(--shadow-card)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div>
                <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", color: "var(--studio-teal-dark)", background: "var(--mint-pill)", padding: "3px 9px", borderRadius: 999 }}>
                  {t(`type.${open.type}`)}{open.preview ? ` · ${t("pg.preview")}` : ""}
                </span>
                {pEdit
                  ? <input value={eTitle} onChange={(e) => setETitle(e.target.value)} style={{ fontSize: 19, fontWeight: 700, color: "var(--ink)", border: "none", borderBottom: "2px solid var(--hairline)", background: "transparent", margin: "10px 0 0", outline: "none", width: 420, maxWidth: "60vw" }} />
                  : <h2 style={{ fontSize: 19, fontWeight: 700, color: "var(--ink)", margin: "10px 0 0" }}>{open.title}</h2>}
                <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{t("card.updated")} {relativeTime(locale, open.updatedAt)}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {pEdit ? (<>
                  <button onClick={() => setPEdit(false)} style={{ border: "1px solid var(--hairline)", background: "var(--card)", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                  <button onClick={saveProject} disabled={pSaving} style={{ border: "none", background: "var(--studio-primary)", color: "var(--primary-foreground)", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{pSaving ? "Saving…" : "Save"}</button>
                </>) : (<>
                  <button onClick={beginEdit} style={{ border: "1px solid var(--hairline)", background: "var(--card)", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>✎ Edit</button>
                  <button onClick={() => navigator.clipboard?.writeText(open.text || "")} style={{ border: "1px solid var(--hairline)", background: "var(--card)", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{t("pg.copy")}</button>
                  <button onClick={() => setConfirmId(open.id)} style={{ border: "1px solid color-mix(in srgb, var(--destructive) 30%, var(--background))", background: "var(--card)", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, color: "var(--destructive)", cursor: "pointer" }}>{t("pg.delete")}</button>
                </>)}
                <button onClick={() => { setPEdit(false); setOpenId(null); }} aria-label="Close" style={{ border: "1px solid var(--hairline)", background: "var(--card)", borderRadius: 8, width: 32, height: 32, display: "grid", placeItems: "center", cursor: "pointer" }}><XIcon size={16} /></button>
              </div>
            </div>
            {pEdit
              ? <textarea value={eText} onChange={(e) => setEText(e.target.value)} style={{ marginTop: 18, width: "100%", minHeight: 300, border: "1px solid var(--hairline)", borderRadius: 10, padding: 14, color: "var(--ink)", lineHeight: 1.7, fontSize: 14.5, resize: "vertical", fontFamily: "inherit", outline: "none" }} />
              : open.html
                ? <iframe title="Website" srcDoc={open.html} style={{ marginTop: 18, width: "100%", height: 520, border: "1px solid var(--hairline)", borderRadius: 12, background: "var(--card)" }} />
                : open.doc
                  ? <div style={{ marginTop: 18, color: "var(--ink)", lineHeight: 1.7, fontSize: 14.5 }}>{open.doc.summary ? <p style={{ color: "var(--text-muted)", marginBottom: 12 }}>{open.doc.summary}</p> : null}<div style={{ whiteSpace: "pre-wrap" }}>{open.doc.bodyMarkdown || open.text || t("pg.noContent")}</div></div>
                  : <div style={{ marginTop: 18, whiteSpace: "pre-wrap", color: "var(--ink)", lineHeight: 1.7, fontSize: 14.5 }}>{open.text || t("pg.noContent")}</div>}
          </div>
        </div>
      )}
    </>
  );
}

function CreateModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const t = useT();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("writing");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState<null | "gen" | "blank">(null);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    if (!prompt.trim()) { setErr(t("pg.enterPrompt")); return; }
    // Decks go to the real Deck Studio (plans + renders + saves slides), not the
    // /api/generate text path.
    if (type === "deck") { window.location.href = `/cms/deck?prompt=${encodeURIComponent(prompt)}`; return; }
    setBusy("gen"); setErr(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: type, prompt, options: { title } }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || t("pg.genFail")); setBusy(null); return; }
      onDone();
    } catch {
      setErr(t("pg.noReach")); setBusy(null);
    }
  }

  async function blank() {
    if (!title.trim()) { setErr(t("pg.enterTitle")); return; }
    setBusy("blank"); setErr(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, type, prompt }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || t("pg.createFail")); setBusy(null); return; }
      onDone();
    } catch {
      setErr(t("pg.noCreate")); setBusy(null);
    }
  }

  const field: React.CSSProperties = {
    width: "100%", border: "1px solid var(--hairline)", borderRadius: 10, padding: "10px 12px",
    fontSize: 14, color: "var(--ink)", outline: "none", background: "var(--card)",
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(11,20,22,0.45)", display: "grid", placeItems: "center", zIndex: 110, padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 540, background: "var(--card)", borderRadius: 18, padding: "24px 26px", boxShadow: "var(--shadow-card)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: "var(--ink)", margin: 0 }}>{t("pg.new")}</h2>
          <button onClick={onClose} aria-label="Close" style={{ border: "1px solid var(--hairline)", background: "var(--card)", borderRadius: 8, width: 32, height: 32, display: "grid", placeItems: "center", cursor: "pointer" }}><XIcon size={16} /></button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>{t("pg.title")} <span style={{ color: "var(--destructive)" }}>*</span></label>
          <span style={{ fontSize: 11.5, color: title.length > 180 ? "var(--destructive)" : "var(--text-muted)" }}>{title.length}/200</span>
        </div>
        <input value={title} maxLength={200} onChange={(e) => { setTitle(e.target.value); if (err) setErr(null); }} placeholder={t("pg.titlePh")}
          style={{ ...field, marginBottom: 14, borderColor: err && !title.trim() ? "var(--destructive)" : "var(--hairline)" }} />

        <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>{t("pg.type")}</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {TYPE_OPTIONS.map((o) => (
            <button key={o.key} onClick={() => setType(o.key)}
              style={{
                height: 32, padding: "0 12px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer",
                border: `1px solid ${type === o.key ? "var(--studio-primary)" : "var(--hairline)"}`,
                background: type === o.key ? "var(--mint-pill)" : "var(--card)",
                color: type === o.key ? "var(--studio-teal-dark)" : "var(--ink)",
              }}>
              {t(`type.${o.key}`)}
            </button>
          ))}
        </div>

        <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>{t("pg.prompt")}</label>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={t("pg.promptPh")} rows={3} style={{ ...field, resize: "vertical", marginBottom: 6 }} />

        {err && <div style={{ color: "var(--destructive)", fontSize: 13, margin: "6px 0" }}>{err}</div>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
          <button onClick={blank} disabled={!!busy}
            style={{ height: 42, padding: "0 16px", borderRadius: 10, border: "1px solid var(--hairline)", background: "var(--card)", color: "var(--ink)", fontSize: 14, fontWeight: 600, cursor: busy ? "default" : "pointer" }}>
            {busy === "blank" ? t("pg.creating") : t("pg.createBlank")}
          </button>
          <button onClick={generate} disabled={!!busy}
            style={{ height: 42, padding: "0 18px", borderRadius: 10, border: "none", background: "var(--studio-primary)", color: "var(--primary-foreground)", fontSize: 14, fontWeight: 700, cursor: busy ? "default" : "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <SparkIcon size={16} color="var(--primary-foreground)" /> {busy === "gen" ? t("pg.generating") : t("pg.generate")}
          </button>
        </div>
      </div>
    </div>
  );
}
