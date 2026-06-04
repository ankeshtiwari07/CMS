"use client";
import { useEffect, useState } from "react";

export default function GeneralClient({ canEdit }: { canEdit: boolean }) {
  const [s, setS] = useState<any>({ siteName: "", tagline: "", analytics: {}, defaultSeo: {} });
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      const g = d.settings || {};
      setS({ siteName: g.siteName || "", tagline: g.tagline || "", analytics: g.analytics || {}, defaultSeo: g.defaultSeo || {} });
    });
  }, []);

  async function save() {
    setBusy(true);
    const res = await fetch("/api/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(s) });
    setBusy(false);
    setToast(res.ok ? "Settings saved" : "Save failed (need publisher/admin)");
  }

  const field: React.CSSProperties = { width: "100%", height: 42, padding: "0 12px", border: "1px solid var(--hairline)", borderRadius: 10, fontSize: 14.5, outline: "none" };
  const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "var(--label, #0e4049)" };
  const grp: React.CSSProperties = { display: "grid", gap: 6, marginBottom: 16 };

  return (
    <div style={{ maxWidth: 640 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 19, fontWeight: 700, color: "var(--ink)" }}>Site Settings</h2>
      <p style={{ margin: "0 0 20px", color: "var(--muted)", fontSize: 13.5 }}>Brand, default SEO, and analytics — applied site-wide.</p>

      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", margin: "0 0 12px" }}>Brand</h3>
      <label style={grp}><span style={lbl}>Site name</span><input style={field} value={s.siteName} onChange={(e) => setS({ ...s, siteName: e.target.value })} /></label>
      <label style={grp}><span style={lbl}>Tagline</span><input style={field} value={s.tagline} onChange={(e) => setS({ ...s, tagline: e.target.value })} /></label>

      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", margin: "18px 0 12px" }}>Default SEO</h3>
      <label style={grp}><span style={lbl}>Meta title</span><input style={field} value={s.defaultSeo?.metaTitle || ""} onChange={(e) => setS({ ...s, defaultSeo: { ...s.defaultSeo, metaTitle: e.target.value } })} /></label>
      <label style={grp}><span style={lbl}>Meta description</span><input style={field} value={s.defaultSeo?.metaDescription || ""} onChange={(e) => setS({ ...s, defaultSeo: { ...s.defaultSeo, metaDescription: e.target.value } })} /></label>

      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", margin: "18px 0 12px" }}>Analytics</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label style={grp}><span style={lbl}>GA4 Measurement ID</span><input style={field} placeholder="G-XXXXXXX" value={s.analytics?.ga4MeasurementId || ""} onChange={(e) => setS({ ...s, analytics: { ...s.analytics, ga4MeasurementId: e.target.value } })} /></label>
        <label style={grp}><span style={lbl}>GTM Container ID</span><input style={field} placeholder="GTM-XXXXX" value={s.analytics?.gtmContainerId || ""} onChange={(e) => setS({ ...s, analytics: { ...s.analytics, gtmContainerId: e.target.value } })} /></label>
      </div>

      {canEdit ? (
        <button onClick={save} disabled={busy} style={{ marginTop: 14, height: 44, padding: "0 24px", border: "none", borderRadius: 999, background: "var(--studio-primary)", color: "#fff", fontWeight: 700 }}>{busy ? "Saving…" : "Save settings"}</button>
      ) : (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Editing site settings requires the publisher or admin role.</p>
      )}

      {toast && <div onAnimationEnd={() => setToast(null)} style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "var(--studio-teal-dark)", color: "#fff", padding: "12px 20px", borderRadius: 12, fontWeight: 600 }}>{toast}</div>}
    </div>
  );
}
