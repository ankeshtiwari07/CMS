"use client";
import { useEffect, useState } from "react";

type Stage = { stage: string; label: string; status: string; comment?: string; sla?: string; slaHours?: number };
type Item = {
  collection: string; id: number | string; title: string; riskTier: string;
  aiGenerated: boolean; updatedAt?: string; stages: Stage[]; actionable: string[];
  overdue?: boolean; escalatedToYou?: boolean; viaDelegation?: boolean;
};

const SLA_COLOR: Record<string, [string, string]> = {
  overdue: ["#fdecec", "#b42318"], due_soon: ["#fff4e0", "#9a6a12"], on_track: ["#eef2f4", "#5A6B72"], approved: ["#e3f5e8", "#1b7f3b"],
};
const slaText = (s?: string, h?: number) =>
  s === "overdue" ? `overdue ${h}h` : s === "due_soon" ? `due in ${h}h` : s === "on_track" ? `${h}h left` : "";

const TIER_COLOR: Record<string, [string, string]> = {
  trivial: ["#eef2f4", "#5A6B72"], low: ["#e3f5e8", "#1b7f3b"],
  medium: ["#fff4e0", "#9a6a12"], high: ["#fdecec", "#b42318"],
};
const STATUS_COLOR: Record<string, [string, string]> = {
  approve: ["#e3f5e8", "#1b7f3b"], pending: ["#eef2f4", "#5A6B72"],
  reject: ["#fdecec", "#b42318"], request_changes: ["#fff4e0", "#9a6a12"],
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
      <p style={{ color: "var(--muted)", margin: "5px 0 14px", fontSize: 14 }}>
        Human-in-the-loop approvals routed to you. Content cannot publish until every required stage approves the current version. You can’t approve content you created (separation of duties).
      </p>
      {meta.delegatingFor.length > 0 && (
        <div style={{ background: "#eef6f5", border: "1px solid var(--hairline)", borderRadius: 10, padding: "9px 13px", fontSize: 13, color: "var(--studio-teal-dark, #0A5C58)", marginBottom: 10 }}>
          🤝 You’re covering approvals (delegation) for: <b>{meta.delegatingFor.join(", ")}</b>
        </div>
      )}
      {meta.overdueCount > 0 && (
        <div style={{ background: "#fdecec", border: "1px solid #f6c8c2", borderRadius: 10, padding: "9px 13px", fontSize: 13, color: "#b42318", marginBottom: 16, fontWeight: 600 }}>
          ⏰ {meta.overdueCount} item{meta.overdueCount > 1 ? "s" : ""} past SLA — escalated for action.
        </div>
      )}

      {selected.size > 0 && (
        <div style={{ position: "sticky", top: 8, zIndex: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: "var(--studio-teal-dark, #0A5C58)", color: "#fff", borderRadius: 12, padding: "10px 14px", marginBottom: 14 }}>
          <b style={{ fontSize: 14 }}>{selected.size} selected</b>
          <input
            value={bulkComment}
            onChange={(e) => setBulkComment(e.target.value)}
            placeholder="Optional comment for all"
            style={{ flex: 1, minWidth: 200, height: 36, border: "none", borderRadius: 9, padding: "0 11px", fontSize: 13.5, outline: "none", color: "var(--ink)" }}
          />
          <button onClick={bulkApprove} disabled={bulkBusy} style={{ height: 36, padding: "0 18px", borderRadius: 9, border: "none", background: "#1b7f3b", color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
            {bulkBusy ? "Approving…" : "✓ Approve selected"}
          </button>
          <button onClick={() => setSelected(new Set())} style={{ height: 36, padding: "0 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.4)", background: "transparent", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Clear</button>
        </div>
      )}

      {loading ? (
        <div style={{ color: "var(--muted)", padding: 24 }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ border: "1px dashed var(--hairline)", borderRadius: 14, padding: 36, textAlign: "center", color: "var(--muted)" }}>
          Nothing awaiting your approval. 🎉
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {items.map((it) => (
            <div key={`${it.collection}:${it.id}`} style={{ border: `1px solid ${it.overdue ? "#f6c8c2" : "var(--hairline)"}`, borderRadius: 14, padding: "16px 18px", background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {it.actionable.length > 0 && (
                  <input type="checkbox" title="Select for bulk approval" checked={selected.has(keyOf(it))} onChange={() => toggleSelect(keyOf(it))} style={{ width: 16, height: 16, cursor: "pointer" }} />
                )}
                <span style={{ fontWeight: 700, fontSize: 15.5, color: "var(--ink)" }}>{it.title}</span>
                {pill(`risk: ${it.riskTier}`, TIER_COLOR[it.riskTier]?.[0] || "#eef2f4", TIER_COLOR[it.riskTier]?.[1] || "#5A6B72")}
                {it.aiGenerated && pill("AI-generated", "#ede9fe", "#6d28d9")}
                {it.overdue && pill("⏰ overdue", "#fdecec", "#b42318")}
                {it.escalatedToYou && pill("escalated to you", "#fff4e0", "#9a6a12")}
                <span style={{ color: "var(--muted)", fontSize: 12.5 }}>{it.collection}#{it.id}</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
                {it.stages.map((s) => {
                  const showSla = s.status !== "approve" && s.sla && s.sla !== "approved";
                  const c = showSla ? SLA_COLOR[s.sla!] : STATUS_COLOR[s.status];
                  return (
                    <span key={s.stage} title={s.comment || ""} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 8, background: c?.[0] || "#eef2f4", color: c?.[1] || "#5A6B72" }}>
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
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--studio-teal-dark, #0A5C58)", marginBottom: 7 }}>Your decision — {label}</div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <input
                        value={comments[key] || ""}
                        onChange={(e) => setComments((c) => ({ ...c, [key]: e.target.value }))}
                        placeholder="Comment (required to reject / request changes)"
                        style={{ flex: 1, minWidth: 240, height: 38, border: "1px solid var(--hairline)", borderRadius: 9, padding: "0 11px", fontSize: 13.5, outline: "none" }}
                      />
                      <button onClick={() => decide(it, stage, "approve")} disabled={busy === key} style={btn("#1b7f3b")}>Approve</button>
                      <button onClick={() => decide(it, stage, "request_changes")} disabled={busy === key} style={btn("#9a6a12")}>Request changes</button>
                      <button onClick={() => decide(it, stage, "reject")} disabled={busy === key} style={btn("#b42318")}>Reject</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div onAnimationEnd={() => {}} style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: toast.k === "ok" ? "var(--studio-teal-dark, #0A5C58)" : "#b42318", color: "#fff", padding: "12px 20px", borderRadius: 12, fontWeight: 600, fontSize: 14, zIndex: 120 }}>
          {toast.m}
        </div>
      )}
    </div>
  );
}

const btn = (bg: string): React.CSSProperties => ({
  height: 38, padding: "0 16px", borderRadius: 9, border: "none", background: bg, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
});
