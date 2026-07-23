"use client";
import { useEffect, useState } from "react";

type Stage = { stage: string; label: string; status: string; comment?: string; sla?: string; slaHours?: number };
type Item = {
  collection: string; id: number | string; title: string; riskTier: string;
  aiGenerated: boolean; updatedAt?: string; stages: Stage[]; actionable: string[];
  overdue?: boolean; escalatedToYou?: boolean; viaDelegation?: boolean; kind?: string;
};

const SLA_COLOR: Record<string, [string, string]> = {
  overdue: ["color-mix(in srgb, var(--destructive) 10%, var(--background))", "var(--destructive)"], due_soon: ["color-mix(in srgb, var(--warning) 12%, var(--background))", "var(--warning)"], on_track: ["var(--surface-2)", "var(--text-muted)"], approved: ["color-mix(in srgb, var(--success) 12%, var(--background))", "var(--success)"],
};
const slaText = (s?: string, h?: number) =>
  s === "overdue" ? `overdue ${h}h` : s === "due_soon" ? `due in ${h}h` : s === "on_track" ? `${h}h left` : "";

const TIER_COLOR: Record<string, [string, string]> = {
  trivial: ["var(--surface-2)", "var(--text-muted)"], low: ["color-mix(in srgb, var(--success) 12%, var(--background))", "var(--success)"],
  medium: ["color-mix(in srgb, var(--warning) 12%, var(--background))", "var(--warning)"], high: ["color-mix(in srgb, var(--destructive) 10%, var(--background))", "var(--destructive)"],
};
const STATUS_COLOR: Record<string, [string, string]> = {
  approve: ["color-mix(in srgb, var(--success) 12%, var(--background))", "var(--success)"], pending: ["var(--surface-2)", "var(--text-muted)"],
  reject: ["color-mix(in srgb, var(--destructive) 10%, var(--background))", "var(--destructive)"], request_changes: ["color-mix(in srgb, var(--warning) 12%, var(--background))", "var(--warning)"],
};

export default function ReviewQueue() {
  const [items, setItems] = useState<Item[]>([]);
  const [meta, setMeta] = useState<{ overdueCount: number; delegatingFor: string[] }>({ overdueCount: 0, delegatingFor: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ k: "ok" | "err"; m: string } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkComment, setBulkComment] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  const keyOf = (it: Item) => `${it.collection}:${it.id}`;
  const toggleSelect = (k: string) =>
    setSelected((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/review-queue");
      const j = await r.json();
      setItems(j.items || []);
      setMeta({ overdueCount: j.overdueCount || 0, delegatingFor: j.delegatingFor || [] });
    } catch { setItems([]); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function decide(it: Item, stage: string, decision: string) {
    const key = `${it.collection}:${it.id}:${stage}`;
    const comment = comments[key] || "";
    if ((decision === "reject" || decision === "request_changes") && !comment.trim()) {
      setToast({ k: "err", m: "A comment is required to reject or request changes." }); return;
    }
    setBusy(key); setToast(null);
    try {
      const r = await fetch("/api/approvals", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ collection: it.collection, id: it.id, stage, decision, comment }),
      });
      const j = await r.json();
      if (!r.ok) setToast({ k: "err", m: j.error || "Decision failed" });
      else { setToast({ k: "ok", m: `${decision === "approve" ? "Approved" : decision === "reject" ? "Rejected" : "Changes requested"} — ${it.title}` }); await load(); }
    } catch { setToast({ k: "err", m: "Network error" }); }
    setBusy(null);
  }

  async function bulkApprove() {
    const picks = items.filter((it) => selected.has(keyOf(it)) && it.actionable.length);
    if (!picks.length) { setToast({ k: "err", m: "Select items to approve" }); return; }
    setBulkBusy(true); setToast(null);
    const decisions = picks.map((it) => ({ collection: it.collection, id: it.id, stage: it.actionable[0], decision: "approve", comment: bulkComment }));
    try {
      const r = await fetch("/api/approvals/bulk", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ decisions }) });
      const j = await r.json();
      if (!r.ok) setToast({ k: "err", m: j.error || "Bulk approve failed" });
      else { setToast({ k: "ok", m: `Approved ${j.applied} item${j.applied === 1 ? "" : "s"}${j.failed ? `, ${j.failed} skipped` : ""}` }); setSelected(new Set()); setBulkComment(""); await load(); }
    } catch { setToast({ k: "err", m: "Network error" }); }
    setBulkBusy(false);
  }

  const pill = (text: string, bg: string, color: string) => (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 999, background: bg, color, textTransform: "capitalize" }}>{text}</span>
  );

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "26px 28px 60px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", margin: 0 }}>Review Queue</h1>
      <p style={{ color: "var(--text-muted)", margin: "5px 0 14px", fontSize: 14 }}>
        Human-in-the-loop approvals routed to you. Content cannot publish until every required stage approves the current version. You can’t approve content you created (separation of duties).
      </p>
      {meta.delegatingFor.length > 0 && (
        <div style={{ background: "var(--brand-tint)", border: "1px solid var(--hairline)", borderRadius: 10, padding: "9px 13px", fontSize: 13, color: "var(--studio-teal-dark, var(--deep-teal))", marginBottom: 10 }}>
          🤝 You’re covering approvals (delegation) for: <b>{meta.delegatingFor.join(", ")}</b>
        </div>
      )}
      {meta.overdueCount > 0 && (
        <div style={{ background: "color-mix(in srgb, var(--destructive) 10%, var(--background))", border: "1px solid color-mix(in srgb, var(--destructive) 30%, var(--background))", borderRadius: 10, padding: "9px 13px", fontSize: 13, color: "var(--destructive)", marginBottom: 16, fontWeight: 600 }}>
          ⏰ {meta.overdueCount} item{meta.overdueCount > 1 ? "s" : ""} past SLA — escalated for action.
        </div>
      )}

      {selected.size > 0 && (
        <div style={{ position: "sticky", top: 8, zIndex: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: "var(--studio-teal-dark, var(--deep-teal))", color: "var(--primary-foreground)", borderRadius: 12, padding: "10px 14px", marginBottom: 14 }}>
          <b style={{ fontSize: 14 }}>{selected.size} selected</b>
          <input
            value={bulkComment}
            onChange={(e) => setBulkComment(e.target.value)}
            placeholder="Optional comment for all"
            style={{ flex: 1, minWidth: 200, height: 36, border: "none", borderRadius: 9, padding: "0 11px", fontSize: 13.5, outline: "none", color: "var(--ink)" }}
          />
          <button onClick={bulkApprove} disabled={bulkBusy} style={{ height: 36, padding: "0 18px", borderRadius: 9, border: "none", background: "var(--success)", color: "var(--primary-foreground)", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
            {bulkBusy ? "Approving…" : "✓ Approve selected"}
          </button>
          <button onClick={() => setSelected(new Set())} style={{ height: 36, padding: "0 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.4)", background: "transparent", color: "var(--primary-foreground)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Clear</button>
        </div>
      )}

      {loading ? (
        <div style={{ color: "var(--text-muted)", padding: 24 }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ border: "1px dashed var(--hairline)", borderRadius: 14, padding: 36, textAlign: "center", color: "var(--text-muted)" }}>
          Nothing awaiting your approval. 🎉
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {items.map((it) => (
            <div key={`${it.collection}:${it.id}`} style={{ border: `1px solid ${it.overdue ? "color-mix(in srgb, var(--destructive) 30%, var(--background))" : "var(--hairline)"}`, borderRadius: 14, padding: "16px 18px", background: "var(--card)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {it.actionable.length > 0 && (
                  <input type="checkbox" title="Select for bulk approval" checked={selected.has(keyOf(it))} onChange={() => toggleSelect(keyOf(it))} style={{ width: 16, height: 16, cursor: "pointer" }} />
                )}
                <span style={{ fontWeight: 700, fontSize: 15.5, color: "var(--ink)" }}>{it.title}</span>
                {pill(`risk: ${it.riskTier}`, TIER_COLOR[it.riskTier]?.[0] || "var(--surface-2)", TIER_COLOR[it.riskTier]?.[1] || "var(--text-muted)")}
                {it.aiGenerated && pill("AI-generated", "var(--soft-purple)", "var(--soft-purple-foreground)")}
                {(it.kind === "component" || it.kind === "website") && it.aiGenerated && pill("⇄ Flow B · dual-approval", "var(--soft-info)", "var(--soft-info-foreground)")}
                {it.overdue && pill("⏰ overdue", "color-mix(in srgb, var(--destructive) 10%, var(--background))", "var(--destructive)")}
                {it.escalatedToYou && pill("escalated to you", "color-mix(in srgb, var(--warning) 12%, var(--background))", "var(--warning)")}
                <span style={{ color: "var(--text-muted)", fontSize: 12.5 }}>{it.collection}#{it.id}</span>
              </div>
              {(it.kind === "component" || it.kind === "website") && it.aiGenerated && (
                <div style={{ fontSize: 12.5, color: "var(--info)", background: "var(--soft-info)", border: "1px solid color-mix(in srgb, var(--info) 28%, var(--background))", borderRadius: 8, padding: "6px 11px", marginTop: 8 }}>
                  ⇄ <b>Flow B (dual approval):</b> {it.kind === "component" ? "an AI-delegated component — it and the page consuming it each require approval before either publishes." : "an AI-generated page — it and any components it delegated each require approval before publishing."}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
                {it.stages.map((s) => {
                  const showSla = s.status !== "approve" && s.sla && s.sla !== "approved";
                  const c = showSla ? SLA_COLOR[s.sla!] : STATUS_COLOR[s.status];
                  return (
                    <span key={s.stage} title={s.comment || ""} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 8, background: c?.[0] || "var(--surface-2)", color: c?.[1] || "var(--text-muted)" }}>
                      {s.label}: {s.status === "request_changes" ? "changes requested" : s.status}{showSla ? ` · ${slaText(s.sla, s.slaHours)}` : ""}
                    </span>
                  );
                })}
              </div>
              {it.actionable.map((stage) => {
                const key = `${it.collection}:${it.id}:${stage}`;
                const label = it.stages.find((s) => s.stage === stage)?.label || stage;
                return (
                  <div key={stage} style={{ borderTop: "1px solid var(--hairline)", paddingTop: 12, marginTop: 6 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--studio-teal-dark, var(--deep-teal))", marginBottom: 7 }}>Your decision — {label}</div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <input
                        value={comments[key] || ""}
                        onChange={(e) => setComments((c) => ({ ...c, [key]: e.target.value }))}
                        placeholder="Comment (required to reject / request changes)"
                        style={{ flex: 1, minWidth: 240, height: 38, border: "1px solid var(--hairline)", borderRadius: 9, padding: "0 11px", fontSize: 13.5, outline: "none" }}
                      />
                      <button onClick={() => decide(it, stage, "approve")} disabled={busy === key} style={btn("var(--success)")}>Approve</button>
                      <button onClick={() => decide(it, stage, "request_changes")} disabled={busy === key} style={btn("var(--warning)")}>Request changes</button>
                      <button onClick={() => decide(it, stage, "reject")} disabled={busy === key} style={btn("var(--destructive)")}>Reject</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div onAnimationEnd={() => {}} style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: toast.k === "ok" ? "var(--studio-teal-dark, var(--deep-teal))" : "var(--destructive)", color: "var(--primary-foreground)", padding: "12px 20px", borderRadius: 12, fontWeight: 600, fontSize: 14, zIndex: 120 }}>
          {toast.m}
        </div>
      )}
    </div>
  );
}

const btn = (bg: string): React.CSSProperties => ({
  height: 38, padding: "0 16px", borderRadius: 9, border: "none", background: bg, color: "var(--primary-foreground)", fontWeight: 700, fontSize: 13, cursor: "pointer",
});
