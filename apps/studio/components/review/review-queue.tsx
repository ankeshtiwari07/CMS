"use client";
import { useEffect, useState } from "react";

type Stage = { stage: string; label: string; status: string; comment?: string };
type Item = {
  collection: string; id: number | string; title: string; riskTier: string;
  aiGenerated: boolean; updatedAt?: string; stages: Stage[]; actionable: string[];
};

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
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ k: "ok" | "err"; m: string } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/review-queue");
      const j = await r.json();
      setItems(j.items || []);
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

  const pill = (text: string, bg: string, color: string) => (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 999, background: bg, color, textTransform: "capitalize" }}>{text}</span>
  );

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "26px 28px 60px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", margin: 0 }}>Review Queue</h1>
      <p style={{ color: "var(--muted)", margin: "5px 0 22px", fontSize: 14 }}>
        Human-in-the-loop approvals routed to you. Content cannot publish until every required stage approves the current version. You can’t approve content you created (separation of duties).
      </p>

      {loading ? (
        <div style={{ color: "var(--muted)", padding: 24 }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ border: "1px dashed var(--hairline)", borderRadius: 14, padding: 36, textAlign: "center", color: "var(--muted)" }}>
          Nothing awaiting your approval. 🎉
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {items.map((it) => (
            <div key={`${it.collection}:${it.id}`} style={{ border: "1px solid var(--hairline)", borderRadius: 14, padding: "16px 18px", background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, fontSize: 15.5, color: "var(--ink)" }}>{it.title}</span>
                {pill(`risk: ${it.riskTier}`, TIER_COLOR[it.riskTier]?.[0] || "#eef2f4", TIER_COLOR[it.riskTier]?.[1] || "#5A6B72")}
                {it.aiGenerated && pill("AI-generated", "#ede9fe", "#6d28d9")}
                <span style={{ color: "var(--muted)", fontSize: 12.5 }}>{it.collection}#{it.id}</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
                {it.stages.map((s) => (
                  <span key={s.stage} title={s.comment || ""} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 8, background: STATUS_COLOR[s.status]?.[0] || "#eef2f4", color: STATUS_COLOR[s.status]?.[1] || "#5A6B72" }}>
                    {s.label}: {s.status === "request_changes" ? "changes requested" : s.status}
                  </span>
                ))}
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
