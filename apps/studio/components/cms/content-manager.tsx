"use client";
import { useMemo, useState } from "react";
import { useLocale } from "@/lib/i18n-client";
import { useRouter } from "next/navigation";
import { CORE_TABS, ALL_TABS, findTab, type FieldDef } from "@/lib/content-types";
import {
  Alert,
  AppShellCard,
  Badge,
  Button,
  Field,
  Input,
  Separator,
  Tabs,
  Textarea,
} from "@humain/ui";
import { ArrowLeft, BookOpen, Calendar, FileText, Megaphone, Sparkles } from "lucide-react";

/* =============================================================================
   Content Manager — tabbed content-type forms with agentic prefill.

   Migrated onto @humain/ui per adoption.md §4 and the package skill:
     hand-rolled pill tabs -> Tabs (Tabs.List / Tabs.Trigger)
     template cards        -> outline Buttons + a Default Badge, not Card
                              (a Card inside a Card is never correct)
     <input>/<textarea>    -> Input / Textarea in Field
     <button> x6           -> Button
     read-only + AI notes  -> Alert
     fixed-position toast  -> Alert
     back link             -> Button in AppShellCard.Header

   Behaviour untouched: the same 12-column field grid, template auto-draft,
   AI-brief re-draft, the canEdit/canPublish gating and the draft/publish
   submissions with their approval routing.

   The local field renderer is renamed FormField — the package now owns the name
   `Field`.
   ============================================================================= */

const ICONS: Record<string, any> = { doc: FileText, book: BookOpen, megaphone: Megaphone, calendar: Calendar };

type Values = Record<string, string>;

export default function ContentManager({ initialType = "blog", canEdit = true, canPublish = true }: { initialType?: string; canEdit?: boolean; canPublish?: boolean }) {
  const router = useRouter();
  const uiLocale = useLocale();
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
          locale: uiLocale,
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
        body: JSON.stringify({ slug: tab.slug, status, template: templates[activeKey], data: v, locale: uiLocale }),
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
    <AppShellCard>
      <AppShellCard.Toolbar>
        <AppShellCard.Header>
          <AppShellCard.Title>{isCore ? "Content Management" : tab.label}</AppShellCard.Title>
          <AppShellCard.Subtitle>{tab.subtitle}</AppShellCard.Subtitle>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              appearance="ghost"
              variant="secondary"
              size="sm"
              startIcon={<ArrowLeft className="size-4" />}
              onClick={() => router.push("/cms")}
            >
              Content Management
            </Button>
          </div>
        </AppShellCard.Header>
      </AppShellCard.Toolbar>

      {toast && (
        <Alert variant={toast.kind === "ok" ? "success" : "destructive"} className="mb-4">
          {toast.msg}
        </Alert>
      )}

      {/* Core content types */}
      {isCore && (
        <Tabs value={activeKey} onValueChange={(v) => setActiveKey(String(v))}>
          <Tabs.List>
            {CORE_TABS.map((t) => {
              const Icon = ICONS[t.icon];
              return (
                <Tabs.Trigger key={t.key} value={t.key}>
                  <Icon className="me-1.5 inline size-4 align-middle" />
                  {t.label}
                </Tabs.Trigger>
              );
            })}
          </Tabs.List>
        </Tabs>
      )}

      {/* Templates */}
      {tab.templates.length > 0 && (
        <>
          <Separator className="my-4" label="Select template" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tab.templates.map((tpl) => {
              const selected = templates[activeKey] === tpl.key;
              return (
                <Button
                  key={tpl.key}
                  appearance={selected ? "soft" : "outline"}
                  variant={selected ? "primary" : "secondary"}
                  onClick={() => { setTemplates((s) => ({ ...s, [activeKey]: tpl.key })); suggest({ tpl: tpl.key, auto: true }); }}
                  className="block h-auto w-full whitespace-normal p-4 text-start"
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0 flex-1 text-sm font-semibold text-foreground">{tpl.name}</span>
                    {selected && <Badge variant="soft" color="primary" size="xs">Default</Badge>}
                  </span>
                  <span className="mt-1 block text-xs text-secondary-foreground">{tpl.desc}</span>
                </Button>
              );
            })}
          </div>
        </>
      )}

      <Separator className="my-5" />

      <h3 className="mb-3 text-lg font-semibold text-foreground">{tab.formTitle}</h3>

      {!canEdit && (
        <Alert variant="warning" className="mb-4">
          You have <b>read-only</b> access. Content authoring is available to editor roles.
        </Alert>
      )}

      {/* Agentic prefill — the agent proposes a draft, the human edits. */}
      {canEdit && (
        <>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Input
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !suggesting) suggest(); }}
              aria-label="Brief for the AI draft"
              placeholder="Selecting a template auto-drafts. Add a brief to steer it, then re-draft."
              className="min-w-64 flex-1"
            />
            <Button
              loading={suggesting}
              disabled={suggesting}
              startIcon={<Sparkles className="size-4" />}
              onClick={() => suggest()}
            >
              {suggesting ? "Drafting…" : "Draft with AI"}
            </Button>
          </div>
          {aiFilled && (
            <Alert variant="info" className="mb-4">
              AI-suggested draft — review and edit every field before saving. Agents propose, you decide.
            </Alert>
          )}
        </>
      )}

      <div className="grid grid-cols-12 gap-x-5 gap-y-4">
        {tab.fields.map((f) => (
          <FormField key={f.name} f={f} value={v[f.name] || ""} onChange={(val) => setField(f.name, val)} />
        ))}
      </div>

      {canEdit && (
        <>
          <Separator className="my-5" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-secondary-foreground">
              {canPublish
                ? "You can publish — content still passes the required approval stages first."
                : "Saved drafts are routed to the Review queue for human approval before publishing."}
            </span>
            <div className="flex flex-wrap gap-3">
              <Button
                appearance="outline"
                variant="secondary"
                loading={busy === "draft"}
                disabled={busy !== null}
                onClick={() => submit("draft")}
              >
                {busy === "draft" ? "Saving…" : canPublish ? "Save draft" : "Save & send for review"}
              </Button>
              {canPublish && (
                <Button loading={busy === "published"} disabled={busy !== null} onClick={() => submit("published")}>
                  {busy === "published" ? "Publishing…" : "Publish"}
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </AppShellCard>
  );
}

/**
 * One form field on the 12-column grid.
 *
 * The column span is a runtime value from the content-type definition, so it
 * stays an inline style: the package's utility layer is precompiled and an
 * arbitrary `col-span-[n]` would silently not exist.
 */
function FormField({ f, value, onChange }: { f: FieldDef; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ gridColumn: `span ${f.col}` }}>
      <Field>
        <Field.Label>{f.label}</Field.Label>
        {f.type === "textarea" || f.type === "richtext" ? (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={f.placeholder}
            rows={f.type === "richtext" ? 6 : 3}
          />
        ) : (
          <Input
            type={f.type === "date" ? "date" : f.type === "time" ? "time" : "text"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={f.placeholder}
          />
        )}
      </Field>
    </div>
  );
}
