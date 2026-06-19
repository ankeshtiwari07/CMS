"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CORE_TABS, ALL_TABS, findTab, type FieldDef } from "@/lib/content-types";
import { DocIcon, BookIcon, MegaphoneIcon, CalendarIcon, StarIcon, ArrowUpRightIcon } from "@/components/icons";

const ICONS: Record<string, any> = { doc: DocIcon, book: BookIcon, megaphone: MegaphoneIcon, calendar: CalendarIcon };

type Values = Record<string, string>;

export default function ContentManager({ initialType = "blog" }: { initialType?: string }) {
  const router = useRouter();
  const isCore = CORE_TABS.some((t) => t.key === initialType);
  const [activeKey, setActiveKey] = useState(findTab(initialType) ? initialType : "blog");
  const [values, setValues] = useState<Record<string, Values>>({});
  const [templates, setTemplates] = useState<Record<string, string>>(
    Object.fromEntries(ALL_TABS.filter((t) => t.templates.length).map((t) => [t.key, t.templates[0].key])),
  );
  const [busy, setBusy] = useState<null | "draft" | "published">(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [brief, setBrief] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [aiFilled, setAiFilled] = useState(false);

  const tab = useMemo(() => findTab(activeKey)!, [activeKey]);
  const v = values[activeKey] || {};
  const setField = (name: string, val: string) =>
    setValues((s) => ({ ...s, [activeKey]: { ...(s[activeKey] || {}), [name]: val } }));

  // Agentic prefill: the drafting agent proposes on-brand values for every field.
  const formEmpty = (key: string) => {
    const cur = values[key] || {};
    return !Object.values(cur).some((x) => String(x || "").trim());
  };

  async function suggest(opts?: { tpl?: string; auto?: boolean }) {
    // Auto-trigger (on template select) must not clobber work already typed.
    if (opts?.auto && !formEmpty(activeKey)) return;
    if (suggesting) return;
    setSuggesting(true);
    setToast(null);
    try {
      const res = await fetch("/api/content/suggest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          typeLabel: tab.label,
          template: opts?.tpl ?? templates[activeKey],
          fields: tab.fields.map((f) => ({ name: f.name, label: f.label, type: f.type })),
          brief: brief.trim() || undefined,
          locale: "en",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setToast({ kind: "err", msg: data.error || "AI draft failed" });
      } else {
        const filled: Values = data.data || {};
        setValues((s) => ({ ...s, [activeKey]: { ...(s[activeKey] || {}), ...filled } }));
        const n = Object.keys(filled).length;
        setAiFilled(n > 0);
        setToast({ kind: "ok", msg: n ? `AI drafted ${n} field${n > 1 ? "s" : ""} — review & edit` : "No suggestions returned" });
      }
    } catch {
      setToast({ kind: "err", msg: "Network error" });
    }
    setSuggesting(false);
  }

  async function submit(status: "draft" | "published") {
    if (!v[tab.titleField]?.trim()) {
      setToast({ kind: "err", msg: `${tab.fields.find((f) => f.name === tab.titleField)?.label} is required` });
      return;
    }
    setBusy(status);
    setToast(null);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: tab.slug, status, template: templates[activeKey], data: v }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ kind: "err", msg: data.error || "Save failed" });
      } else {
        setToast({
          kind: "ok",
          msg: status === "published" ? `Published — “${v[tab.titleField]}”` : `Draft saved — #${data.doc?.id}`,
        });
        if (status === "published") setValues((s) => ({ ...s, [activeKey]: {} }));
      }
    } catch {
      setToast({ kind: "err", msg: "Network error" });
    }
    setBusy(null);
  }

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "26px 28px 60px" }}>
      <button
        onClick={() => router.push("/cms")}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 8, cursor: "pointer" }}
      >
        ← Content Management
      </button>
      <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 700, margin: 0 }}>{isCore ? "Content Management" : tab.label}</h1>
      <p style={{ color: "rgba(255,255,255,0.72)", margin: "5px 0 20px", fontSize: 14.5 }}>{tab.subtitle}</p>

      {/* Tabs (core content types only) */}
      {isCore && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {CORE_TABS.map((t) => {
            const Icon = ICONS[t.icon];
            const active = t.key === activeKey;
            return (
              <button
                key={t.key}
                onClick={() => setActiveKey(t.key)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8, height: 42, padding: "0 18px",
                  borderRadius: "var(--r-pill)", border: "none", fontWeight: 600, fontSize: 14.5,
                  background: active ? "var(--lime)" : "var(--deep-teal)",
                  color: active ? "#0b1416" : "rgba(255,255,255,0.86)",
                }}
              >
                <Icon size={17} color={active ? "#0b1416" : "rgba(255,255,255,0.86)"} /> {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Templates */}
      {tab.templates.length > 0 && (
      <div style={{ marginTop: 24 }}>
        <div style={{ color: "#fff", fontWeight: 600, fontSize: 14.5, marginBottom: 12 }}>Select Template</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,260px))", gap: 16 }}>
          {tab.templates.map((tpl) => {
            const selected = templates[activeKey] === tpl.key;
            return (
              <div
                key={tpl.key}
                style={{
                  position: "relative",
                  background: "var(--surface)",
                  borderRadius: 14,
                  padding: "16px 16px 14px",
                  boxShadow: selected ? "0 0 0 2px var(--lime)" : "var(--shadow-card)",
                }}
              >
                {selected && (
                  <span
                    style={{
                      position: "absolute",
                      top: -10,
                      right: -8,
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: "var(--lime)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <StarIcon size={13} color="#0b1416" />
                  </span>
                )}
                <div style={{ color: "var(--label)", fontWeight: 700, fontSize: 15.5 }}>{tpl.name}</div>
                <div style={{ color: "var(--muted)", fontSize: 13, margin: "3px 0 12px" }}>{tpl.desc}</div>
                <button
                  onClick={() => { setTemplates((s) => ({ ...s, [activeKey]: tpl.key })); suggest({ tpl: tpl.key, auto: true }); }}
                  style={{
                    height: 30,
                    padding: "0 14px",
                    borderRadius: "var(--r-pill)",
                    border: "none",
                    background: "var(--lime)",
                    color: "#0b1416",
                    fontWeight: 700,
                    fontSize: 12.5,
                    opacity: selected ? 1 : 0.78,
                  }}
                >
                  {selected ? "Default" : "Set Default"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Form panel */}
      <div
        style={{
          marginTop: 26,
          background: "var(--surface)",
          borderRadius: "var(--r-card)",
          padding: "26px 28px 22px",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <h2 style={{ color: "var(--label)", fontSize: 18, fontWeight: 700, margin: "0 0 14px" }}>{tab.formTitle}</h2>

        {/* Agentic prefill — agent proposes a draft, human edits */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8, padding: "11px 13px", background: "#eef6f5", borderRadius: 12, border: "1px solid var(--hairline)" }}>
          <span style={{ fontSize: 17, lineHeight: 1 }}>✨</span>
          <input
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !suggesting) suggest(); }}
            placeholder={`Selecting a template auto-drafts. Add a brief to steer it, then re-draft.`}
            style={{ flex: 1, height: 40, border: "1px solid var(--hairline)", borderRadius: 10, padding: "0 12px", fontSize: 14, color: "var(--ink)", background: "#fff", outline: "none" }}
          />
          <button
            onClick={() => suggest()}
            disabled={suggesting}
            style={{ height: 40, padding: "0 18px", borderRadius: "var(--r-pill)", border: "none", background: "var(--studio-primary, #0B7A75)", color: "#fff", fontWeight: 700, fontSize: 13.5, whiteSpace: "nowrap", cursor: "pointer" }}
          >
            {suggesting ? "Drafting…" : "✨ Draft with AI"}
          </button>
        </div>
        {aiFilled && (
          <div style={{ fontSize: 12.5, color: "var(--studio-teal-dark, #0A5C58)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 6 }}>
            AI-suggested draft — review &amp; edit every field before saving. Agents propose, you decide.
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "18px 20px" }}>
          {tab.fields.map((f) => (
            <Field key={f.name} f={f} value={v[f.name] || ""} onChange={(val) => setField(f.name, val)} />
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 14, marginTop: 26 }}>
          <button
            onClick={() => submit("draft")}
            disabled={busy !== null}
            style={{
              height: 46,
              padding: "0 30px",
              borderRadius: 12,
              border: "none",
              background: "var(--lime)",
              color: "#0b1416",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            {busy === "draft" ? "Saving…" : "Save Draft"}
          </button>
          <button
            onClick={() => submit("published")}
            disabled={busy !== null}
            style={{
              height: 46,
              padding: "0 34px",
              borderRadius: 12,
              border: "none",
              background: "var(--publish-blue)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            {busy === "published" ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: toast.kind === "ok" ? "var(--publish-blue)" : "#b42318",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 14,
            boxShadow: "var(--shadow-card)",
            zIndex: 100,
          }}
          onAnimationEnd={() => {}}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function Field({ f, value, onChange }: { f: FieldDef; value: string; onChange: (v: string) => void }) {
  const span = `span ${f.col}`;
  const labelEl = (
    <label style={{ display: "block", color: "var(--label)", fontWeight: 600, fontSize: 13.5, marginBottom: 7 }}>
      {f.label}
    </label>
  );
  const common: React.CSSProperties = {
    width: "100%",
    border: "1px solid var(--hairline)",
    borderRadius: "var(--r-input)",
    padding: "11px 13px",
    fontSize: 14.5,
    color: "var(--ink)",
    outline: "none",
    background: "#fff",
  };
  const focus = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      (e.currentTarget.style.borderColor = "var(--studio-primary)"),
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      (e.currentTarget.style.borderColor = "var(--hairline)"),
  };

  return (
    <div style={{ gridColumn: span }}>
      {labelEl}
      {f.type === "textarea" || f.type === "richtext" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={f.placeholder}
          rows={f.type === "richtext" ? 6 : 3}
          style={{ ...common, resize: "vertical", minHeight: f.type === "richtext" ? 130 : 70 }}
          {...focus}
        />
      ) : (
        <input
          type={f.type === "date" ? "date" : f.type === "time" ? "time" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={f.placeholder}
          style={common}
          {...focus}
        />
      )}
    </div>
  );
}
