"use client";
import { useEffect, useMemo, useState } from "react";

type Finding = { dimension: string; severity: string; issue: string; evidence?: string; fix?: string };
type Report = {
  score: number; status: string; brandName: string; grounded: boolean;
  palette: { brand: string[]; used: string[]; offBrand: string[]; score: number };
  dimensions: { palette: number; tone: number; messaging: number; visual: number };
  findings: Finding[]; summary: string;
};
type Profile = { name: string; palette: string[]; paletteMeta: { hex: string; name?: string; usage?: string }[]; fonts: string[]; voice: string; ragText: string; grounded: boolean };

const TEAL = "var(--primary)", INK = "var(--background)", LINE = "var(--hairline)", MUT = "var(--text-muted)";
const statusColor = (s: string) => (s === "pass" ? "var(--success)" : s === "warn" ? "var(--warning)" : "var(--destructive)");
const sevColor = (s: string) => (s === "fail" ? "var(--destructive)" : s === "warn" ? "var(--warning)" : "var(--text-muted)");

export default function GovernanceStudio() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [html, setHtml] = useState<string>("");
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState<string>("");
  const [changes, setChanges] = useState<string[] | null>(null);
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    fetch("/api/governance/brand").then((r) => r.json()).then((d) => setProfile(d?.profile || null)).catch(() => {});
  }, []);

  async function loadLatestSite() {
    setMsg("Loading latest website…"); setBusy("load");
    try {
      const list = await fetch("/api/website").then((r) => r.json());
      const site = (list?.sites || [])[0];
      if (!site) { setMsg("No saved websites yet — paste HTML to review."); return; }
      const full = await fetch(`/api/website/${site.id}`).then((r) => r.json());
      setHtml(full?.html || ""); setReport(null); setChanges(null);
      setMsg(`Loaded “${site.title}”.`);
    } catch { setMsg("Could not load a website."); } finally { setBusy(""); }
  }

  async function review() {
    if (!html.trim()) { setMsg("Paste or load some HTML first."); return; }
    setBusy("review"); setMsg("Governance Agent reviewing against the brand…"); setChanges(null);
    try {
      const d = await fetch("/api/governance/review", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ html, kind: "website" }) }).then((r) => r.json());
      if (d?.report) { setReport(d.report); setMsg(""); } else setMsg(d?.error || "Review failed.");
    } catch { setMsg("Review failed."); } finally { setBusy(""); }
  }

  async function fix() {
    if (!html.trim()) return;
    setBusy("fix"); setMsg("Auto-fixing to the brand…");
    try {
      const d = await fetch("/api/governance/remediate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ html, kind: "website" }) }).then((r) => r.json());
      if (d?.html) { setHtml(d.html); setChanges(d.changes || []); setReport(d.report || null); setMsg(`Applied ${d.changes?.length || 0} on-brand fix(es). Re-review to confirm.`); }
      else setMsg(d?.error || "Remediation failed.");
    } catch { setMsg("Remediation failed."); } finally { setBusy(""); }
  }

  const ring = useMemo(() => {
    const s = report?.score ?? 0;
    return { background: `conic-gradient(${statusColor(report?.status || "warn")} ${s}%, var(--surface-3) 0)` };
  }, [report]);

  const card: React.CSSProperties = { border: `1px solid ${LINE}`, borderRadius: 14, background: "var(--card)", padding: 16 };
  const btn = (primary?: boolean, disabled?: boolean): React.CSSProperties => ({
    padding: "9px 14px", borderRadius: 10, fontWeight: 700, fontSize: 13.5, cursor: disabled ? "default" : "pointer",
    border: primary ? "none" : `1px solid ${LINE}`, background: primary ? TEAL : "var(--card)", color: primary ? "var(--primary-foreground)" : INK, opacity: disabled ? 0.55 : 1,
  });

  return (
    <div style={{ background: "var(--card)", borderRadius: 16, minHeight: "100%", padding: "22px 26px", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", color: INK }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".12em", color: TEAL, textTransform: "uppercase" }}>Governance Agent</div>
        {profile && (
          <span style={{ fontSize: 12, fontWeight: 700, color: profile.grounded ? "var(--success)" : "var(--warning)", background: profile.grounded ? "color-mix(in srgb, var(--success) 12%, var(--background))" : "var(--soft-warning)", border: `1px solid ${LINE}`, padding: "3px 9px", borderRadius: 999 }}>
            {profile.grounded ? `● Grounded on “${profile.name}” (RAG + brand guidelines)` : "○ No active brand — using defaults"}
          </span>
        )}
      </div>
      <h1 style={{ margin: "6px 0 4px", fontSize: 26, letterSpacing: "-.01em" }}>Brand Governance</h1>
      <p style={{ color: MUT, margin: 0, maxWidth: "70ch", fontSize: 14.5 }}>
        Keep branding, styling, tone and visual identity consistent with your brand across everything generated or edited. Every check is grounded in your brand corpus and written to the audit log.
      </p>

      {/* Brand profile */}
      {profile && (
        <div style={{ ...card, marginTop: 18, display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div style={{ minWidth: 220 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: MUT, fontWeight: 700, marginBottom: 8 }}>Brand palette</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(profile.paletteMeta.length ? profile.paletteMeta : profile.palette.map((h) => ({ hex: h }))).map((p, i) => (
                <div key={i} title={`${p.hex}${(p as any).name ? " · " + (p as any).name : ""}`} style={{ textAlign: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 9, background: p.hex, border: `1px solid ${LINE}` }} />
                  <div style={{ fontSize: 9.5, color: MUT, marginTop: 3 }}>{p.hex}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: MUT, fontWeight: 700, marginBottom: 8 }}>Voice &amp; guidelines (grounding)</div>
            <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.55, whiteSpace: "pre-wrap", maxHeight: 120, overflow: "auto" }}>{profile.voice || "—"}</div>
            {profile.fonts.length > 0 && <div style={{ fontSize: 12, color: MUT, marginTop: 8 }}>Fonts: {profile.fonts.join(", ")}</div>}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
        <button style={btn(false, busy === "load")} disabled={busy === "load"} onClick={loadLatestSite}>Load latest website</button>
        <button style={btn(true, !!busy)} disabled={!!busy} onClick={review}>{busy === "review" ? "Reviewing…" : "Review against brand"}</button>
        <button style={btn(false, !!busy || !report)} disabled={!!busy || !report} onClick={fix}>{busy === "fix" ? "Fixing…" : "Auto-fix on-brand"}</button>
        {msg && <span style={{ color: MUT, fontSize: 13 }}>{msg}</span>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16, alignItems: "start" }}>
        {/* Editor + preview */}
        <div style={card}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: MUT, fontWeight: 700, marginBottom: 8 }}>Artifact (HTML)</div>
          <textarea value={html} onChange={(e) => { setHtml(e.target.value); }} placeholder="Paste a page/section/component HTML, or click “Load latest website”." spellCheck={false}
            style={{ width: "100%", height: 150, resize: "vertical", border: `1px solid ${LINE}`, borderRadius: 10, padding: 10, fontFamily: "ui-monospace,monospace", fontSize: 12, color: INK, outline: "none" }} />
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: MUT, fontWeight: 700, margin: "12px 0 8px" }}>Live preview</div>
          <iframe title="preview" srcDoc={html || "<div style='font-family:sans-serif;color:#889;padding:24px'>Nothing to preview yet.</div>"} style={{ width: "100%", height: 320, border: `1px solid ${LINE}`, borderRadius: 10, background: "var(--card)" }} />
        </div>

        {/* Report */}
        <div style={card}>
          {!report && <div style={{ color: MUT, fontSize: 14, padding: "40px 8px", textAlign: "center" }}>Run a review to see the governance report — overall score, per-dimension breakdown, off-brand colours and specific findings.</div>}
          {report && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ width: 92, height: 92, borderRadius: "50%", display: "grid", placeItems: "center", ...ring }}>
                  <div style={{ width: 70, height: 70, borderRadius: "50%", background: "var(--card)", display: "grid", placeItems: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800 }}>{report.score}</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: statusColor(report.status), textTransform: "uppercase" }}>{report.status}</div>
                  <div style={{ color: MUT, fontSize: 13, marginTop: 2, maxWidth: "34ch" }}>{report.summary}</div>
                </div>
              </div>

              {/* dimension bars */}
              <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
                {(["palette", "tone", "messaging", "visual"] as const).map((k) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 78, fontSize: 12, color: MUT, textTransform: "capitalize" }}>{k}</div>
                    <div style={{ flex: 1, height: 7, background: "var(--surface-2)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: `${report.dimensions[k]}%`, height: "100%", background: report.dimensions[k] >= 85 ? "var(--success)" : report.dimensions[k] >= 65 ? "var(--warning)" : "var(--destructive)" }} />
                    </div>
                    <div style={{ width: 30, fontSize: 12, fontWeight: 700, textAlign: "right" }}>{report.dimensions[k]}</div>
                  </div>
                ))}
              </div>

              {/* off-brand colours */}
              {report.palette.offBrand.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: MUT, fontWeight: 700, marginBottom: 6 }}>Off-brand colours ({report.palette.offBrand.length})</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {report.palette.offBrand.map((c) => (
                      <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${LINE}`, borderRadius: 8, padding: "3px 8px", fontSize: 11.5 }}>
                        <span style={{ width: 13, height: 13, borderRadius: 3, background: c, border: `1px solid ${LINE}` }} />{c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* findings */}
              {report.findings.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: MUT, fontWeight: 700, marginBottom: 8 }}>Findings ({report.findings.length})</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {report.findings.map((f, i) => (
                      <div key={i} style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: "9px 11px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: "var(--primary-foreground)", background: sevColor(f.severity), padding: "1px 7px", borderRadius: 5, textTransform: "uppercase" }}>{f.severity}</span>
                          <span style={{ fontSize: 11, color: MUT, textTransform: "capitalize" }}>{f.dimension}</span>
                        </div>
                        <div style={{ fontSize: 13, marginTop: 5 }}>{f.issue}</div>
                        {f.evidence && <div style={{ fontSize: 11.5, color: MUT, marginTop: 3, fontFamily: "ui-monospace,monospace" }}>evidence: {f.evidence}</div>}
                        {f.fix && <div style={{ fontSize: 12, color: "var(--success)", marginTop: 3 }}>→ {f.fix}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {changes && (
                <div style={{ marginTop: 14, fontSize: 12.5, color: "var(--ink)" }}>
                  <b>Applied fixes:</b> {changes.length ? changes.join(" · ") : "no changes needed"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
