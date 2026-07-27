"use client";
import { useEffect, useState } from "react";
import {
  AppShellCard,
  Badge,
  Button,
  DropdownMenu,
  EmptyState,
  Field,
  Progress,
  Separator,
  Textarea,
} from "@humain/ui";
import { ShieldCheck } from "lucide-react";

/* =============================================================================
   Brand Governance.

   Migrated onto @humain/ui per references/adoption.md §4 and the package skill's
   Adopt guardrails:
     <button>            -> Button (two visible in the header, the third in
                            AppShellCard.Menu — the skill caps header buttons at
                            two and puts overflow in the ellipsis menu)
     <textarea>          -> Textarea in a Field
     hand-rolled score ring / conic-gradient -> Progress circular showValue
     hand-rolled bar divs -> Progress (semantic variant per threshold)
     severity + status pills -> Badge
     "run a review" placeholder -> EmptyState
     nested bordered "card" divs -> Separator + spacing, because the skill is
                            explicit that a Card inside a Card is never correct

   Behaviour is unchanged: same three endpoints, same busy/message handling, same
   thresholds, same remediation flow.

   Palette swatches keep literal hex: those are the BRAND'S OWN colours being
   audited — data under review, not chrome. Same for the off-brand chips.
   ============================================================================= */

type Finding = { dimension: string; severity: string; issue: string; evidence?: string; fix?: string };
type Report = {
  score: number; status: string; brandName: string; grounded: boolean;
  palette: { brand: string[]; used: string[]; offBrand: string[]; score: number };
  dimensions: { palette: number; tone: number; messaging: number; visual: number };
  findings: Finding[]; summary: string;
};
type Profile = { name: string; palette: string[]; paletteMeta: { hex: string; name?: string; usage?: string }[]; fonts: string[]; voice: string; ragText: string; grounded: boolean };

type Tone = "success" | "warning" | "destructive";
const statusTone = (s: string): Tone => (s === "pass" ? "success" : s === "warn" ? "warning" : "destructive");
const sevTone = (s: string): Tone => (s === "fail" ? "destructive" : s === "warn" ? "warning" : "success");
const scoreTone = (n: number): Tone => (n >= 85 ? "success" : n >= 65 ? "warning" : "destructive");

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


  return (
    <AppShellCard>
      <AppShellCard.Toolbar>
        <AppShellCard.Header>
          <AppShellCard.Title>Brand Governance</AppShellCard.Title>
          <AppShellCard.Subtitle>
            Keep branding, styling, tone and visual identity consistent with your brand across
            everything generated or edited. Every check is grounded in your brand corpus and written
            to the audit log.
          </AppShellCard.Subtitle>
          {profile && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="dot" color={profile.grounded ? "success" : "warning"} size="sm">
                {profile.grounded
                  ? `Grounded on “${profile.name}” (RAG + brand guidelines)`
                  : "No active brand — using defaults"}
              </Badge>
              {msg && <span className="text-sm text-secondary-foreground">{msg}</span>}
            </div>
          )}
        </AppShellCard.Header>
        <AppShellCard.Actions>
          <Button loading={busy === "review"} disabled={!!busy} onClick={review}>
            {busy === "review" ? "Reviewing…" : "Review against brand"}
          </Button>
          <Button
            appearance="outline"
            variant="secondary"
            loading={busy === "fix"}
            disabled={!!busy || !report}
            onClick={fix}
          >
            {busy === "fix" ? "Fixing…" : "Auto-fix on-brand"}
          </Button>
        </AppShellCard.Actions>
        {/* Third command lives in the overflow menu: the skill caps a header at
            two visible buttons. */}
        <AppShellCard.Menu>
          <DropdownMenu.Item disabled={busy === "load"} onClick={loadLatestSite}>
            Load latest website
          </DropdownMenu.Item>
        </AppShellCard.Menu>
      </AppShellCard.Toolbar>

      {/* Brand profile — a section, not a nested Card. */}
      {profile && (
        <>
          <div className="flex flex-wrap gap-6">
            <div className="min-w-56">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
                Brand palette
              </div>
              <div className="flex flex-wrap gap-2">
                {(profile.paletteMeta.length ? profile.paletteMeta : profile.palette.map((h) => ({ hex: h }))).map((pl, i) => (
                  <div key={i} title={`${pl.hex}${(pl as any).name ? " · " + (pl as any).name : ""}`} className="text-center">
                    {/* The brand's own colour, under audit — data, not chrome. */}
                    <div className="size-10 rounded-lg border border-border" style={{ background: pl.hex }} />
                    <div className="mt-1 text-xs text-secondary-foreground">{pl.hex}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="min-w-64 flex-1">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
                Voice &amp; guidelines (grounding)
              </div>
              <div className="max-h-32 overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-secondary-foreground">
                {profile.voice || "—"}
              </div>
              {profile.fonts.length > 0 && (
                <div className="mt-2 text-xs text-secondary-foreground">Fonts: {profile.fonts.join(", ")}</div>
              )}
            </div>
          </div>
          <Separator className="my-5" />
        </>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {/* Artifact + preview */}
        <div>
          <Field>
            <Field.Label>Artifact (HTML)</Field.Label>
            <Textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="Paste a page/section/component HTML, or use “Load latest website”."
              spellCheck={false}
              rows={7}
              className="font-mono"
            />
          </Field>
          <div className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
            Live preview
          </div>
          <iframe
            title="preview"
            srcDoc={html || "<div style='font-family:sans-serif;color:#889;padding:24px'>Nothing to preview yet.</div>"}
            className="h-80 w-full rounded-xl border border-border bg-card"
          />
        </div>

        {/* Report */}
        <div>
          {!report && (
            <EmptyState
              title="No review yet"
              description="Run a review to see the governance report — overall score, per-dimension breakdown, off-brand colours and specific findings."
              media="featured-icon"
              icon={<ShieldCheck />}
            />
          )}
          {report && (
            <div>
              <div className="flex items-center gap-5">
                <Progress
                  circular
                  showValue
                  size="lg"
                  value={report.score}
                  variant={statusTone(report.status)}
                />
                <div>
                  <div className="text-base font-bold uppercase text-foreground">{report.status}</div>
                  <div className="mt-0.5 max-w-sm text-sm text-secondary-foreground">{report.summary}</div>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                {(["palette", "tone", "messaging", "visual"] as const).map((k) => (
                  <div key={k} className="flex items-center gap-2.5">
                    <div className="w-20 text-xs capitalize text-secondary-foreground">{k}</div>
                    <Progress
                      className="flex-1"
                      size="sm"
                      value={report.dimensions[k]}
                      variant={scoreTone(report.dimensions[k])}
                    />
                    <div className="w-8 text-end text-xs font-semibold text-foreground">{report.dimensions[k]}</div>
                  </div>
                ))}
              </div>

              {report.palette.offBrand.length > 0 && (
                <>
                  <Separator className="my-4" label={`Off-brand colours (${report.palette.offBrand.length})`} />
                  <div className="flex flex-wrap gap-1.5">
                    {report.palette.offBrand.map((c) => (
                      <Badge key={c} variant="outline" color="secondary" size="sm">
                        <span className="me-1.5 inline-block size-3 rounded-sm border border-border align-middle" style={{ background: c }} />
                        {c}
                      </Badge>
                    ))}
                  </div>
                </>
              )}

              {report.findings.length > 0 && (
                <>
                  <Separator className="my-4" label={`Findings (${report.findings.length})`} />
                  <div className="grid gap-3">
                    {report.findings.map((f, i) => (
                      <div key={i}>
                        <div className="flex items-center gap-2">
                          <Badge variant="soft" color={sevTone(f.severity)} size="xs">{f.severity}</Badge>
                          <span className="text-xs capitalize text-secondary-foreground">{f.dimension}</span>
                        </div>
                        <div className="mt-1 text-sm text-foreground">{f.issue}</div>
                        {f.evidence && (
                          <div className="mt-0.5 font-mono text-xs text-secondary-foreground">evidence: {f.evidence}</div>
                        )}
                        {f.fix && <div className="mt-0.5 text-xs text-success">→ {f.fix}</div>}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {changes && (
                <>
                  <Separator className="my-4" />
                  <div className="text-sm text-secondary-foreground">
                    <b className="text-foreground">Applied fixes:</b>{" "}
                    {changes.length ? changes.join(" · ") : "no changes needed"}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShellCard>
  );
}
